-- Spatial Performance Optimization Migration
-- This migration adds PostGIS spatial columns, indexes, and optimized query functions
-- Target: Reduce query times from 800ms to <100ms for spatial operations

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Add spatial columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS location_point GEOGRAPHY(POINT, 4326);

-- Add spatial columns to profiles table  
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location_point GEOGRAPHY(POINT, 4326);

-- Add spatial columns to stories table
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS location_point GEOGRAPHY(POINT, 4326);

-- Populate spatial columns from existing lat/lng data
UPDATE public.messages 
SET location_point = ST_Point(lng, lat)::geography
WHERE lat IS NOT NULL AND lng IS NOT NULL AND location_point IS NULL;

UPDATE public.profiles
SET location_point = ST_Point(lng, lat)::geography  
WHERE lat IS NOT NULL AND lng IS NOT NULL AND location_point IS NULL;

UPDATE public.stories
SET location_point = ST_Point(lng, lat)::geography
WHERE lat IS NOT NULL AND lng IS NOT NULL AND location_point IS NULL;

-- Create high-performance spatial indexes using GIST
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_location_gist 
ON public.messages USING GIST (location_point);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_location_gist
ON public.profiles USING GIST (location_point);  

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_location_gist
ON public.stories USING GIST (location_point);

-- Create composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_location_time
ON public.messages USING BTREE (created_at DESC, expires_at) 
WHERE location_point IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_location_public
ON public.messages USING BTREE (is_public, created_at DESC)
WHERE location_point IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_location_type
ON public.messages USING BTREE (message_type, created_at DESC)
WHERE location_point IS NOT NULL;

-- Create optimized spatial query functions
CREATE OR REPLACE FUNCTION get_nearby_messages(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 1000,
  message_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  location TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  user_id UUID,
  is_public BOOLEAN,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  message_type VARCHAR(20),
  event_title TEXT,
  event_venue TEXT,
  event_url TEXT,
  distance_meters DOUBLE PRECISION
) 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.media_url,
    m.media_type,
    m.location,
    m.lat,
    m.lng,
    m.user_id,
    m.is_public,
    m.created_at,
    m.expires_at,
    m.message_type,
    m.event_title,
    m.event_venue,
    m.event_url,
    ST_Distance(
      m.location_point,
      ST_Point(user_lng, user_lat)::geography
    ) as distance_meters
  FROM public.messages m
  WHERE 
    m.location_point IS NOT NULL
    AND ST_DWithin(
      m.location_point,
      ST_Point(user_lng, user_lat)::geography,
      radius_meters
    )
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
  ORDER BY 
    m.location_point <-> ST_Point(user_lng, user_lat)::geography,
    m.created_at DESC
  LIMIT message_limit;
END;
$$;

