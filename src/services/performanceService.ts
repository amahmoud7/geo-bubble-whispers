// Performance Monitoring Service
// Tracks and analyzes database query performance for Lo platform

import { supabase } from '@/integrations/supabase/client';

export interface PerformanceMetrics {
  queryType: string;
  avgExecutionTimeMs: number;
  p95ExecutionTimeMs: number;
  p99ExecutionTimeMs: number;
  totalQueries: number;
  slowQueryCount: number;
  spatialQueryCount: number;
}

export interface SpatialPerformanceMetrics {
  operationType: string;
  totalQueries: number;
  avgExecutionTimeMs: number;
  p95ExecutionTimeMs: number;
  avgRowsReturned: number;
  improvementOpportunity: string;
}

export interface RealtimePerformanceStatus {
  currentActiveQueries: number;
  avgQueryTimeLast5Min: number;
  slowQueriesLast5Min: number;
  spatialQueriesLast5Min: number;
  connectionUtilization: number;
  performanceStatus: string;
}

export interface PerformanceAlert {
  alertType: string;
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  metricValue: number;
  threshold: number;
}

export interface PerformanceReport {
  reportGeneratedAt: string;
  timeWindowHours: number;
  summary: PerformanceMetrics[];
  slowQueries: any[];
  spatialPerformance: SpatialPerformanceMetrics[];
  activeAlerts: PerformanceAlert[];
  recommendations: string[];
}

class PerformanceService {
  private static instance: PerformanceService;
  private metricsCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Cache helper method
   */
  private getCachedData<T>(key: string): T | null {
    const now = Date.now();
    const expiry = this.cacheExpiry.get(key);
    
    if (expiry && now < expiry && this.metricsCache.has(key)) {
      return this.metricsCache.get(key) as T;
    }
    
    // Clean up expired cache entry
    if (expiry && now >= expiry) {
      this.metricsCache.delete(key);
      this.cacheExpiry.delete(key);
    }
    
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.metricsCache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Get performance summary by query type
   */
  async getPerformanceSummary(timeWindowHours: number = 24): Promise<PerformanceMetrics[]> {
    const cacheKey = `performance-summary-${timeWindowHours}`;
    const cached = this.getCachedData<PerformanceMetrics[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.rpc('get_performance_summary', {
        time_window_hours: timeWindowHours
      });

      if (error) {
        console.error('Error fetching performance summary:', error);
        return [];
      }

      const metrics: PerformanceMetrics[] = (data || []).map((row: any) => ({
        queryType: row.query_type,
        avgExecutionTimeMs: row.avg_execution_time_ms,
        p95ExecutionTimeMs: row.p95_execution_time_ms,
        p99ExecutionTimeMs: row.p99_execution_time_ms,
        totalQueries: row.total_queries,
        slowQueryCount: row.slow_query_count,
        spatialQueryCount: row.spatial_query_count
      }));

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to fetch performance summary:', error);
      return [];
    }
  }

  /**
   * Get spatial query performance metrics
   */
  async getSpatialQueryPerformance(timeWindowHours: number = 24): Promise<SpatialPerformanceMetrics[]> {
    const cacheKey = `spatial-performance-${timeWindowHours}`;
    const cached = this.getCachedData<SpatialPerformanceMetrics[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.rpc('get_spatial_query_performance', {
        time_window_hours: timeWindowHours
      });

      if (error) {
        console.error('Error fetching spatial performance:', error);
        return [];
      }

      const metrics: SpatialPerformanceMetrics[] = (data || []).map((row: any) => ({
        operationType: row.operation_type,
        totalQueries: row.total_queries,
        avgExecutionTimeMs: row.avg_execution_time_ms,
        p95ExecutionTimeMs: row.p95_execution_time_ms,
        avgRowsReturned: row.avg_rows_returned,
        improvementOpportunity: row.improvement_opportunity
      }));

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to fetch spatial performance:', error);
      return [];
    }
  }

  /**
   * Get real-time performance status
   */
  async getRealtimePerformance(): Promise<RealtimePerformanceStatus | null> {
    // Don't cache real-time data
    try {
      const { data, error } = await supabase.rpc('get_realtime_performance');

      if (error) {
        console.error('Error fetching realtime performance:', error);
        return null;
      }

      const row = (data || [])[0];
      if (!row) return null;

      return {
        currentActiveQueries: row.current_active_queries,
        avgQueryTimeLast5Min: row.avg_query_time_last_5min,
        slowQueriesLast5Min: row.slow_queries_last_5min,
        spatialQueriesLast5Min: row.spatial_queries_last_5min,
        connectionUtilization: row.connection_utilization,
        performanceStatus: row.performance_status
      };
    } catch (error) {
      console.error('Failed to fetch realtime performance:', error);
      return null;
    }
  }

  /**
   * Check for performance alerts
   */
  async getPerformanceAlerts(): Promise<PerformanceAlert[]> {
    try {
      const { data, error } = await supabase.rpc('check_performance_alerts');

      if (error) {
        console.error('Error fetching performance alerts:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        alertType: row.alert_type,
        severity: row.severity,
        message: row.message,
        metricValue: row.metric_value,
        threshold: row.threshold
      }));
    } catch (error) {
      console.error('Failed to fetch performance alerts:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(reportHours: number = 24): Promise<PerformanceReport | null> {
    try {
      const { data, error } = await supabase.rpc('generate_performance_report', {
        report_hours: reportHours
      });

      if (error) {
        console.error('Error generating performance report:', error);
        return null;
      }

      return data as PerformanceReport;
    } catch (error) {
      console.error('Failed to generate performance report:', error);
      return null;
    }
  }

  /**
   * Analyze spatial index usage
   */
  async analyzeSpatialIndexUsage(): Promise<any[]> {
    const cacheKey = 'spatial-index-usage';
    const cached = this.getCachedData<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.rpc('monitor_spatial_index_usage');

      if (error) {
        console.error('Error analyzing spatial index usage:', error);
        return [];
      }

      this.setCachedData(cacheKey, data || []);
      return data || [];
    } catch (error) {
      console.error('Failed to analyze spatial index usage:', error);
      return [];
    }
  }

  /**
   * Monitor connection pool
   */
  async getConnectionPoolStatus(): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('monitor_connection_pool');

      if (error) {
        console.error('Error monitoring connection pool:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to monitor connection pool:', error);
      return [];
    }
  }

