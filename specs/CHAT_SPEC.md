# Chat Page Specification

## Overview
The Chat page provides real-time messaging functionality for users to communicate with friends, share food recommendations, and discuss dining experiences in a group chat environment.

**⚠️ Architecture Update**: This specification has been updated to reflect the migration from Stream Chat to a native React implementation using Supabase Realtime.

## Core Functions

### 1. Messaging
- **Real-time Chat**: Instant message delivery and updates
- **Message Types**: Text, images, location, restaurant shares
- **Message Status**: Sent, delivered, read indicators
- **Typing Indicators**: Show when others are typing
- **Message History**: Scrollable chat history with pagination

### 2. Group Management
- **Create Groups**: Create new chat groups
- **Group Settings**: Name, description, member management
- **Member Roles**: Admin, moderator, member permissions
- **Group Discovery**: Find and join public groups
- **Group Invites**: Invite friends via link or username

### 3. Content Sharing
- **Restaurant Shares**: Share restaurants with location and details
- **Recipe Shares**: Share recipes with ingredients and instructions
- **Photo Sharing**: Share food photos with captions
- **Location Sharing**: Share current location or restaurant location
- **Link Previews**: Auto-generate previews for shared links

### 4. User Interactions
- **Friend System**: Add/remove friends, friend requests
- **User Profiles**: View user profiles and shared content
- **Message Reactions**: React to messages with emojis
- **Message Search**: Search through chat history
- **Mute/Block**: Mute groups or block users

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Real-time**: Supabase Realtime subscriptions
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React hooks + Context API
- **Icons**: Lucide React

### Backend
- **API Routes**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **File Storage**: Supabase Storage

### External Services
- **~~Stream Chat~~**: **DEPRECATED** - Replaced with Supabase Realtime
- **Image Processing**: Sharp for image optimization
- **Link Preview**: LinkPreview API

## Environment Variables

```env
# Database & Realtime
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ~~Stream Chat~~ - DEPRECATED
# NEXT_PUBLIC_STREAM_CHAT_API_KEY=deprecated
# STREAM_CHAT_API_SECRET=deprecated
# STREAM_WEBHOOK_SECRET=deprecated

# Optional
LINK_PREVIEW_API_KEY=your_link_preview_key
IMAGE_PROCESSING_ENABLED=true
```

**Migration Note**: Stream Chat environment variables are no longer required. Real-time functionality is now handled natively through Supabase Realtime subscriptions.

## Database Schema

### Tables
- `chat_groups` - Chat group information
- `group_members` - Group membership
- `user_friends` - Friend relationships
- `message_reactions` - Message reactions
- `user_settings` - User chat preferences

### Key Fields
```sql
chat_groups:
- id (uuid, primary key)
- name (text)
- description (text)
- type (enum: public, private, direct)
- created_by (uuid, foreign key)
- created_at (timestamp)
- updated_at (timestamp)

group_members:
- id (uuid, primary key)
- group_id (uuid, foreign key)
- user_id (uuid, foreign key)
- role (enum: admin, moderator, member)
- joined_at (timestamp)

user_friends:
- id (uuid, primary key)
- user_id (uuid, foreign key)
- friend_id (uuid, foreign key)
- status (enum: pending, accepted, blocked)
- created_at (timestamp)
```

## API Endpoints

### GET /api/chat/groups
- **Purpose**: Get user's chat groups
- **Response**: Array of groups with member counts

### POST /api/chat/groups
- **Purpose**: Create new chat group
- **Body**: `{ name, description, type, member_ids }`
- **Response**: Created group object

### GET /api/chat/groups/:id/messages
- **Purpose**: Get group messages
- **Query Params**:
  - `page` (number): Page number
  - `limit` (number): Messages per page
- **Response**: Array of messages

### POST /api/chat/groups/:id/messages
- **Purpose**: Send message to group
- **Body**: `{ text, type, attachments }`
- **Response**: Sent message object

