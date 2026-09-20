/**
 * ============================================================================
 * CHAT SERVICE - real-time, end-to-end encrypted messaging
 * ============================================================================
 *
 * Direct messages and group chats over Supabase. Every message body (text and
 * any shared item) is encrypted in the browser with a per-thread AES-256-GCM
 * key before it is sent - see src/lib/chat/e2ee.ts. The database only ever
 * stores ciphertext (a trigger rejects plaintext inserts), so neither the
 * server nor anyone with database access can read a conversation.
 *
 * Also here: friends-only contacts, inbox with last message + unread counts,
 * read markers / receipts, unsend, block + report, typing, and presence.
 */

import { createClient } from '../supabase/client';
import type { AppItem } from '../../types/appItem';
import { E2ee, E2eeError, type MessagePayload, type ThreadType } from '../chat/e2ee';
import { sanitizeSharedItem } from '../chat/safeItem';
import { MediaUploadService } from './mediaUploadService';

const supabase = createClient();

export const MAX_MESSAGE_CHARS = 2000;

// ─────────────────────────────── entities ───────────────────────────────

type ChatSharedItem = AppItem;

export interface ChatContact {
  id: string;
  name: string;
  username: string;
  /** null = no photo; the UI draws initials. Never a placeholder-photo service. */
  avatar: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  groupId?: string;
  senderId: string;
  content: string;
  sharedItem: ChatSharedItem | null;
  createdAt: string;
  /** true when this message was end-to-end encrypted (false = a legacy plaintext row from before). */
  encrypted: boolean;
  /** This device could not decrypt it (no key for its epoch, or it was tampered with). */
  undecryptable: boolean;
}

export interface ChatGroup {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  createdBy: string;
  createdAt: string;
  lastMessageAt?: string;
}

export interface GroupMember extends ChatContact {
  role: 'admin' | 'member';
}

export interface InboxThread {
  type: ThreadType;
  /** Conversation id (dm) or group id (group). */
  id: string;
  peerId?: string;
  title: string;
  avatar: string | null;
  username?: string;
  createdAt: string;
  lastAt: string | null;
  lastText: string;
  lastMine: boolean;
  unread: number;
}

export interface IncomingRequest {
  requestId: string;
  from: ChatContact;
  createdAt: string;
}

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other';

interface ChatResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  /** Machine-readable reason for encryption failures, so the UI can explain rather than show a raw error. */
  code?: string;
}

type SupabaseRealtimePayload = { new?: unknown; old?: unknown };

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

// postgres_changes channels are client-local, so each subscription gets a unique
// suffix - otherwise React Strict Mode's double-invoked effects reuse a topic
// that is still subscribed and .on() throws.
const uniqueChannelSuffix = () => Math.random().toString(36).slice(2);

const fail = (error: unknown): { success: false; error: string; code?: string } => {
  if (error instanceof E2eeError) return { success: false, error: error.message, code: error.code };
  return { success: false, error: error instanceof Error ? error.message : String(error) };
};

// ─────────────────────────────── mappers ───────────────────────────────

const toChatContact = (value: unknown): ChatContact => {
  const row = asRecord(value);
  const username = typeof row.username === 'string' && row.username ? row.username : 'fuzo_user';
  const display = typeof row.display_name === 'string' ? row.display_name.trim() : '';
  const avatar = typeof row.avatar_url === 'string' && row.avatar_url.trim() ? row.avatar_url : null;
  return { id: String(row.id || ''), name: display || username, username, avatar };
};

const toChatGroup = (value: unknown): ChatGroup => {
  const row = asRecord(value);
  return {
    id: String(row.id || ''),
    name: String(row.name || 'Group'),
    description: typeof row.description === 'string' ? row.description : undefined,
    avatarUrl: typeof row.avatar_url === 'string' ? row.avatar_url : undefined,
    createdBy: String(row.created_by || ''),
    createdAt: String(row.created_at || ''),
    lastMessageAt: typeof row.last_message_at === 'string' ? row.last_message_at : undefined,
  };
};

const MESSAGE_COLUMNS = 'id, conversation_id, group_id, sender_id, content, shared_item, created_at, ciphertext, iv, key_epoch';
const DM_COLUMNS = 'id, conversation_id, sender_id, content, shared_item, created_at, ciphertext, iv, key_epoch';
const GROUP_COLUMNS = 'id, group_id, sender_id, content, shared_item, created_at, ciphertext, iv, key_epoch';
void MESSAGE_COLUMNS;

