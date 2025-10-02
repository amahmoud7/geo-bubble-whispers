import { useState, useEffect } from 'react';
import { mapService, MapInstance } from '@/services/mapService';

/**
 * Hook to access the unified map service
 * Replaces useGoogleMap, MapContext, and direct map access
 */
export function useMapService() {
  const [map, setMap] = useState<MapInstance>(mapService.getMap());
  const [isReady, setIsReady] = useState(mapService.isMapReady());

  useEffect(() => {
    // Subscribe to map changes
    const unsubscribe = mapService.subscribe((newMap) => {
      setMap(newMap);
      setIsReady(newMap !== null);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  return {
    map,
    isReady,
    // Expose service methods
    panTo: mapService.panTo.bind(mapService),
    setZoom: mapService.setZoom.bind(mapService),
    getZoom: mapService.getZoom.bind(mapService),
    getBounds: mapService.getBounds.bind(mapService),
    fitBounds: mapService.fitBounds.bind(mapService),
    withMap: mapService.withMap.bind(mapService),
  };
}
