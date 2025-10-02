-- Query Performance Monitoring and Tracking System
-- Comprehensive monitoring for spatial queries and database performance
-- Target: Track all queries >100ms and provide performance insights

-- Enable pg_stat_statements extension for query tracking
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create comprehensive query performance tracking table
CREATE TABLE IF NOT EXISTS public.query_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_hash TEXT NOT NULL,
  query_type VARCHAR(50) NOT NULL,
  query_pattern TEXT,
  execution_time_ms NUMERIC NOT NULL,
  rows_examined BIGINT,
  rows_returned BIGINT,
  index_usage JSONB,
  spatial_operations BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for query performance table
CREATE INDEX IF NOT EXISTS idx_query_perf_type_time 
ON public.query_performance_metrics (query_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_perf_execution_time
ON public.query_performance_metrics (execution_time_ms DESC);

CREATE INDEX IF NOT EXISTS idx_query_perf_spatial
ON public.query_performance_metrics (spatial_operations, created_at DESC)
WHERE spatial_operations = true;

CREATE INDEX IF NOT EXISTS idx_query_perf_hash
ON public.query_performance_metrics (query_hash);

-- Enable RLS for query performance metrics
ALTER TABLE public.query_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policy for query performance metrics (admin and own queries only)
CREATE POLICY "query_metrics_access" ON public.query_performance_metrics
FOR SELECT
USING (
  auth.uid() = user_id
  OR auth.jwt() ->> 'role' = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND (p.email LIKE '%admin%' OR p.email LIKE '%@lo.com%')
  )
);

-- Create function to capture and analyze query performance
CREATE OR REPLACE FUNCTION capture_query_performance(
  query_text TEXT,
  query_type_param VARCHAR(50),
  execution_time_ms NUMERIC,
  rows_examined BIGINT DEFAULT NULL,
  rows_returned BIGINT DEFAULT NULL,
  request_id_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  query_id UUID;
  query_hash_val TEXT;
  is_spatial BOOLEAN;
  index_info JSONB;
BEGIN
  -- Generate hash for query pattern matching
  query_hash_val := encode(digest(query_text, 'sha256'), 'hex');
  
  -- Detect if query involves spatial operations
  is_spatial := (
    query_text ILIKE '%ST_%' 
    OR query_text ILIKE '%location_point%'
    OR query_text ILIKE '%geography%'
    OR query_text ILIKE '%geometry%'
  );
  
  -- Extract basic index usage information
  index_info := jsonb_build_object(
    'spatial_index_likely', is_spatial,
    'has_where_clause', query_text ILIKE '%WHERE%',
    'has_order_by', query_text ILIKE '%ORDER BY%',
    'has_limit', query_text ILIKE '%LIMIT%'
  );
  
  -- Insert performance record
  INSERT INTO public.query_performance_metrics (
    query_hash,
    query_type,
    query_pattern,
    execution_time_ms,
    rows_examined,
    rows_returned,
    index_usage,
    spatial_operations,
    user_id,
    request_id,
    created_at
  ) VALUES (
    query_hash_val,
    query_type_param,
    SUBSTRING(query_text, 1, 500), -- Store truncated query pattern
    execution_time_ms,
    rows_examined,
    rows_returned,
    index_info,
    is_spatial,
    auth.uid(),
    COALESCE(request_id_param, gen_random_uuid()::text),
    NOW()
  ) RETURNING id INTO query_id;
  
  -- Log slow queries automatically
  IF execution_time_ms > 100 THEN
    PERFORM log_slow_query(query_text, execution_time_ms, rows_returned);
  END IF;
  
  RETURN query_id;
END;
$$;

-- Create comprehensive performance analytics functions

-- 1. Get performance summary by query type
CREATE OR REPLACE FUNCTION get_performance_summary(
  time_window_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  query_type VARCHAR(50),
  total_queries BIGINT,
  avg_execution_time_ms NUMERIC,
  p95_execution_time_ms NUMERIC,
  p99_execution_time_ms NUMERIC,
  slow_query_count BIGINT,
  spatial_query_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    qpm.query_type,
    COUNT(*) as total_queries,
    ROUND(AVG(qpm.execution_time_ms), 2) as avg_execution_time_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY qpm.execution_time_ms), 2) as p95_execution_time_ms,
    ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY qpm.execution_time_ms), 2) as p99_execution_time_ms,
    COUNT(*) FILTER (WHERE qpm.execution_time_ms > 100) as slow_query_count,
    COUNT(*) FILTER (WHERE qpm.spatial_operations = true) as spatial_query_count
  FROM public.query_performance_metrics qpm
  WHERE qpm.created_at > NOW() - INTERVAL '1 hour' * time_window_hours
  GROUP BY qpm.query_type
  ORDER BY avg_execution_time_ms DESC;
