// Chat end-to-end encryption service: identity setup / unlock / reset, per-thread
// key distribution, and message seal / open. The primitives live in ./crypto.ts
// (unit-tested); this file only orchestrates them against Supabase.
//
// What the server can see: public keys, passphrase-encrypted key backups,
// per-member WRAPPED thread keys, and message ciphertext. It never holds a
// private key, a thread key, or a plaintext message.

import { createClient } from '@/lib/supabase/client';
import type { AppItem } from '@/types/appItem';
import {
  aadFor,
  backupPrivateKey,
  decryptPayload,
  encryptPayload,
  generateIdentity,
  generateThreadKey,
  importPrivateKey,
  passphraseProblem,
  restorePrivateKey,
  unwrapThreadKey,
  wrapThreadKey,
  type Sealed,
} from './crypto';
import { KeyStore, type StoredIdentity } from './keyStore';

export type ThreadType = 'dm' | 'group';
export type E2eeStatus = 'unavailable' | 'needs-setup' | 'needs-unlock' | 'ready';

export type E2eeErrorCode = 'not-ready' | 'peer-not-ready' | 'no-key' | 'server' | 'bad-passphrase' | 'weak-passphrase';

export class E2eeError extends Error {
  constructor(public code: E2eeErrorCode, message: string) {
    super(message);
    this.name = 'E2eeError';
  }
}

/** What actually gets encrypted: the text and/or a shared item. Nothing else is ever in the clear. */
export interface MessagePayload {
  t?: string;
  item?: AppItem | null;
}

export interface EncryptedFields {
  ciphertext: string;
  iv: string;
  key_epoch: number;
}

// Short on purpose: if a member adds a device / resets their keys, senders pick up the new epoch within seconds.
const KEY_STATE_TTL_MS = 20_000;
const MAX_PUBLISH_ATTEMPTS = 3;

const identityCache = new Map<string, StoredIdentity>();
const threadKeyCache = new Map<string, CryptoKey>();
const syncCache = new Map<string, { at: number; epoch: number }>();

const tkey = (type: ThreadType, id: string) => `${type}:${id}`;
const ekey = (type: ThreadType, id: string, epoch: number) => `${type}:${id}:${epoch}`;

function db() {
  const client = createClient();
  if (!client) throw new E2eeError('server', 'Supabase is not configured');
  return client;
}

const sameJwk = (a: JsonWebKey, b: JsonWebKey) => a.x === b.x && a.y === b.y;

async function loadIdentity(userId: string): Promise<StoredIdentity> {
  const cached = identityCache.get(userId);
  if (cached) return cached;
  const stored = await KeyStore.get(userId);
  if (!stored) throw new E2eeError('not-ready', 'Secure messaging is locked on this device.');
  identityCache.set(userId, stored);
  return stored;
}

async function persistIdentity(userId: string, privateJwk: JsonWebKey, publicJwk: JsonWebKey, keyVersion: number) {
  const identity: StoredIdentity = { privateKey: await importPrivateKey(privateJwk), publicJwk, keyVersion };
  const saved = await KeyStore.put(userId, identity);
  // If IndexedDB is blocked (some private-browsing modes) keep it in memory for this tab only.
  identityCache.set(userId, identity);
  return saved;
}

function forgetThreadState(threadPrefix?: string) {
  if (!threadPrefix) {
    threadKeyCache.clear();
    syncCache.clear();
    return;
  }
  for (const k of [...threadKeyCache.keys()]) if (k.startsWith(threadPrefix)) threadKeyCache.delete(k);
  syncCache.delete(threadPrefix);
}

// ─────────────────────────── identity lifecycle ───────────────────────────

async function getStatus(userId: string): Promise<E2eeStatus> {
  if (typeof globalThis.crypto?.subtle === 'undefined' || typeof indexedDB === 'undefined') return 'unavailable';
  let client;
  try { client = db(); } catch { return 'unavailable'; }

  const { data: row, error } = await client.from('user_public_keys').select('public_key, key_version').eq('user_id', userId).maybeSingle();
  if (error) return 'unavailable';

  if (!row) {
    // Server has no identity for this user (never set up, or wiped): any local key is orphaned.
    identityCache.delete(userId);
    await KeyStore.remove(userId);
    return 'needs-setup';
  }

  const local = identityCache.get(userId) ?? (await KeyStore.get(userId));
  if (local && local.keyVersion === row.key_version && sameJwk(local.publicJwk, row.public_key as JsonWebKey)) {
    identityCache.set(userId, local);
    return 'ready';
  }
  // Keys were reset elsewhere, or this is a new device / cleared browser.
  identityCache.delete(userId);
  return 'needs-unlock';
}

/**
 * Create (or replace) this user's chat identity.
 *   - no passphrase: the key lives only on this device (like WhatsApp with backups off).
 *   - passphrase:    additionally stores an encrypted backup so chats can be restored on another device.
 * `fresh` = replacing an existing identity (bumps the key version, clears wrapped thread keys and any old backup).
 */
