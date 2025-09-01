-- Add livestream support to messages table
-- This migration adds columns to support livestreaming functionality

-- Add livestream-specific columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS livestream_url TEXT,
ADD COLUMN IF NOT EXISTS livestream_title TEXT,
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS viewer_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stream_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stream_ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stream_quality VARCHAR(20) DEFAULT 'medium' CHECK (stream_quality IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS stream_duration_seconds INTEGER DEFAULT 0;

-- Create livestream viewers tracking table
CREATE TABLE IF NOT EXISTS public.livestream_viewers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(stream_id, viewer_id)
);

-- Create livestream interactions table (for comments, reactions during live streams)
CREATE TABLE IF NOT EXISTS public.livestream_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('comment', 'reaction', 'join', 'leave')),
  content TEXT,
  reaction_emoji VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security on new tables
ALTER TABLE public.livestream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestream_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for livestream_viewers table
CREATE POLICY "Users can view viewers of public streams" 
ON public.livestream_viewers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = stream_id
    AND (m.is_public = true OR m.user_id = auth.uid())
  )
);

CREATE POLICY "Users can join/leave streams" 
ON public.livestream_viewers FOR INSERT WITH CHECK (
  auth.uid() = viewer_id AND
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = stream_id
    AND (m.is_public = true OR m.user_id = auth.uid())
  )
);

CREATE POLICY "Users can update their own viewer status" 
ON public.livestream_viewers FOR UPDATE USING (auth.uid() = viewer_id);

-- RLS Policies for livestream_interactions table
CREATE POLICY "Users can view interactions of public streams" 
ON public.livestream_interactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = stream_id
    AND (m.is_public = true OR m.user_id = auth.uid())
  )
);

CREATE POLICY "Users can add interactions to streams they can view" 
ON public.livestream_interactions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = stream_id
    AND (m.is_public = true OR m.user_id = auth.uid())
  )
);

CREATE POLICY "Users can delete their own interactions" 
ON public.livestream_interactions FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_is_live ON public.messages(is_live) WHERE is_live = true;
CREATE INDEX IF NOT EXISTS idx_messages_livestream_url ON public.messages(livestream_url) WHERE livestream_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_stream_started_at ON public.messages(stream_started_at DESC) WHERE is_live = true;

CREATE INDEX IF NOT EXISTS idx_livestream_viewers_stream_id ON public.livestream_viewers(stream_id);
CREATE INDEX IF NOT EXISTS idx_livestream_viewers_viewer_id ON public.livestream_viewers(viewer_id);
CREATE INDEX IF NOT EXISTS idx_livestream_viewers_active ON public.livestream_viewers(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_livestream_interactions_stream_id ON public.livestream_interactions(stream_id);
CREATE INDEX IF NOT EXISTS idx_livestream_interactions_created_at ON public.livestream_interactions(created_at DESC);

-- Function to update viewer count when users join/leave
CREATE OR REPLACE FUNCTION public.update_livestream_viewer_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true) THEN
    -- User joined or became active
    UPDATE public.messages 
    SET viewer_count = (
      SELECT COUNT(*) 
      FROM public.livestream_viewers 
      WHERE stream_id = NEW.stream_id AND is_active = true
    )
    WHERE id = NEW.stream_id;
    
    -- Add join interaction
    INSERT INTO public.livestream_interactions (stream_id, user_id, interaction_type)
    VALUES (NEW.stream_id, NEW.viewer_id, 'join');
    
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    -- User left or became inactive
    UPDATE public.messages 
    SET viewer_count = (
      SELECT COUNT(*) 
      FROM public.livestream_viewers 
      WHERE stream_id = NEW.stream_id AND is_active = true
    )
    WHERE id = NEW.stream_id;
    
    -- Add leave interaction
    INSERT INTO public.livestream_interactions (stream_id, user_id, interaction_type)
    VALUES (NEW.stream_id, NEW.viewer_id, 'leave');
    
  ELSIF TG_OP = 'DELETE' THEN
    -- User record deleted
    UPDATE public.messages 
    SET viewer_count = (
      SELECT COUNT(*) 
      FROM public.livestream_viewers 
      WHERE stream_id = OLD.stream_id AND is_active = true
    )
    WHERE id = OLD.stream_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update viewer count
CREATE TRIGGER update_livestream_viewer_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.livestream_viewers
  FOR EACH ROW EXECUTE FUNCTION public.update_livestream_viewer_count();

-- Function to end expired livestreams (streams running longer than 4 hours)
CREATE OR REPLACE FUNCTION public.cleanup_expired_livestreams()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.messages
  SET 
    is_live = false,
    stream_ended_at = now()
  WHERE 
    is_live = true 
    AND stream_started_at < (now() - INTERVAL '4 hours')
    AND stream_ended_at IS NULL;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Mark all viewers as inactive for expired streams
  UPDATE public.livestream_viewers
  SET 
    is_active = false,
    left_at = now()
  WHERE 
    is_active = true 
    AND stream_id IN (
      SELECT id FROM public.messages 
      WHERE is_live = false 
      AND stream_ended_at = now()
    );
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get live streams near a location
CREATE OR REPLACE FUNCTION public.get_nearby_livestreams(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km INTEGER DEFAULT 10
) RETURNS TABLE (
  id UUID,
  livestream_title TEXT,
  livestream_url TEXT,
  lat DECIMAL,
  lng DECIMAL,
  user_name TEXT,
  user_avatar TEXT,
  viewer_count INTEGER,
  stream_started_at TIMESTAMP WITH TIME ZONE,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.livestream_title,
    m.livestream_url,
    m.lat,
    m.lng,
    p.name as user_name,
    p.avatar_url as user_avatar,
    m.viewer_count,
    m.stream_started_at,
    ROUND(
      (6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(m.lat)) * 
        cos(radians(m.lng) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(m.lat))
      ))::NUMERIC, 
      2
    ) as distance_km
  FROM public.messages m
  JOIN public.profiles p ON m.user_id = p.id
  WHERE 
    m.is_live = true 
    AND m.is_public = true
    AND m.lat IS NOT NULL 
    AND m.lng IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(m.lat)) * 
        cos(radians(m.lng) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(m.lat))
      )
    ) <= radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for new tables
ALTER TABLE public.livestream_viewers REPLICA IDENTITY FULL;
ALTER TABLE public.livestream_interactions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.livestream_viewers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.livestream_interactions;

-- Grant permissions
GRANT ALL ON public.livestream_viewers TO authenticated;
GRANT ALL ON public.livestream_interactions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nearby_livestreams TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_livestreams TO authenticated;