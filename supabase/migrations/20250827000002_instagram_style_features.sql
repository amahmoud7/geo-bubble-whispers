-- Instagram-style features migration for Geo Bubble Whispers
-- Adds followers/following, profile stats, achievements, and enhanced profile data

-- Add missing fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS join_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS posts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

-- Create followers/following relationship table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create profile achievements table
CREATE TABLE IF NOT EXISTS public.profile_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN (
    'early_adopter', 'verified', 'top_poster', 'explorer', 
    'social_butterfly', 'content_creator', 'globe_trotter', 'trendsetter'
  )),
  achievement_data JSONB,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, achievement_type)
);

-- Create story highlights table
CREATE TABLE IF NOT EXISTS public.story_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_image_url TEXT,
  story_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create saved messages table for bookmarking
CREATE TABLE IF NOT EXISTS public.saved_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, message_id)
);

-- Enable Row Level Security on new tables
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows table
CREATE POLICY "Follows are viewable by everyone" 
ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others" 
ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" 
ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for profile achievements
CREATE POLICY "Achievements are viewable by everyone" 
ON public.profile_achievements FOR SELECT USING (true);

CREATE POLICY "System can manage achievements" 
ON public.profile_achievements FOR ALL USING (false);

-- RLS Policies for story highlights
CREATE POLICY "Story highlights are viewable by everyone" 
ON public.story_highlights FOR SELECT USING (true);

CREATE POLICY "Users can manage their own story highlights" 
ON public.story_highlights FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for saved messages
CREATE POLICY "Users can view their own saved messages" 
ON public.saved_messages FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save messages" 
ON public.saved_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave their own messages" 
ON public.saved_messages FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profile_achievements_user_id ON public.profile_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_story_highlights_user_id ON public.story_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_messages_user_id ON public.saved_messages(user_id);

-- Function to get follower count
CREATE OR REPLACE FUNCTION public.get_follower_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.follows 
    WHERE following_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get following count
CREATE OR REPLACE FUNCTION public.get_following_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.follows 
    WHERE follower_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is following another user
CREATE OR REPLACE FUNCTION public.is_following(follower_uuid UUID, following_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.follows 
    WHERE follower_id = follower_uuid AND following_id = following_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update posts count when messages are inserted/deleted
CREATE OR REPLACE FUNCTION public.update_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET posts_count = posts_count + 1 
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles 
    SET posts_count = GREATEST(0, posts_count - 1) 
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update posts count
CREATE TRIGGER update_profile_posts_count
  AFTER INSERT OR DELETE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_posts_count();

-- Trigger for updated_at on story highlights
CREATE TRIGGER update_story_highlights_updated_at
  BEFORE UPDATE ON public.story_highlights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new tables
ALTER TABLE public.follows REPLICA IDENTITY FULL;
ALTER TABLE public.saved_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_messages;