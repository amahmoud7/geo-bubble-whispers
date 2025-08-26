import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { performance } from 'perf_hooks';

describe('Performance Benchmarks', () => {
  const benchmarkResults: Array<{
    testName: string;
    duration: number;
    operations: number;
    opsPerSecond: number;
    memoryUsage?: NodeJS.MemoryUsage;
  }> = [];

  afterAll(() => {
    // Generate performance report
    console.log('\n📊 PERFORMANCE BENCHMARK RESULTS');
    console.log('='.repeat(60));
    
    benchmarkResults.forEach(result => {
      console.log(`🔥 ${result.testName}:`);
      console.log(`   Duration: ${result.duration.toFixed(2)}ms`);
      console.log(`   Operations: ${result.operations}`);
      console.log(`   Ops/sec: ${result.opsPerSecond.toFixed(0)}`);
      if (result.memoryUsage) {
        console.log(`   Memory: ${(result.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB heap`);
      }
      console.log('');
    });

    // Generate performance summary
    const avgDuration = benchmarkResults.reduce((sum, r) => sum + r.duration, 0) / benchmarkResults.length;
    const totalOps = benchmarkResults.reduce((sum, r) => sum + r.operations, 0);
    const avgOpsPerSec = benchmarkResults.reduce((sum, r) => sum + r.opsPerSecond, 0) / benchmarkResults.length;

    console.log('📈 SUMMARY:');
    console.log(`   Average test duration: ${avgDuration.toFixed(2)}ms`);
    console.log(`   Total operations: ${totalOps}`);
    console.log(`   Average ops/sec: ${avgOpsPerSec.toFixed(0)}`);
  });

  describe('City Detection Performance', () => {
    it('should detect cities efficiently at scale', async () => {
      const { detectNearestCity } = await import('@/utils/cityDetection');
      
      const testCoordinates = [
        { lat: 40.7128, lng: -74.0060 }, // NYC
        { lat: 34.0522, lng: -118.2437 }, // LA
        { lat: 41.8781, lng: -87.6298 }, // Chicago
        { lat: 29.7604, lng: -95.3698 }, // Houston
        { lat: 33.4484, lng: -112.0740 }, // Phoenix
        { lat: 39.9526, lng: -75.1652 }, // Philadelphia
        { lat: 29.4241, lng: -98.4936 }, // San Antonio
        { lat: 32.7157, lng: -117.1611 }, // San Diego
        { lat: 32.7767, lng: -96.7970 }, // Dallas
        { lat: 37.3382, lng: -121.8863 }, // San Jose
      ];

      const iterations = 1000;
      const totalOps = testCoordinates.length * iterations;
      
      const startTime = performance.now();
      const startMemory = process.memoryUsage();

      for (let i = 0; i < iterations; i++) {
        testCoordinates.forEach(coord => {
          detectNearestCity(coord.lat, coord.lng);
        });
      }

      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      const duration = endTime - startTime;
      const opsPerSecond = (totalOps / duration) * 1000;

      benchmarkResults.push({
        testName: 'City Detection at Scale',
        duration,
        operations: totalOps,
        opsPerSecond,
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
        }
      });

      // Performance expectations
      expect(opsPerSecond).toBeGreaterThan(1000); // Should handle 1000+ detections per second
      expect(duration / totalOps).toBeLessThan(10); // Average < 10ms per detection
    });

    it('should handle radius searches efficiently', async () => {
      const { getCitiesWithinRadius } = await import('@/utils/cityDetection');
      
      const testCases = [
        { lat: 40.7128, lng: -74.0060, radius: 50 },
        { lat: 40.7128, lng: -74.0060, radius: 100 },
        { lat: 40.7128, lng: -74.0060, radius: 200 },
        { lat: 34.0522, lng: -118.2437, radius: 50 },
        { lat: 34.0522, lng: -118.2437, radius: 100 },
        { lat: 34.0522, lng: -118.2437, radius: 200 },
      ];

      const iterations = 500;
      const totalOps = testCases.length * iterations;
      
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        testCases.forEach(testCase => {
          getCitiesWithinRadius(testCase.lat, testCase.lng, testCase.radius);
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const opsPerSecond = (totalOps / duration) * 1000;

      benchmarkResults.push({
        testName: 'Radius Search Performance',
        duration,
        operations: totalOps,
        opsPerSecond
      });

      expect(opsPerSecond).toBeGreaterThan(100); // Should handle 100+ radius searches per second
    });

    it('should maintain performance with concurrent operations', async () => {
      const { detectNearestCity, getCitiesWithinRadius } = await import('@/utils/cityDetection');
      
      const concurrency = 10;
      const operationsPerWorker = 100;
      const totalOps = concurrency * operationsPerWorker * 2; // 2 operations per iteration
      
      const startTime = performance.now();

      const workers = Array(concurrency).fill(null).map(async (_, workerIndex) => {
        for (let i = 0; i < operationsPerWorker; i++) {
          const lat = 40.7128 + (workerIndex * 0.01) + (i * 0.001);
          const lng = -74.0060 + (workerIndex * 0.01) + (i * 0.001);
          
          detectNearestCity(lat, lng);
          getCitiesWithinRadius(lat, lng, 50);
        }
      });

      await Promise.all(workers);

      const endTime = performance.now();
      const duration = endTime - startTime;
      const opsPerSecond = (totalOps / duration) * 1000;

      benchmarkResults.push({
        testName: 'Concurrent Operations',
        duration,
        operations: totalOps,
        opsPerSecond
      });

      expect(opsPerSecond).toBeGreaterThan(500); // Should handle concurrent operations efficiently
    });
  });

  describe('Event Service Performance', () => {
    it('should process event searches efficiently', async () => {
      const { EnhancedEventService } = await import('@/services/enhancedEventService');
      
      // Mock dependencies for performance testing
      const mockDetectCityWithMarket = vi.fn().mockReturnValue({
        city: { 
          id: 'test-city',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          radius: 30
        },
        market: { id: '35' }
      });

      const mockSupabaseInvoke = vi.fn().mockResolvedValue({
        data: { events: [], created: 0, fetched: 0 },
        error: null
      });

      vi.mock('@/utils/cityDetection', () => ({
        detectCityWithMarket: mockDetectCityWithMarket,
        getTicketmasterSearchParams: vi.fn().mockReturnValue({
          marketId: '35',
          radius: 30,
          coordinates: { lat: 40.7128, lng: -74.0060 }
        })
      }));

      vi.mock('@/integrations/supabase/client', () => ({
        supabase: {
          functions: {
            invoke: mockSupabaseInvoke
          }
        }
      }));

      const eventService = new EnhancedEventService();
      const iterations = 100;
      
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        await eventService.searchEvents({
          center: { 
            lat: 40.7128 + (i * 0.001), 
            lng: -74.0060 + (i * 0.001) 
          }
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const opsPerSecond = (iterations / duration) * 1000;

      benchmarkResults.push({
        testName: 'Event Service Processing',
        duration,
        operations: iterations,
        opsPerSecond
      });

      expect(opsPerSecond).toBeGreaterThan(10); // Should handle 10+ searches per second
      expect(duration / iterations).toBeLessThan(100); // Average < 100ms per search
    });
  });

  describe('Data Structure Performance', () => {
    it('should handle large city datasets efficiently', async () => {
      const { EXPANDED_US_CITIES, getAllCities, getCitiesByState } = await import('@/utils/cityDetection');
      
      const iterations = 1000;
      
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        getAllCities();
        getCitiesByState('CA');
        getCitiesByState('TX');
        getCitiesByState('NY');
        
        // Simulate filtering operations
        EXPANDED_US_CITIES.filter(city => city.population > 500000);
        EXPANDED_US_CITIES.filter(city => city.state === 'CA');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const totalOps = iterations * 6; // 6 operations per iteration
      const opsPerSecond = (totalOps / duration) * 1000;

      benchmarkResults.push({
        testName: 'Dataset Operations',
        duration,
        operations: totalOps,
        opsPerSecond
      });

      expect(opsPerSecond).toBeGreaterThan(1000); // Should handle 1000+ dataset operations per second
    });

    it('should perform distance calculations efficiently', async () => {
      // Test the distance calculation performance (used internally by city detection)
      const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 3959; // Earth's radius in miles
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLng = (lng2 - lng1) * (Math.PI / 180);
        
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
          
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const iterations = 10000;
      const coordinates = [
        { lat: 40.7128, lng: -74.0060 }, // NYC
        { lat: 34.0522, lng: -118.2437 }, // LA
        { lat: 41.8781, lng: -87.6298 }, // Chicago
      ];

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const coord1 = coordinates[i % coordinates.length];
        const coord2 = coordinates[(i + 1) % coordinates.length];
        calculateDistance(coord1.lat, coord1.lng, coord2.lat, coord2.lng);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const opsPerSecond = (iterations / duration) * 1000;

      benchmarkResults.push({
        testName: 'Distance Calculations',
        duration,
        operations: iterations,
        opsPerSecond
      });

      expect(opsPerSecond).toBeGreaterThan(10000); // Should handle 10k+ distance calculations per second
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during repeated operations', async () => {
      const { detectNearestCity, getCitiesWithinRadius } = await import('@/utils/cityDetection');
      
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        detectNearestCity(40.7128 + (i * 0.001), -74.0060 + (i * 0.001));
        
        if (i % 100 === 0) {
          getCitiesWithinRadius(40.7128, -74.0060, 50);
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryGrowthMB = memoryGrowth / 1024 / 1024;

      console.log(`🧠 Memory growth after 1000 operations: ${memoryGrowthMB.toFixed(2)}MB`);

      // Memory growth should be reasonable (< 10MB for this test)
      expect(memoryGrowthMB).toBeLessThan(10);
    });

    it('should handle large result sets without excessive memory usage', async () => {
      const { getCitiesWithinRadius } = await import('@/utils/cityDetection');
      
      const startMemory = process.memoryUsage();
      
      // Get large result sets
      const results = [];
      for (let i = 0; i < 100; i++) {
        const cities = getCitiesWithinRadius(40.7128, -74.0060, 200); // Large radius
        results.push(cities);
      }

      const endMemory = process.memoryUsage();
      const memoryUsed = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024;

      console.log(`💾 Memory used for large result sets: ${memoryUsed.toFixed(2)}MB`);
      console.log(`📊 Average results per query: ${results.reduce((sum, r) => sum + r.length, 0) / results.length}`);

      // Should handle large datasets without excessive memory usage
      expect(memoryUsed).toBeLessThan(50); // < 50MB for this test
    });
  });

  describe('Performance Regression Detection', () => {
    it('should maintain performance benchmarks', () => {
      // Performance thresholds based on benchmarking
      const performanceThresholds = {
        'City Detection at Scale': { minOpsPerSec: 1000, maxAvgTime: 10 },
        'Radius Search Performance': { minOpsPerSec: 100, maxAvgTime: 50 },
        'Concurrent Operations': { minOpsPerSec: 500, maxAvgTime: 20 },
        'Event Service Processing': { minOpsPerSec: 10, maxAvgTime: 100 },
        'Dataset Operations': { minOpsPerSec: 1000, maxAvgTime: 5 },
        'Distance Calculations': { minOpsPerSec: 10000, maxAvgTime: 1 }
      };

      benchmarkResults.forEach(result => {
        const threshold = performanceThresholds[result.testName];
        if (threshold) {
          const avgTimePerOp = result.duration / result.operations;
          
          expect(result.opsPerSecond).toBeGreaterThanOrEqual(threshold.minOpsPerSec);
          expect(avgTimePerOp).toBeLessThanOrEqual(threshold.maxAvgTime);
          
          console.log(`✅ ${result.testName}: Performance within acceptable bounds`);
        }
      });
    });

    it('should generate performance baseline for future comparisons', () => {
      const baseline = {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        results: benchmarkResults.map(r => ({
          testName: r.testName,
          opsPerSecond: r.opsPerSecond,
          avgDurationMs: r.duration / r.operations
        }))
      };

      // In a real scenario, this would be saved to a file or database
      console.log('\n📋 Performance Baseline Generated:');
      console.log(JSON.stringify(baseline, null, 2));

      expect(baseline.results.length).toBeGreaterThan(0);
    });
  });
});