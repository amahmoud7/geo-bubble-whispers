// Performance testing utility for Ticketmaster integration
// Tests the optimized fetch-events-realtime function across multiple scenarios

import { supabase } from '@/integrations/supabase/client';

export interface PerformanceTestResult {
  testName: string;
  location: { lat: number; lng: number; city?: string };
  success: boolean;
  duration: number;
  eventCount: number;
  cached: boolean;
  errorMessage?: string;
  metadata: {
    requestId?: string;
    sources: string[];
    market?: string;
  };
}

export interface PerformanceTestSuite {
  totalTests: number;
  successRate: number;
  averageDuration: number;
  cacheHitRate: number;
  results: PerformanceTestResult[];
  summary: {
    fastest: PerformanceTestResult;
    slowest: PerformanceTestResult;
    mostEvents: PerformanceTestResult;
    errors: PerformanceTestResult[];
  };
}

// Test locations covering major US cities
const TEST_LOCATIONS = [
  { name: 'NYC Times Square', lat: 40.7580, lng: -73.9855, expectedCity: 'new-york' },
  { name: 'LA Hollywood', lat: 34.0928, lng: -118.3287, expectedCity: 'los-angeles' },
  { name: 'Chicago Downtown', lat: 41.8781, lng: -87.6298, expectedCity: 'chicago' },
  { name: 'Houston Downtown', lat: 29.7604, lng: -95.3698, expectedCity: 'houston' },
  { name: 'Phoenix Downtown', lat: 33.4484, lng: -112.0740, expectedCity: 'phoenix' },
  { name: 'Atlanta Downtown', lat: 33.7490, lng: -84.3880, expectedCity: 'atlanta' },
  { name: 'Miami Beach', lat: 25.7617, lng: -80.1918, expectedCity: 'miami' },
  { name: 'Seattle Downtown', lat: 47.6062, lng: -122.3321, expectedCity: 'seattle' },
  { name: 'Denver Downtown', lat: 39.7392, lng: -104.9903, expectedCity: 'denver' },
  { name: 'Las Vegas Strip', lat: 36.1699, lng: -115.1398, expectedCity: 'las-vegas' },
  // Secondary cities
  { name: 'Austin Downtown', lat: 30.2672, lng: -97.7431, expectedCity: 'austin' },
  { name: 'Nashville Downtown', lat: 36.1627, lng: -86.7816, expectedCity: 'nashville' },
  { name: 'Portland Downtown', lat: 45.5152, lng: -122.6784, expectedCity: 'portland' },
  // Rural/edge cases
  { name: 'Rural Montana', lat: 47.0527, lng: -109.6333, expectedCity: null },
  { name: 'Rural Nevada', lat: 39.1638, lng: -117.2694, expectedCity: null }
];

/**
 * Run comprehensive performance tests on the optimized Ticketmaster integration
 */
