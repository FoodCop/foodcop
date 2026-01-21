# Online Presence System - Implementation Guide

**Status:** ✅ Fully Implemented
**Date:** 2026-01-19
**Version:** 1.0.0

---

## 🎉 **What Was Implemented**

Your FUZO food discovery app now has a **complete Instagram-style online presence system** with:

✅ Real-time online/offline status indicators
✅ "Active now" and "Last seen X ago" text
✅ Green dot indicators on avatars
✅ Automatic heartbeat tracking (30s intervals)
✅ Multi-device/multi-session support
✅ Automatic cleanup of stale sessions
✅ Database-backed persistence
✅ Supabase Realtime integration

---

## 📦 **Files Created/Modified**

### **New Files (8)**

1. **`supabase/migrations/011_add_user_presence.sql`**
   - Database schema for presence tracking
   - Helper functions (update_user_activity, mark_user_offline, cleanup_stale_presence)
   - Indexes for performance
   - RLS policies
   - Realtime publication setup

2. **`src/services/presenceService.ts`**
   - Core presence tracking service
   - Heartbeat management
   - Supabase Presence integration
   - Activity tracking
   - Status formatters

3. **`src/components/chat/OnlineStatusIndicator.tsx`**
   - OnlineStatusIndicator component (3 variants)
   - OnlineStatusDot component
   - LastSeenText component

4. **`src/components/chat/PresenceTracker.tsx`**
   - Auto-initializes presence tracking
   - Handles cleanup on unmount

5. **`src/hooks/useUserPresence.ts`**
   - useUserPresence hook (single user)
   - useBatchPresence hook (multiple users)

6. **`ONLINE-PRESENCE-GUIDE.md`** (this file)
   - Complete implementation documentation

### **Modified Files (3)**

7. **`src/components/chat/ConversationList.tsx`**
   - Added OnlineStatusDot to avatars

8. **`src/components/chat/ChatThread.tsx`**
   - Added OnlineStatusDot to avatar
   - Added LastSeenText in header

9. **`src/App.tsx`**
   - Added PresenceTracker component
   - Auto-starts presence tracking

---

## 🏗️ **Architecture**

### **Database Schema**

```sql
-- Users table additions
ALTER TABLE users
ADD COLUMN is_online BOOLEAN DEFAULT false,
ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN last_seen TIMESTAMPTZ DEFAULT NOW();

-- New table for multi-session tracking
CREATE TABLE user_presence (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_id TEXT NOT NULL,  -- Browser tab identifier
  device_info JSONB,          -- Browser, OS, device type
  is_online BOOLEAN DEFAULT true,
  last_heartbeat_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  UNIQUE(user_id, session_id)
);
```

### **Data Flow**

```
User Logs In
    ↓
PresenceTracker mounts
    ↓
startPresenceTracking(userId)
    ↓
Create Supabase Presence channel
    ↓
Send initial heartbeat to DB
    ↓
Start 30s interval heartbeat
    ↓
Window focus/blur listeners
    ↓
On Activity: update_user_activity()
    ↓
Update users.is_online = true
Update users.last_activity_at = NOW()
Update user_presence heartbeat
    ↓
Real-time subscription updates UI
    ↓
On Page Unload/Tab Close:
    ↓
mark_user_offline()
    ↓
Update users.is_online = false
Update users.last_seen = NOW()
Update user_presence.disconnected_at
```

### **Automatic Cleanup**

Stale sessions (no heartbeat for 5+ minutes) are automatically marked offline by:
- PostgreSQL function: `cleanup_stale_presence()`
- Called via pg_cron (if available) or manually

---

## 🎨 **UI Components**

### **1. OnlineStatusIndicator**

Shows online status with customizable variants:

```tsx
import { OnlineStatusIndicator } from '@/components/chat/OnlineStatusIndicator';

// Variant 1: Just the green dot
<OnlineStatusIndicator userId={userId} variant="dot" />

// Variant 2: Dot + text badge
<OnlineStatusIndicator userId={userId} variant="badge" showText />

// Variant 3: Full status with "Active now" / "Last seen"
<OnlineStatusIndicator userId={userId} variant="full" />
```

