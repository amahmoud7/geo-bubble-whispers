/**
 * Unified Map Service
 * Single source of truth for Google Maps state
 * Replaces the three competing systems (GoogleMapsContext, useGoogleMap, MapContext)
 */

type MapInstance = google.maps.Map | null;
type MapListener = (map: MapInstance) => void;
type CleanupFunction = () => void;

class MapService {
  private static instance: MapService;
  private map: MapInstance = null;
  private listeners: Set<MapListener> = new Set();
  private isInitialized = false;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  /**
   * Set the map instance (called once during initialization)
   */
  setMap(map: MapInstance): void {
    if (this.map && map && this.map !== map) {
      console.warn('🗺️ MapService: Replacing existing map instance');
    }

    this.map = map;
    this.isInitialized = map !== null;

    // Notify all listeners
    this.listeners.forEach((listener) => {
      try {
        listener(map);
      } catch (error) {
        console.error('🗺️ MapService: Listener error:', error);
      }
    });
  }

  /**
   * Get the current map instance
   */
  getMap(): MapInstance {
    return this.map;
  }

  /**
   * Check if map is initialized
   */
  isMapReady(): boolean {
    return this.isInitialized && this.map !== null;
  }

  /**
   * Subscribe to map changes
   * Returns cleanup function
   */
  subscribe(listener: MapListener): CleanupFunction {
    this.listeners.add(listener);

    // Immediately call with current value if map is ready
    if (this.isMapReady()) {
      try {
        listener(this.map);
      } catch (error) {
        console.error('🗺️ MapService: Listener error on subscribe:', error);
      }
    }

    // Return cleanup function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Reset the service (useful for testing or error recovery)
   */
  reset(): void {
    console.log('🗺️ MapService: Resetting');
    this.map = null;
    this.isInitialized = false;
    this.listeners.clear();
  }

  /**
   * Safely execute a function with the map instance
   * Handles null checks and errors gracefully
   */
  withMap<T>(fn: (map: google.maps.Map) => T, fallback?: T): T | undefined {
    if (!this.map) {
      console.warn('🗺️ MapService: Attempted to use map before initialization');
      return fallback;
    }

    try {
      return fn(this.map);
    } catch (error) {
      console.error('🗺️ MapService: Error executing map function:', error);
      return fallback;
    }
  }

  /**
   * Get bounds from the current map
   */
  getBounds(): google.maps.LatLngBounds | null {
    return this.withMap((map) => map.getBounds() ?? null, null) ?? null;
  }

  /**
   * Pan map to location
   */
  panTo(location: { lat: number; lng: number }): void {
    this.withMap((map) => {
      map.panTo(location);
    });
  }

  /**
   * Set map zoom level
   */
  setZoom(zoom: number): void {
    this.withMap((map) => {
      map.setZoom(zoom);
    });
  }

  /**
   * Get current zoom level
   */
  getZoom(): number | null {
    return this.withMap((map) => map.getZoom() ?? null, null) ?? null;
  }

  /**
   * Fit map to bounds
   */
  fitBounds(bounds: google.maps.LatLngBounds): void {
    this.withMap((map) => {
      map.fitBounds(bounds);
    });
  }
}

// Export singleton instance
export const mapService = MapService.getInstance();

// Export type for external use
export type { MapInstance };
