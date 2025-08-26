import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';

describe('API Integration Tests', () => {
  // Test with real-like scenarios but using MSW to mock responses
  const MAJOR_CITIES = [
    { name: 'New York', lat: 40.7128, lng: -74.0060, marketId: '35' },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, marketId: '27' },
    { name: 'Chicago', lat: 41.8781, lng: -87.6298, marketId: '8' },
    { name: 'Houston', lat: 29.7604, lng: -95.3698, marketId: '18' },
    { name: 'Phoenix', lat: 33.4484, lng: -112.0740, marketId: '17' },
    { name: 'Philadelphia', lat: 39.9526, lng: -75.1652, marketId: '29' },
    { name: 'San Antonio', lat: 29.4241, lng: -98.4936, marketId: '59' },
    { name: 'San Diego', lat: 32.7157, lng: -117.1611, marketId: '37' },
    { name: 'Dallas', lat: 32.7767, lng: -96.7970, marketId: '11' },
    { name: 'San Jose', lat: 37.3382, lng: -121.8863, marketId: '41' },
    { name: 'Atlanta', lat: 33.7490, lng: -84.3880, marketId: '1' },
    { name: 'Miami', lat: 25.7617, lng: -80.1918, marketId: '21' },
    { name: 'Denver', lat: 39.7392, lng: -104.9903, marketId: '12' },
    { name: 'Seattle', lat: 47.6062, lng: -122.3321, marketId: '49' },
    { name: 'Las Vegas', lat: 36.1699, lng: -115.1398, marketId: '20' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ticketmaster API Integration', () => {
    it('should successfully fetch events for all major cities', async () => {
      const results = await Promise.allSettled(
        MAJOR_CITIES.map(async (city) => {
          const response = await fetch(
            `https://app.ticketmaster.com/discovery/v2/events.json?marketId=${city.marketId}&apikey=test-key`
          );
          
          expect(response.ok).toBe(true);
          const data = await response.json();
          
          return {
            city: city.name,
            success: true,
            eventCount: data._embedded?.events?.length || 0,
            hasEvents: (data._embedded?.events?.length || 0) > 0,
            marketId: city.marketId
          };
        })
      );

      const successfulResults = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failedResults = results.filter(r => r.status === 'rejected');

      console.log(`\n🎫 Ticketmaster API Results:`);
      console.log(`✅ Successful cities: ${successfulResults.length}/${MAJOR_CITIES.length}`);
      
      successfulResults.forEach(result => {
        console.log(`  ${result.city} (Market ${result.marketId}): ${result.eventCount} events`);
      });

      if (failedResults.length > 0) {
        console.log(`❌ Failed cities: ${failedResults.length}`);
        failedResults.forEach((result, index) => {
          console.log(`  ${MAJOR_CITIES[index].name}: ${result.reason}`);
        });
      }

      // Should succeed for most major cities
      expect(successfulResults.length).toBeGreaterThanOrEqual(MAJOR_CITIES.length * 0.9);
    });

    it('should handle geographic coordinate-based searches', async () => {
      const testCities = MAJOR_CITIES.slice(0, 5); // Test subset for performance

      const results = await Promise.allSettled(
        testCities.map(async (city) => {
          const response = await fetch(
            `https://app.ticketmaster.com/discovery/v2/events.json?latlong=${city.lat},${city.lng}&radius=25&unit=miles&apikey=test-key`
          );
          
          expect(response.ok).toBe(true);
          const data = await response.json();
          
          return {
            city: city.name,
            coordinates: `${city.lat},${city.lng}`,
            eventCount: data._embedded?.events?.length || 0,
            totalPages: data.page?.totalPages || 0
          };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      
      console.log(`\n📍 Geographic Search Results:`);
      successful.forEach(result => {
        console.log(`  ${result.city} (${result.coordinates}): ${result.eventCount} events, ${result.totalPages} pages`);
      });

      expect(successful.length).toBe(testCities.length);
    });

    it('should handle different timeframes correctly', async () => {
      const timeframes = ['24h', '48h', '7d'];
      const testCity = MAJOR_CITIES[0]; // NYC

      const results = await Promise.allSettled(
        timeframes.map(async (timeframe) => {
          const now = new Date();
          const endTime = new Date(now.getTime() + getTimeframeMs(timeframe));
          
          const response = await fetch(
            `https://app.ticketmaster.com/discovery/v2/events.json?marketId=${testCity.marketId}&startDateTime=${now.toISOString()}&endDateTime=${endTime.toISOString()}&apikey=test-key`
          );
          
          expect(response.ok).toBe(true);
          const data = await response.json();
          
          return {
            timeframe,
            eventCount: data._embedded?.events?.length || 0,
            dateRange: {
              start: now.toISOString(),
              end: endTime.toISOString()
            }
          };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      
      console.log(`\n⏰ Timeframe Results for ${testCity.name}:`);
      successful.forEach(result => {
        console.log(`  ${result.timeframe}: ${result.eventCount} events`);
      });

      expect(successful.length).toBe(timeframes.length);
      
      // Longer timeframes should generally have more or equal events
      if (successful.length >= 2) {
        const sorted = successful.sort((a, b) => getTimeframeMs(a.timeframe) - getTimeframeMs(b.timeframe));
        expect(sorted[sorted.length - 1].eventCount).toBeGreaterThanOrEqual(sorted[0].eventCount);
      }
    });

    it('should handle pagination correctly', async () => {
      // Mock a multi-page response
      server.use(
        http.get('https://app.ticketmaster.com/discovery/v2/events.json', ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get('page') || '0');
          
          if (page === 0) {
            return HttpResponse.json({
              _embedded: { events: Array(20).fill(null).map((_, i) => ({ id: `page0-event-${i}`, name: `Event ${i}` })) },
              page: { totalPages: 3, number: 0, size: 20 }
            });
          } else if (page === 1) {
            return HttpResponse.json({
              _embedded: { events: Array(20).fill(null).map((_, i) => ({ id: `page1-event-${i}`, name: `Event ${i + 20}` })) },
              page: { totalPages: 3, number: 1, size: 20 }
            });
          } else {
            return HttpResponse.json({
              _embedded: { events: Array(10).fill(null).map((_, i) => ({ id: `page2-event-${i}`, name: `Event ${i + 40}` })) },
              page: { totalPages: 3, number: 2, size: 10 }
            });
          }
        })
      );

      const allEvents = [];
      let currentPage = 0;
      let totalPages = 1;

      while (currentPage < totalPages && currentPage < 5) { // Safety limit
        const response = await fetch(
          `https://app.ticketmaster.com/discovery/v2/events.json?page=${currentPage}&marketId=35&apikey=test-key`
        );
        
        expect(response.ok).toBe(true);
        const data = await response.json();
        
        if (data._embedded?.events) {
          allEvents.push(...data._embedded.events);
        }
        
        totalPages = data.page?.totalPages || 1;
        currentPage++;
      }

      console.log(`\n📄 Pagination Test: Retrieved ${allEvents.length} events across ${currentPage} pages`);
      
      expect(allEvents.length).toBe(50); // 20 + 20 + 10
      expect(currentPage).toBe(3);
    });

    it('should handle rate limiting correctly', async () => {
      // Mock rate limit response
      server.use(
        http.get('https://app.ticketmaster.com/discovery/v2/events.json', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('test-error') === 'rate-limit') {
            return new HttpResponse(null, { 
              status: 429, 
              headers: { 'Retry-After': '60' }
            });
          }
          return HttpResponse.json({ _embedded: { events: [] }, page: { totalPages: 1 } });
        })
      );

      const response = await fetch(
        'https://app.ticketmaster.com/discovery/v2/events.json?test-error=rate-limit&apikey=test-key'
      );
      
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
      
      console.log(`\n⚠️ Rate Limiting: Correctly received 429 with Retry-After header`);
    });

    it('should handle server errors gracefully', async () => {
      // Mock server error
      server.use(
        http.get('https://app.ticketmaster.com/discovery/v2/events.json', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('test-error') === 'server-error') {
            return new HttpResponse(null, { status: 500 });
          }
          return HttpResponse.json({ _embedded: { events: [] }, page: { totalPages: 1 } });
        })
      );

      const response = await fetch(
        'https://app.ticketmaster.com/discovery/v2/events.json?test-error=server-error&apikey=test-key'
      );
      
      expect(response.status).toBe(500);
      console.log(`\n🚨 Error Handling: Correctly received 500 status`);
    });
  });

  describe('Supabase Function Integration', () => {
    it('should successfully call fetch-events function for major cities', async () => {
      const testCities = MAJOR_CITIES.slice(0, 3); // Test subset

      const results = await Promise.allSettled(
        testCities.map(async (city) => {
          const response = await fetch('https://test.supabase.co/functions/v1/fetch-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              center: { lat: city.lat, lng: city.lng },
              radius: 25,
              timeframe: '24h',
              source: ['ticketmaster']
            })
          });
          
          expect(response.ok).toBe(true);
          const data = await response.json();
          
          return {
            city: city.name,
            success: data.success,
            created: data.created || 0,
            fetched: data.fetched || 0
          };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      
      console.log(`\n🔄 Supabase Function Results:`);
      successful.forEach(result => {
        console.log(`  ${result.city}: ${result.success ? 'Success' : 'Failed'}, ${result.fetched} fetched, ${result.created} created`);
      });

      expect(successful.length).toBe(testCities.length);
      successful.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle real-time events function', async () => {
      const testCity = MAJOR_CITIES[0];

      const response = await fetch('https://test.supabase.co/functions/v1/fetch-events-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          center: { lat: testCity.lat, lng: testCity.lng },
          radius: 30,
          timeframe: '48h'
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.location).toBeDefined();
      expect(data.sources).toBeDefined();
      
      console.log(`\n⚡ Real-time Function: ${data.success ? 'Success' : 'Failed'}`);
      console.log(`  Detected City: ${data.location?.detectedCity || 'Unknown'}`);
      console.log(`  Market: ${data.location?.marketInfo?.id || 'None'}`);
      console.log(`  Events: ${data.events?.total || 0}`);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle network timeouts', async () => {
      // This test would timeout in real scenarios, but MSW will handle it
      server.use(
        http.get('https://app.ticketmaster.com/discovery/v2/events.json', async ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('test-error') === 'timeout') {
            // Simulate timeout by delaying indefinitely
            await new Promise(() => {}); // Never resolves
          }
          return HttpResponse.json({ _embedded: { events: [] } });
        })
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      try {
        await fetch(
          'https://app.ticketmaster.com/discovery/v2/events.json?test-error=timeout&apikey=test-key',
          { signal: controller.signal }
        );
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.name).toBe('AbortError');
        console.log(`\n⏱️ Timeout Handling: Correctly aborted after timeout`);
      } finally {
        clearTimeout(timeoutId);
      }
    });

    it('should handle malformed API responses', async () => {
      server.use(
        http.get('https://app.ticketmaster.com/discovery/v2/events.json', () => {
          return new HttpResponse('invalid json{', {
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );

      const response = await fetch(
        'https://app.ticketmaster.com/discovery/v2/events.json?apikey=test-key'
      );

      expect(response.ok).toBe(true);
      
      try {
        await response.json();
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        console.log(`\n🔧 Malformed JSON: Correctly caught parsing error`);
      }
    });

    it('should handle empty event responses', async () => {
      server.use(
        http.get('https://app.ticketmaster.com/discovery/v2/events.json', () => {
          return HttpResponse.json({ page: { totalPages: 1 } }); // No _embedded.events
        })
      );

      const response = await fetch(
        'https://app.ticketmaster.com/discovery/v2/events.json?apikey=test-key'
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data._embedded?.events).toBeUndefined();
      expect(data.page.totalPages).toBe(1);
      
      console.log(`\n📭 Empty Response: Correctly handled response with no events`);
    });
  });

  describe('Market ID Validation', () => {
    it('should validate all configured market IDs', async () => {
      const marketIds = MAJOR_CITIES.map(city => city.marketId);
      const uniqueMarkets = [...new Set(marketIds)];
      
      const results = await Promise.allSettled(
        uniqueMarkets.map(async (marketId) => {
          const response = await fetch(
            `https://app.ticketmaster.com/discovery/v2/events.json?marketId=${marketId}&apikey=test-key`
          );
          
          return {
            marketId,
            status: response.status,
            ok: response.ok
          };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const validMarkets = successful.filter(r => r.ok);
      
      console.log(`\n🏪 Market ID Validation:`);
      console.log(`  Total Markets: ${uniqueMarkets.length}`);
      console.log(`  Valid Markets: ${validMarkets.length}`);
      console.log(`  Success Rate: ${(validMarkets.length / uniqueMarkets.length * 100).toFixed(1)}%`);
      
      // Should validate most market IDs
      expect(validMarkets.length).toBeGreaterThanOrEqual(uniqueMarkets.length * 0.9);
    });
  });
});

// Helper function
function getTimeframeMs(timeframe: string): number {
  const map: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '48h': 48 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };
  return map[timeframe] || map['24h'];
}