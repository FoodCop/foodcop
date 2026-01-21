# 🚀 Apply Migration 011 - User Presence System

## Quick Steps (5 minutes)

### Step 1: Open Supabase SQL Editor

Click this link to open the SQL Editor:
👉 **https://supabase.com/dashboard/project/lgladnskxmbkhcnrsfxv/sql/new**

### Step 2: Copy the Migration SQL

The migration file is located at:
`supabase/migrations/011_add_user_presence.sql`

**Option A: Copy from VS Code**
1. Open `supabase/migrations/011_add_user_presence.sql` in VS Code
2. Press `Ctrl+A` to select all
3. Press `Ctrl+C` to copy

**Option B: Copy from file explorer**
Right-click the file → Open with → Notepad → Select all → Copy

### Step 3: Paste and Run

1. In the Supabase SQL Editor, paste the entire migration (Ctrl+V)
2. Click the **"Run"** button (or press F5)
3. Wait for execution (should take ~3-5 seconds)

### Step 4: Verify Success

You should see output like:
```
NOTICE: Migration 011 completed successfully
```

If you see any errors, copy them and let me know.

---

## What This Migration Does

✅ Adds 3 columns to `users` table:
- `is_online` - Real-time online status
- `last_activity_at` - Last activity timestamp
- `last_seen` - When user went offline

✅ Creates `user_presence` table for multi-session tracking

✅ Creates 3 helper functions:
- `update_user_activity()` - Called every 30s by heartbeat
- `mark_user_offline()` - Called when user closes tab
- `cleanup_stale_presence()` - Auto-cleanup stale sessions

✅ Sets up indexes for performance

✅ Configures Row Level Security (RLS) policies

✅ Enables Realtime for instant updates

---

## After Migration

Once the migration is complete, run:

```bash
npm run dev
```

Then:
1. Open http://localhost:5173 (or your dev port)
2. Log in
3. Open browser DevTools console (F12)
4. Look for: **"🟢 PresenceTracker: Starting for user abc123"**
5. Open the chat (Messages icon)
6. You should see **green dots** next to online users
7. Click a conversation to see **"Active now"** or **"Last seen 5m ago"**

---

## Troubleshooting

### Error: "relation 'users' does not exist"
Your database might not have a users table. Check your schema first.

### Error: "column 'is_online' already exists"
The migration was already applied. You can skip this step.

### Error: "permission denied"
Make sure you're logged into the correct Supabase project (lgladnskxmbkhcnrsfxv).

---

**Need help?** Let me know if you see any errors and I'll help troubleshoot!
