-- Core schema for Geo Bubble Whispers
-- This creates the essential tables needed for the app to function

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  is_new_user BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create the main messages table (Lo messages)
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type TEXT DEFAULT 'text', -- 'text', 'image', 'video', 'live_stream', 'event'
  location TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours'),
  
  -- Event-specific fields
  message_type VARCHAR(20) DEFAULT 'user',
  event_source VARCHAR(50),
  external_event_id VARCHAR(100),
  event_url TEXT,
  event_title TEXT,
  event_venue TEXT,
  event_start_date TIMESTAMP WITH TIME ZONE,
  event_end_date TIMESTAMP WITH TIME ZONE,
  event_price_min DECIMAL(10,2),
  event_price_max DECIMAL(10,2)
);

-- Create comments table for message interactions
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create likes table for message likes
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(message_id, user_id)
);

-- Create shares table for message sharing
CREATE TABLE public.shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Messages policies  
CREATE POLICY "Public messages are viewable by everyone" ON public.messages FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert their own messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own messages" ON public.messages FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Shares policies
CREATE POLICY "Shares are viewable by everyone" ON public.shares FOR SELECT USING (true);
CREATE POLICY "Users can insert their own shares" ON public.shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own shares" ON public.shares FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_messages_location ON public.messages(lat, lng);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_messages_is_public ON public.messages(is_public);
CREATE INDEX idx_messages_expires_at ON public.messages(expires_at);
CREATE INDEX idx_messages_message_type ON public.messages(message_type);
CREATE INDEX idx_messages_event_source ON public.messages(event_source);
CREATE INDEX idx_comments_message_id ON public.comments(message_id);
CREATE INDEX idx_likes_message_id ON public.likes(message_id);
CREATE INDEX idx_shares_message_id ON public.shares(message_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for real-time updates
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.likes REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;