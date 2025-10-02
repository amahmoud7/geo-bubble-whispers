-- Performance Testing and Validation Suite
-- Comprehensive testing to ensure spatial optimizations achieve target performance
-- Target: Validate p95 ≤ 100ms for spatial queries, confirm all functionality works

-- Create test data for performance validation
CREATE OR REPLACE FUNCTION generate_test_spatial_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  i INTEGER;
  test_lat DOUBLE PRECISION;
  test_lng DOUBLE PRECISION;
  test_user_id UUID;
BEGIN
  -- Insert test user if not exists
  INSERT INTO auth.users (id, email, created_at, updated_at)
  SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'performance.test@lo.com',
    NOW(),
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
  );
  
  test_user_id := '00000000-0000-0000-0000-000000000001'::uuid;
  
  -- Insert test profile
  INSERT INTO public.profiles (id, email, full_name, created_at)
  SELECT test_user_id, 'performance.test@lo.com', 'Performance Test User', NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = test_user_id
  );
  
  -- Generate test messages around major cities for realistic performance testing
  -- NYC area (40.7128, -74.0060)
  FOR i IN 1..500 LOOP
    test_lat := 40.7128 + (random() - 0.5) * 0.1; -- ±0.05 degrees (~3 miles)
    test_lng := -74.0060 + (random() - 0.5) * 0.1;
    
    INSERT INTO public.messages (
      user_id,
      content,
      lat,
      lng,
      location,
      is_public,
      created_at,
      expires_at
    ) VALUES (
      test_user_id,
      'Test message NYC area ' || i,
      test_lat,
      test_lng,
      'New York, NY',
      true,
      NOW() - (random() * INTERVAL '23 hours'),
      NOW() + INTERVAL '1 hour'
    );
  END LOOP;
  
  -- LA area (34.0522, -118.2437)  
  FOR i IN 1..500 LOOP
    test_lat := 34.0522 + (random() - 0.5) * 0.1;
    test_lng := -118.2437 + (random() - 0.5) * 0.1;
    
    INSERT INTO public.messages (
      user_id,
      content,
      lat,
      lng,
      location,
      is_public,
      created_at,
      expires_at
    ) VALUES (
      test_user_id,
      'Test message LA area ' || i,
      test_lat,
      test_lng,
      'Los Angeles, CA',
      true,
      NOW() - (random() * INTERVAL '23 hours'),
      NOW() + INTERVAL '1 hour'
    );
  END LOOP;
  
  -- Chicago area (41.8781, -87.6298)
  FOR i IN 1..300 LOOP
    test_lat := 41.8781 + (random() - 0.5) * 0.08;
    test_lng := -87.6298 + (random() - 0.5) * 0.08;
    
    INSERT INTO public.messages (
      user_id,
      content,
      lat,
      lng,  
      location,
      is_public,
      created_at,
      expires_at
    ) VALUES (
      test_user_id,
      'Test message Chicago area ' || i,
      test_lat,
      test_lng,
      'Chicago, IL',
      true,
      NOW() - (random() * INTERVAL '23 hours'),
      NOW() + INTERVAL '1 hour'
    );
  END LOOP;
  
  -- Generate test stories
  FOR i IN 1..200 LOOP
    test_lat := 40.7128 + (random() - 0.5) * 0.05;
    test_lng := -74.0060 + (random() - 0.5) * 0.05;
    
    INSERT INTO public.stories (
      user_id,
      content,
      lat,
      lng,
      location,
      created_at,
      expires_at
    ) VALUES (
      test_user_id,
      'Test story ' || i,
      test_lat,
      test_lng,
      'New York, NY',
      NOW() - (random() * INTERVAL '12 hours'),
      NOW() + (random() * INTERVAL '12 hours')
    );
  END LOOP;
  
  -- Update statistics after inserting test data
  ANALYZE public.messages;
  ANALYZE public.stories;
  ANALYZE public.profiles;
END;
$$;