-- Function for nearby active stories
CREATE OR REPLACE FUNCTION get_nearby_stories(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 1000,
  story_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  location TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.content,
    s.media_url,
    s.media_type,
    s.location,
    s.lat,
    s.lng,
    s.created_at,
    s.expires_at,
    ST_Distance(
      s.location_point,
      ST_Point(user_lng, user_lat)::geography
    ) as distance_meters
  FROM public.stories s
  WHERE 
    s.location_point IS NOT NULL
    AND s.is_active = true
    AND s.expires_at > NOW()
    AND ST_DWithin(
      s.location_point,
      ST_Point(user_lng, user_lat)::geography,
      radius_meters
    )
  ORDER BY 
    s.location_point <-> ST_Point(user_lng, user_lat)::geography,
    s.created_at DESC
  LIMIT story_limit;
END;
$$;

-- Function for proximity-based user discovery
CREATE OR REPLACE FUNCTION get_nearby_users(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000,
  exclude_user_id UUID DEFAULT NULL,
  user_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  location TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    p.location,
    ST_Y(p.location_point::geometry) as lat,
    ST_X(p.location_point::geometry) as lng,
    ST_Distance(
      p.location_point,
      ST_Point(user_lng, user_lat)::geography
    ) as distance_meters
  FROM public.profiles p
  WHERE 
    p.location_point IS NOT NULL
    AND (exclude_user_id IS NULL OR p.id != exclude_user_id)
    AND ST_DWithin(
      p.location_point,
      ST_Point(user_lng, user_lat)::geography,
      radius_meters
    )
  ORDER BY 
    p.location_point <-> ST_Point(user_lng, user_lat)::geography
  LIMIT user_limit;
END;
$$;

-- Function for efficient event discovery by location
CREATE OR REPLACE FUNCTION get_nearby_events(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 50000,
  event_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  event_title TEXT,
  event_venue TEXT,
  event_url TEXT,
  event_start_date TIMESTAMPTZ,
  event_end_date TIMESTAMPTZ,
  event_price_min DECIMAL(10,2),
  event_price_max DECIMAL(10,2),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE  
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.event_title,
    m.event_venue,
    m.event_url,
    m.event_start_date,
    m.event_end_date,
    m.event_price_min,
    m.event_price_max,
    m.lat,
    m.lng,
    ST_Distance(
      m.location_point,
      ST_Point(user_lng, user_lat)::geography
    ) as distance_meters,
    m.created_at
  FROM public.messages m
  WHERE 
    m.message_type = 'event'
    AND m.location_point IS NOT NULL
    AND (m.event_start_date IS NULL OR m.event_start_date > NOW())
    AND ST_DWithin(
      m.location_point,
      ST_Point(user_lng, user_lat)::geography,
      radius_meters
    )
  ORDER BY 
    m.location_point <-> ST_Point(user_lng, user_lat)::geography,
    COALESCE(m.event_start_date, m.created_at) ASC
  LIMIT event_limit;
END;
$$;

-- Add trigger to automatically update location_point when lat/lng change
CREATE OR REPLACE FUNCTION update_location_point()
RETURNS TRIGGER AS $$
BEGIN
  -- Update location_point when lat/lng changes
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location_point = ST_Point(NEW.lng, NEW.lat)::geography;
  ELSE
    NEW.location_point = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic spatial column updates
DROP TRIGGER IF EXISTS messages_update_location_point ON public.messages;
CREATE TRIGGER messages_update_location_point
  BEFORE INSERT OR UPDATE OF lat, lng ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_location_point();

DROP TRIGGER IF EXISTS profiles_update_location_point ON public.profiles;  
CREATE TRIGGER profiles_update_location_point
  BEFORE INSERT OR UPDATE OF lat, lng ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_location_point();

DROP TRIGGER IF EXISTS stories_update_location_point ON public.stories;
CREATE TRIGGER stories_update_location_point
  BEFORE INSERT OR UPDATE OF lat, lng ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION update_location_point();

-- Create materialized view for hot location data (top areas with recent activity)
CREATE MATERIALIZED VIEW IF NOT EXISTS hot_locations AS
SELECT 
  ST_SnapToGrid(location_point::geometry, 0.01) as location_grid,
  COUNT(*) as message_count,
  MAX(created_at) as latest_activity,
  AVG(ST_Y(location_point::geometry)) as avg_lat,
  AVG(ST_X(location_point::geometry)) as avg_lng
FROM public.messages 
WHERE 
  location_point IS NOT NULL 
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY ST_SnapToGrid(location_point::geometry, 0.01)
HAVING COUNT(*) >= 3
ORDER BY message_count DESC, latest_activity DESC;

CREATE INDEX IF NOT EXISTS idx_hot_locations_grid 
ON hot_locations USING GIST (location_grid);

-- Function to refresh hot locations (call this periodically)
CREATE OR REPLACE FUNCTION refresh_hot_locations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY hot_locations;
END;
$$;

-- Performance monitoring function
CREATE OR REPLACE FUNCTION analyze_spatial_performance()
RETURNS TABLE (
  table_name TEXT,
  index_name TEXT,
  index_type TEXT,
  table_size TEXT,
  index_size TEXT,
  estimated_rows BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname || '.' || tablename as table_name,
    indexname as index_name,
    'GIST'::text as index_type,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as index_size,
    n_tup_ins + n_tup_upd as estimated_rows
  FROM pg_stat_user_indexes 
  JOIN pg_indexes ON (pg_stat_user_indexes.indexrelname = pg_indexes.indexname)
  LEFT JOIN pg_stat_user_tables ON (pg_stat_user_indexes.relname = pg_stat_user_tables.relname)
  WHERE indexname LIKE '%location%gist%'
  ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_nearby_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_stories TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_users TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_events TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_spatial_performance TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_nearby_messages IS 'High-performance spatial query for nearby messages using PostGIS GIST indexes';
COMMENT ON FUNCTION get_nearby_stories IS 'Optimized query for nearby active stories within radius';
COMMENT ON FUNCTION get_nearby_users IS 'Proximity-based user discovery with distance calculation';
COMMENT ON FUNCTION get_nearby_events IS 'Event discovery using spatial indexes for better performance';
COMMENT ON COLUMN public.messages.location_point IS 'PostGIS spatial column for optimized location queries';
COMMENT ON INDEX idx_messages_location_gist IS 'GIST spatial index for sub-100ms proximity queries';