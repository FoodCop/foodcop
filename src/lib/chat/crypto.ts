// End-to-end encryption primitives for chat - WebCrypto only, no I/O, no
// dependencies, so it runs identically in the browser and in Node (which is how
// it is tested).
//
//   identity     ECDH P-256 keypair per user (public stored server-side,
//                private only ever leaves the browser as a passphrase backup)
//   thread key   random AES-256-GCM key per thread epoch
//   key wrap     ephemeral-static ECDH -> HKDF-SHA256 -> AES-256-GCM (one wrap
//                per member; the wrapper's long-term key is NOT involved, so a
//                wrapper resetting their identity never breaks old wraps)
//   backup       PBKDF2-SHA256 (600k iterations) from a passphrase -> AES-GCM
//   messages     AES-256-GCM, fresh 96-bit IV each, AAD binds the ciphertext to
//                its thread + sender + epoch so it can't be replayed elsewhere

const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();

export const PBKDF2_ITERATIONS = 600_000;
const WRAP_INFO = enc.encode('fuzo-chat-thread-key-wrap-v1');

// ── base64 helpers (chunked so large buffers don't overflow the call stack) ──
export function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(s.length));
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

const randomBytes = (n: number) => globalThis.crypto.getRandomValues(new Uint8Array(new ArrayBuffer(n)));

// ── identity ──
export interface Identity {
  publicJwk: JsonWebKey;
  /** Extractable private JWK - only used to make the passphrase backup, then discarded. */
  privateJwk: JsonWebKey;
}

export async function generateIdentity(): Promise<Identity> {
  const pair = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  return {
    publicJwk: await subtle.exportKey('jwk', pair.publicKey),
    privateJwk: await subtle.exportKey('jwk', pair.privateKey),
  };
}

/** Non-extractable private key: usable for ECDH but its bytes can't be read back out by script. */
export function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
}

export function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  // Strip anything but the public parts so a hostile row can't smuggle in "d".
  const { kty, crv, x, y } = jwk;
  return subtle.importKey('jwk', { kty, crv, x, y }, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
}

// ── passphrase backup ──
export interface PassphraseBackup {
  wrapped: string;
  salt: string;
  iv: string;
  iterations: number;
}

async function passphraseKey(passphrase: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const base = await subtle.importKey('raw', enc.encode(passphrase.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function backupPrivateKey(privateJwk: JsonWebKey, passphrase: string, iterations = PBKDF2_ITERATIONS): Promise<PassphraseBackup> {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await passphraseKey(passphrase, salt, iterations);
  const wrapped = await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(privateJwk)));
  return { wrapped: toB64(wrapped), salt: toB64(salt), iv: toB64(iv), iterations };
}

/** Throws if the passphrase is wrong (AES-GCM authentication fails). */
export async function restorePrivateKey(backup: PassphraseBackup, passphrase: string): Promise<JsonWebKey> {
  const key = await passphraseKey(passphrase, fromB64(backup.salt), backup.iterations);
  const plain = await subtle.decrypt({ name: 'AES-GCM', iv: fromB64(backup.iv) }, key, fromB64(backup.wrapped));
  return JSON.parse(dec.decode(plain)) as JsonWebKey;
}

// ── thread keys ──
export function generateThreadKey(): Promise<CryptoKey> {
  return subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

export interface WrappedKey {
  wrapped: string;
  iv: string;
  ephPublicJwk: JsonWebKey;
}

async function wrapKek(ecdhPrivate: CryptoKey, ecdhPublic: CryptoKey, salt: Uint8Array<ArrayBuffer>, usages: KeyUsage[]): Promise<CryptoKey> {
  const bits = await subtle.deriveBits({ name: 'ECDH', public: ecdhPublic }, ecdhPrivate, 256);
  const hkdf = await subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
  return subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: WRAP_INFO }, hkdf, { name: 'AES-GCM', length: 256 }, false, usages);
}

export async function wrapThreadKey(threadKey: CryptoKey, recipientPublicJwk: JsonWebKey): Promise<WrappedKey> {
  const recipient = await importPublicKey(recipientPublicJwk);
  const eph = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const iv = randomBytes(12);
  const kek = await wrapKek(eph.privateKey, recipient, iv, ['encrypt']);
  const raw = await subtle.exportKey('raw', threadKey);
  const wrapped = await subtle.encrypt({ name: 'AES-GCM', iv }, kek, raw);
  return { wrapped: toB64(wrapped), iv: toB64(iv), ephPublicJwk: await subtle.exportKey('jwk', eph.publicKey) };
}

export async function unwrapThreadKey(w: WrappedKey, recipientPrivate: CryptoKey): Promise<CryptoKey> {
  const eph = await importPublicKey(w.ephPublicJwk);
  const iv = fromB64(w.iv);
  const kek = await wrapKek(recipientPrivate, eph, iv, ['decrypt']);
  const raw = await subtle.decrypt({ name: 'AES-GCM', iv }, kek, fromB64(w.wrapped));
  return subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

// ── messages ──
export interface Sealed {
  ciphertext: string;
  iv: string;
}

export const aadFor = (threadType: string, threadId: string, senderId: string, epoch: number) =>
  enc.encode(`fuzo-chat-v1|${threadType}|${threadId}|${senderId}|${epoch}`);

export async function encryptPayload(threadKey: CryptoKey, payload: unknown, aad: Uint8Array<ArrayBuffer>): Promise<Sealed> {
  const iv = randomBytes(12);
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, threadKey, enc.encode(JSON.stringify(payload)));
  return { ciphertext: toB64(ct), iv: toB64(iv) };
}

/** Throws if the key, IV, ciphertext or AAD don't match (any tampering or wrong thread/sender/epoch). */
export async function decryptPayload<T = unknown>(threadKey: CryptoKey, sealed: Sealed, aad: Uint8Array<ArrayBuffer>): Promise<T> {
  const plain = await subtle.decrypt({ name: 'AES-GCM', iv: fromB64(sealed.iv), additionalData: aad }, threadKey, fromB64(sealed.ciphertext));
  return JSON.parse(dec.decode(plain)) as T;
}

/** Rough strength gate for the backup passphrase (the only thing protecting the key backup). */
export function passphraseProblem(passphrase: string): string | null {
  if (passphrase.length < 10) return 'Use at least 10 characters.';
  if (new Set(passphrase).size < 5) return 'Use a more varied passphrase.';
  if (/^(password|12345|qwerty|letmein)/i.test(passphrase)) return 'That passphrase is too easy to guess.';
  return null;
}
