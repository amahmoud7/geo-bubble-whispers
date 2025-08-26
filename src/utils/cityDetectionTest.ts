// Test suite for expanded city detection coverage
// Validates nationwide support and intelligent fallback systems

import { 
  detectNearestCity, 
  detectCityWithMarket,
  getTicketmasterSearchParams,
  getCitiesWithinRadius,
  getOptimalSearchRadius,
  isWithinEventRadius,
  US_CITIES,
  getAllCities,
  getCitiesByState,
  getMajorMetros
} from './cityDetection';

// Test coordinates for various US locations
const TEST_LOCATIONS = [
  // Major cities - should detect exact matches
  { name: 'Times Square, NYC', lat: 40.7580, lng: -73.9855, expectedCity: 'new-york' },
  { name: 'Hollywood, LA', lat: 34.0928, lng: -118.3287, expectedCity: 'los-angeles' },
  { name: 'Downtown Chicago', lat: 41.8781, lng: -87.6298, expectedCity: 'chicago' },
  { name: 'Downtown Houston', lat: 29.7604, lng: -95.3698, expectedCity: 'houston' },
  { name: 'Phoenix Downtown', lat: 33.4484, lng: -112.0740, expectedCity: 'phoenix' },

  // Mid-sized cities - should detect from expanded database
  { name: 'Downtown Austin', lat: 30.2672, lng: -97.7431, expectedCity: 'austin' },
  { name: 'Downtown Nashville', lat: 36.1627, lng: -86.7816, expectedCity: 'nashville' },
  { name: 'Downtown Portland', lat: 45.5152, lng: -122.6784, expectedCity: 'portland' },
  { name: 'Downtown Denver', lat: 39.7392, lng: -104.9903, expectedCity: 'denver' },
  { name: 'Downtown Atlanta', lat: 33.7490, lng: -84.3880, expectedCity: 'atlanta' },

  // Smaller cities - should be detected with fallback
  { name: 'Boise, ID', lat: 43.6150, lng: -116.2023, expectedCity: 'boise' },
  { name: 'Des Moines, IA', lat: 41.5868, lng: -93.6250, expectedCity: 'des-moines' },
  { name: 'Albuquerque, NM', lat: 35.0844, lng: -106.6504, expectedCity: 'albuquerque' },
  { name: 'Anchorage, AK', lat: 61.2181, lng: -149.9003, expectedCity: 'anchorage' },
  { name: 'Honolulu, HI', lat: 21.3099, lng: -157.8581, expectedCity: 'honolulu' },

  // Rural/suburban areas - should find nearest major city
  { name: 'Suburban NYC (Westchester)', lat: 41.0534, lng: -73.5387, expectedNearby: 'new-york' },
  { name: 'Silicon Valley (Palo Alto)', lat: 37.4419, lng: -122.1430, expectedNearby: 'san-jose' },
  { name: 'Orange County, CA', lat: 33.7175, lng: -117.8311, expectedNearby: 'los-angeles' },
  { name: 'North Dallas Suburbs', lat: 33.0198, lng: -96.6989, expectedNearby: 'dallas' },

  // Edge cases - remote locations
  { name: 'Rural Montana', lat: 47.0527, lng: -109.6333, expectedFallback: true },
  { name: 'Rural Nevada', lat: 39.1638, lng: -117.2694, expectedFallback: true },
  { name: 'Rural Wyoming', lat: 43.0759, lng: -107.2903, expectedFallback: true },
];

