-- Create direct messaging system
-- This migration creates tables for private conversations and direct messages

-- Conversations table to track private conversations between users
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  participant_1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_archived_by_1 BOOLEAN DEFAULT FALSE,
  is_archived_by_2 BOOLEAN DEFAULT FALSE,
  is_muted_by_1 BOOLEAN DEFAULT FALSE,
  is_muted_by_2 BOOLEAN DEFAULT FALSE,
  last_message_id UUID,
  UNIQUE(participant_1_id, participant_2_id)
);

-- Direct messages table for private messages within conversations
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type VARCHAR(50), -- 'image', 'video', 'audio', 'voice', 'location'
  reply_to_id UUID REFERENCES direct_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  lat DECIMAL(10, 8), -- For location sharing
  lng DECIMAL(11, 8), -- For location sharing
  voice_duration INTEGER, -- Duration in seconds for voice messages
  CHECK (
    (content IS NOT NULL AND content != '') OR 
    media_url IS NOT NULL OR 
    (lat IS NOT NULL AND lng IS NOT NULL)
  )
);

-- Message status table to track read receipts and delivery status
CREATE TABLE message_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'read'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Message reactions table for emoji reactions
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction VARCHAR(10) NOT NULL, -- Emoji or reaction type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction)
);

-- User online status for real-time features
CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT FALSE,
  is_typing_in_conversation UUID REFERENCES conversations(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_participants ON conversations(participant_1_id, participant_2_id);

CREATE INDEX idx_direct_messages_conversation ON direct_messages(conversation_id);
CREATE INDEX idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_created_at ON direct_messages(created_at DESC);
CREATE INDEX idx_direct_messages_reply_to ON direct_messages(reply_to_id);

CREATE INDEX idx_message_status_message ON message_status(message_id);
CREATE INDEX idx_message_status_user ON message_status(user_id);

CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user ON message_reactions(user_id);

CREATE INDEX idx_user_presence_online ON user_presence(is_online);
CREATE INDEX idx_user_presence_typing ON user_presence(is_typing_in_conversation) WHERE is_typing_in_conversation IS NOT NULL;

-- Update triggers for conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message_at = NEW.created_at,
    last_message_id = NEW.id,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Trigger to ensure conversation participants are ordered (smaller ID first)
CREATE OR REPLACE FUNCTION ensure_conversation_participant_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.participant_1_id > NEW.participant_2_id THEN
    -- Swap the participants to maintain consistent ordering
    NEW.participant_1_id := OLD.participant_2_id;
    NEW.participant_2_id := OLD.participant_1_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_conversation_participant_order
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION ensure_conversation_participant_order();

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_id UUID,
  user2_id UUID
) RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  p1_id UUID := LEAST(user1_id, user2_id);
  p2_id UUID := GREATEST(user1_id, user2_id);
BEGIN
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE participant_1_id = p1_id AND participant_2_id = p2_id;
  
  -- If no conversation exists, create one
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (participant_1_id, participant_2_id)
    VALUES (p1_id, p2_id)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations - users can only see conversations they're part of
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

CREATE POLICY "Users can update their conversation settings" ON conversations
  FOR UPDATE USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

-- RLS Policies for direct_messages
CREATE POLICY "Users can view messages in their conversations" ON direct_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON direct_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON direct_messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON direct_messages
  FOR DELETE USING (sender_id = auth.uid());

-- RLS Policies for message_status
CREATE POLICY "Users can view message status for their conversations" ON message_status
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM direct_messages dm
      JOIN conversations c ON dm.conversation_id = c.id
      WHERE dm.id = message_id
      AND dm.sender_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own message status" ON message_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their message status" ON message_status
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for message_reactions
CREATE POLICY "Users can view reactions in their conversations" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM direct_messages dm
      JOIN conversations c ON dm.conversation_id = c.id
      WHERE dm.id = message_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can add reactions to messages in their conversations" ON message_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM direct_messages dm
      JOIN conversations c ON dm.conversation_id = c.id
      WHERE dm.id = message_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can remove their own reactions" ON message_reactions
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for user_presence
CREATE POLICY "Users can view presence of users they have conversations with" ON user_presence
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE (c.participant_1_id = auth.uid() AND c.participant_2_id = user_id)
      OR (c.participant_2_id = auth.uid() AND c.participant_1_id = user_id)
    )
  );

CREATE POLICY "Users can update their own presence" ON user_presence
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their presence" ON user_presence
  FOR UPDATE USING (user_id = auth.uid());

-- Views for easier querying
CREATE OR REPLACE VIEW conversation_list AS
SELECT 
  c.id,
  c.created_at,
  c.updated_at,
  c.last_message_at,
  c.participant_1_id,
  c.participant_2_id,
  c.is_archived_by_1,
  c.is_archived_by_2,
  c.is_muted_by_1,
  c.is_muted_by_2,
  p1.name AS participant_1_name,
  p1.avatar_url AS participant_1_avatar,
  p1.username AS participant_1_username,
  p2.name AS participant_2_name,
  p2.avatar_url AS participant_2_avatar,
  p2.username AS participant_2_username,
  dm.content AS last_message_content,
  dm.media_type AS last_message_media_type,
  dm.sender_id AS last_message_sender_id,
  CASE 
    WHEN auth.uid() = c.participant_1_id THEN p2.name
    ELSE p1.name
  END AS other_user_name,
  CASE 
    WHEN auth.uid() = c.participant_1_id THEN p2.avatar_url
    ELSE p1.avatar_url
  END AS other_user_avatar,
  CASE 
    WHEN auth.uid() = c.participant_1_id THEN p2.username
    ELSE p1.username
  END AS other_user_username,
  CASE 
    WHEN auth.uid() = c.participant_1_id THEN p2.id
    ELSE p1.id
  END AS other_user_id,
  -- Check if current user has unread messages
  EXISTS (
    SELECT 1 FROM direct_messages dm2
    LEFT JOIN message_status ms ON dm2.id = ms.message_id AND ms.user_id = auth.uid()
    WHERE dm2.conversation_id = c.id
    AND dm2.sender_id != auth.uid()
    AND (ms.status IS NULL OR ms.status != 'read')
  ) AS has_unread_messages
FROM conversations c
LEFT JOIN profiles p1 ON c.participant_1_id = p1.id
LEFT JOIN profiles p2 ON c.participant_2_id = p2.id
LEFT JOIN direct_messages dm ON c.last_message_id = dm.id
WHERE c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid()
ORDER BY c.last_message_at DESC;

-- Grant permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON direct_messages TO authenticated;
GRANT ALL ON message_status TO authenticated;
GRANT ALL ON message_reactions TO authenticated;
GRANT ALL ON user_presence TO authenticated;
GRANT SELECT ON conversation_list TO authenticated;

-- Enable realtime for the new tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_status;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;