$$;

-- 2. Get slowest queries with patterns
CREATE OR REPLACE FUNCTION get_slowest_queries(
  limit_count INTEGER DEFAULT 20,
  time_window_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  query_pattern TEXT,
  query_type VARCHAR(50),
  avg_execution_time_ms NUMERIC,
  execution_count BIGINT,
  total_time_ms NUMERIC,
  is_spatial BOOLEAN,
  last_seen TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE  
AS $$
  SELECT 
    qpm.query_pattern,
    qpm.query_type,
    ROUND(AVG(qpm.execution_time_ms), 2) as avg_execution_time_ms,
    COUNT(*) as execution_count,
    ROUND(SUM(qpm.execution_time_ms), 2) as total_time_ms,
    bool_or(qpm.spatial_operations) as is_spatial,
    MAX(qpm.created_at) as last_seen
  FROM public.query_performance_metrics qpm
  WHERE qpm.created_at > NOW() - INTERVAL '1 hour' * time_window_hours
  GROUP BY qpm.query_hash, qpm.query_pattern, qpm.query_type
  ORDER BY avg_execution_time_ms DESC
  LIMIT limit_count;
$$;

-- 3. Get spatial query performance specifically
CREATE OR REPLACE FUNCTION get_spatial_query_performance(
  time_window_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  operation_type TEXT,
  total_queries BIGINT,
  avg_execution_time_ms NUMERIC,
  p95_execution_time_ms NUMERIC,
  avg_rows_returned NUMERIC,
  improvement_opportunity TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN query_pattern ILIKE '%ST_DWithin%' THEN 'proximity_search'
      WHEN query_pattern ILIKE '%ST_Distance%' THEN 'distance_calculation'  
      WHEN query_pattern ILIKE '%ST_Intersects%' THEN 'intersection_test'
      WHEN query_pattern ILIKE '%location_point%' THEN 'spatial_column_access'
      ELSE 'other_spatial'
    END as operation_type,
    COUNT(*) as total_queries,
    ROUND(AVG(execution_time_ms), 2) as avg_execution_time_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms), 2) as p95_execution_time_ms,
    ROUND(AVG(COALESCE(rows_returned, 0)), 2) as avg_rows_returned,
    CASE 
      WHEN AVG(execution_time_ms) > 200 THEN 'Consider index optimization'
      WHEN AVG(execution_time_ms) > 100 THEN 'Monitor closely'
      ELSE 'Performance acceptable'
    END as improvement_opportunity
  FROM public.query_performance_metrics
  WHERE 
    spatial_operations = true
    AND created_at > NOW() - INTERVAL '1 hour' * time_window_hours
  GROUP BY 
    CASE 
      WHEN query_pattern ILIKE '%ST_DWithin%' THEN 'proximity_search'
      WHEN query_pattern ILIKE '%ST_Distance%' THEN 'distance_calculation'
      WHEN query_pattern ILIKE '%ST_Intersects%' THEN 'intersection_test'
      WHEN query_pattern ILIKE '%location_point%' THEN 'spatial_column_access'
      ELSE 'other_spatial'
    END
  ORDER BY avg_execution_time_ms DESC;
$$;

-- 4. Real-time performance monitoring function  
CREATE OR REPLACE FUNCTION get_realtime_performance()
RETURNS TABLE (
  current_active_queries BIGINT,
  avg_query_time_last_5min NUMERIC,
  slow_queries_last_5min BIGINT,
  spatial_queries_last_5min BIGINT,
  connection_utilization NUMERIC,
  performance_status TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as current_active_queries,
    COALESCE(
      (SELECT ROUND(AVG(execution_time_ms), 2) 
       FROM public.query_performance_metrics 
       WHERE created_at > NOW() - INTERVAL '5 minutes'), 
      0
    ) as avg_query_time_last_5min,
    COALESCE(
      (SELECT COUNT(*) 
       FROM public.query_performance_metrics 
       WHERE execution_time_ms > 100 
       AND created_at > NOW() - INTERVAL '5 minutes'), 
      0
    ) as slow_queries_last_5min,
    COALESCE(
      (SELECT COUNT(*) 
       FROM public.query_performance_metrics 
       WHERE spatial_operations = true 
       AND created_at > NOW() - INTERVAL '5 minutes'), 
      0
    ) as spatial_queries_last_5min,
    ROUND(
      (SELECT COUNT(*) FROM pg_stat_activity WHERE state IS NOT NULL)::NUMERIC / 
      (SELECT setting::NUMERIC FROM pg_settings WHERE name = 'max_connections') * 100,
      2
    ) as connection_utilization,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.query_performance_metrics 
            WHERE execution_time_ms > 500 
            AND created_at > NOW() - INTERVAL '5 minutes') > 5 
      THEN 'CRITICAL - Multiple slow queries detected'
      WHEN (SELECT AVG(execution_time_ms) FROM public.query_performance_metrics 
            WHERE created_at > NOW() - INTERVAL '5 minutes') > 200
      THEN 'WARNING - Above average query times'
      ELSE 'HEALTHY - Performance within targets'
    END as performance_status;