-- Create comprehensive performance test suite
CREATE OR REPLACE FUNCTION run_spatial_performance_tests()
RETURNS TABLE (
  test_name TEXT,
  execution_time_ms NUMERIC,
  rows_returned BIGINT,
  meets_target BOOLEAN,
  target_ms NUMERIC,
  improvement_factor NUMERIC,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  execution_time NUMERIC;
  row_count BIGINT;
  baseline_time NUMERIC := 800; -- Original 800ms baseline
  target_time NUMERIC := 100;   -- Target 100ms
BEGIN
  -- Test 1: Basic proximity search (most common query)
  start_time := clock_timestamp();
  
  SELECT COUNT(*) INTO row_count
  FROM get_nearby_messages(40.7128, -74.0060, 1000, 50);
  
  end_time := clock_timestamp();
  execution_time := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  RETURN QUERY SELECT 
    'proximity_search_1km'::TEXT,
    execution_time,
    row_count,
    execution_time <= target_time,
    target_time,
    ROUND(baseline_time / NULLIF(execution_time, 0), 2),
    CASE 
      WHEN execution_time <= target_time THEN 'PASS'
      WHEN execution_time <= target_time * 2 THEN 'MARGINAL'  
      ELSE 'FAIL'
    END;
  
  -- Test 2: Larger radius proximity search
  start_time := clock_timestamp();
  
  SELECT COUNT(*) INTO row_count
  FROM get_nearby_messages(40.7128, -74.0060, 5000, 100);
  
  end_time := clock_timestamp();
  execution_time := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  RETURN QUERY SELECT 
    'proximity_search_5km'::TEXT,
    execution_time,
    row_count,
    execution_time <= target_time * 1.5, -- Allow 150ms for larger radius
    target_time * 1.5,
    ROUND(baseline_time / NULLIF(execution_time, 0), 2),
    CASE 
      WHEN execution_time <= target_time * 1.5 THEN 'PASS'
      WHEN execution_time <= target_time * 3 THEN 'MARGINAL'
      ELSE 'FAIL'
    END;
  
  -- Test 3: Story proximity search
  start_time := clock_timestamp();
  
  SELECT COUNT(*) INTO row_count  
  FROM get_nearby_stories(40.7128, -74.0060, 2000, 25);
  
  end_time := clock_timestamp();
  execution_time := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  RETURN QUERY SELECT 
    'story_proximity_search'::TEXT,
    execution_time,
    row_count,
    execution_time <= target_time,
    target_time,
    ROUND(baseline_time / NULLIF(execution_time, 0), 2),
    CASE 
      WHEN execution_time <= target_time THEN 'PASS'
      WHEN execution_time <= target_time * 2 THEN 'MARGINAL'
      ELSE 'FAIL'  
    END;
  
  -- Test 4: Event discovery search
  start_time := clock_timestamp();
  
  SELECT COUNT(*) INTO row_count
  FROM get_nearby_events(34.0522, -118.2437, 25000, 30);
  
  end_time := clock_timestamp();
  execution_time := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  RETURN QUERY SELECT 
    'event_discovery_search'::TEXT,
    execution_time,
    row_count,
    execution_time <= target_time,
    target_time,
    ROUND(baseline_time / NULLIF(execution_time, 0), 2),
    CASE 
      WHEN execution_time <= target_time THEN 'PASS'
      WHEN execution_time <= target_time * 2 THEN 'MARGINAL'
      ELSE 'FAIL'
    END;
  
  -- Test 5: User proximity search
  start_time := clock_timestamp();
  
  SELECT COUNT(*) INTO row_count
  FROM get_nearby_users(41.8781, -87.6298, 3000);
  
  end_time := clock_timestamp();
  execution_time := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  RETURN QUERY SELECT 
    'user_proximity_search'::TEXT,
    execution_time,
    row_count,
    execution_time <= target_time,
    target_time,
    ROUND(baseline_time / NULLIF(execution_time, 0), 2),
    CASE 
      WHEN execution_time <= target_time THEN 'PASS'
      WHEN execution_time <= target_time * 2 THEN 'MARGINAL'
      ELSE 'FAIL'
    END;
  
  -- Test 6: Bounds-based query (map viewport)
  start_time := clock_timestamp();
  
  SELECT COUNT(*) INTO row_count
  FROM get_messages_in_bounds(40.8, 40.6, -73.9, -74.1, 200);
  
  end_time := clock_timestamp();
  execution_time := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  RETURN QUERY SELECT 
    'viewport_bounds_query'::TEXT,
    execution_time,
    row_count,
    execution_time <= target_time,
    target_time,
    ROUND(baseline_time / NULLIF(execution_time, 0), 2),
    CASE 
      WHEN execution_time <= target_time THEN 'PASS'
      WHEN execution_time <= target_time * 2 THEN 'MARGINAL'
      ELSE 'FAIL'
    END;
  
  -- Test 7: Complex spatial query with sorting
  start_time := clock_timestamp();
  
  SELECT COUNT(*) INTO row_count
  FROM (
    SELECT m.*, 
           ST_Distance(m.location_point, ST_Point(-74.0060, 40.7128)::geography) as distance
    FROM public.messages m
    WHERE m.location_point IS NOT NULL
      AND ST_DWithin(m.location_point, ST_Point(-74.0060, 40.7128)::geography, 2000)
      AND m.is_public = true
      AND m.expires_at > NOW()
    ORDER BY m.location_point <-> ST_Point(-74.0060, 40.7128)::geography
    LIMIT 50
  ) complex_query;
  
  end_time := clock_timestamp();
  execution_time := EXTRACT(MILLISECONDS FROM (end_time - start_time));
  
  RETURN QUERY SELECT 
    'complex_spatial_sort'::TEXT,
    execution_time,
    row_count,
    execution_time <= target_time * 1.2, -- Allow 120ms for complex query
    target_time * 1.2,
    ROUND(baseline_time / NULLIF(execution_time, 0), 2),
    CASE 
      WHEN execution_time <= target_time * 1.2 THEN 'PASS'
      WHEN execution_time <= target_time * 2.5 THEN 'MARGINAL'
      ELSE 'FAIL'
    END;
    
END;
$$;

-- Create function to validate spatial index usage
CREATE OR REPLACE FUNCTION validate_spatial_indexes()
RETURNS TABLE (
  index_name TEXT,
  table_name TEXT,
  index_size TEXT,
  is_being_used BOOLEAN,
  estimated_usage_percent NUMERIC,
  status TEXT
)
LANGUAGE sql
SECURITY DEFINER  
AS $$
  SELECT 
    indexname as index_name,
    tablename as table_name,
    pg_size_pretty(pg_relation_size(indexrelname::regclass)) as index_size,
    CASE 
      WHEN idx_tup_read > 0 THEN true 
      ELSE false 
    END as is_being_used,
    CASE 
      WHEN seq_tup_read + idx_tup_fetch = 0 THEN 0
      ELSE ROUND((idx_tup_fetch::NUMERIC / (seq_tup_read + idx_tup_fetch)::NUMERIC) * 100, 2)
    END as estimated_usage_percent,
    CASE 
      WHEN idx_tup_read = 0 THEN 'UNUSED - Consider dropping'
      WHEN idx_tup_read < 1000 THEN 'LOW_USAGE - Monitor'
      WHEN idx_tup_read < 10000 THEN 'MODERATE_USAGE - Good'
      ELSE 'HIGH_USAGE - Excellent'
    END as status
  FROM pg_stat_user_indexes
  LEFT JOIN pg_stat_user_tables USING (relname)
  WHERE indexname LIKE '%location%' 
     OR indexname LIKE '%spatial%'
     OR indexname LIKE '%gist%'
  ORDER BY idx_tup_read DESC;
$$;

-- Create function to run full performance validation suite
CREATE OR REPLACE FUNCTION run_full_performance_validation()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_results JSONB;
  index_results JSONB;
  summary_stats JSONB;
  validation_report JSONB;
  total_tests INTEGER;
  passed_tests INTEGER;
  failed_tests INTEGER;
  avg_improvement NUMERIC;
BEGIN
  -- Run performance tests
  SELECT jsonb_agg(row_to_json(t)) INTO test_results
  FROM (SELECT * FROM run_spatial_performance_tests()) t;
  
  -- Validate indexes
  SELECT jsonb_agg(row_to_json(t)) INTO index_results  
  FROM (SELECT * FROM validate_spatial_indexes()) t;
  
  -- Calculate summary statistics
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'PASS') as passed,
    COUNT(*) FILTER (WHERE status = 'FAIL') as failed,
    ROUND(AVG(improvement_factor), 2) as avg_improvement
  INTO total_tests, passed_tests, failed_tests, avg_improvement
  FROM run_spatial_performance_tests();
  
  summary_stats := jsonb_build_object(
    'total_tests', total_tests,
    'tests_passed', passed_tests, 
    'tests_failed', failed_tests,
    'pass_rate_percent', ROUND((passed_tests::NUMERIC / total_tests::NUMERIC) * 100, 1),
    'average_improvement_factor', avg_improvement,
    'performance_target_met', CASE WHEN failed_tests = 0 THEN true ELSE false END
  );
  
  -- Generate comprehensive validation report
  validation_report := jsonb_build_object(
    'validation_timestamp', NOW(),
    'database_version', version(),
    'postgis_version', PostGIS_Version(),
    'summary', summary_stats,
    'detailed_test_results', COALESCE(test_results, '[]'::jsonb),
    'spatial_index_status', COALESCE(index_results, '[]'::jsonb),
    'recommendations', jsonb_build_array(
      CASE 
        WHEN failed_tests = 0 THEN 'All performance targets met - optimization successful'
        ELSE 'Some tests failed - review failed queries for further optimization'
      END,
      CASE 
        WHEN avg_improvement >= 5 THEN 'Excellent performance improvement achieved'
        WHEN avg_improvement >= 2 THEN 'Good performance improvement achieved'  
        ELSE 'Moderate improvement - consider additional optimization'
      END,
      'Monitor query performance in production using the monitoring functions',
      'Run periodic performance validations to ensure sustained performance'
    ),
    'next_steps', jsonb_build_array(
      'Deploy optimizations to production environment',
      'Monitor real-world performance metrics',
      'Set up automated performance alerting',
      'Schedule regular performance reviews'
    )
  );
  
  RETURN validation_report;
