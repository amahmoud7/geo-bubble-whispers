-- Migration for enhanced social features in Lo app

-- 1. Message Reactions Table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Index for faster reaction queries
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);

-- 2. User Follows Table
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes for follow queries
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);

-- 3. Message Tags Table
CREATE TABLE IF NOT EXISTS message_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, tag)
);

-- Indexes for tag queries
CREATE INDEX idx_message_tags_message_id ON message_tags(message_id);
CREATE INDEX idx_message_tags_tag ON message_tags(tag);
CREATE INDEX idx_message_tags_created_at ON message_tags(created_at DESC);

-- 4. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for subscription queries
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- 5. Trending Locations View (Materialized for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_locations AS
SELECT 
  ROUND(lat::numeric, 4) as lat_rounded,
  ROUND(lng::numeric, 4) as lng_rounded,
  location,
  COUNT(*) as message_count,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(created_at) as last_activity,
  -- Calculate trend based on recent activity
  CASE 
    WHEN COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') > 
         COUNT(*) FILTER (WHERE created_at BETWEEN NOW() - INTERVAL '2 hours' AND NOW() - INTERVAL '1 hour') 
    THEN 'rising'
    WHEN COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') < 
         COUNT(*) FILTER (WHERE created_at BETWEEN NOW() - INTERVAL '2 hours' AND NOW() - INTERVAL '1 hour')
    THEN 'falling'
    ELSE 'stable'
  END as trend
FROM messages
WHERE 
  created_at > NOW() - INTERVAL '24 hours' 
  AND is_public = true
GROUP BY lat_rounded, lng_rounded, location
HAVING COUNT(*) >= 3
ORDER BY message_count DESC;

-- Index for the materialized view
CREATE UNIQUE INDEX idx_trending_locations ON trending_locations(lat_rounded, lng_rounded);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_trending_locations()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_locations;
END;
$$ LANGUAGE plpgsql;

-- 6. User Activity Stats (for social features)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  total_reactions_received INTEGER DEFAULT 0,
  total_followers INTEGER DEFAULT 0,
  total_following INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update follower counts
  IF TG_TABLE_NAME = 'user_follows' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE profiles SET total_followers = total_followers + 1 WHERE id = NEW.following_id;
      UPDATE profiles SET total_following = total_following + 1 WHERE id = NEW.follower_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE profiles SET total_followers = total_followers - 1 WHERE id = OLD.following_id;
      UPDATE profiles SET total_following = total_following - 1 WHERE id = OLD.follower_id;
    END IF;
  END IF;
  
  -- Update reaction counts
  IF TG_TABLE_NAME = 'message_reactions' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE profiles SET total_reactions_received = total_reactions_received + 1 
      WHERE id = (SELECT user_id FROM messages WHERE id = NEW.message_id);
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE profiles SET total_reactions_received = total_reactions_received - 1 
      WHERE id = (SELECT user_id FROM messages WHERE id = OLD.message_id);
    END IF;
  END IF;
  
  -- Update message counts
  IF TG_TABLE_NAME = 'messages' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE profiles SET total_messages = total_messages + 1, last_active = NOW() 
      WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE profiles SET total_messages = total_messages - 1 WHERE id = OLD.user_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for stats updates
CREATE TRIGGER update_follow_stats
AFTER INSERT OR DELETE ON user_follows
FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_reaction_stats
AFTER INSERT OR DELETE ON message_reactions
FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_message_stats
AFTER INSERT OR DELETE ON messages
FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- 7. Row Level Security Policies

-- Enable RLS on new tables
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for message_reactions
CREATE POLICY "Anyone can view reactions" ON message_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own reactions" ON message_reactions
  FOR ALL USING (auth.uid() = user_id);

-- Policies for user_follows
CREATE POLICY "Anyone can view follows" ON user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" ON user_follows
  FOR ALL USING (auth.uid() = follower_id);

-- Policies for message_tags
CREATE POLICY "Anyone can view tags" ON message_tags
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own tags" ON message_tags
  FOR ALL USING (auth.uid() = user_id);

-- Policies for push_subscriptions
CREATE POLICY "Users can manage their own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 8. Functions for social features

-- Get mutual followers
CREATE OR REPLACE FUNCTION get_mutual_followers(user1_id UUID, user2_id UUID)
RETURNS TABLE(user_id UUID, name TEXT, avatar_url TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.avatar_url
  FROM profiles p
  WHERE p.id IN (
    SELECT follower_id FROM user_follows WHERE following_id = user1_id
    INTERSECT
    SELECT follower_id FROM user_follows WHERE following_id = user2_id
  );
END;
$$ LANGUAGE plpgsql;

-- Get trending tags
CREATE OR REPLACE FUNCTION get_trending_tags(time_window INTERVAL DEFAULT '24 hours')
RETURNS TABLE(tag VARCHAR, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT mt.tag, COUNT(*) as count
  FROM message_tags mt
  WHERE mt.created_at > NOW() - time_window
  GROUP BY mt.tag
  ORDER BY count DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Get nearby messages with reactions
CREATE OR REPLACE FUNCTION get_nearby_messages_with_reactions(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_meters FLOAT DEFAULT 1000
)
RETURNS TABLE(
  message_id UUID,
  content TEXT,
  lat FLOAT,
  lng FLOAT,
  distance FLOAT,
  reaction_count BIGINT,
  tag_list TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.lat,
    m.lng,
    earth_distance(ll_to_earth(user_lat, user_lng), ll_to_earth(m.lat, m.lng)) as distance,
    COUNT(DISTINCT mr.id) as reaction_count,
    ARRAY_AGG(DISTINCT mt.tag) as tag_list
  FROM messages m
  LEFT JOIN message_reactions mr ON m.id = mr.message_id
  LEFT JOIN message_tags mt ON m.id = mt.message_id
  WHERE 
    earth_distance(ll_to_earth(user_lat, user_lng), ll_to_earth(m.lat, m.lng)) <= radius_meters
    AND m.is_public = true
  GROUP BY m.id, m.content, m.lat, m.lng
  ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql;

-- Enable earthdistance extension for location calculations
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Schedule periodic refresh of trending locations (every 5 minutes)
SELECT cron.schedule(
  'refresh-trending-locations',
  '*/5 * * * *',
  'SELECT refresh_trending_locations();'
);

-- Add notifications table for activity feed
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'reaction', 'follow', 'mention', 'nearby_message', 'trending'
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;