/** Turn a raw row into a ChatMessage, decrypting it if it is an encrypted row. */
async function hydrateMessage(threadType: ThreadType, threadId: string, currentUserId: string, value: unknown): Promise<ChatMessage> {
  const row = asRecord(value);
  const base = {
    id: String(row.id || ''),
    conversationId: row.conversation_id ? String(row.conversation_id) : undefined,
    groupId: row.group_id ? String(row.group_id) : undefined,
    senderId: String(row.sender_id || ''),
    createdAt: String(row.created_at || ''),
  };

  const isEncrypted = typeof row.ciphertext === 'string' && typeof row.iv === 'string' && typeof row.key_epoch === 'number';
  if (!isEncrypted) {
    // Legacy plaintext row from before secure messaging - still shown, flagged as unencrypted.
    return {
      ...base,
      content: typeof row.content === 'string' ? row.content : '',
      sharedItem: sanitizeSharedItem(row.shared_item),
      encrypted: false,
      undecryptable: false,
    };
  }

  const payload = await E2ee.open(threadType, threadId, currentUserId, {
    sender_id: base.senderId,
    ciphertext: row.ciphertext as string,
    iv: row.iv as string,
    key_epoch: row.key_epoch as number,
  });
  if (!payload) return { ...base, content: '', sharedItem: null, encrypted: true, undecryptable: true };

  return {
    ...base,
    content: typeof payload.t === 'string' ? payload.t : '',
    sharedItem: sanitizeSharedItem(payload.item),
    encrypted: true,
    undecryptable: false,
  };
}

export const previewOfMessage = (m: ChatMessage): string => {
  if (m.undecryptable) return '🔒 Encrypted message';
  if (m.sharedItem) return `📎 ${m.sharedItem.name || m.sharedItem.title || 'Shared item'}`;
  return m.content || 'Message';
};

/**
 * A card's photo is stored as a data URL. That can't ride inside a chat message, so upload it once and
 * send the link (the original photo, not a stand-in). If the upload fails the card is still shared, just
 * without a cover.
 */
async function withHostedImage(item?: AppItem | null): Promise<AppItem | null | undefined> {
  if (!item) return item;
  const inline = [item.img, item.image, item.imageUrl].find((v): v is string => typeof v === 'string' && v.startsWith('data:image/'));
  if (!inline) return item;
  const hosted = await MediaUploadService.uploadDataUrlImage(inline);
  if (!hosted.success) console.warn('Card photo could not be attached to the chat message:', hosted.error);
  return { ...item, img: hosted.success ? hosted.data : undefined, image: undefined, imageUrl: undefined };
}

// ─────────────────────────────── service ───────────────────────────────

