import { describe, it, expect, beforeAll } from 'vitest';
import { 
  detectNearestCity, 
  getCitiesWithinRadius,
  getCitiesByState,
  getMajorMetros,
  TOP_US_CITIES,
  EXPANDED_US_CITIES
} from '@/utils/cityDetection';

describe('Geographic Coverage Tests', () => {
  // Test coordinates for all major US metropolitan areas
  const MAJOR_METRO_COORDINATES = [
    // Top 10 Metropolitan Areas by Population
    { name: 'New York-Newark-Jersey City', lat: 40.7128, lng: -74.0060, expectedCity: 'new-york' },
    { name: 'Los Angeles-Long Beach-Anaheim', lat: 34.0522, lng: -118.2437, expectedCity: 'los-angeles' },
    { name: 'Chicago-Naperville-Elgin', lat: 41.8781, lng: -87.6298, expectedCity: 'chicago' },
    { name: 'Dallas-Fort Worth-Arlington', lat: 32.7767, lng: -96.7970, expectedCity: 'dallas' },
    { name: 'Houston-The Woodlands-Sugar Land', lat: 29.7604, lng: -95.3698, expectedCity: 'houston' },
    { name: 'Washington-Arlington-Alexandria', lat: 38.9072, lng: -77.0369, expectedCity: 'washington-dc' },
    { name: 'Miami-Fort Lauderdale-West Palm Beach', lat: 25.7617, lng: -80.1918, expectedCity: 'miami' },
    { name: 'Philadelphia-Camden-Wilmington', lat: 39.9526, lng: -75.1652, expectedCity: 'philadelphia' },
    { name: 'Atlanta-Sandy Springs-Roswell', lat: 33.7490, lng: -84.3880, expectedCity: 'atlanta' },
    { name: 'Phoenix-Mesa-Scottsdale', lat: 33.4484, lng: -112.0740, expectedCity: 'phoenix' },
    
    // Additional Major Metros (Top 20)
    { name: 'Boston-Cambridge-Newton', lat: 42.3601, lng: -71.0589, expectedCity: 'boston' },
    { name: 'San Francisco-Oakland-Hayward', lat: 37.7749, lng: -122.4194, expectedCity: 'san-francisco' },
    { name: 'Detroit-Warren-Dearborn', lat: 42.3314, lng: -83.0458, expectedCity: 'detroit' },
    { name: 'Seattle-Tacoma-Bellevue', lat: 47.6062, lng: -122.3321, expectedCity: 'seattle' },
    { name: 'Minneapolis-St. Paul-Bloomington', lat: 44.9778, lng: -93.2650, expectedCity: 'minneapolis' },
    { name: 'San Diego-Carlsbad', lat: 32.7157, lng: -117.1611, expectedCity: 'san-diego' },
    { name: 'Tampa-St. Petersburg-Clearwater', lat: 27.9506, lng: -82.4572, expectedCity: 'tampa' },
    { name: 'Denver-Aurora-Lakewood', lat: 39.7392, lng: -104.9903, expectedCity: 'denver' },
    { name: 'St. Louis', lat: 38.6270, lng: -90.1994, expectedCity: 'st-louis' },
    { name: 'Baltimore-Columbia-Towson', lat: 39.2904, lng: -76.6122, expectedCity: 'baltimore' },
    
    // State Capitals and Major Regional Centers
    { name: 'Austin-Round Rock', lat: 30.2672, lng: -97.7431, expectedNearby: ['austin', 'san-antonio'] },
    { name: 'Nashville-Davidson-Murfreesboro', lat: 36.1627, lng: -86.7816, expectedCity: 'nashville' },
    { name: 'San Antonio-New Braunfels', lat: 29.4241, lng: -98.4936, expectedCity: 'san-antonio' },
    { name: 'Las Vegas-Henderson-Paradise', lat: 36.1699, lng: -115.1398, expectedCity: 'las-vegas' },
    { name: 'Kansas City', lat: 39.0997, lng: -94.5786, expectedCity: 'kansas-city' },
    { name: 'Cleveland-Elyria', lat: 41.4993, lng: -81.6944, expectedCity: 'cleveland' },
    { name: 'Columbus', lat: 39.9612, lng: -82.9988, expectedCity: 'columbus' },
    { name: 'Indianapolis-Carmel-Anderson', lat: 39.7684, lng: -86.1581, expectedCity: 'indianapolis' },
    { name: 'San Jose-Sunnyvale-Santa Clara', lat: 37.3382, lng: -121.8863, expectedCity: 'san-jose' },
    { name: 'Charlotte-Concord-Gastonia', lat: 35.2271, lng: -80.8431, expectedCity: 'charlotte' },
    
    // Western States
    { name: 'Portland-Vancouver-Hillsboro', lat: 45.5152, lng: -122.6784, expectedCity: 'portland' },
    { name: 'Sacramento-Roseville-Arden-Arcade', lat: 38.5816, lng: -121.4944, expectedCity: 'sacramento' },
    { name: 'San Bernardino-Riverside-Ontario', lat: 34.1083, lng: -117.2898, expectedNearby: ['los-angeles'] },
    { name: 'Salt Lake City', lat: 40.7608, lng: -111.8910, expectedNearby: ['denver'] },
    { name: 'Boise City', lat: 43.6150, lng: -116.2023, expectedCity: 'boise' },
    
    // Southern States  
    { name: 'Orlando-Kissimmee-Sanford', lat: 28.5383, lng: -81.3792, expectedCity: 'orlando' },
    { name: 'Jacksonville', lat: 30.3322, lng: -81.6557, expectedCity: 'jacksonville' },
    { name: 'Memphis', lat: 35.1495, lng: -90.0490, expectedCity: 'memphis' },
    { name: 'New Orleans-Metairie', lat: 29.9511, lng: -90.0715, expectedCity: 'new-orleans' },
    { name: 'Louisville/Jefferson County', lat: 38.2527, lng: -85.7585, expectedCity: 'louisville' },
    { name: 'Richmond', lat: 37.5407, lng: -77.4360, expectedCity: 'richmond' },
    { name: 'Raleigh', lat: 35.7796, lng: -78.6382, expectedCity: 'raleigh' },
    { name: 'Birmingham-Hoover', lat: 33.5186, lng: -86.8104, expectedCity: 'birmingham' },
    
    // Mountain and Plains States
    { name: 'Albuquerque', lat: 35.0844, lng: -106.6504, expectedCity: 'albuquerque' },
    { name: 'Tucson', lat: 32.2226, lng: -110.9747, expectedCity: 'tucson' },
    { name: 'Fresno', lat: 36.7378, lng: -119.7871, expectedCity: 'fresno' },
    { name: 'Oklahoma City', lat: 35.4676, lng: -97.5164, expectedCity: 'oklahoma-city' },
    { name: 'Omaha-Council Bluffs', lat: 41.2565, lng: -95.9345, expectedCity: 'omaha' },
    { name: 'Wichita', lat: 37.6872, lng: -97.3301, expectedCity: 'wichita' },
    { name: 'Des Moines-West Des Moines', lat: 41.5868, lng: -93.6250, expectedCity: 'des-moines' },
    
    // Special Cases - Alaska and Hawaii
    { name: 'Anchorage', lat: 61.2181, lng: -149.9003, expectedCity: 'anchorage' },
    { name: 'Honolulu', lat: 21.3099, lng: -157.8581, expectedCity: 'honolulu' },
  ];

  describe('Major Metropolitan Area Coverage', () => {
    it('should detect correct cities for all major metro areas', () => {
      const results = MAJOR_METRO_COORDINATES.map(metro => {
        const detected = detectNearestCity(metro.lat, metro.lng);
        const passed = metro.expectedCity 
          ? detected.id === metro.expectedCity
          : metro.expectedNearby 
          ? metro.expectedNearby.includes(detected.id)
          : true;

        return {
          metro: metro.name,
          expected: metro.expectedCity || metro.expectedNearby,
          detected: detected.id,
          displayName: detected.displayName,
          passed,
          coordinates: `${metro.lat}, ${metro.lng}`
        };
      });

      const failed = results.filter(r => !r.passed);
      const successRate = (results.length - failed.length) / results.length * 100;

      console.log(`\n📊 Metropolitan Coverage Results:`);
      console.log(`✅ Success Rate: ${successRate.toFixed(1)}% (${results.length - failed.length}/${results.length})`);
      
      if (failed.length > 0) {
        console.log(`❌ Failed Detections:`);
        failed.forEach(fail => {
          console.log(`  - ${fail.metro}: expected ${fail.expected}, got ${fail.detected} (${fail.displayName})`);
        });
      }

      // Expect at least 85% success rate for major metros
      expect(successRate).toBeGreaterThanOrEqual(85);
    });

    it('should provide reasonable coverage radius for all metros', () => {
      MAJOR_METRO_COORDINATES.forEach(metro => {
        const nearbyCities = getCitiesWithinRadius(metro.lat, metro.lng, 100);
        expect(nearbyCities.length).toBeGreaterThan(0);
      });
    });
  });

  describe('State Coverage Analysis', () => {
    // All 50 US states + DC
    const ALL_STATES = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
    ];

    it('should have city coverage for major states', () => {
      const stateCoverage = ALL_STATES.map(state => {
        const cities = getCitiesByState(state);
        return {
          state,
          cityCount: cities.length,
          cities: cities.map(c => c.displayName)
        };
      });

      const majorStates = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI'];
      const majorStateCoverage = stateCoverage.filter(sc => majorStates.includes(sc.state));

      console.log(`\n🗺️ State Coverage Analysis:`);
      majorStateCoverage.forEach(sc => {
        console.log(`  ${sc.state}: ${sc.cityCount} cities (${sc.cities.join(', ')})`);
      });

      // Major states should have multiple cities
      majorStateCoverage.forEach(sc => {
        if (sc.state === 'CA' || sc.state === 'TX' || sc.state === 'FL') {
          expect(sc.cityCount).toBeGreaterThanOrEqual(3);
        } else {
          expect(sc.cityCount).toBeGreaterThanOrEqual(1);
        }
      });
    });

    it('should calculate total geographic coverage', () => {
      const statesWithCities = ALL_STATES.filter(state => 
        getCitiesByState(state).length > 0
      ).length;
      
      const coveragePercentage = (statesWithCities / ALL_STATES.length) * 100;
      
      console.log(`\n🌍 Overall Coverage: ${coveragePercentage.toFixed(1)}% (${statesWithCities}/${ALL_STATES.length} states)`);
      
      // Should cover at least 60% of states directly
      expect(coveragePercentage).toBeGreaterThanOrEqual(60);
    });
  });

  describe('Population-Based Coverage', () => {
    it('should cover all major population centers', () => {
      const majorMetros = getMajorMetros(500000); // 500k+ population cities
      console.log(`\n👥 Major Metro Analysis: ${majorMetros.length} cities with 500k+ population`);
      
      majorMetros.forEach(city => {
        console.log(`  ${city.displayName} (${city.state}): ${city.population.toLocaleString()}`);
      });

      // Should have significant representation of large cities
      expect(majorMetros.length).toBeGreaterThanOrEqual(15);
      
      // Top 3 should be NYC, LA, Chicago
      expect(majorMetros[0].id).toBe('new-york');
      expect(majorMetros[1].id).toBe('los-angeles'); 
      expect(majorMetros[2].id).toBe('chicago');
    });

    it('should provide adequate coverage for medium-sized cities', () => {
      const mediumMetros = getMajorMetros(200000).filter(city => city.population < 500000);
      console.log(`\n🏙️ Medium Cities: ${mediumMetros.length} cities (200k-500k population)`);
      
      expect(mediumMetros.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Geographic Distribution Analysis', () => {
    it('should have balanced regional coverage', () => {
      const regions = {
        'Northeast': ['NY', 'MA', 'PA', 'NJ', 'CT', 'RI', 'NH', 'VT', 'ME', 'MD', 'DC'],
        'Southeast': ['FL', 'GA', 'NC', 'SC', 'VA', 'WV', 'KY', 'TN', 'AL', 'MS', 'AR', 'LA'],
        'Midwest': ['IL', 'IN', 'MI', 'OH', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
        'Southwest': ['TX', 'OK', 'NM', 'AZ'],
        'West': ['CA', 'NV', 'UT', 'CO', 'WY', 'MT', 'ID', 'WA', 'OR', 'AK', 'HI']
      };

      const regionalCoverage = Object.entries(regions).map(([region, states]) => {
        const cities = EXPANDED_US_CITIES.filter(city => states.includes(city.state));
        return {
          region,
          cityCount: cities.length,
          states: states.length,
          citiesPerState: (cities.length / states.length).toFixed(2)
        };
      });

      console.log(`\n🌎 Regional Distribution:`);
      regionalCoverage.forEach(rc => {
        console.log(`  ${rc.region}: ${rc.cityCount} cities across ${rc.states} states (${rc.citiesPerState} cities/state)`);
      });

      // Each region should have reasonable representation
      regionalCoverage.forEach(rc => {
        expect(rc.cityCount).toBeGreaterThan(0);
        if (rc.region === 'West' || rc.region === 'Southeast') {
          expect(rc.cityCount).toBeGreaterThanOrEqual(8);
        }
      });
    });
  });

  describe('Edge Case Coverage', () => {
    const EDGE_CASE_LOCATIONS = [
      // Border cities
      { name: 'San Diego (Mexico border)', lat: 32.7157, lng: -117.1611 },
      { name: 'Seattle (Canada border)', lat: 47.6062, lng: -122.3321 },
      { name: 'Detroit (Canada border)', lat: 42.3314, lng: -83.0458 },
      { name: 'El Paso (Mexico border)', lat: 31.7619, lng: -106.4850 },
      
      // Remote locations
      { name: 'Anchorage (Alaska)', lat: 61.2181, lng: -149.9003 },
      { name: 'Honolulu (Hawaii)', lat: 21.3099, lng: -157.8581 },
      { name: 'Juneau (Alaska)', lat: 58.3019, lng: -134.4197 },
      
      // Mountain regions
      { name: 'Denver (Mile High)', lat: 39.7392, lng: -104.9903 },
      { name: 'Salt Lake City (Mountains)', lat: 40.7608, lng: -111.8910 },
      { name: 'Cheyenne (High Plains)', lat: 41.1400, lng: -104.8197 },
      
      // Desert regions
      { name: 'Phoenix (Sonoran Desert)', lat: 33.4484, lng: -112.0740 },
      { name: 'Las Vegas (Mojave Desert)', lat: 36.1699, lng: -115.1398 },
      { name: 'Albuquerque (High Desert)', lat: 35.0844, lng: -106.6504 },
      
      // Coastal extremes
      { name: 'Key West (Southernmost)', lat: 24.5551, lng: -81.7800 },
      { name: 'Bellingham (Northern Coast)', lat: 48.7519, lng: -122.4787 },
      { name: 'Bangor (Northeastern)', lat: 44.8016, lng: -68.7712 },
    ];

    it('should handle edge case locations', () => {
      const results = EDGE_CASE_LOCATIONS.map(location => {
        try {
          const detected = detectNearestCity(location.lat, location.lng);
          const nearbyCities = getCitiesWithinRadius(location.lat, location.lng, 200);
          
          return {
            location: location.name,
            detected: detected.displayName,
            detectedId: detected.id,
            nearbyCount: nearbyCities.length,
            success: true
          };
        } catch (error) {
          return {
            location: location.name,
            error: error.message,
            success: false
          };
        }
      });

      const failed = results.filter(r => !r.success);
      const successRate = (results.length - failed.length) / results.length * 100;

      console.log(`\n🏔️ Edge Case Results:`);
      console.log(`✅ Success Rate: ${successRate.toFixed(1)}% (${results.length - failed.length}/${results.length})`);
      
      results.filter(r => r.success).forEach(result => {
        console.log(`  ${result.location}: ${result.detected} (${result.nearbyCount} cities within 200mi)`);
      });

      if (failed.length > 0) {
        console.log(`❌ Failed Locations:`);
        failed.forEach(fail => {
          console.log(`  - ${fail.location}: ${fail.error}`);
        });
      }

      // Should handle all edge cases without crashing
      expect(successRate).toBe(100);
    });
  });

  describe('Database Completeness', () => {
    beforeAll(() => {
      console.log(`\n📋 Database Statistics:`);
      console.log(`  TOP_US_CITIES: ${TOP_US_CITIES.length} cities`);
      console.log(`  EXPANDED_US_CITIES: ${EXPANDED_US_CITIES.length} cities`);
    });

    it('should have comprehensive city database', () => {
      expect(TOP_US_CITIES.length).toBeGreaterThanOrEqual(15);
      expect(EXPANDED_US_CITIES.length).toBeGreaterThanOrEqual(50);
    });

    it('should have required fields for all cities', () => {
      const requiredFields = ['id', 'name', 'displayName', 'coordinates', 'radius', 'population', 'timezone', 'state'];
      
      EXPANDED_US_CITIES.forEach(city => {
        requiredFields.forEach(field => {
          expect(city).toHaveProperty(field);
          expect(city[field]).toBeDefined();
          
          if (field === 'coordinates') {
            expect(city.coordinates).toHaveProperty('lat');
            expect(city.coordinates).toHaveProperty('lng');
            expect(typeof city.coordinates.lat).toBe('number');
            expect(typeof city.coordinates.lng).toBe('number');
          }
        });
      });
    });

    it('should have unique city IDs', () => {
      const ids = EXPANDED_US_CITIES.map(city => city.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have reasonable coordinate ranges', () => {
      EXPANDED_US_CITIES.forEach(city => {
        // US latitude range: roughly 24° to 71° N
        expect(city.coordinates.lat).toBeGreaterThanOrEqual(20);
        expect(city.coordinates.lat).toBeLessThanOrEqual(72);
        
        // US longitude range: roughly 172° W to 66° W  
        expect(city.coordinates.lng).toBeGreaterThanOrEqual(-180);
        expect(city.coordinates.lng).toBeLessThanOrEqual(-60);
      });
    });
  });
});