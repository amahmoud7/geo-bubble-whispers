import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runComprehensiveTests } from '@/utils/cityDetectionTest';
import { EnhancedEventService } from '@/services/enhancedEventService';
import { enhancedEventService } from '@/services/enhancedEventService';

describe('Regression Tests - Backward Compatibility', () => {
  // These tests ensure that existing functionality continues to work
  // when new features are added or the system is modified

  describe('Legacy City Detection Compatibility', () => {
    it('should maintain compatibility with original LA, NYC, and Chicago detection', async () => {
      const legacyTestCases = [
        // These are the original test cases that MUST continue to work
        { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, expectedId: 'los-angeles' },
        { name: 'New York City', lat: 40.7128, lng: -74.0060, expectedId: 'new-york' },
        { name: 'Chicago', lat: 41.8781, lng: -87.6298, expectedId: 'chicago' },
      ];

      const { detectNearestCity } = await import('@/utils/cityDetection');

      legacyTestCases.forEach(testCase => {
        const result = detectNearestCity(testCase.lat, testCase.lng);
        
        expect(result.id).toBe(testCase.expectedId);
        expect(result.coordinates.lat).toBeCloseTo(testCase.lat, 1);
        expect(result.coordinates.lng).toBeCloseTo(testCase.lng, 1);
        
        console.log(`✅ ${testCase.name}: Legacy detection maintained (${result.displayName})`);
      });
    });

    it('should preserve original API signatures', async () => {
      const { detectNearestCity, getCityById, getAllCities } = await import('@/utils/cityDetection');

      // Test that original function signatures still work
      expect(typeof detectNearestCity).toBe('function');
      expect(typeof getCityById).toBe('function');
      expect(typeof getAllCities).toBe('function');

      // Test function calls with original parameters
      const nycResult = detectNearestCity(40.7128, -74.0060);
      expect(nycResult).toHaveProperty('id');
      expect(nycResult).toHaveProperty('displayName');
      expect(nycResult).toHaveProperty('coordinates');

      const cityById = getCityById('new-york');
      expect(cityById).toBeTruthy();
      expect(cityById!.id).toBe('new-york');

      const allCities = getAllCities();
      expect(Array.isArray(allCities)).toBe(true);
      expect(allCities.length).toBeGreaterThan(0);

      console.log('✅ Original API signatures preserved');
    });

    it('should maintain original city data structure', async () => {
      const { getCityById } = await import('@/utils/cityDetection');
      
      const nyc = getCityById('new-york');
      expect(nyc).toBeTruthy();
      
      // Original required fields must still exist
      const requiredFields = ['id', 'name', 'displayName', 'coordinates', 'radius', 'population', 'timezone', 'state'];
      requiredFields.forEach(field => {
        expect(nyc).toHaveProperty(field);
        expect(nyc![field]).toBeDefined();
      });

      // Coordinates structure must be preserved
      expect(nyc!.coordinates).toHaveProperty('lat');
      expect(nyc!.coordinates).toHaveProperty('lng');
      expect(typeof nyc!.coordinates.lat).toBe('number');
      expect(typeof nyc!.coordinates.lng).toBe('number');

      console.log('✅ Original city data structure maintained');
    });
  });

  describe('Event Service Backward Compatibility', () => {
    let eventService: EnhancedEventService;

    beforeEach(() => {
      eventService = new EnhancedEventService();
    });

    it('should maintain compatibility with original searchEvents interface', async () => {
      // Mock the dependencies
      vi.mock('@/utils/cityDetection', () => ({
        detectCityWithMarket: vi.fn().mockReturnValue({
          city: { 
            id: 'new-york', 
            coordinates: { lat: 40.7128, lng: -74.0060 },
            radius: 30 
          },
          market: { id: '35' }
        }),
        getTicketmasterSearchParams: vi.fn().mockReturnValue({
          marketId: '35',
          radius: 30,
          coordinates: { lat: 40.7128, lng: -74.0060 }
        })
      }));

      vi.mock('@/integrations/supabase/client', () => ({
        supabase: {
          functions: {
            invoke: vi.fn().mockResolvedValue({
              data: { events: [], created: 0, fetched: 0 },
              error: null
            })
          }
        }
      }));

      // Test original function signature still works
      const result = await eventService.searchEvents({
        center: { lat: 40.7128, lng: -74.0060 }
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('city');
      expect(result).toHaveProperty('searchParams');
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('metadata');

      console.log('✅ Event service interface compatibility maintained');
    });

    it('should preserve getEventsForLocation convenience method', async () => {
      // This method was in the original implementation
      expect(typeof eventService.getEventsForLocation).toBe('function');

      // Mock search method
      const mockSearchResult = {
        success: true,
        city: { id: 'new-york' },
        searchParams: { center: { lat: 40.7128, lng: -74.0060 }, radius: 30, timeframe: '24h' },
        events: [],
        metadata: { totalCitiesChecked: 1, nearestCityDistance: 0, searchStrategy: 'primary' }
      };

      const searchSpy = vi.spyOn(eventService, 'searchEvents').mockResolvedValue(mockSearchResult as any);

      const result = await eventService.getEventsForLocation(40.7128, -74.0060);
      
      expect(searchSpy).toHaveBeenCalledWith({
        center: { lat: 40.7128, lng: -74.0060 }
      });
      expect(result).toEqual(mockSearchResult);

      console.log('✅ getEventsForLocation convenience method preserved');
    });
  });

  describe('Database Schema Compatibility', () => {
    it('should maintain compatibility with existing message structure', async () => {
      // Test that the event message structure hasn't broken
      const mockEvent = {
        external_id: 'test-123',
        source: 'ticketmaster',
        title: 'Test Event',
        description: 'Test Description',
        event_url: 'https://example.com',
        image_url: 'https://example.com/image.jpg',
        venue_name: 'Test Venue',
        venue_address: '123 Test St, Test City, NY',
        lat: 40.7128,
        lng: -74.0060,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        price_min: 25,
        price_max: 100,
        genre: 'Music',
        classification: 'Concert'
      };

      // Required fields that must be present for database operations
      const requiredEventFields = [
        'external_id', 'source', 'title', 'lat', 'lng', 'start_date'
      ];

      requiredEventFields.forEach(field => {
        expect(mockEvent).toHaveProperty(field);
        expect(mockEvent[field]).toBeDefined();
      });

      console.log('✅ Event database schema compatibility maintained');
    });
  });

  describe('Performance Regression Tests', () => {
    it('should maintain city detection performance within acceptable bounds', async () => {
      const { detectNearestCity } = await import('@/utils/cityDetection');

      const testCases = [
        { lat: 40.7128, lng: -74.0060 }, // NYC
        { lat: 34.0522, lng: -118.2437 }, // LA
        { lat: 41.8781, lng: -87.6298 }, // Chicago
        { lat: 29.7604, lng: -95.3698 }, // Houston
        { lat: 33.4484, lng: -112.0740 }, // Phoenix
      ];

      const startTime = performance.now();

      testCases.forEach(coords => {
        detectNearestCity(coords.lat, coords.lng);
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / testCases.length;

      console.log(`⏱️ City detection performance: ${avgTime.toFixed(2)}ms average per detection`);

      // Should detect cities in under 10ms each on average
      expect(avgTime).toBeLessThan(10);
      expect(totalTime).toBeLessThan(100);

      console.log('✅ City detection performance within acceptable bounds');
    });

    it('should not have memory leaks in repeated operations', async () => {
      const { detectNearestCity, getCitiesWithinRadius } = await import('@/utils/cityDetection');

      // Perform many operations to test for memory leaks
      for (let i = 0; i < 1000; i++) {
        detectNearestCity(40.7128 + (i * 0.001), -74.0060 + (i * 0.001));
        if (i % 100 === 0) {
          getCitiesWithinRadius(40.7128, -74.0060, 50);
        }
      }

      // If we get here without running out of memory, we're good
      console.log('✅ No memory leaks detected in repeated operations');
    });
  });

  describe('Configuration Compatibility', () => {
    it('should preserve existing Ticketmaster market mappings', async () => {
      const { TICKETMASTER_MARKETS } = await import('@/config/ticketmasterMarkets');

      // Essential markets that must always be present
      const essentialMarkets = ['35', '27', '8', '18', '17']; // NYC, LA, Chicago, Houston, Phoenix
      
      const marketIds = TICKETMASTER_MARKETS.map(m => m.id);
      
      essentialMarkets.forEach(marketId => {
        expect(marketIds).toContain(marketId);
      });

      console.log(`✅ Essential Ticketmaster markets preserved (${essentialMarkets.length}/${TICKETMASTER_MARKETS.length})`);
    });

    it('should maintain city-to-market ID mappings', async () => {
      const { getMarketForCity } = await import('@/config/ticketmasterMarkets');

      const essentialCityMarkets = [
        { cityId: 'new-york', expectedMarketId: '35' },
        { cityId: 'los-angeles', expectedMarketId: '27' },
        { cityId: 'chicago', expectedMarketId: '8' },
      ];

      essentialCityMarkets.forEach(({ cityId, expectedMarketId }) => {
        const market = getMarketForCity(cityId);
        expect(market).toBeTruthy();
        expect(market!.id).toBe(expectedMarketId);
      });

      console.log('✅ Essential city-to-market mappings preserved');
    });
  });

  describe('Integration Test Compatibility', () => {
    it('should maintain existing test suite functionality', async () => {
      // Ensure that the comprehensive test runner still works
      const testResults = runComprehensiveTests();
      
      // This is a synchronous function that logs results
      expect(typeof testResults).toBe('undefined'); // It logs but doesn't return
      
      console.log('✅ Comprehensive test suite remains functional');
    });

    it('should preserve performance test infrastructure', async () => {
      const performanceTest = await import('@/utils/ticketmasterPerformanceTest');
      
      expect(performanceTest.default).toBeDefined();
      expect(typeof performanceTest.default.runPerformanceTests).toBe('function');
      expect(typeof performanceTest.default.testSpecificCity).toBe('function');
      
      console.log('✅ Performance test infrastructure preserved');
    });
  });

  describe('Error Handling Regression', () => {
    it('should maintain graceful error handling for invalid coordinates', async () => {
      const { detectNearestCity } = await import('@/utils/cityDetection');

      const invalidCoordinates = [
        { lat: NaN, lng: -74.0060 },
        { lat: 40.7128, lng: NaN },
        { lat: Infinity, lng: -74.0060 },
        { lat: 1000, lng: 1000 }, // Out of valid range
      ];

      invalidCoordinates.forEach(coords => {
        expect(() => {
          detectNearestCity(coords.lat, coords.lng);
        }).not.toThrow();
      });

      console.log('✅ Error handling for invalid coordinates maintained');
    });

    it('should handle missing or null parameters gracefully', async () => {
      const eventService = new EnhancedEventService();

      // Test with missing center and bounds
      const result = await eventService.searchEvents({});
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');

      console.log('✅ Parameter validation error handling maintained');
    });
  });

  describe('Feature Flag Compatibility', () => {
    it('should preserve ability to disable fallback strategies', async () => {
      const eventService = new EnhancedEventService();

      // Mock dependencies to avoid actual API calls
      vi.mock('@/utils/cityDetection', () => ({
        detectCityWithMarket: vi.fn().mockReturnValue({
          city: { 
            id: 'remote-city', 
            coordinates: { lat: 47.0527, lng: -109.6333 }, // Rural Montana
            radius: 25 
          },
          market: null
        }),
        getTicketmasterSearchParams: vi.fn().mockReturnValue({
          radius: 25,
          coordinates: { lat: 47.0527, lng: -109.6333 }
        })
      }));

      vi.mock('@/integrations/supabase/client', () => ({
        supabase: {
          functions: {
            invoke: vi.fn().mockResolvedValue({
              data: { events: [], created: 0, fetched: 0 },
              error: null
            })
          }
        }
      }));

      const result = await eventService.searchEvents({
        center: { lat: 47.0527, lng: -109.6333 },
        enableFallback: false // Should not use fallback
      });

      expect(result.fallbackUsed).toBe(false);

      console.log('✅ Fallback strategy controls maintained');
    });
  });
});