import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { EnhancedEventService, EventSearchRequest } from '@/services/enhancedEventService';

// Mock the city detection utilities
vi.mock('@/utils/cityDetection', () => ({
  detectNearestCity: vi.fn(),
  detectCityWithMarket: vi.fn(),
  getTicketmasterSearchParams: vi.fn(),
  getCitiesWithinRadius: vi.fn(),
  getOptimalSearchRadius: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    }
  }
}));

import { detectNearestCity, detectCityWithMarket, getTicketmasterSearchParams, getCitiesWithinRadius } from '@/utils/cityDetection';
import { supabase } from '@/integrations/supabase/client';

describe('EnhancedEventService', () => {
  let eventService: EnhancedEventService;
  let mockDetectNearestCity: Mock;
  let mockDetectCityWithMarket: Mock;
  let mockGetTicketmasterSearchParams: Mock;
  let mockGetCitiesWithinRadius: Mock;
  let mockSupabaseInvoke: Mock;

  beforeEach(() => {
    eventService = new EnhancedEventService();
    mockDetectNearestCity = detectNearestCity as Mock;
    mockDetectCityWithMarket = detectCityWithMarket as Mock;
    mockGetTicketmasterSearchParams = getTicketmasterSearchParams as Mock;
    mockGetCitiesWithinRadius = getCitiesWithinRadius as Mock;
    mockSupabaseInvoke = supabase.functions.invoke as Mock;

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('searchEvents', () => {
    const mockNYC = {
      id: 'new-york',
      name: 'New York',
      displayName: 'NYC',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      radius: 30,
      population: 8300000,
      timezone: 'America/New_York',
      state: 'NY',
      ticketmasterMarketId: '35'
    };

    const mockMarket = {
      id: '35',
      name: 'New York',
      dmaId: '501'
    };

    it('should successfully search events for NYC', async () => {
      const request: EventSearchRequest = {
        center: { lat: 40.7128, lng: -74.0060 },
        timeframe: '24h'
      };

      mockDetectCityWithMarket.mockReturnValue({
        city: mockNYC,
        market: mockMarket
      });

      mockGetTicketmasterSearchParams.mockReturnValue({
        marketId: '35',
        dmaId: '501',
        radius: 30,
        coordinates: { lat: 40.7128, lng: -74.0060 }
      });

      mockSupabaseInvoke.mockResolvedValue({
        data: {
          events: [
            { id: 1, title: 'Broadway Show' },
            { id: 2, title: 'Concert at MSG' }
          ],
          created: 2,
          fetched: 2
        },
        error: null
      });

      const result = await eventService.searchEvents(request);

      expect(result.success).toBe(true);
      expect(result.city).toEqual(mockNYC);
      expect(result.marketInfo).toEqual({
        marketId: '35',
        marketName: 'New York',
        dmaId: '501'
      });
      expect(result.events).toHaveLength(2);
      expect(result.fallbackUsed).toBe(false);
      expect(mockSupabaseInvoke).toHaveBeenCalledWith('fetch-events', {
        body: {
          center: { lat: 40.7128, lng: -74.0060 },
          radius: 30,
          timeframe: '24h',
          source: ['ticketmaster']
        }
      });
    });

    it('should handle search with bounds instead of center', async () => {
      const request: EventSearchRequest = {
        bounds: {
          north: 40.92,
          south: 40.53,
          east: -73.68,
          west: -74.26
        },
        timeframe: '48h'
      };

      mockDetectCityWithMarket.mockReturnValue({
        city: mockNYC,
        market: mockMarket
      });

      mockGetTicketmasterSearchParams.mockReturnValue({
        marketId: '35',
        radius: 30,
        coordinates: { lat: 40.7128, lng: -74.0060 }
      });

      mockSupabaseInvoke.mockResolvedValue({
        data: { events: [], created: 0, fetched: 0 },
        error: null
      });

      const result = await eventService.searchEvents(request);

      expect(result.success).toBe(true);
      // Should calculate center from bounds
      expect(mockDetectCityWithMarket).toHaveBeenCalledWith(
        (40.92 + 40.53) / 2,
        (-73.68 + -74.26) / 2
      );
    });

    it('should use fallback strategies for remote locations', async () => {
      const request: EventSearchRequest = {
        center: { lat: 47.0527, lng: -109.6333 }, // Rural Montana
        enableFallback: true,
        preferLargeMetros: true
      };

      const mockSmallCity = {
        id: 'rural-mt',
        coordinates: { lat: 47.0527, lng: -109.6333 },
        radius: 25,
        population: 50000
      };

      const mockDenver = {
        id: 'denver',
        coordinates: { lat: 39.7392, lng: -104.9903 },
        radius: 40,
        population: 715000
      };

      mockDetectCityWithMarket.mockReturnValue({
        city: mockSmallCity,
        market: null
      });

      mockGetCitiesWithinRadius.mockReturnValue([mockDenver]);

      mockSupabaseInvoke.mockResolvedValue({
        data: { events: [], created: 0, fetched: 0 },
        error: null
      });

      const result = await eventService.searchEvents(request);

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(result.metadata.searchStrategy).toBe('nearby-cities');
    });

    it('should handle API errors gracefully', async () => {
      const request: EventSearchRequest = {
        center: { lat: 40.7128, lng: -74.0060 }
      };

      mockDetectCityWithMarket.mockReturnValue({
        city: mockNYC,
        market: mockMarket
      });

      mockGetTicketmasterSearchParams.mockReturnValue({
        marketId: '35',
        radius: 30,
        coordinates: { lat: 40.7128, lng: -74.0060 }
      });

      mockSupabaseInvoke.mockRejectedValue(new Error('API Error'));

      const result = await eventService.searchEvents(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should handle missing center and bounds', async () => {
      const request: EventSearchRequest = {
        timeframe: '24h'
      };

      const result = await eventService.searchEvents(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must provide either center coordinates or bounds');
    });

    it('should customize search parameters correctly', async () => {
      const request: EventSearchRequest = {
        center: { lat: 34.0522, lng: -118.2437 }, // LA
        radius: 50,
        timeframe: '7d',
        sources: ['ticketmaster', 'meetup'],
        preferLargeMetros: false
      };

      const mockLA = {
        id: 'los-angeles',
        coordinates: { lat: 34.0522, lng: -118.2437 },
        radius: 35,
        population: 3900000
      };

      mockDetectCityWithMarket.mockReturnValue({
        city: mockLA,
        market: { id: '27' }
      });

      mockGetTicketmasterSearchParams.mockReturnValue({
        marketId: '27',
        radius: 35,
        coordinates: { lat: 34.0522, lng: -118.2437 }
      });

      mockSupabaseInvoke.mockResolvedValue({
        data: { events: [], created: 0, fetched: 0 },
        error: null
      });

      await eventService.searchEvents(request);

      expect(mockSupabaseInvoke).toHaveBeenCalledWith('fetch-events', {
        body: {
          center: { lat: 34.0522, lng: -118.2437 },
          radius: 50, // Should use requested radius
          timeframe: '7d',
          source: ['ticketmaster', 'meetup']
        }
      });
    });
  });

  describe('getEventsForLocation', () => {
    it('should be a convenience method for searchEvents', async () => {
      const mockResult = {
        success: true,
        city: mockNYC,
        searchParams: {
          center: { lat: 40.7128, lng: -74.0060 },
          radius: 30,
          timeframe: '24h'
        },
        events: [],
        metadata: {
          totalCitiesChecked: 1,
          nearestCityDistance: 0,
          searchStrategy: 'primary-city'
        }
      };

      const searchSpy = vi.spyOn(eventService, 'searchEvents').mockResolvedValue(mockResult);

      const result = await eventService.getEventsForLocation(40.7128, -74.0060, {
        preferLargeMetros: true,
        timeframe: '48h',
        maxRadius: 75
      });

      expect(searchSpy).toHaveBeenCalledWith({
        center: { lat: 40.7128, lng: -74.0060 },
        preferLargeMetros: true,
        timeframe: '48h',
        maxRadius: 75
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate distances correctly', () => {
      // Test the private calculateDistance method through public interface
      const request: EventSearchRequest = {
        center: { lat: 40.7128, lng: -74.0060 } // NYC
      };

      const mockPhilly = {
        id: 'philadelphia',
        coordinates: { lat: 39.9526, lng: -75.1652 }, // About 95 miles from NYC
        radius: 25,
        population: 1600000
      };

      mockDetectCityWithMarket.mockReturnValue({
        city: mockPhilly,
        market: null
      });

      mockGetTicketmasterSearchParams.mockReturnValue({
        radius: 25,
        coordinates: mockPhilly.coordinates
      });

      mockSupabaseInvoke.mockResolvedValue({
        data: { events: [], created: 0, fetched: 0 },
        error: null
      });

      return eventService.searchEvents(request).then(result => {
        expect(result.metadata.nearestCityDistance).toBeGreaterThan(90);
        expect(result.metadata.nearestCityDistance).toBeLessThan(100);
      });
    });
  });

  describe('Optimal Search Parameters', () => {
    it('should use market center when city is far from search center', async () => {
      const request: EventSearchRequest = {
        center: { lat: 40.5, lng: -73.8 } // Queens, NY
      };

      const mockNYCMarket = {
        id: '35',
        coordinates: { lat: 40.7128, lng: -74.0060 } // Manhattan
      };

      mockDetectCityWithMarket.mockReturnValue({
        city: mockNYC,
        market: mockNYCMarket
      });

      mockGetTicketmasterSearchParams.mockReturnValue({
        marketId: '35',
        radius: 30,
        coordinates: mockNYCMarket.coordinates
      });

      mockSupabaseInvoke.mockResolvedValue({
        data: { events: [], created: 0, fetched: 0 },
        error: null
      });

      const result = await eventService.searchEvents(request);

      expect(result.success).toBe(true);
      // Should use market center instead of search center for API call
      expect(mockSupabaseInvoke).toHaveBeenCalledWith('fetch-events', {
        body: {
          center: mockNYCMarket.coordinates,
          radius: 30,
          timeframe: '48h',
          source: ['ticketmaster']
        }
      });
    });
  });
});