export function runCityDetectionTests(): {
  passed: number;
  failed: number;
  total: number;
  details: Array<{
    location: string;
    passed: boolean;
    detected: string;
    expected?: string;
    distance: number;
    hasMarket: boolean;
    message: string;
  }>;
} {
  console.log('🧪 Starting City Detection Test Suite...');
  console.log(`📊 Testing with ${US_CITIES.length} cities in database`);
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
    details: [] as any[]
  };

  for (const testLocation of TEST_LOCATIONS) {
    const { name, lat, lng, expectedCity, expectedNearby, expectedFallback } = testLocation;
    
    try {
      // Test basic city detection
      const detectedCity = detectNearestCity(lat, lng);
      const distance = calculateTestDistance(lat, lng, detectedCity.coordinates.lat, detectedCity.coordinates.lng);
      
      // Test market integration
      const { city: cityWithMarket, market } = detectCityWithMarket(lat, lng);
      const hasMarket = !!market;
      
      // Test search parameters
      const searchParams = getTicketmasterSearchParams(detectedCity);
      
      // Determine if test passed
      let passed = false;
      let message = '';
      
      if (expectedCity) {
        passed = detectedCity.id === expectedCity;
        message = passed 
          ? `✅ Exact match: ${detectedCity.displayName}`
          : `❌ Expected ${expectedCity}, got ${detectedCity.id}`;
      } else if (expectedNearby) {
        const nearbyDistance = 50; // miles
        passed = distance <= nearbyDistance && (detectedCity.id === expectedNearby || distance <= 30);
        message = passed 
          ? `✅ Nearby match: ${detectedCity.displayName} (${distance.toFixed(1)}mi)`
          : `❌ Expected near ${expectedNearby}, got ${detectedCity.id} at ${distance.toFixed(1)}mi`;
      } else if (expectedFallback) {
        passed = distance <= 200; // Should find something within 200 miles
        message = passed 
          ? `✅ Fallback success: ${detectedCity.displayName} (${distance.toFixed(1)}mi)`
          : `❌ Fallback failed: ${detectedCity.id} too far (${distance.toFixed(1)}mi)`;
      }

      results.details.push({
        location: name,
        passed,
        detected: `${detectedCity.displayName} (${detectedCity.state})`,
        expected: expectedCity || expectedNearby,
        distance: Math.round(distance),
        hasMarket,
        message: `${message}${hasMarket ? ' [TM Market]' : ''}`
      });

      if (passed) results.passed++;
      else results.failed++;
      results.total++;

    } catch (error) {
      results.details.push({
        location: name,
        passed: false,
        detected: 'ERROR',
        distance: 0,
        hasMarket: false,
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      results.failed++;
      results.total++;
    }
  }

  // Additional coverage tests
  testCoverageMetrics(results);

  return results;
}

function testCoverageMetrics(results: any) {
  console.log('📈 Testing Coverage Metrics...');
  
  // Test state coverage
  const statesCovered = new Set(US_CITIES.map(city => city.state)).size;
  console.log(`🗺️ States covered: ${statesCovered}/50`);
  
  // Test population coverage
  const majorMetros = getMajorMetros(20);
  console.log(`🏙️ Major metros (400k+): ${majorMetros.length}`);
  
  // Test market integration
  const citiesWithMarkets = US_CITIES.filter(city => city.ticketmasterMarketId).length;
  console.log(`🎫 Cities with TM markets: ${citiesWithMarkets}/${US_CITIES.length}`);
  
  // Test radius coverage
  const avgRadius = US_CITIES.reduce((sum, city) => sum + city.radius, 0) / US_CITIES.length;
  console.log(`📏 Average search radius: ${avgRadius.toFixed(1)} miles`);
  
  results.metadata = {
    totalCities: US_CITIES.length,
    statesCovered,
    majorMetros: majorMetros.length,
    citiesWithMarkets,
    avgRadius: Math.round(avgRadius)
  };
}

// Test specific functionality
export function testEventRadiusFunction(): boolean {
  console.log('🎯 Testing isWithinEventRadius function...');
  
  // Should return true for major cities
  const nycTest = isWithinEventRadius(40.7128, -74.0060, 100);
  const laTest = isWithinEventRadius(34.0522, -118.2437, 100);
  const chicagoTest = isWithinEventRadius(41.8781, -87.6298, 100);
  
  // Should return false for very remote locations with small radius
  const remoteTest = isWithinEventRadius(45.0, -110.0, 25);
  
  const passed = nycTest && laTest && chicagoTest && !remoteTest;
  console.log(`Event radius test: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return passed;
}

export function testOptimalSearchRadius(): boolean {
  console.log('🔍 Testing getOptimalSearchRadius function...');
  
  // Test major city (should get larger radius)
  const nycRadius = getOptimalSearchRadius(40.7128, -74.0060);
  
  // Test smaller city (should get appropriate radius)  
  const boiseRadius = getOptimalSearchRadius(43.6150, -116.2023);
  
  // Test remote location (should get expanded radius)
  const remoteRadius = getOptimalSearchRadius(45.0, -110.0);
  
  const passed = nycRadius >= 30 && boiseRadius >= 25 && remoteRadius >= 35;
  console.log(`Optimal radius test: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  NYC: ${nycRadius}mi, Boise: ${boiseRadius}mi, Remote: ${remoteRadius}mi`);
  
  return passed;
}

function calculateTestDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Run comprehensive test suite
export function runComprehensiveTests(): void {
  console.log('🚀 Running Comprehensive City Detection Tests');
  console.log('='.repeat(60));
  
  const detectionResults = runCityDetectionTests();
  const radiusTest = testEventRadiusFunction();
  const optimalRadiusTest = testOptimalSearchRadius();
  
  console.log('\n📋 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`🎯 City Detection: ${detectionResults.passed}/${detectionResults.total} passed`);
  console.log(`📏 Event Radius: ${radiusTest ? 'PASSED' : 'FAILED'}`);
  console.log(`🔍 Optimal Radius: ${optimalRadiusTest ? 'PASSED' : 'FAILED'}`);
  
  console.log('\n📊 COVERAGE METRICS');
  console.log('='.repeat(60));
  if (detectionResults.metadata) {
    console.log(`🏙️ Total cities: ${detectionResults.metadata.totalCities}`);
    console.log(`🗺️ States covered: ${detectionResults.metadata.statesCovered}/50`);
    console.log(`🎫 Cities with TM markets: ${detectionResults.metadata.citiesWithMarkets}`);
    console.log(`📏 Average search radius: ${detectionResults.metadata.avgRadius} miles`);
  }
  
  const overallSuccess = detectionResults.passed === detectionResults.total && radiusTest && optimalRadiusTest;
  console.log(`\n🎉 OVERALL: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!overallSuccess) {
    console.log('\n❌ FAILED TESTS:');
    detectionResults.details
      .filter(detail => !detail.passed)
      .forEach(detail => console.log(`  - ${detail.location}: ${detail.message}`));
  }
}