$$;

-- Create automated performance alerting function
CREATE OR REPLACE FUNCTION check_performance_alerts()
RETURNS TABLE (
  alert_type TEXT,
  severity TEXT,
  message TEXT,
  metric_value NUMERIC,
  threshold NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- Check for slow spatial queries
  SELECT 
    'slow_spatial_queries' as alert_type,
    'WARNING' as severity,
    'Spatial queries exceeding 200ms threshold' as message,
    ROUND(AVG(execution_time_ms), 2) as metric_value,
    200 as threshold
  FROM public.query_performance_metrics
  WHERE 
    spatial_operations = true 
    AND execution_time_ms > 200
    AND created_at > NOW() - INTERVAL '10 minutes'
  HAVING COUNT(*) > 3
  
  UNION ALL
  
  -- Check for connection pool saturation
  SELECT 
    'connection_pool_high' as alert_type,
    CASE WHEN utilization > 90 THEN 'CRITICAL' ELSE 'WARNING' END as severity,
    'High connection pool utilization' as message,
    utilization as metric_value,
    80 as threshold
  FROM (
    SELECT ROUND(
      (SELECT COUNT(*) FROM pg_stat_activity WHERE state IS NOT NULL)::NUMERIC / 
      (SELECT setting::NUMERIC FROM pg_settings WHERE name = 'max_connections') * 100,
      2
    ) as utilization
  ) pool_stats
  WHERE utilization > 80;
$$;

-- Create function to generate performance reports
CREATE OR REPLACE FUNCTION generate_performance_report(
  report_hours INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  report JSONB;
  summary_data JSONB;
  slow_queries JSONB;  
  spatial_perf JSONB;
  alerts JSONB;
BEGIN
  -- Gather performance summary
  SELECT jsonb_agg(row_to_json(t)) INTO summary_data
  FROM (SELECT * FROM get_performance_summary(report_hours)) t;
  
  -- Gather slow query data
  SELECT jsonb_agg(row_to_json(t)) INTO slow_queries
  FROM (SELECT * FROM get_slowest_queries(10, report_hours)) t;
  
  -- Gather spatial performance data
  SELECT jsonb_agg(row_to_json(t)) INTO spatial_perf  
  FROM (SELECT * FROM get_spatial_query_performance(report_hours)) t;
  
  -- Gather current alerts
  SELECT jsonb_agg(row_to_json(t)) INTO alerts
  FROM (SELECT * FROM check_performance_alerts()) t;
  
  -- Build comprehensive report
  report := jsonb_build_object(
    'report_generated_at', NOW(),
    'time_window_hours', report_hours,
    'summary', COALESCE(summary_data, '[]'::jsonb),
    'slow_queries', COALESCE(slow_queries, '[]'::jsonb),
    'spatial_performance', COALESCE(spatial_perf, '[]'::jsonb),
    'active_alerts', COALESCE(alerts, '[]'::jsonb),
    'recommendations', jsonb_build_array(
      'Monitor queries exceeding 100ms consistently',
      'Consider index optimization for spatial operations > 200ms',
      'Review connection pool utilization if > 80%',
      'Analyze query patterns for optimization opportunities'
    )
  );
  
  RETURN report;
END;
$$;

-- Grant permissions for all monitoring functions
GRANT EXECUTE ON FUNCTION capture_query_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_slowest_queries TO authenticated;
GRANT EXECUTE ON FUNCTION get_spatial_query_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_realtime_performance TO authenticated;
GRANT EXECUTE ON FUNCTION check_performance_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION generate_performance_report TO authenticated;

-- Grant table access
GRANT SELECT ON public.query_performance_metrics TO authenticated;
GRANT INSERT ON public.query_performance_metrics TO service_role;

-- Add helpful comments
COMMENT ON FUNCTION capture_query_performance IS 'Capture and analyze individual query performance metrics';
COMMENT ON FUNCTION get_performance_summary IS 'Generate performance summary by query type with percentile analysis';
COMMENT ON FUNCTION get_spatial_query_performance IS 'Analyze spatial query performance and identify optimization opportunities';
COMMENT ON FUNCTION get_realtime_performance IS 'Get real-time performance metrics and system health status';
COMMENT ON FUNCTION generate_performance_report IS 'Generate comprehensive performance report with recommendations';
COMMENT ON TABLE public.query_performance_metrics IS 'Comprehensive query performance tracking and analysis';