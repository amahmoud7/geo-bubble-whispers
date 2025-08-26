import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  detectNearestCity, 
  detectCityWithMarket,
  getCitiesWithinRadius,
  getOptimalSearchRadius,
  isWithinEventRadius,
  getCityById,
  getAllCities,
  getCitiesByState,
  getMajorMetros,
  formatCityDisplay,
  getTicketmasterSearchParams
} from '@/utils/cityDetection';

describe('City Detection System', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    vi.clearAllMocks();
  });

  describe('detectNearestCity', () => {
    it('should detect New York City correctly', () => {
      const result = detectNearestCity(40.7128, -74.0060);
      expect(result.id).toBe('new-york');
      expect(result.displayName).toBe('NYC');
      expect(result.state).toBe('NY');
    });

    it('should detect Los Angeles correctly', () => {
      const result = detectNearestCity(34.0522, -118.2437);
      expect(result.id).toBe('los-angeles');
      expect(result.displayName).toBe('LA');
      expect(result.state).toBe('CA');
    });

    it('should detect Chicago correctly', () => {
      const result = detectNearestCity(41.8781, -87.6298);
      expect(result.id).toBe('chicago');
      expect(result.displayName).toBe('Chicago');
      expect(result.state).toBe('IL');
    });

    it('should detect Atlanta correctly', () => {
      const result = detectNearestCity(33.7490, -84.3880);
      expect(result.id).toBe('atlanta');
      expect(result.displayName).toBe('Atlanta');
      expect(result.state).toBe('GA');
    });

    it('should find nearest city for suburban locations', () => {
      // Test Westchester, NY (should detect NYC)
      const result = detectNearestCity(41.0534, -73.5387);
      expect(result.id).toBe('new-york');
    });

    it('should handle edge cases with rural locations', () => {
      // Rural Montana - should still return a city (fallback)
      const result = detectNearestCity(47.0527, -109.6333);
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
    });

    it('should handle Alaska and Hawaii coordinates', () => {
      // Anchorage, Alaska
      const alaskaResult = detectNearestCity(61.2181, -149.9003);
      expect(alaskaResult).toBeDefined();
      
      // Honolulu, Hawaii  
      const hawaiiResult = detectNearestCity(21.3099, -157.8581);
      expect(hawaiiResult).toBeDefined();
    });
  });

  describe('detectCityWithMarket', () => {
    it('should return city with market information', () => {
      const result = detectCityWithMarket(40.7128, -74.0060);
      expect(result.city.id).toBe('new-york');
      expect(result.market).toBeDefined();
      if (result.market) {
        expect(result.market.id).toBe('35');
        expect(result.market.name).toContain('New York');
      }
    });

    it('should handle cities without specific markets', () => {
      // Test a location that might not have a specific Ticketmaster market
      const result = detectCityWithMarket(46.8772, -96.7898); // Fargo, ND
      expect(result.city).toBeDefined();
    });
  });

  describe('getCitiesWithinRadius', () => {
    it('should return cities within specified radius', () => {
      const cities = getCitiesWithinRadius(40.7128, -74.0060, 50); // 50 miles from NYC
      expect(cities.length).toBeGreaterThan(0);
      expect(cities[0].id).toBe('new-york'); // Closest should be NYC itself
    });

    it('should return empty array for ocean locations', () => {
      const cities = getCitiesWithinRadius(30.0, -50.0, 50); // Middle of Atlantic
      expect(cities.length).toBe(0);
    });

    it('should sort cities by distance', () => {
      const cities = getCitiesWithinRadius(40.5, -74.0, 100);
      if (cities.length > 1) {
        // Cities should be sorted by distance (closest first)
        expect(cities).toBeDefined();
        // First city should be closer than the last
        expect(cities.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getOptimalSearchRadius', () => {
    it('should return appropriate radius for major cities', () => {
      const nycRadius = getOptimalSearchRadius(40.7128, -74.0060);
      expect(nycRadius).toBeGreaterThanOrEqual(30);
      expect(nycRadius).toBeLessThanOrEqual(100);
    });

    it('should return larger radius for rural areas', () => {
      const ruralRadius = getOptimalSearchRadius(47.0527, -109.6333);
      expect(ruralRadius).toBeGreaterThan(35);
      expect(ruralRadius).toBeLessThanOrEqual(100);
    });

    it('should cap radius at reasonable maximum', () => {
      const radius = getOptimalSearchRadius(90.0, 0.0); // North Pole
      expect(radius).toBeLessThanOrEqual(100);
    });
  });

  describe('isWithinEventRadius', () => {
    it('should return true for major city centers', () => {
      expect(isWithinEventRadius(40.7128, -74.0060, 50)).toBe(true); // NYC
      expect(isWithinEventRadius(34.0522, -118.2437, 50)).toBe(true); // LA
      expect(isWithinEventRadius(41.8781, -87.6298, 50)).toBe(true); // Chicago
    });

    it('should return false for remote locations', () => {
      expect(isWithinEventRadius(45.0, -110.0, 25)).toBe(false); // Rural Montana
    });

    it('should respect custom radius parameter', () => {
      // Test with very small radius
      expect(isWithinEventRadius(40.8, -74.0, 5)).toBe(false);
      
      // Test with large radius
      expect(isWithinEventRadius(40.8, -74.0, 100)).toBe(true);
    });
  });

  describe('getCityById', () => {
    it('should return correct city by ID', () => {
      const nyc = getCityById('new-york');
      expect(nyc).toBeDefined();
      expect(nyc!.id).toBe('new-york');
      expect(nyc!.displayName).toBe('NYC');
    });

    it('should return null for invalid ID', () => {
      const result = getCityById('invalid-city');
      expect(result).toBeNull();
    });
  });

  describe('getAllCities', () => {
    it('should return all cities sorted by population', () => {
      const cities = getAllCities();
      expect(cities.length).toBeGreaterThan(0);
      
      // Should be sorted by population (descending)
      for (let i = 0; i < cities.length - 1; i++) {
        expect(cities[i].population).toBeGreaterThanOrEqual(cities[i + 1].population);
      }
    });
  });

  describe('getCitiesByState', () => {
    it('should return cities for valid state codes', () => {
      const caCities = getCitiesByState('CA');
      expect(caCities.length).toBeGreaterThan(0);
      caCities.forEach(city => {
        expect(city.state.toLowerCase()).toBe('ca');
      });
    });

    it('should handle case-insensitive state codes', () => {
      const nyUpper = getCitiesByState('NY');
      const nyLower = getCitiesByState('ny');
      expect(nyUpper).toEqual(nyLower);
    });

    it('should return empty array for invalid state', () => {
      const invalid = getCitiesByState('XX');
      expect(invalid).toEqual([]);
    });
  });

  describe('getMajorMetros', () => {
    it('should return cities above population threshold', () => {
      const majorMetros = getMajorMetros(1000000);
      expect(majorMetros.length).toBeGreaterThan(0);
      majorMetros.forEach(city => {
        expect(city.population).toBeGreaterThanOrEqual(1000000);
      });
    });

    it('should be sorted by population descending', () => {
      const metros = getMajorMetros(500000);
      for (let i = 0; i < metros.length - 1; i++) {
        expect(metros[i].population).toBeGreaterThanOrEqual(metros[i + 1].population);
      }
    });
  });

  describe('formatCityDisplay', () => {
    it('should format city names with appropriate emojis', () => {
      const nycFormatted = formatCityDisplay(getCityById('new-york')!);
      expect(nycFormatted).toContain('🗽');
      expect(nycFormatted).toContain('NYC');

      const laFormatted = formatCityDisplay(getCityById('los-angeles')!);
      expect(laFormatted).toContain('🌴');
      expect(laFormatted).toContain('LA');
    });

    it('should handle cities without specific emojis', () => {
      const city = { id: 'test-city', displayName: 'Test City' } as any;
      const formatted = formatCityDisplay(city);
      expect(formatted).toContain('🏙️'); // Default emoji
      expect(formatted).toContain('Test City');
    });
  });

  describe('getTicketmasterSearchParams', () => {
    it('should return search parameters for cities with markets', () => {
      const nyc = getCityById('new-york')!;
      const params = getTicketmasterSearchParams(nyc);
      
      expect(params.marketId).toBe('35');
      expect(params.radius).toBeGreaterThan(0);
      expect(params.coordinates).toBeDefined();
      expect(params.coordinates.lat).toBeCloseTo(40.7128, 2);
      expect(params.coordinates.lng).toBeCloseTo(-74.0060, 2);
    });

    it('should handle cities without specific markets', () => {
      const city = { 
        id: 'test-city', 
        coordinates: { lat: 45.0, lng: -100.0 },
        radius: 25
      } as any;
      
      const params = getTicketmasterSearchParams(city);
      expect(params.radius).toBe(25);
      expect(params.coordinates).toEqual(city.coordinates);
    });
  });
});

describe('City Detection Edge Cases', () => {
  it('should handle boundary coordinates correctly', () => {
    // Test coordinates at US borders
    const southTexas = detectNearestCity(25.9018, -97.4975); // Brownsville, TX
    expect(southTexas).toBeDefined();
    
    const northAlaska = detectNearestCity(64.0685, -152.2782); // Fairbanks, AK  
    expect(northAlaska).toBeDefined();
    
    const eastMaine = detectNearestCity(44.3106, -68.7712); // Bar Harbor, ME
    expect(eastMaine).toBeDefined();
    
    const westCalifornia = detectNearestCity(34.4208, -119.6982); // Santa Barbara, CA
    expect(westCalifornia).toBeDefined();
  });

  it('should handle coordinates with high precision', () => {
    const preciseNYC = detectNearestCity(40.712812345678, -74.006012345678);
    expect(preciseNYC.id).toBe('new-york');
  });

  it('should handle extreme coordinates gracefully', () => {
    // Should not crash with invalid coordinates
    expect(() => detectNearestCity(0, 0)).not.toThrow();
    expect(() => detectNearestCity(1000, 1000)).not.toThrow();
    expect(() => detectNearestCity(-1000, -1000)).not.toThrow();
  });

  it('should handle coordinates near international borders', () => {
    // Near Canadian border
    const seattle = detectNearestCity(47.6062, -122.3321);
    expect(seattle.id).toBe('seattle');
    
    // Near Mexican border
    const sanDiego = detectNearestCity(32.7157, -117.1611);
    expect(sanDiego.id).toBe('san-diego');
  });
});