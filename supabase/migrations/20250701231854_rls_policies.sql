-- Create live_streams table for real-time streaming with location tracking
CREATE TABLE public.live_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  description TEXT,
  stream_url TEXT,
  thumbnail_url TEXT,
  start_lat DOUBLE PRECISION NOT NULL,
  start_lng DOUBLE PRECISION NOT NULL,
  current_lat DOUBLE PRECISION NOT NULL,
  current_lng DOUBLE PRECISION NOT NULL,
  is_live BOOLEAN NOT NULL DEFAULT true,
  viewer_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create live_stream_locations table for tracking location history during stream
CREATE TABLE public.live_stream_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create live_stream_viewers table for tracking active viewers
CREATE TABLE public.live_stream_viewers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(stream_id, viewer_id)
);

-- Enable Row Level Security
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_viewers ENABLE ROW LEVEL SECURITY;

-- Live streams policies
CREATE POLICY "Live streams are viewable by everyone" 
ON public.live_streams 
FOR SELECT 
USING (is_live = true);

CREATE POLICY "Users can create their own live streams" 
ON public.live_streams 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own live streams" 
ON public.live_streams 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own live streams" 
ON public.live_streams 
FOR DELETE 
USING (auth.uid() = user_id);

-- Live stream locations policies
CREATE POLICY "Live stream locations are viewable by everyone" 
ON public.live_stream_locations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.live_streams 
    WHERE live_streams.id = live_stream_locations.stream_id 
    AND live_streams.is_live = true
  )
);

CREATE POLICY "Stream owners can insert location updates" 
ON public.live_stream_locations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.live_streams 
    WHERE live_streams.id = stream_id 
    AND live_streams.user_id = auth.uid()
  )
);

-- Live stream viewers policies
CREATE POLICY "Users can view stream viewers" 
ON public.live_stream_viewers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.live_streams 
    WHERE live_streams.id = live_stream_viewers.stream_id 
    AND live_streams.is_live = true
  )
);

CREATE POLICY "Users can join streams as viewers" 
ON public.live_stream_viewers 
FOR INSERT 
WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Users can update their viewer status" 
ON public.live_stream_viewers 
FOR UPDATE 
USING (auth.uid() = viewer_id);

-- Function to update live stream location and current position
CREATE OR REPLACE FUNCTION public.update_live_stream_location(
  stream_id_param UUID,
  new_lat DOUBLE PRECISION,
  new_lng DOUBLE PRECISION
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update current location in live_streams table
  UPDATE public.live_streams 
  SET 
    current_lat = new_lat,
    current_lng = new_lng,
    updated_at = now()
  WHERE id = stream_id_param AND user_id = auth.uid();
  
  -- Insert location history
  INSERT INTO public.live_stream_locations (stream_id, lat, lng)
  VALUES (stream_id_param, new_lat, new_lng);
END;
$$;

-- Function to end a live stream
CREATE OR REPLACE FUNCTION public.end_live_stream(stream_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update stream status
  UPDATE public.live_streams 
  SET 
    is_live = false,
    ended_at = now(),
    updated_at = now()
  WHERE id = stream_id_param AND user_id = auth.uid();
  
  -- Mark all viewers as inactive
  UPDATE public.live_stream_viewers 
  SET 
    is_active = false,
    left_at = now()
  WHERE stream_id = stream_id_param AND is_active = true;
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_live_streams_is_live ON public.live_streams(is_live);
CREATE INDEX idx_live_streams_user_id ON public.live_streams(user_id);
CREATE INDEX idx_live_streams_current_location ON public.live_streams(current_lat, current_lng);
CREATE INDEX idx_live_stream_locations_stream_id ON public.live_stream_locations(stream_id);
CREATE INDEX idx_live_stream_locations_timestamp ON public.live_stream_locations(timestamp);
CREATE INDEX idx_live_stream_viewers_stream_id ON public.live_stream_viewers(stream_id);
CREATE INDEX idx_live_stream_viewers_active ON public.live_stream_viewers(is_active);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_live_streams_updated_at
BEFORE UPDATE ON public.live_streams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live location updates
ALTER TABLE public.live_streams REPLICA IDENTITY FULL;
ALTER TABLE public.live_stream_locations REPLICA IDENTITY FULL;
ALTER TABLE public.live_stream_viewers REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_viewers;