async function createIdentity(userId: string, passphrase: string | undefined, fresh: boolean): Promise<void> {
  if (passphrase !== undefined) {
    const problem = passphraseProblem(passphrase);
    if (problem) throw new E2eeError('weak-passphrase', problem);
  }

  const client = db();
  let version = 1;
  if (fresh) {
    const { data: existing } = await client.from('user_public_keys').select('key_version').eq('user_id', userId).maybeSingle();
    version = ((existing?.key_version as number | undefined) ?? 0) + 1;
  }

  const identity = await generateIdentity();

  if (passphrase !== undefined) {
    const backup = await backupPrivateKey(identity.privateJwk, passphrase);
    const { error: backupError } = await client.from('user_key_backups').upsert({
      user_id: userId,
      wrapped_private_key: backup.wrapped,
      kdf_salt: backup.salt,
      kdf_iterations: backup.iterations,
      wrap_iv: backup.iv,
      key_version: version,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (backupError) throw new E2eeError('server', backupError.message);
  } else {
    // No backup requested: make sure a stale one for the OLD key isn't left behind to mislead a later restore.
    await client.from('user_key_backups').delete().eq('user_id', userId);
  }

  const { error: keyError } = await client.from('user_public_keys').upsert({
    user_id: userId,
    public_key: identity.publicJwk,
    key_version: version,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (keyError) throw new E2eeError('server', keyError.message);

  if (fresh) {
    // Wrapped keys addressed to the old identity are useless now - clear them so
    // other members' clients publish a fresh epoch that includes the new key.
    await client.from('chat_thread_keys').delete().eq('user_id', userId);
  }

  await persistIdentity(userId, identity.privateJwk, identity.publicJwk, version);
  forgetThreadState();
}

/** First-time setup. Passphrase is optional - omit it for one-tap setup. */
const setup = (userId: string, passphrase?: string) => createIdentity(userId, passphrase, false);

/** Whether an encrypted backup exists on the server (i.e. a passphrase restore is possible). */
async function hasBackup(userId: string): Promise<boolean> {
  const { data } = await db().from('user_key_backups').select('user_id').eq('user_id', userId).maybeSingle();
  return !!data;
}

async function unlock(userId: string, passphrase: string): Promise<void> {
  const client = db();
  const [{ data: backup }, { data: pub }] = await Promise.all([
    client.from('user_key_backups').select('*').eq('user_id', userId).maybeSingle(),
    client.from('user_public_keys').select('public_key, key_version').eq('user_id', userId).maybeSingle(),
  ]);
  if (!backup || !pub) throw new E2eeError('server', 'No secure-messaging backup found for this account.');

  let privateJwk: JsonWebKey;
  try {
    privateJwk = await restorePrivateKey(
      { wrapped: backup.wrapped_private_key, salt: backup.kdf_salt, iv: backup.wrap_iv, iterations: backup.kdf_iterations },
      passphrase,
    );
  } catch {
    throw new E2eeError('bad-passphrase', 'That passphrase is incorrect.');
  }
  // The backup must belong to the public key on file - otherwise refuse rather than run with a mismatched pair.
  if (!sameJwk(privateJwk, pub.public_key as JsonWebKey)) throw new E2eeError('server', 'Backup does not match your public key.');

  await persistIdentity(userId, privateJwk, pub.public_key as JsonWebKey, pub.key_version as number);
  forgetThreadState();
}

/**
 * Start fresh on this device. Messages this device can't currently read stay unreadable;
 * the old device (if any) will need to start fresh or restore a backup too. Passphrase optional.
 */
const reset = (userId: string, passphrase?: string) => createIdentity(userId, passphrase, true);

async function lock(userId: string): Promise<void> {
  identityCache.delete(userId);
  await KeyStore.remove(userId);
  forgetThreadState();
}

// ─────────────────────────── thread key distribution ───────────────────────────

interface KeyStateRow {
  out_user_id: string;
  out_pub_version: number | null;
  out_row_version: number | null;
  out_latest_epoch: number;
}

async function fetchMyKey(threadType: ThreadType, threadId: string, userId: string, epoch?: number): Promise<{ key: CryptoKey; epoch: number } | null> {
  const client = db();
  const identity = await loadIdentity(userId);

  let query = client
    .from('chat_thread_keys')
    .select('epoch, wrapped_key, wrap_iv, eph_public_key')
    .eq('thread_type', threadType)
    .eq('thread_id', threadId)
    .eq('user_id', userId);
  query = epoch === undefined ? query.order('epoch', { ascending: false }).limit(1) : query.eq('epoch', epoch).limit(1);

  const { data, error } = await query;
  if (error) throw new E2eeError('server', error.message);
  const row = data?.[0];
  if (!row) return null;

  try {
    const key = await unwrapThreadKey(
      { wrapped: row.wrapped_key, iv: row.wrap_iv, ephPublicJwk: row.eph_public_key as JsonWebKey },
      identity.privateKey,
    );
    threadKeyCache.set(ekey(threadType, threadId, row.epoch), key);
    return { key, epoch: row.epoch as number };
  } catch {
    return null; // wrapped to an identity we no longer hold (e.g. after a reset)
  }
}

/**
 * Make sure this thread has a current key that every member WITH an identity
 * holds a wrapped copy of, and return ours. Starts a new epoch when someone is
 * missing or holds a stale wrap (newly added member, or a member who reset).
 */
async function ensureThreadKey(threadType: ThreadType, threadId: string, userId: string): Promise<{ key: CryptoKey; epoch: number }> {
  await loadIdentity(userId);
  const tk = tkey(threadType, threadId);

  const fresh = syncCache.get(tk);
  if (fresh && Date.now() - fresh.at < KEY_STATE_TTL_MS) {
    const cached = threadKeyCache.get(ekey(threadType, threadId, fresh.epoch));
    if (cached) return { key: cached, epoch: fresh.epoch };
  }

  const client = db();

  for (let attempt = 0; attempt < MAX_PUBLISH_ATTEMPTS; attempt++) {
    const { data, error } = await client.rpc('get_thread_key_state', { p_type: threadType, p_id: threadId });
    if (error) throw new E2eeError('server', error.message);
    const rows = (data ?? []) as KeyStateRow[];
    const latest = rows[0]?.out_latest_epoch ?? 0;

    const withIdentity = rows.filter((r) => r.out_pub_version !== null);
    const needsNewEpoch = withIdentity.some((r) => r.out_row_version !== r.out_pub_version);

    if (!needsNewEpoch) {
      const mine = await fetchMyKey(threadType, threadId, userId);
      if (mine) {
        syncCache.set(tk, { at: Date.now(), epoch: mine.epoch });
        return mine;
      }
    }

    // A 1:1 chat needs the other person's identity before anything can be sent.
    if (threadType === 'dm' && withIdentity.length < rows.length) {
      throw new E2eeError('peer-not-ready', 'They haven’t turned on secure messaging yet.');
    }

    const { data: pubs, error: pubError } = await client
      .from('user_public_keys')
      .select('user_id, public_key, key_version')
      .in('user_id', withIdentity.map((r) => r.out_user_id));
    if (pubError) throw new E2eeError('server', pubError.message);

    const threadKey = await generateThreadKey();
    const wraps = await Promise.all(
      (pubs ?? []).map(async (p) => {
        const w = await wrapThreadKey(threadKey, p.public_key as JsonWebKey);
        return {
          user_id: p.user_id as string,
          wrapped_key: w.wrapped,
          wrap_iv: w.iv,
          eph_public_key: w.ephPublicJwk,
          recipient_key_version: p.key_version as number,
        };
      }),
    );

    const { error: publishError } = await client.rpc('publish_thread_key_epoch', {
      p_type: threadType,
      p_id: threadId,
      p_epoch: latest + 1,
      p_rows: wraps,
    });
    if (publishError) throw new E2eeError('server', publishError.message);
    // `false` (someone else won the race) is fine: loop, re-read, and adopt their key.
  }

  const mine = await fetchMyKey(threadType, threadId, userId);
  if (!mine) throw new E2eeError('no-key', 'Couldn’t get an encryption key for this chat.');
  syncCache.set(tk, { at: Date.now(), epoch: mine.epoch });
  return mine;
}

// ─────────────────────────── seal / open ───────────────────────────

async function seal(threadType: ThreadType, threadId: string, userId: string, payload: MessagePayload): Promise<EncryptedFields> {
  const { key, epoch } = await ensureThreadKey(threadType, threadId, userId);
  const sealed = await encryptPayload(key, payload, aadFor(threadType, threadId, userId, epoch));
  return { ciphertext: sealed.ciphertext, iv: sealed.iv, key_epoch: epoch };
}

/** Returns null when this device can't open the message (no key for that epoch, wrong thread, or tampering). */
async function open(
  threadType: ThreadType,
  threadId: string,
  userId: string,
  msg: { sender_id: string; ciphertext: string; iv: string; key_epoch: number },
): Promise<MessagePayload | null> {
  try {
    let key = threadKeyCache.get(ekey(threadType, threadId, msg.key_epoch));
    if (!key) {
      const fetched = await fetchMyKey(threadType, threadId, userId, msg.key_epoch);
      key = fetched?.key;
    }
    if (!key) return null;
    const sealed: Sealed = { ciphertext: msg.ciphertext, iv: msg.iv };
    return await decryptPayload<MessagePayload>(key, sealed, aadFor(threadType, threadId, msg.sender_id, msg.key_epoch));
  } catch {
    return null;
  }
}

export const E2ee = { getStatus, setup, unlock, reset, hasBackup, lock, seal, open, ensureThreadKey, forgetThreadState };