export const ChatService = {
  // ── Contacts (real friends only) ──────────────────────────────────────────
  /**
   * Accepted friends only. The old version listed the 100 highest-scoring users
   * on the platform, i.e. strangers, with no relationship at all.
   */
  async listFriends(currentUserId: string): Promise<ChatResult<ChatContact[]>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data: links, error } = await client
      .from('friend_requests')
      .select('requester_id, requested_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${currentUserId},requested_id.eq.${currentUserId}`);
    if (error) return { success: false, error: error.message };

    const ids = [...new Set((links ?? []).map((l) => (l.requester_id === currentUserId ? l.requested_id : l.requester_id)))];
    if (ids.length === 0) return { success: true, data: [] };

    const { data: users, error: usersError } = await client
      .from('users')
      .select('id, display_name, username, avatar_url')
      .in('id', ids);
    if (usersError) return { success: false, error: usersError.message };

    const contacts = (users ?? []).map(toChatContact).sort((a, b) => a.name.localeCompare(b.name));
    return { success: true, data: contacts };
  },

  /** Kept for callers written against the old API - now returns friends only. */
  async listContacts(currentUserId: string): Promise<ChatResult<ChatContact[]>> {
    return ChatService.listFriends(currentUserId);
  },

  /** Pending follow requests sent TO you (shown as "Requests" in the inbox). */
  async listIncomingRequests(currentUserId: string): Promise<ChatResult<IncomingRequest[]>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data, error } = await client
      .from('friend_requests')
      .select('id, requester_id, created_at')
      .eq('requested_id', currentUserId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) return { success: false, error: error.message };
    if (!data?.length) return { success: true, data: [] };

    const { data: users, error: usersError } = await client
      .from('users')
      .select('id, display_name, username, avatar_url')
      .in('id', data.map((r) => r.requester_id));
    if (usersError) return { success: false, error: usersError.message };
    const byId = new Map((users ?? []).map((u) => [u.id, toChatContact(u)]));

    return {
      success: true,
      data: data
        .map((r) => (byId.has(r.requester_id) ? { requestId: r.id as string, from: byId.get(r.requester_id) as ChatContact, createdAt: String(r.created_at) } : null))
        .filter((r): r is IncomingRequest => r !== null),
    };
  },

  /** Find people to follow: public identity columns only, minimum 2 characters, capped. */
  async searchPeople(query: string, currentUserId: string): Promise<ChatResult<ChatContact[]>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };
    const q = query.replace(/[^\p{L}\p{N} ._-]/gu, '').trim().slice(0, 40);
    if (q.length < 2) return { success: true, data: [] };

    const { data, error } = await client
      .from('users')
      .select('id, display_name, username, avatar_url')
      .eq('is_master_bot', false)
      .neq('id', currentUserId)
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(8);
    if (error) return { success: false, error: error.message };
    return { success: true, data: (data ?? []).map(toChatContact) };
  },

  /** Whether this person has set up secure messaging (has a public key on file). Needed before a DM can be sent. */
  async hasSecureMessaging(userId: string): Promise<boolean> {
    const client = supabase;
    if (!client) return false;
    const { data } = await client.from('user_public_keys').select('user_id').eq('user_id', userId).maybeSingle();
    return !!data;
  },

  // ── Direct messages ───────────────────────────────────────────────────────
  async getOrCreateConversation(currentUserId: string, otherUserId: string): Promise<ChatResult<{ id: string }>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const [participant1, participant2] = [currentUserId, otherUserId].sort((l, r) => l.localeCompare(r));

    const { data: existing, error: existingError } = await client
      .from('dm_conversations')
      .select('id')
      .eq('participant_1', participant1)
      .eq('participant_2', participant2)
      .maybeSingle();
    if (existingError) return { success: false, error: existingError.message };
    if (existing?.id) return { success: true, data: { id: existing.id } };

    const { data, error } = await client
      .from('dm_conversations')
      .insert({
        participant_1: participant1,
        participant_2: participant2,
        initiator_id: currentUserId,
        status: 'active',
        accepted_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data: { id: data.id } };
  },

  async listMessages(params: { threadType: ThreadType; threadId: string; userId: string; limit?: number }): Promise<ChatResult<ChatMessage[]>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const isDm = params.threadType === 'dm';
    const { data, error } = await client
      .from(isDm ? 'dm_messages' : 'group_messages')
      .select(isDm ? DM_COLUMNS : GROUP_COLUMNS)
      .eq(isDm ? 'conversation_id' : 'group_id', params.threadId)
      .order('created_at', { ascending: false })
      .limit(params.limit ?? 300);
    if (error) return { success: false, error: error.message };

    const rows = ((data ?? []) as unknown[]).reverse();
    const messages = await Promise.all(rows.map((row) => hydrateMessage(params.threadType, params.threadId, params.userId, row)));
    return { success: true, data: messages };
  },

  async getConversationParticipants(conversationId: string): Promise<ChatResult<{ id: string; participant1: string; participant2: string }>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };
    const { data, error } = await client
      .from('dm_conversations')
      .select('id, participant_1, participant_2')
      .eq('id', conversationId)
      .maybeSingle();
    if (error || !data) return { success: false, error: error?.message || 'Conversation not found' };
    return { success: true, data: { id: data.id, participant1: data.participant_1, participant2: data.participant_2 } };
  },

  // ── Sending (everything is encrypted here, in the browser) ────────────────
  async sendEncrypted(params: {
    threadType: ThreadType;
    threadId: string;
    senderId: string;
    payload: MessagePayload;
  }): Promise<ChatResult<ChatMessage>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const text = params.payload.t?.trim();
    if (params.payload.t !== undefined && !text && !params.payload.item) return { success: false, error: 'Message is empty' };
    if (text && text.length > MAX_MESSAGE_CHARS) return { success: false, error: `Messages are limited to ${MAX_MESSAGE_CHARS} characters` };

    try {
      const item = params.payload.item ? sanitizeSharedItem(await withHostedImage(params.payload.item)) : null;
      const sealed = await E2ee.seal(params.threadType, params.threadId, params.senderId, {
        ...(text ? { t: text } : {}),
        ...(item ? { item } : {}),
      });

      const isDm = params.threadType === 'dm';
      const { data, error } = await client
        .from(isDm ? 'dm_messages' : 'group_messages')
        .insert({
          [isDm ? 'conversation_id' : 'group_id']: params.threadId,
          sender_id: params.senderId,
          content: '',
          shared_item: null,
          ciphertext: sealed.ciphertext,
          iv: sealed.iv,
          key_epoch: sealed.key_epoch,
        })
        .select(isDm ? DM_COLUMNS : GROUP_COLUMNS)
        .single();
      if (error) return { success: false, error: error.message };

      // We just wrote it, so we already know what it says - no need to decrypt our own message.
      const row = asRecord(data);
      return {
        success: true,
        data: {
          id: String(row.id),
          conversationId: isDm ? params.threadId : undefined,
          groupId: isDm ? undefined : params.threadId,
          senderId: params.senderId,
          content: text ?? '',
          sharedItem: item,
          createdAt: String(row.created_at),
          encrypted: true,
          undecryptable: false,
        },
      };
    } catch (err) {
      return fail(err);
    }
  },

  sendTextMessage: (p: { conversationId: string; senderId: string; content: string }) =>
    ChatService.sendEncrypted({ threadType: 'dm', threadId: p.conversationId, senderId: p.senderId, payload: { t: p.content } }),

  sendSharedItemMessage: (p: { conversationId: string; senderId: string; item: ChatSharedItem }) =>
    ChatService.sendEncrypted({ threadType: 'dm', threadId: p.conversationId, senderId: p.senderId, payload: { item: p.item } }),

  sendGroupTextMessage: (p: { groupId: string; senderId: string; content: string }) =>
    ChatService.sendEncrypted({ threadType: 'group', threadId: p.groupId, senderId: p.senderId, payload: { t: p.content } }),

  sendGroupSharedItemMessage: (p: { groupId: string; senderId: string; item: ChatSharedItem }) =>
    ChatService.sendEncrypted({ threadType: 'group', threadId: p.groupId, senderId: p.senderId, payload: { item: p.item } }),

  /** Unsend: removes the message for everyone (RLS lets a sender delete only their own). */
  async deleteMessage(threadType: ThreadType, messageId: string): Promise<ChatResult<null>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };
    const { error } = await client.from(threadType === 'dm' ? 'dm_messages' : 'group_messages').delete().eq('id', messageId);
    if (error) return { success: false, error: error.message };
    return { success: true, data: null };
  },

  // ── Inbox, unread, receipts ───────────────────────────────────────────────
  /** Every thread you're in, with the real last message (decrypted here) and unread count. */
  async getInbox(userId: string): Promise<ChatResult<InboxThread[]>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data, error } = await client.rpc('get_chat_inbox');
    if (error) return { success: false, error: error.message };
    const rows = (data ?? []) as Record<string, unknown>[];

    const peerIds = [...new Set(rows.map((r) => r.out_peer_id).filter((v): v is string => typeof v === 'string'))];
    const peers = new Map<string, ChatContact>();
    if (peerIds.length) {
      const { data: users } = await client.from('users').select('id, display_name, username, avatar_url').in('id', peerIds);
      for (const u of users ?? []) peers.set(u.id, toChatContact(u));
    }

    const threads = await Promise.all(
      rows.map(async (r): Promise<InboxThread> => {
        const type = r.out_thread_type as ThreadType;
        const id = String(r.out_thread_id);
        const peer = typeof r.out_peer_id === 'string' ? peers.get(r.out_peer_id) : undefined;

        let lastText = '';
        if (r.out_last_at) {
          const m = await hydrateMessage(type, id, userId, {
            id: 'preview',
            sender_id: r.out_last_sender,
            content: r.out_last_content,
            shared_item: r.out_last_shared ? { name: 'Shared item' } : null,
            ciphertext: r.out_last_ciphertext,
            iv: r.out_last_iv,
            key_epoch: r.out_last_epoch,
            created_at: r.out_last_at,
          });
          lastText = previewOfMessage(m);
        }

        return {
          type,
          id,
          peerId: typeof r.out_peer_id === 'string' ? r.out_peer_id : undefined,
          title: type === 'dm' ? peer?.name ?? 'Unknown user' : String(r.out_title || 'Group'),
          avatar: type === 'dm' ? peer?.avatar ?? null : (typeof r.out_avatar_url === 'string' ? r.out_avatar_url : null),
          username: peer?.username,
          createdAt: String(r.out_created_at),
          lastAt: r.out_last_at ? String(r.out_last_at) : null,
          lastText,
          lastMine: r.out_last_sender === userId,
          unread: Number(r.out_unread) || 0,
        };
      }),
    );

    threads.sort((a, b) => (b.lastAt ?? b.createdAt).localeCompare(a.lastAt ?? a.createdAt));
    return { success: true, data: threads };
  },

  async markRead(threadType: ThreadType, threadId: string, userId: string): Promise<void> {
    const client = supabase;
    if (!client) return;
    await client
      .from('chat_reads')
      .upsert({ user_id: userId, thread_type: threadType, thread_id: threadId, last_read_at: new Date().toISOString() }, { onConflict: 'user_id,thread_type,thread_id' });
  },

  /** When the other person last read this DM (null if unknown or they turned receipts off). */
  async getPeerReadAt(conversationId: string): Promise<string | null> {
    const client = supabase;
    if (!client) return null;
    const { data, error } = await client.rpc('get_dm_peer_read', { p_conversation: conversationId });
    return error || typeof data !== 'string' ? null : data;
  },

  // ── Realtime ──────────────────────────────────────────────────────────────
  /**
   * One subscription for every thread you're in. Row-level security decides what
   * the realtime server delivers, so this only ever yields messages from your own
   * conversations and groups. Each is decrypted before the callback fires.
   */
  subscribeToAllMessages(
    userId: string,
    handlers: {
      onMessage: (event: { threadType: ThreadType; threadId: string; message: ChatMessage }) => void;
      onDelete: (event: { threadType: ThreadType; messageId: string }) => void;
    },
  ) {
    const client = supabase;
    if (!client) return () => undefined;

    const insertHandler = (threadType: ThreadType) => async (payload: SupabaseRealtimePayload) => {
      try {
        const row = asRecord(payload.new);
        const threadId = String(threadType === 'dm' ? row.conversation_id : row.group_id || '');
        if (!row.id || !threadId) return;
        const message = await hydrateMessage(threadType, threadId, userId, row);
        handlers.onMessage({ threadType, threadId, message });
      } catch (err) {
        console.error('Realtime message error:', err);
      }
    };
    const deleteHandler = (threadType: ThreadType) => (payload: SupabaseRealtimePayload) => {
      const id = asRecord(payload.old).id;
      if (typeof id === 'string') handlers.onDelete({ threadType, messageId: id });
    };

    const channel = client
      .channel(`chat:${userId}:${uniqueChannelSuffix()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_messages' }, insertHandler('dm'))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, insertHandler('group'))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'dm_messages' }, deleteHandler('dm'))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'group_messages' }, deleteHandler('group'))
      .subscribe();

    return () => {
      client.removeChannel(channel).catch((e) => console.error('Unsubscribe error:', e));
    };
  },

  /** Typing indicator for one open thread (ephemeral broadcast; carries only a user id and a boolean). */
  openTypingChannel(threadType: ThreadType, threadId: string, userId: string, onTyping: (userId: string, isTyping: boolean) => void) {
    const client = supabase;
    if (!client) return { setTyping: () => undefined, close: () => undefined };

    let ready = false;
    const channel = client
      .channel(`typing:${threadType}:${threadId}:${uniqueChannelSuffix()}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const data = asRecord(payload);
        if (typeof data.userId === 'string' && data.userId !== userId) onTyping(data.userId, Boolean(data.isTyping));
      })
      .subscribe((status) => { ready = status === 'SUBSCRIBED'; });

    return {
      setTyping: (isTyping: boolean) => {
        if (ready) channel.send({ type: 'broadcast', event: 'typing', payload: { userId, isTyping } });
      },
      close: () => { client.removeChannel(channel).catch(() => undefined); },
    };
  },

  /**
   * Who is online right now, from Realtime Presence (nothing is stored in the
   * database - the old is_online/last_seen columns were never written and never
   * true). Mutual: if you turn "Show when I'm active" off you neither appear nor
   * see anyone else.
   */
  joinPresence(userId: string, enabled: boolean, onSync: (onlineIds: Set<string>) => void) {
    const client = supabase;
    if (!client || !enabled) {
      onSync(new Set());
      return () => undefined;
    }
    const channel = client.channel('presence:fuzo', { config: { presence: { key: userId } } });
    channel
      .on('presence', { event: 'sync' }, () => onSync(new Set(Object.keys(channel.presenceState()))))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ at: Date.now() });
      });
    return () => {
      client.removeChannel(channel).catch(() => undefined);
    };
  },

  // ── Groups ────────────────────────────────────────────────────────────────
  async listGroups(userId: string): Promise<ChatResult<ChatGroup[]>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data, error } = await client.from('group_members').select('groups(*)').eq('user_id', userId);
    if (error) return { success: false, error: error.message };

    const groups = (data || [])
      .map((row) => (row as unknown as { groups: unknown }).groups)
      .filter(Boolean)
      .map(toChatGroup)
      .sort((a, b) => (b.lastMessageAt || b.createdAt).localeCompare(a.lastMessageAt || a.createdAt));
    return { success: true, data: groups };
  },

  async createGroup(params: {
    name: string;
    description?: string;
    avatarUrl?: string;
    memberIds: string[];
    createdBy: string;
  }): Promise<ChatResult<ChatGroup>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const name = params.name.trim().slice(0, 60);
    if (!name) return { success: false, error: 'Give the group a name' };

    const { data: group, error: groupError } = await client
      .from('groups')
      .insert({ name, description: params.description, avatar_url: params.avatarUrl, created_by: params.createdBy })
      .select()
      .single();
    if (groupError || !group) return { success: false, error: groupError?.message || 'Failed to create group' };

    const memberIds = [...new Set([params.createdBy, ...params.memberIds])];
    const { error: membersError } = await client.from('group_members').insert(
      memberIds.map((id) => ({ group_id: group.id, user_id: id, role: id === params.createdBy ? 'admin' : 'member' })),
    );
    if (membersError) {
      await client.from('groups').delete().eq('id', group.id);
      return { success: false, error: membersError.message };
    }

    // Create the group's first encryption key right away so every member (who has secure
    // messaging on) can read from the first message. Best-effort: sending retries it.
    try {
      await E2ee.ensureThreadKey('group', group.id, params.createdBy);
    } catch (err) {
      console.warn('Could not create the group key yet:', err);
    }

    return { success: true, data: toChatGroup(group) };
  },

  async listGroupMembers(groupId: string): Promise<ChatResult<GroupMember[]>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };

    const { data: members, error } = await client.from('group_members').select('user_id, role').eq('group_id', groupId);
    if (error) return { success: false, error: error.message };

    const ids = (members ?? []).map((m) => m.user_id);
    const { data: users } = ids.length
      ? await client.from('users').select('id, display_name, username, avatar_url').in('id', ids)
      : { data: [] };
    const byId = new Map((users ?? []).map((u) => [u.id, toChatContact(u)]));

    return {
      success: true,
      data: (members ?? [])
        .map((m) => {
          const c = byId.get(m.user_id);
          return c ? { ...c, role: (m.role === 'admin' ? 'admin' : 'member') as GroupMember['role'] } : null;
        })
        .filter((m): m is GroupMember => m !== null),
    };
  },

  async leaveGroup(groupId: string, userId: string): Promise<ChatResult<null>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };
    const { error } = await client.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true, data: null };
  },

  // ── Safety: block + report ────────────────────────────────────────────────
  async blockUser(userId: string): Promise<ChatResult<null>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };
    const { error } = await client.rpc('block_user', { p_blocked: userId });
    if (error) return { success: false, error: error.message };
    return { success: true, data: null };
  },

  async unblockUser(currentUserId: string, blockedId: string): Promise<ChatResult<null>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };
    const { error } = await client.from('user_blocks').delete().eq('blocker_id', currentUserId).eq('blocked_id', blockedId);
    if (error) return { success: false, error: error.message };
    return { success: true, data: null };
  },

  /** People YOU blocked (the table is readable only by the blocker). */
  async listBlockedIds(currentUserId: string): Promise<string[]> {
    const client = supabase;
    if (!client) return [];
    const { data } = await client.from('user_blocks').select('blocked_id').eq('blocker_id', currentUserId);
    return (data ?? []).map((r) => r.blocked_id as string);
  },

  async reportUser(params: {
    reporterId: string;
    reportedUserId?: string;
    threadType?: ThreadType;
    threadId?: string;
    reason: ReportReason;
    details?: string;
  }): Promise<ChatResult<null>> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase is not configured' };
    const { error } = await client.from('chat_reports').insert({
      reporter_id: params.reporterId,
      reported_user_id: params.reportedUserId ?? null,
      thread_type: params.threadType ?? null,
      thread_id: params.threadId ?? null,
      reason: params.reason,
      details: params.details?.trim().slice(0, 1000) || null,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data: null };
  },
};