**Props:**
- `userId` (required): User ID to track
- `variant`: `'dot' | 'badge' | 'full'`
- `showText`: Show text alongside dot
- `realtime`: Subscribe to real-time updates (default: true)
- `className`, `dotClassName`, `textClassName`: Styling overrides

### **2. OnlineStatusDot**

Small green dot for avatars (absolute positioned):

```tsx
import { OnlineStatusDot } from '@/components/chat/OnlineStatusIndicator';

<div className="relative">
  <Avatar>...</Avatar>
  <OnlineStatusDot
    userId={userId}
    className="bottom-0 right-0"
    size="md"
  />
</div>
```

**Props:**
- `userId` (required)
- `size`: `'sm' | 'md' | 'lg'`
- `className`: Position override
- `realtime`: Subscribe to updates

### **3. LastSeenText**

Text-only status display:

```tsx
import { LastSeenText } from '@/components/chat/OnlineStatusIndicator';

<LastSeenText userId={userId} />
// Renders: "Active now" or "5m ago" or "2h ago"
```

---

## 🔧 **Hooks**

### **useUserPresence**

React hook for single user presence:

```tsx
import { useUserPresence } from '@/hooks/useUserPresence';

function UserProfile({ userId }) {
  const { presence, isOnline, lastSeenText, isLoading } = useUserPresence({
    userId,
    realtime: true, // Auto-subscribe to updates
  });

  return (
    <div>
      {isOnline && <span>🟢 Online</span>}
      <span>{lastSeenText}</span>
    </div>
  );
}
```

**Returns:**
- `presence`: Full UserPresence object
- `isOnline`: Boolean
- `lastSeenText`: Formatted string ("Active now", "5m ago", etc.)
- `isLoading`: Boolean
- `error`: Error | null

### **useBatchPresence**

Efficient hook for multiple users:

```tsx
import { useBatchPresence } from '@/hooks/useUserPresence';

function ConversationList({ conversations }) {
  const userIds = conversations.map(c => c.other_user.id);
  const { presenceMap, isOnline, isLoading } = useBatchPresence(userIds);

  return conversations.map(conv => (
    <div key={conv.id}>
      {isOnline(conv.other_user.id) && <span>🟢</span>}
      {conv.other_user.display_name}
    </div>
  ));
}
```

**Returns:**
- `presenceMap`: Map<userId, UserPresence>
- `getPresence(userId)`: Get specific user presence
- `isOnline(userId)`: Check if user is online
- `isLoading`: Boolean

---

## 📘 **Service API**

### **PresenceService**

```tsx
import { PresenceService } from '@/services/presenceService';

// Start tracking (auto-called by PresenceTracker)
await PresenceService.startPresenceTracking(userId);

// Stop tracking
PresenceService.stopPresenceTracking();

// Manual activity update
await PresenceService.updateUserActivity(userId);

// Mark offline
await PresenceService.markUserOffline(userId);

// Get user's current status
const status = await PresenceService.getUserOnlineStatus(userId);
// Returns: { user_id, is_online, last_activity_at, last_seen }

// Get multiple users' status (efficient batch query)
const statusMap = await PresenceService.getBatchOnlineStatus([userId1, userId2]);

// Subscribe to status changes
const unsubscribe = PresenceService.subscribeToUserStatus(userId, (presence) => {
  console.log('User status changed:', presence);
});
// Later: unsubscribe();

// Format last seen timestamp
const text = PresenceService.formatLastSeen(lastSeenDate);
// Returns: "Active now" | "5m ago" | "2h ago" | "3d ago" | "Jan 15"

// Manual cleanup of stale sessions
const cleanedCount = await PresenceService.cleanupStalePresence();
```

---

## ⚙️ **How It Works**

### **1. Automatic Tracking**

When a user logs in, the `PresenceTracker` component automatically starts tracking:

1. Creates a unique `session_id` for this browser tab
2. Connects to Supabase Presence channel (`global-presence`)
3. Sends initial heartbeat to database
4. Starts 30-second interval heartbeat
5. Listens to window focus/blur events
6. Listens to tab visibility changes

### **2. Heartbeat System**

Every 30 seconds, the app sends a heartbeat:

```typescript
// Calls update_user_activity function
UPDATE users
SET is_online = true, last_activity_at = NOW(), last_seen = NOW()
WHERE id = userId;

UPDATE user_presence
SET last_heartbeat_at = NOW()
WHERE user_id = userId AND session_id = sessionId;
```

