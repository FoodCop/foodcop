-- Migration: Add chat_messages table for simple chat functionality
-- This table provides a simpler interface for the chat components

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    room_id VARCHAR(255) NOT NULL, -- Simple room identifier (e.g., 'general', 'private_user1_user2', 'ai_user_tako')
    is_ai_generated BOOLEAN DEFAULT FALSE,
    shared_content JSONB DEFAULT NULL, -- For shared restaurants/recipes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);

-- Enable realtime
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view messages in rooms they have access to" ON chat_messages
    FOR SELECT USING (
        -- Allow access to general room
        room_id = 'general' OR
        -- Allow access to private rooms where user is a participant
        (room_id LIKE 'private_%' AND position(auth.uid()::text in room_id) > 0) OR
        -- Allow access to AI rooms for the specific user
        (room_id LIKE 'ai_%' AND room_id LIKE 'ai_' || auth.uid()::text || '_%')
    );

CREATE POLICY "Users can insert messages in rooms they have access to" ON chat_messages
    FOR INSERT WITH CHECK (
        -- Users can only insert with their own user_id
        user_id = auth.uid() AND (
            -- Allow posting to general room
            room_id = 'general' OR
            -- Allow posting to private rooms where user is a participant
            (room_id LIKE 'private_%' AND position(auth.uid()::text in room_id) > 0) OR
            -- Allow posting to AI rooms for the specific user
            (room_id LIKE 'ai_%' AND room_id LIKE 'ai_' || auth.uid()::text || '_%')
        )
    );

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_messages_updated_at();