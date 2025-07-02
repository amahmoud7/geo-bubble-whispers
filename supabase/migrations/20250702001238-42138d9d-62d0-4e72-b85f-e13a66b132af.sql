-- Create events table to store fetched events and prevent duplicates
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL, -- Eventbrite/Ticketmaster event ID
  source TEXT NOT NULL CHECK (source IN ('eventbrite', 'ticketmaster')),
  title TEXT NOT NULL,
  description TEXT,
  event_url TEXT,
  image_url TEXT,
  venue_name TEXT,
  venue_address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  message_id UUID, -- Reference to created message
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(external_id, source)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Events are viewable by everyone" 
ON public.events 
FOR SELECT 
USING (true);

-- Only system can insert/update events (will be done via edge functions)
CREATE POLICY "System can manage events" 
ON public.events 
FOR ALL 
USING (false);

-- Add index for performance
CREATE INDEX idx_events_location ON public.events (lat, lng);
CREATE INDEX idx_events_start_date ON public.events (start_date);
CREATE INDEX idx_events_source_external ON public.events (source, external_id);