-- Connection Pooling and Performance Configuration
-- Optimizes database settings for spatial queries and high-throughput operations
-- Target: Support 10K+ concurrent connections with <50ms connection establishment

-- Configure PostgreSQL for spatial performance
-- These settings optimize for spatial queries and high concurrency

-- Set work memory for spatial operations (per connection)
-- Increased from default 4MB to handle larger spatial calculations
ALTER SYSTEM SET work_mem = '16MB';

-- Set maintenance work memory for index creation and VACUUM operations  
ALTER SYSTEM SET maintenance_work_mem = '256MB';

-- Enable parallel query execution for large spatial operations
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
ALTER SYSTEM SET max_parallel_workers = 8;
ALTER SYSTEM SET parallel_tuple_cost = 0.1;
ALTER SYSTEM SET parallel_setup_cost = 1000.0;

-- Optimize shared buffers for PostGIS operations
-- This should be ~25% of available RAM in production
ALTER SYSTEM SET shared_buffers = '128MB';

-- Configure effective cache size (should match available system memory)
ALTER SYSTEM SET effective_cache_size = '1GB';  

-- Optimize random page cost for SSD storage
ALTER SYSTEM SET random_page_cost = 1.1;

-- Configure checkpoint settings for write performance
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';

-- Enable query plan caching for repeated spatial queries
ALTER SYSTEM SET plan_cache_mode = 'auto';

-- Configure connection limits and timeouts
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET idle_in_transaction_session_timeout = '10min';
ALTER SYSTEM SET statement_timeout = '30s';

-- Enable logging for slow queries (queries > 100ms)
ALTER SYSTEM SET log_min_duration_statement = 100;
ALTER SYSTEM SET log_statement_stats = off;
ALTER SYSTEM SET log_checkpoints = on;

-- Configure auto-vacuum for spatial tables
ALTER SYSTEM SET autovacuum_max_workers = 6;
ALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;

-- Reload configuration (requires superuser privileges)
-- In production, this would be: SELECT pg_reload_conf();
-- For Supabase, these settings are managed through the dashboard