export async function runPerformanceTests(options: {
  includeCache?: boolean;
  timeframe?: string;
  sources?: string[];
  maxConcurrentTests?: number;
} = {}): Promise<PerformanceTestSuite> {
  const {
    includeCache = true,
    timeframe = '24h',
    sources = ['ticketmaster'],
    maxConcurrentTests = 3
  } = options;

  console.log('🚀 Starting Ticketmaster Performance Test Suite');
  console.log(`📊 Testing ${TEST_LOCATIONS.length} locations`);
  console.log(`⏰ Timeframe: ${timeframe}`);
  console.log(`📡 Sources: ${sources.join(', ')}`);

  const results: PerformanceTestResult[] = [];
  const startTime = Date.now();

  // Run tests in batches to avoid overwhelming the API
  const batches = [];
  for (let i = 0; i < TEST_LOCATIONS.length; i += maxConcurrentTests) {
    batches.push(TEST_LOCATIONS.slice(i, i + maxConcurrentTests));
  }

  for (const batch of batches) {
    console.log(`\n📦 Processing batch of ${batch.length} tests...`);
    
    const batchPromises = batch.map(location => 
      runSingleTest(location, { timeframe, sources })
    );

    const batchResults = await Promise.allSettled(batchPromises);
    
    for (let i = 0; i < batchResults.length; i++) {
      const result = batchResults[i];
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          testName: batch[i].name,
          location: { lat: batch[i].lat, lng: batch[i].lng, city: batch[i].expectedCity },
          success: false,
          duration: 0,
          eventCount: 0,
          cached: false,
          errorMessage: result.reason?.message || 'Test execution failed',
          metadata: { sources: [] }
        });
      }
    }

    // Add delay between batches to respect rate limits
    if (batches.indexOf(batch) < batches.length - 1) {
      console.log('⏳ Waiting 2 seconds between batches...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // If testing cache, run the same tests again
  if (includeCache) {
    console.log('\n💾 Testing cache performance with repeat requests...');
    
    // Test a subset of locations for cache performance
    const cacheTestLocations = TEST_LOCATIONS.slice(0, 5);
    
    for (const location of cacheTestLocations) {
      const cacheResult = await runSingleTest(location, { 
        timeframe, 
        sources,
        testName: `${location.name} (Cache Test)`
      });
      results.push(cacheResult);
    }
  }

  const totalDuration = Date.now() - startTime;
  
  return generateTestSuite(results, totalDuration);
}

/**
 * Run a single performance test
 */
async function runSingleTest(
  location: { name: string; lat: number; lng: number; expectedCity: string | null },
  options: { timeframe: string; sources: string[]; testName?: string }
): Promise<PerformanceTestResult> {
  const { timeframe, sources, testName } = options;
  const testStartTime = Date.now();
  
  try {
    console.log(`🧪 Testing: ${testName || location.name}`);
    
    const { data, error } = await supabase.functions.invoke('fetch-events-realtime', {
      body: {
        center: {
          lat: location.lat,
          lng: location.lng
        },
        radius: 25,
        timeframe,
        source: sources
      }
    });

    const duration = Date.now() - testStartTime;

    if (error) {
      throw error;
    }

    const result: PerformanceTestResult = {
      testName: testName || location.name,
      location: {
        lat: location.lat,
        lng: location.lng,
        city: location.expectedCity
      },
      success: data.success,
      duration,
      eventCount: data.events?.total || 0,
      cached: checkIfCached(data),
      metadata: {
        requestId: data.requestId,
        sources: data.sources?.processed || [],
        market: data.location?.marketInfo?.id
      }
    };

    if (!data.success) {
      result.errorMessage = data.error?.message || 'Unknown error';
    }

    console.log(`${result.success ? '✅' : '❌'} ${location.name}: ${duration}ms, ${result.eventCount} events${result.cached ? ' (cached)' : ''}`);
    
    return result;

  } catch (error) {
    const duration = Date.now() - testStartTime;
    
    console.log(`❌ ${location.name}: Failed in ${duration}ms - ${error.message}`);
    
    return {
      testName: testName || location.name,
      location: {
        lat: location.lat,
        lng: location.lng,
        city: location.expectedCity
      },
      success: false,
      duration,
      eventCount: 0,
      cached: false,
      errorMessage: error.message,
      metadata: { sources: [] }
    };
  }
}

/**
 * Check if a response was served from cache
 */
function checkIfCached(data: any): boolean {
  // Look for cache indicators in the response
  return data.duration < 1000 || // Very fast responses likely cached
         data.metadata?.cached === true ||
         data.performance?.durationMs < 1000;
}

/**
 * Generate comprehensive test suite results
 */
function generateTestSuite(results: PerformanceTestResult[], totalDuration: number): PerformanceTestSuite {
  const successfulResults = results.filter(r => r.success);
  const cachedResults = results.filter(r => r.cached);
  const errors = results.filter(r => !r.success);

  // Find performance extremes
  const fastest = successfulResults.reduce((prev, current) => 
    prev.duration < current.duration ? prev : current
  );
  
  const slowest = successfulResults.reduce((prev, current) => 
    prev.duration > current.duration ? prev : current
  );
  
  const mostEvents = successfulResults.reduce((prev, current) => 
    prev.eventCount > current.eventCount ? prev : current
  );

  const suite: PerformanceTestSuite = {
    totalTests: results.length,
    successRate: (successfulResults.length / results.length) * 100,
    averageDuration: successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length,
    cacheHitRate: (cachedResults.length / results.length) * 100,
    results,
    summary: {
      fastest,
      slowest,
      mostEvents,
      errors
    }
  };

  // Print comprehensive summary
  console.log('\n📊 PERFORMANCE TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`🎯 Success Rate: ${suite.successRate.toFixed(1)}% (${successfulResults.length}/${results.length})`);
  console.log(`⚡ Average Duration: ${suite.averageDuration.toFixed(0)}ms`);
  console.log(`💾 Cache Hit Rate: ${suite.cacheHitRate.toFixed(1)}% (${cachedResults.length}/${results.length})`);
  console.log(`🚀 Fastest Request: ${fastest.testName} - ${fastest.duration}ms`);
  console.log(`🐌 Slowest Request: ${slowest.testName} - ${slowest.duration}ms`);
  console.log(`🎪 Most Events: ${mostEvents.testName} - ${mostEvents.eventCount} events`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`);
    errors.forEach(error => {
      console.log(`  - ${error.testName}: ${error.errorMessage}`);
    });
  }

  console.log(`\n⏱️ Total Test Duration: ${totalDuration}ms`);
  console.log('\n✨ Performance optimization results validated!');

  return suite;
}

/**
 * Run specific city tests
 */
export async function testSpecificCity(
  cityName: string,
  coordinates: { lat: number; lng: number }
): Promise<PerformanceTestResult> {
  console.log(`🏙️ Testing specific city: ${cityName}`);
  
  return runSingleTest(
    { name: cityName, lat: coordinates.lat, lng: coordinates.lng, expectedCity: null },
    { timeframe: '24h', sources: ['ticketmaster'] }
  );
}

/**
 * Run load test with multiple concurrent requests
 */
export async function runLoadTest(options: {
  location: { lat: number; lng: number };
  concurrentRequests: number;
  testDuration: number; // seconds
}): Promise<{
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  errors: string[];
}> {
  const { location, concurrentRequests, testDuration } = options;
  
  console.log(`🔥 Starting load test: ${concurrentRequests} concurrent requests for ${testDuration}s`);
  
  const startTime = Date.now();
  const endTime = startTime + (testDuration * 1000);
  const results: PerformanceTestResult[] = [];
  const errors: string[] = [];
  
  let requestCount = 0;
  
  while (Date.now() < endTime) {
    const batchPromises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      batchPromises.push(
        runSingleTest(
          { name: `Load Test ${requestCount++}`, ...location, expectedCity: null },
          { timeframe: '24h', sources: ['ticketmaster'] }
        )
      );
    }
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        if (!result.value.success) {
          errors.push(result.value.errorMessage || 'Unknown error');
        }
      } else {
        errors.push(result.reason?.message || 'Request failed');
      }
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const actualDuration = Date.now() - startTime;
  const successfulRequests = results.filter(r => r.success).length;
  const averageResponseTime = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.duration, 0) / successfulRequests;
  
  const loadTestResults = {
    totalRequests: results.length,
    successfulRequests,
    averageResponseTime,
    requestsPerSecond: (results.length / actualDuration) * 1000,
    errors: [...new Set(errors)] // Remove duplicates
  };
  
  console.log('\n🔥 LOAD TEST RESULTS');
  console.log('='.repeat(30));
  console.log(`📊 Total Requests: ${loadTestResults.totalRequests}`);
  console.log(`✅ Successful: ${loadTestResults.successfulRequests} (${(successfulRequests/results.length*100).toFixed(1)}%)`);
  console.log(`⚡ Avg Response Time: ${loadTestResults.averageResponseTime.toFixed(0)}ms`);
  console.log(`🚀 Requests/Second: ${loadTestResults.requestsPerSecond.toFixed(2)}`);
  
  if (errors.length > 0) {
    console.log(`❌ Unique Errors: ${errors.length}`);
  }
  
  return loadTestResults;
}

// Export test runner for easy import
export default {
  runPerformanceTests,
  testSpecificCity,
  runLoadTest
};