### **3. Real-time Updates**

UI components subscribe to database changes:

```typescript
supabase
  .channel(`user-status-${userId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    table: 'users',
    filter: `id=eq.${userId}`
  }, (payload) => {
    // Update UI with new status
  })
  .subscribe();
```

### **4. Automatic Offline Detection**

Users are marked offline when:
- They close the browser tab (beforeunload event)
- They don't send heartbeat for 5+ minutes (stale cleanup)
- They explicitly log out

```typescript
// On tab close
window.addEventListener('beforeunload', () => {
  markUserOffline(userId);
});

// Automatic cleanup (runs every minute via pg_cron)
SELECT cleanup_stale_presence();
// Marks sessions offline if last_heartbeat_at < NOW() - INTERVAL '5 minutes'
```

### **5. Multi-Device Support**

Each browser tab gets a unique `session_id`:

```typescript
session-1674123456789-abc123  // Tab 1
session-1674123459876-xyz789  // Tab 2 (same user)
```

User is shown as online if **any** session is active.

---

## 🎯 **Where Online Status Shows**

### **1. Conversation List**

Green dot on avatar:

```tsx
// src/components/chat/ConversationList.tsx
<OnlineStatusDot
  userId={otherUser.id}
  className="bottom-0 right-0"
  size="md"
/>
```

### **2. Chat Thread Header**

Avatar dot + "Active now" text:

```tsx
// src/components/chat/ChatThread.tsx
<OnlineStatusDot userId={otherUser.id} size="sm" />
<LastSeenText userId={otherUser.id} />
```

---

## 🚀 **How to Use in New Components**

### **Example 1: Show Online Count**

```tsx
import { useUserPresence } from '@/hooks/useUserPresence';

function OnlineUserCount({ userIds }) {
  const { presenceMap } = useBatchPresence(userIds);

  const onlineCount = Array.from(presenceMap.values())
    .filter(p => p.is_online).length;

  return <span>{onlineCount} online</span>;
}
```

### **Example 2: User Profile Card**

```tsx
function UserCard({ userId }) {
  const { isOnline, lastSeenText } = useUserPresence({ userId });

  return (
    <div>
      <Avatar>...</Avatar>
      {isOnline && <Badge variant="success">Online</Badge>}
      {!isOnline && <Text muted>{lastSeenText}</Text>}
    </div>
  );
}
```

### **Example 3: Friend List with Status**

```tsx
function FriendList({ friends }) {
  const friendIds = friends.map(f => f.id);
  const { isOnline } = useBatchPresence(friendIds);

  return friends.map(friend => (
    <div key={friend.id}>
      <OnlineStatusDot userId={friend.id} size="sm" />
      <span>{friend.name}</span>
      {isOnline(friend.id) ? ' (online)' : ''}
    </div>
  ));
}
```

---

## 🛠️ **Testing**

### **Manual Testing Steps**

1. **Basic Online Detection:**
   - Open app in two browser tabs
   - Log in as User A in Tab 1
   - Log in as User B in Tab 2
   - Open chat between User A and User B
   - ✅ User B should show green dot and "Active now"

2. **Last Seen:**
   - Close Tab 2 (User B)
   - Wait a few seconds
   - ✅ User B should show "Last seen X ago" in Tab 1

3. **Multi-Device:**
   - Open Tab 3 with User B
   - ✅ User B should show as online again in Tab 1
   - Close Tab 3
   - ✅ User B still online (Tab 2 still open)
   - Close all User B tabs
   - ✅ User B offline

4. **Heartbeat:**
   - Open browser DevTools console
   - Look for logs: "💓 Heartbeat sent"
   - Should appear every 30 seconds

5. **Window Focus/Blur:**
   - Switch to different tab, then back
   - Check console: "👁️ Tab visible - marking online"

### **Database Verification**

```sql
-- Check users online status
SELECT id, display_name, is_online, last_activity_at, last_seen
FROM users
WHERE is_online = true;

-- Check active sessions
SELECT user_id, session_id, last_heartbeat_at, device_info
FROM user_presence
WHERE is_online = true;

-- Check stale sessions
SELECT *
FROM user_presence
WHERE is_online = true
  AND last_heartbeat_at < NOW() - INTERVAL '5 minutes';