### GET /api/chat/friends
- **Purpose**: Get user's friends
- **Response**: Array of friends with status

### POST /api/chat/friends
- **Purpose**: Send friend request
- **Body**: `{ friend_id }`
- **Response**: Friend request status

### GET /api/chat/search
- **Purpose**: Search messages
- **Query Params**:
  - `query` (string): Search query
  - `group_id` (uuid): Search within group
- **Response**: Array of matching messages

## UI Components

### Required Components
- `ChatSidebar` - Groups and friends list
- `ChatWindow` - Main chat interface
- `MessageList` - Scrollable message history
- `MessageInput` - Message composition
- `MessageBubble` - Individual message display
- `GroupSettings` - Group management modal
- `UserProfile` - User profile modal
- `FriendList` - Friends management

### Layout Structure
```
ChatPage
├── ChatSidebar
│   ├── GroupList
│   └── FriendList
├── ChatWindow
│   ├── ChatHeader
│   ├── MessageList
│   │   └── MessageBubble (repeated)
│   └── MessageInput
└── Modals
    ├── GroupSettings
    └── UserProfile
```

## Performance Requirements

- **Message Delivery**: < 100ms for local messages
- **Real-time Updates**: < 200ms for remote messages
- **Message History**: < 1 second for 100 messages
- **Image Loading**: < 2 seconds for image messages
- **Mobile Performance**: Smooth scrolling and typing

## Success Metrics

- **Engagement**: Messages sent, time spent in chat
- **Groups**: Groups created, active groups
- **Friends**: Friend connections, friend requests
- **Content**: Shared restaurants, recipes, photos

## Constraints

- **No Voice/Video**: Text and image messages only
- **No File Sharing**: Images and links only
- **Limited Groups**: Max 50 members per group
- **Mobile First**: Touch-optimized interface
- **No Encryption**: Standard security only

## Message Types

### Text Messages
- **Basic Text**: Plain text messages
- **Emojis**: Full emoji support
- **Mentions**: @username mentions
- **Hashtags**: #hashtag support

### Media Messages
- **Images**: Photo sharing with captions
- **Location**: Share current or restaurant location
- **Restaurant Cards**: Rich restaurant information
- **Recipe Cards**: Rich recipe information

### System Messages
- **User Joined**: Member joined group
- **User Left**: Member left group
- **Group Created**: Group creation notification
- **Settings Changed**: Group settings updates

## Group Features

### Group Types
- **Direct Messages**: 1-on-1 conversations
- **Private Groups**: Invite-only groups
- **Public Groups**: Discoverable groups
- **Restaurant Groups**: Location-based groups

### Group Management
- **Create/Delete**: Group creation and deletion
- **Member Management**: Add/remove members
- **Role Management**: Admin/moderator roles
- **Settings**: Group name, description, privacy

## Supabase Realtime Implementation

### Real-time Architecture
The chat system now uses Supabase Realtime for live messaging instead of Stream Chat:

- **Database Tables**: All messages stored in Supabase `chat_messages` table
- **Realtime Subscriptions**: Subscribe to table changes for live updates
- **Row Level Security**: Proper RLS policies for message access control
- **Native Integration**: Direct integration with existing Supabase infrastructure

### Migration Benefits
- **Cost Effective**: No third-party messaging service fees
- **Simplified Architecture**: Single database for all app data
- **Better Control**: Full control over data and business logic
- **Consistent Auth**: Same authentication system across all features

### Implementation Example
```typescript
// Subscribe to new messages in a chat channel
const subscription = supabase
  .channel('chat-messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `channel_id=eq.${channelId}`
  }, (payload) => {
    // Handle new message
    setMessages(prev => [...prev, payload.new]);
  })
  .subscribe();
```

## Future Enhancements (Not in MVP)

- Voice messages
- Video calls
- File sharing
- Message encryption
- Bot integrations
- Message scheduling
- Advanced search
- Message translation
- Screen sharing
- Live location sharing
