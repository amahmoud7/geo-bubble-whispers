-- Optimized RLS Policies for Spatial Performance
-- This migration replaces existing RLS policies with performance-optimized versions
-- Focus: Reduce policy evaluation overhead and enable index usage

-- Drop existing policies to replace with optimized versions
DROP POLICY IF EXISTS "Public messages are viewable by everyone" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- Optimized Messages RLS Policies
-- These policies are designed to work efficiently with spatial indexes

-- 1. Optimized SELECT policy for public messages
CREATE POLICY "messages_select_optimized" ON public.messages
FOR SELECT 
USING (
  is_public = true 
  AND (expires_at IS NULL OR expires_at > NOW())
);

-- 2. Optimized SELECT policy for private messages (user's own + shared)
CREATE POLICY "messages_select_private" ON public.messages  
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.shares s 
    WHERE s.message_id = messages.id 
    AND s.shared_with_user_id = auth.uid()
  )
);

-- 3. Optimized INSERT policy with location validation
CREATE POLICY "messages_insert_optimized" ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND (
    location_point IS NULL 
    OR ST_IsValid(location_point::geometry)
  )
);

-- 4. Optimized UPDATE policy
CREATE POLICY "messages_update_optimized" ON public.messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    location_point IS NULL 
    OR ST_IsValid(location_point::geometry)
  )
);

-- 5. Optimized DELETE policy  
CREATE POLICY "messages_delete_optimized" ON public.messages
FOR DELETE
USING (auth.uid() = user_id);

-- Drop and recreate Stories RLS policies for better performance
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;
DROP POLICY IF EXISTS "Users can create their own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can update their own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;

-- Optimized Stories RLS Policies
CREATE POLICY "stories_select_active" ON public.stories
FOR SELECT
USING (
  is_active = true 
  AND expires_at > NOW()
);

CREATE POLICY "stories_insert_optimized" ON public.stories
FOR INSERT  
WITH CHECK (
  auth.uid() = user_id
  AND (
    location_point IS NULL 
    OR ST_IsValid(location_point::geometry)
  )
);

CREATE POLICY "stories_update_own" ON public.stories
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_delete_own" ON public.stories  
FOR DELETE
USING (auth.uid() = user_id);

-- Optimize Comments RLS policies to reduce nested queries
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

-- Optimized Comments policies (comments inherit message visibility)
CREATE POLICY "comments_select_with_message" ON public.comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = comments.message_id
    AND (
      m.is_public = true 
      OR m.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.shares s
        WHERE s.message_id = m.id 
        AND s.shared_with_user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "comments_insert_authenticated" ON public.comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = comments.message_id
    AND (m.is_public = true OR m.user_id = auth.uid())
  )
);

CREATE POLICY "comments_update_own" ON public.comments
FOR UPDATE  
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete_own" ON public.comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create function for efficient location-based message filtering
-- This function can be used in application code to pre-filter by location
CREATE OR REPLACE FUNCTION get_messages_in_bounds(
  north_lat DOUBLE PRECISION,
  south_lat DOUBLE PRECISION,
  east_lng DOUBLE PRECISION,
  west_lng DOUBLE PRECISION,
  message_limit INTEGER DEFAULT 1000
)
RETURNS SETOF public.messages
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT m.*
  FROM public.messages m
  WHERE 
    m.location_point IS NOT NULL
    AND m.location_point && ST_MakeEnvelope(west_lng, south_lat, east_lng, north_lat, 4326)
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
    AND m.is_public = true
  ORDER BY m.created_at DESC
  LIMIT message_limit;
$$;

-- Create function for user-specific messages with location filtering
CREATE OR REPLACE FUNCTION get_user_messages_in_bounds(
  user_id_param UUID,
  north_lat DOUBLE PRECISION,
  south_lat DOUBLE PRECISION,  
  east_lng DOUBLE PRECISION,
  west_lng DOUBLE PRECISION,
  message_limit INTEGER DEFAULT 1000
)
RETURNS SETOF public.messages
LANGUAGE sql  
SECURITY DEFINER
STABLE
AS $$
  SELECT m.*
  FROM public.messages m
  WHERE 
    m.user_id = user_id_param
    AND m.location_point IS NOT NULL
    AND m.location_point && ST_MakeEnvelope(west_lng, south_lat, east_lng, north_lat, 4326)
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
  ORDER BY m.created_at DESC  
  LIMIT message_limit;
$$;

-- Add performance monitoring for RLS policy execution
CREATE OR REPLACE FUNCTION monitor_rls_performance()
RETURNS TABLE (
  schemaname TEXT,
  tablename TEXT,  
  policy_name TEXT,
  policy_type TEXT,
  enabled BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    schemaname,
    tablename,
    policyname as policy_name,
    CASE 
      WHEN cmd = 'r' THEN 'SELECT'
      WHEN cmd = 'w' THEN 'UPDATE'  
      WHEN cmd = 'a' THEN 'INSERT'
      WHEN cmd = 'd' THEN 'DELETE'
      ELSE 'ALL'
    END as policy_type,
    NOT permissive as enabled
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN ('messages', 'stories', 'comments', 'likes', 'shares')
  ORDER BY tablename, policy_name;
$$;

-- Function to analyze query performance with RLS
CREATE OR REPLACE FUNCTION analyze_query_performance(
  query_text TEXT,
  enable_rls BOOLEAN DEFAULT true
)
RETURNS TABLE (
  execution_time_ms DOUBLE PRECISION,
  planning_time_ms DOUBLE PRECISION,
  rows_returned BIGINT,
  index_usage TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER  
AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  result RECORD;
BEGIN
  -- Set RLS enforcement
  IF enable_rls THEN
    SET row_security = on;
  ELSE  
    SET row_security = off;
  END IF;
  
  -- Execute EXPLAIN ANALYZE and capture results
  start_time := clock_timestamp();
  
  -- This is a simplified version - in practice, you'd use 
  -- EXPLAIN (ANALYZE, BUFFERS) and parse the results
  EXECUTE query_text;
  
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    EXTRACT(MILLISECONDS FROM (end_time - start_time))::DOUBLE PRECISION as execution_time_ms,
    0::DOUBLE PRECISION as planning_time_ms,
    0::BIGINT as rows_returned,
    'See query plan for details'::TEXT as index_usage;
    
  -- Reset RLS to default
  SET row_security = on;
END;
$$;

-- Grant permissions for monitoring functions
GRANT EXECUTE ON FUNCTION get_messages_in_bounds TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_messages_in_bounds TO authenticated;  
GRANT EXECUTE ON FUNCTION monitor_rls_performance TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_query_performance TO authenticated;

-- Add comments for documentation
COMMENT ON POLICY "messages_select_optimized" ON public.messages IS 'Optimized RLS policy for public message access with spatial index compatibility';
COMMENT ON POLICY "stories_select_active" ON public.stories IS 'Performance-optimized policy for active stories only';
COMMENT ON FUNCTION get_messages_in_bounds IS 'Boundary-based message retrieval optimized for map viewport queries';
COMMENT ON FUNCTION monitor_rls_performance IS 'Monitor RLS policy performance and configuration';