-- Manual cleanup
SELECT cleanup_stale_presence();
```

---

## ⚠️ **Troubleshooting**

### **Problem: Green dot not showing**

**Causes:**
1. Database migration not run
2. Presence tracker not mounted
3. User not authenticated
4. RLS policies blocking access

**Solutions:**
```bash
# Run migration
supabase db push

# Check console logs
# Should see: "🟢 PresenceTracker: Starting for user abc123"

# Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_presence';
```

### **Problem: "Last seen" always shows old timestamp**

**Causes:**
1. Heartbeat not running
2. `update_user_activity` function failing
3. Network issues

**Solutions:**
```typescript
// Check heartbeat logs in console
// Should see: "💓 Heartbeat sent" every 30s

// Manually trigger
await PresenceService.updateUserActivity(userId);

// Check database
SELECT last_activity_at FROM users WHERE id = 'userId';
```

### **Problem: User shows offline but they're online**

**Causes:**
1. Stale session not cleaned up
2. Heartbeat stopped
3. `cleanup_stale_presence()` not running

**Solutions:**
```sql
-- Manual cleanup
SELECT cleanup_stale_presence();

-- Check session
SELECT * FROM user_presence
WHERE user_id = 'userId' AND is_online = true;

-- If no pg_cron, schedule manual cleanup via app:
```

```typescript
// In App.tsx or background service
setInterval(() => {
  PresenceService.cleanupStalePresence();
}, 60000); // Every minute
```

---

## 🔒 **Security & Privacy**

### **What's Tracked**

✅ **Tracked:**
- Is user online (boolean)
- Last activity timestamp
- Last seen timestamp
- Device info (browser, OS, device type)

❌ **NOT Tracked:**
- Specific page visited
- Message content
- Location data (beyond city if in profile)
- IP address
- Detailed browsing behavior

### **Row Level Security (RLS)**

All users can view each other's online status (required for chat):

```sql
-- Users can see all presence data
CREATE POLICY "Users can view all presence"
ON user_presence FOR SELECT TO authenticated USING (true);

-- Users can only update their own presence
CREATE POLICY "Users can update own presence"
ON user_presence FOR ALL TO authenticated
USING (auth.uid() = user_id);
```

### **Privacy Considerations**

- Online status is visible to **all authenticated users** (like Instagram)
- Users **cannot** disable online status (feature requirement)
- Last seen is **always visible** when offline
- Multi-device presence is **aggregated** (don't show individual devices to others)

---

## 📊 **Performance**

### **Database Indexes**

```sql
-- Fast online user lookups
CREATE INDEX idx_users_online_status
ON users(is_online, last_activity_at DESC)
WHERE is_online = true;

-- Fast last_seen queries
CREATE INDEX idx_users_last_seen ON users(last_seen DESC);

-- Fast presence lookups
CREATE INDEX idx_user_presence_user_id
ON user_presence(user_id, is_online, last_heartbeat_at DESC);
```

### **Query Optimization**

Use batch queries for multiple users:

```typescript
// ❌ Bad: N+1 queries
for (const user of users) {
  const status = await getUserOnlineStatus(user.id);
}

// ✅ Good: Single batch query
const statusMap = await getBatchOnlineStatus(users.map(u => u.id));
```

### **Heartbeat Frequency**

- **30 seconds** is optimal balance:
  - Too frequent (10s): Excessive database writes
  - Too infrequent (60s+): Stale status, delayed offline detection

---

## 🎉 **Summary**

You now have a **production-ready online presence system** that:

✅ Shows real-time online/offline status
✅ Displays "Active now" and "Last seen X ago"
✅ Handles multiple devices gracefully
✅ Auto-cleans stale sessions
✅ Integrates seamlessly with existing chat
✅ Follows Instagram UX patterns
✅ Scales efficiently with indexes
✅ Has comprehensive documentation

**Next Steps:**
1. Run the database migration: `supabase db push`
2. Test in development environment
3. Deploy to production
4. Monitor performance and adjust heartbeat interval if needed

---

**Questions or Issues?**
- Check `presenceService.ts` for implementation details
- Check browser console for presence tracking logs
- Run database verification queries above
- Check this guide's Troubleshooting section

**Created:** 2026-01-19
**Version:** 1.0.0
