-- Add missing livestream columns to messages table
-- Run this in Supabase SQL Editor to fix the schema

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_is_live ON public.messages(is_live) WHERE is_live = true;
CREATE INDEX IF NOT EXISTS idx_messages_livestream_url ON public.messages(livestream_url) WHERE livestream_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_stream_started_at ON public.messages(stream_started_at DESC) WHERE is_live = true;

-- Grant permissions
GRANT UPDATE ON public.messages TO authenticated;