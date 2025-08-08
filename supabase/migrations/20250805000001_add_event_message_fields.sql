-- Add new columns to messages table for event support
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS event_source VARCHAR(50),
ADD COLUMN IF NOT EXISTS external_event_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS event_url TEXT,
ADD COLUMN IF NOT EXISTS event_title TEXT,
ADD COLUMN IF NOT EXISTS event_venue TEXT,
ADD COLUMN IF NOT EXISTS event_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS event_price_min DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS event_price_max DECIMAL(10,2);

-- Create index for event messages
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_external_event_id ON messages(external_event_id);
CREATE INDEX IF NOT EXISTS idx_messages_event_start_date ON messages(event_start_date);

-- Add constraint to ensure event messages have required fields
ALTER TABLE messages 
ADD CONSTRAINT chk_event_messages 
CHECK (
  (message_type = 'event' AND event_source IS NOT NULL AND external_event_id IS NOT NULL) 
  OR message_type != 'event'
);

-- Create view for event messages only
CREATE OR REPLACE VIEW event_messages AS
SELECT 
  id,
  content,
  media_url,
  location,
  lat,
  lng,
  event_source,
  external_event_id,
  event_url,
  event_title,
  event_venue,
  event_start_date,
  event_price_min,
  event_price_max,
  created_at,
  expires_at
FROM messages 
WHERE message_type = 'event' 
  AND expires_at > NOW()
  AND event_start_date > NOW()
ORDER BY event_start_date ASC;