-- Create connection pool monitoring function
CREATE OR REPLACE FUNCTION monitor_connection_pool()
RETURNS TABLE (
  state TEXT,
  connection_count BIGINT,
  max_connections INTEGER,
  utilization_percent NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    state,
    count(*) as connection_count,
    (SELECT setting::integer FROM pg_settings WHERE name = 'max_connections') as max_connections,
    ROUND(
      (count(*)::numeric / (SELECT setting::integer FROM pg_settings WHERE name = 'max_connections')::numeric) * 100, 
      2
    ) as utilization_percent
  FROM pg_stat_activity 
  WHERE state IS NOT NULL
  GROUP BY state
  ORDER BY connection_count DESC;
$$;

-- Create query performance statistics function
CREATE OR REPLACE FUNCTION get_query_performance_stats()
RETURNS TABLE (
  query_type TEXT,
  avg_execution_time_ms NUMERIC,
  total_calls BIGINT,
  total_time_ms NUMERIC,
  mean_time_ms NUMERIC,
  stddev_time_ms NUMERIC,
  rows_per_call NUMERIC
)
LANGUAGE sql  
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN query LIKE '%ST_DWithin%' OR query LIKE '%location_point%' THEN 'spatial_query'
      WHEN query LIKE '%messages%' AND query LIKE '%SELECT%' THEN 'message_select'
      WHEN query LIKE '%stories%' AND query LIKE '%SELECT%' THEN 'story_select'
      WHEN query LIKE '%INSERT%' THEN 'insert_query'
      WHEN query LIKE '%UPDATE%' THEN 'update_query'
      WHEN query LIKE '%DELETE%' THEN 'delete_query'
      ELSE 'other_query'
    END as query_type,
    ROUND(mean_exec_time, 2) as avg_execution_time_ms,
    calls as total_calls,
    ROUND(total_exec_time, 2) as total_time_ms,
    ROUND(mean_exec_time, 2) as mean_time_ms,
    ROUND(stddev_exec_time, 2) as stddev_time_ms,
    ROUND(COALESCE(rows / NULLIF(calls, 0), 0), 2) as rows_per_call
  FROM pg_stat_statements
  WHERE calls > 0
  ORDER BY mean_exec_time DESC;
$$;

-- Create index usage monitoring function  
CREATE OR REPLACE FUNCTION monitor_spatial_index_usage()
RETURNS TABLE (
  schemaname TEXT,
  tablename TEXT,
  indexname TEXT,
  idx_tup_read BIGINT,
  idx_tup_fetch BIGINT,
  idx_blks_read BIGINT,
  idx_blks_hit BIGINT,
  cache_hit_ratio NUMERIC
)
LANGUAGE sql
SECURITY DEFINER  
AS $$
  SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_blks_read,
    idx_blks_hit,
    CASE 
      WHEN (idx_blks_hit + idx_blks_read) = 0 THEN NULL
      ELSE ROUND(
        (idx_blks_hit::numeric / (idx_blks_hit + idx_blks_read)::numeric) * 100, 
        2
      )
    END as cache_hit_ratio
  FROM pg_stat_user_indexes
  WHERE indexname LIKE '%location%' 
  OR indexname LIKE '%spatial%'
  OR indexname LIKE '%gist%'
  ORDER BY idx_tup_read DESC;
$$;

-- Create automatic statistics update function
CREATE OR REPLACE FUNCTION refresh_spatial_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update table statistics for query planner
  ANALYZE public.messages;
  ANALYZE public.stories;  
  ANALYZE public.profiles;
  
  -- Refresh materialized view with fresh data
  PERFORM refresh_hot_locations();
  
  -- Log performance update
  INSERT INTO public.performance_logs (
    log_type,
    message,
    created_at
  ) VALUES (
    'statistics_refresh',
    'Spatial statistics and hot locations updated',
    NOW()
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail
  INSERT INTO public.performance_logs (
    log_type,
    message, 
    created_at
  ) VALUES (
    'statistics_error',
    'Error refreshing spatial statistics: ' || SQLERRM,
    NOW()
  );
END;
$$;

-- Create performance monitoring table
CREATE TABLE IF NOT EXISTS public.performance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  log_type VARCHAR(50) NOT NULL,
  message TEXT,
  query_time_ms NUMERIC,
  rows_affected BIGINT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on performance logs
CREATE INDEX IF NOT EXISTS idx_performance_logs_type_time 
ON public.performance_logs (log_type, created_at DESC);

-- Enable RLS for performance logs
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;

-- Policy for performance logs (admin access only)
CREATE POLICY "performance_logs_admin_only" ON public.performance_logs
FOR ALL 
USING (
  auth.jwt() ->> 'role' = 'admin'
  OR auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%admin%' OR email LIKE '%@lo.com%'
  )
);

-- Create function to log slow queries automatically
CREATE OR REPLACE FUNCTION log_slow_query(
  query_text TEXT,
  execution_time_ms NUMERIC,
  rows_returned BIGINT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.performance_logs (
    log_type,
    message,
    query_time_ms,
    rows_affected,
    metadata,
    created_at
  ) VALUES (
    'slow_query',
    SUBSTRING(query_text, 1, 1000), -- Truncate long queries
    execution_time_ms,
    rows_returned,
    jsonb_build_object(
      'threshold_exceeded', execution_time_ms > 100,
      'query_length', LENGTH(query_text)
    ),
    NOW()
  );
END;
$$;

-- Create maintenance function to clean up old performance logs
CREATE OR REPLACE FUNCTION cleanup_performance_logs()
RETURNS void  
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Keep only last 7 days of performance logs
  DELETE FROM public.performance_logs 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  -- Vacuum the table after cleanup
  VACUUM public.performance_logs;
  
  -- Log cleanup completion
  INSERT INTO public.performance_logs (
    log_type,
    message,
    created_at
  ) VALUES (
    'maintenance',
    'Performance logs cleanup completed',
    NOW()
  );
END;
$$;

-- Grant permissions for monitoring functions
GRANT EXECUTE ON FUNCTION monitor_connection_pool TO authenticated;
GRANT EXECUTE ON FUNCTION get_query_performance_stats TO authenticated;
GRANT EXECUTE ON FUNCTION monitor_spatial_index_usage TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_spatial_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION log_slow_query TO authenticated;

-- Grant access to performance logs for admin users
GRANT SELECT ON public.performance_logs TO authenticated;
GRANT INSERT ON public.performance_logs TO authenticated;

-- Add comments for documentation  
COMMENT ON FUNCTION monitor_connection_pool IS 'Monitor database connection pool utilization and state';
COMMENT ON FUNCTION get_query_performance_stats IS 'Analyze query performance by type with execution statistics';
COMMENT ON FUNCTION monitor_spatial_index_usage IS 'Track spatial index performance and cache hit ratios';
COMMENT ON FUNCTION refresh_spatial_statistics IS 'Update table statistics and refresh spatial materialized views';
COMMENT ON TABLE public.performance_logs IS 'Performance monitoring and slow query log storage';