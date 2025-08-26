// Enhanced Event Service for Nationwide Coverage
// Utilizes comprehensive city database and Ticketmaster market integration
// Supports intelligent fallback and dynamic radius calculation

import { 
  detectNearestCity, 
  detectCityWithMarket, 
  getTicketmasterSearchParams,
  getCitiesWithinRadius,
  getOptimalSearchRadius,
  type City 
} from '@/utils/cityDetection';
import { supabase } from '@/integrations/supabase/client';

export interface EventSearchRequest {
  center?: { lat: number; lng: number };
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  radius?: number;
  timeframe?: string;
  sources?: string[];
  preferLargeMetros?: boolean;
  enableFallback?: boolean;
}

export interface EventSearchResponse {
  success: boolean;
  city: City;
  marketInfo?: {
    marketId?: string;
    marketName?: string;
    dmaId?: string;
  };
  searchParams: {
    center: { lat: number; lng: number };
    radius: number;
    timeframe: string;
  };
  events?: any[];
  fallbackUsed?: boolean;
  error?: string;
  metadata: {
    totalCitiesChecked: number;
    nearestCityDistance: number;
    searchStrategy: string;
  };
}

export class EnhancedEventService {
  /**
   * Intelligent event search with nationwide coverage
   */
  async searchEvents(request: EventSearchRequest): Promise<EventSearchResponse> {
    try {
      const {
        center,
        bounds,
        radius,
        timeframe = '48h',
        sources = ['ticketmaster'],
        preferLargeMetros = true,
        enableFallback = true
      } = request;

      // Determine search center
      const searchCenter = this.determineSearchCenter(center, bounds);
      if (!searchCenter) {
        throw new Error('Must provide either center coordinates or bounds');
      }

      console.log(`🎯 ENHANCED SEARCH: Starting search at ${searchCenter.lat}, ${searchCenter.lng}`);

      // Phase 1: Primary city detection with market awareness
      const { city, market } = detectCityWithMarket(searchCenter.lat, searchCenter.lng);
      const distance = this.calculateDistance(searchCenter.lat, searchCenter.lng, city.coordinates.lat, city.coordinates.lng);
      
      console.log(`🏙️ PRIMARY CITY: ${city.displayName} (${distance.toFixed(1)} miles away)`);

      // Phase 2: Determine optimal search parameters
      let searchParams = this.getOptimalSearchParams(city, searchCenter, radius, preferLargeMetros);
      let fallbackUsed = false;
      let searchStrategy = 'primary-city';
      let totalCitiesChecked = 1;

      // Phase 3: Fallback strategies if needed
      if (enableFallback && distance > 75) {
        const fallbackResult = this.tryFallbackStrategies(searchCenter, radius, preferLargeMetros);
        if (fallbackResult.success) {
          searchParams = fallbackResult.searchParams;
          fallbackUsed = true;
          searchStrategy = fallbackResult.strategy;
          totalCitiesChecked = fallbackResult.citiesChecked;
          console.log(`🔄 FALLBACK: Using ${fallbackResult.strategy} strategy`);
        }
      }

      // Phase 4: Execute the search
      const eventResults = await this.executeEventSearch({
        center: searchParams.center,
        radius: searchParams.radius,
        timeframe,
        sources
      });

      const marketInfo = market ? {
        marketId: market.id,
        marketName: market.name,
        dmaId: market.dmaId
      } : undefined;

      return {
        success: true,
        city,
        marketInfo,
        searchParams: {
          center: searchParams.center,
          radius: searchParams.radius,
          timeframe
        },
        events: eventResults.events,
        fallbackUsed,
        metadata: {
          totalCitiesChecked,
          nearestCityDistance: distance,
          searchStrategy
        }
      };

    } catch (error) {
      console.error('❌ Enhanced event search failed:', error);
      return {
        success: false,
        city: null as any,
        searchParams: null as any,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          totalCitiesChecked: 0,
          nearestCityDistance: 0,
          searchStrategy: 'failed'
        }
      };
    }
  }

  /**
   * Get events with intelligent city-based optimization
   */
  async getEventsForLocation(lat: number, lng: number, options: {
    preferLargeMetros?: boolean;
    timeframe?: string;
    maxRadius?: number;
  } = {}): Promise<EventSearchResponse> {
    return this.searchEvents({
      center: { lat, lng },
      ...options
    });
  }

  private determineSearchCenter(
    center?: { lat: number; lng: number },
    bounds?: { north: number; south: number; east: number; west: number }
  ): { lat: number; lng: number } | null {
    if (center) return center;
    
    if (bounds) {
      return {
        lat: (bounds.north + bounds.south) / 2,
        lng: (bounds.east + bounds.west) / 2
      };
    }
    
    return null;
  }

  private getOptimalSearchParams(
    city: City,
    searchCenter: { lat: number; lng: number },
    requestedRadius?: number,
    preferLargeMetros?: boolean
  ) {
    const ticketmasterParams = getTicketmasterSearchParams(city);
    
    // Use Ticketmaster market center if available and city is far
    const distance = this.calculateDistance(searchCenter.lat, searchCenter.lng, city.coordinates.lat, city.coordinates.lng);
    const useMarketCenter = ticketmasterParams.coordinates && distance > 30;
    
    return {
      center: useMarketCenter ? ticketmasterParams.coordinates : searchCenter,
      radius: requestedRadius || this.calculateOptimalRadius(city, distance, preferLargeMetros)
    };
  }

  private tryFallbackStrategies(
    searchCenter: { lat: number; lng: number },
    requestedRadius?: number,
    preferLargeMetros?: boolean
  ): {
    success: boolean;
    searchParams?: { center: { lat: number; lng: number }; radius: number };
    strategy?: string;
    citiesChecked?: number;
  } {
    // Strategy 1: Find multiple cities within expanded radius
    const nearbyCities = getCitiesWithinRadius(searchCenter.lat, searchCenter.lng, 200);
    
    if (nearbyCities.length > 0) {
      const targetCity = preferLargeMetros 
        ? nearbyCities.reduce((largest, current) => 
            current.population > largest.population ? current : largest)
        : nearbyCities[0];
      
      return {
        success: true,
        searchParams: {
          center: targetCity.coordinates,
          radius: requestedRadius || Math.max(targetCity.radius, 50)
        },
        strategy: 'nearby-cities',
        citiesChecked: nearbyCities.length
      };
    }

    // Strategy 2: Regional center fallback (use largest city in broader area)
    const regionalCities = getCitiesWithinRadius(searchCenter.lat, searchCenter.lng, 500);
    if (regionalCities.length > 0) {
      const regionalCenter = regionalCities.reduce((largest, current) => 
        current.population > largest.population ? current : largest);
      
      return {
        success: true,
        searchParams: {
          center: regionalCenter.coordinates,
          radius: requestedRadius || Math.min(100, regionalCenter.radius + 25)
        },
        strategy: 'regional-fallback',
        citiesChecked: regionalCities.length
      };
    }

    return { success: false };
  }

  private calculateOptimalRadius(city: City, distanceToCity: number, preferLargeMetros?: boolean): number {
    // Base radius from city configuration
    let radius = city.radius;

    // Adjust for distance from city center
    if (distanceToCity > 25) {
      radius = Math.max(radius, distanceToCity + 15);
    }

    // Population-based adjustments
    if (city.population > 2000000) {
      radius = Math.max(radius, 45); // Major metros get larger radius
    } else if (city.population < 500000) {
      radius = Math.max(radius, 35); // Smaller cities need wider search
    }

    // Cap the radius
    return Math.min(radius, 100);
  }

  private async executeEventSearch(params: {
    center: { lat: number; lng: number };
    radius: number;
    timeframe: string;
    sources: string[];
  }) {
    try {
      console.log(`📡 EXECUTING SEARCH: ${params.center.lat}, ${params.center.lng} (${params.radius}mi, ${params.timeframe})`);

      // Call the enhanced fetch-events function
      const { data, error } = await supabase.functions.invoke('fetch-events', {
        body: {
          center: params.center,
          radius: params.radius,
          timeframe: params.timeframe,
          source: params.sources
        }
      });

      if (error) {
        throw error;
      }

      return {
        events: data?.events || [],
        created: data?.created || 0,
        fetched: data?.fetched || 0
      };
    } catch (error) {
      console.error('❌ Event search execution failed:', error);
      throw error;
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Singleton instance
export const enhancedEventService = new EnhancedEventService();