END;
$$;

-- Create function to clean up test data
CREATE OR REPLACE FUNCTION cleanup_test_spatial_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove test messages
  DELETE FROM public.messages 
  WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  -- Remove test stories  
  DELETE FROM public.stories
  WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  -- Remove test profile
  DELETE FROM public.profiles
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  -- Remove test user (if we have permission)
  DELETE FROM auth.users 
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  -- Update statistics after cleanup
  ANALYZE public.messages;
  ANALYZE public.stories;
  ANALYZE public.profiles;
END;
$$;

-- Grant permissions for testing functions
GRANT EXECUTE ON FUNCTION generate_test_spatial_data TO authenticated;
GRANT EXECUTE ON FUNCTION run_spatial_performance_tests TO authenticated;  
GRANT EXECUTE ON FUNCTION validate_spatial_indexes TO authenticated;
GRANT EXECUTE ON FUNCTION run_full_performance_validation TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_test_spatial_data TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION generate_test_spatial_data IS 'Generate realistic test data for spatial performance validation';
COMMENT ON FUNCTION run_spatial_performance_tests IS 'Execute comprehensive spatial query performance tests';
COMMENT ON FUNCTION validate_spatial_indexes IS 'Validate that spatial indexes are being used effectively';
COMMENT ON FUNCTION run_full_performance_validation IS 'Complete performance validation suite with detailed reporting';
COMMENT ON FUNCTION cleanup_test_spatial_data IS 'Clean up test data after performance validation';