  /**
   * Refresh spatial statistics manually
   */
  async refreshSpatialStatistics(): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('refresh_spatial_statistics');

      if (error) {
        console.error('Error refreshing spatial statistics:', error);
        return false;
      }

      // Clear relevant caches after refresh
      const keysToDelete = Array.from(this.metricsCache.keys())
        .filter(key => key.includes('spatial') || key.includes('performance'));
      
      keysToDelete.forEach(key => {
        this.metricsCache.delete(key);
        this.cacheExpiry.delete(key);
      });

      return true;
    } catch (error) {
      console.error('Failed to refresh spatial statistics:', error);
      return false;
    }
  }

  /**
   * Log custom query performance
   */
  async logQueryPerformance(
    queryText: string,
    queryType: string,
    executionTimeMs: number,
    rowsReturned?: number,
    requestId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('capture_query_performance', {
        query_text: queryText,
        query_type_param: queryType,
        execution_time_ms: executionTimeMs,
        rows_returned: rowsReturned,
        request_id_param: requestId
      });

      if (error) {
        console.warn('Error logging query performance:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Failed to log query performance:', error);
      return false;
    }
  }

  /**
   * Validate that performance targets are being met
   */
  async validatePerformanceTargets(): Promise<{
    spatialQueriesUnder100ms: boolean;
    connectionUtilizationUnder80: boolean;
    overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    issues: string[];
  }> {
    try {
      const [summary, realtimeStatus] = await Promise.all([
        this.getPerformanceSummary(1), // Last hour
        this.getRealtimePerformance()
      ]);

      const spatialMetrics = summary.find(m => m.queryType?.includes('spatial'));
      const spatialQueriesUnder100ms = !spatialMetrics || spatialMetrics.p95ExecutionTimeMs <= 100;
      
      const connectionUtilizationUnder80 = !realtimeStatus || realtimeStatus.connectionUtilization < 80;
      
      const issues: string[] = [];
      
      if (!spatialQueriesUnder100ms) {
        issues.push(`Spatial queries p95: ${spatialMetrics?.p95ExecutionTimeMs}ms (target: ≤100ms)`);
      }
      
      if (!connectionUtilizationUnder80) {
        issues.push(`Connection utilization: ${realtimeStatus?.connectionUtilization}% (target: <80%)`);
      }

      const overallStatus = issues.length === 0 ? 'HEALTHY' : 
                           issues.length === 1 ? 'WARNING' : 'CRITICAL';

      return {
        spatialQueriesUnder100ms,
        connectionUtilizationUnder80,
        overallStatus,
        issues
      };
    } catch (error) {
      console.error('Failed to validate performance targets:', error);
      return {
        spatialQueriesUnder100ms: false,
        connectionUtilizationUnder80: false,
        overallStatus: 'CRITICAL',
        issues: ['Unable to validate performance targets']
      };
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.metricsCache.clear();
    this.cacheExpiry.clear();
  }
}

export const performanceService = PerformanceService.getInstance();