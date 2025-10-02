import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { MapErrorBoundary } from './MapErrorBoundary';
import { useGoogleMapsLoader } from '@/contexts/GoogleMapsContext';
import { mapService } from '@/services/mapService';
import { defaultMapOptions } from '@/config/mapStyles';
import { Loader2 } from 'lucide-react';

const DEFAULT_CENTER = { lat: 34.0522, lng: -118.2437 };
const DEFAULT_ZOOM = 12;

interface RobustMapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  children?: React.ReactNode;
  onMapReady?: (map: google.maps.Map) => void;
  onClick?: (e: google.maps.MapMouseEvent) => void;
  className?: string;
}

const LoadingFallback: React.FC = () => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-900 text-white">
    <Loader2 className="h-8 w-8 animate-spin" />
    <p className="text-sm text-slate-300">Loading map...</p>
  </div>
);

const ErrorFallback: React.FC<{ error?: Error; onRetry: () => void }> = ({
  error,
  onRetry,
}) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-900 px-6 text-center text-white">
    <div className="max-w-md">
      <h2 className="text-2xl font-semibold">Map Unavailable</h2>
      <p className="mt-2 text-sm text-slate-300">
        {error?.message || 'Failed to load Google Maps. Please check your internet connection and API key.'}
      </p>
    </div>
    <button
      type="button"
      onClick={onRetry}
      className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/20"
    >
      Retry
    </button>
  </div>
);

/**
 * RobustMapView - A bulletproof Google Maps component
 *
 * Features:
 * - Single source of truth for map state (mapService)
 * - Error boundary protection
 * - Proper cleanup on unmount
 * - Null-safe initialization
 * - No competing state systems
 * - Minimal re-renders
 */
const RobustMapViewInternal: React.FC<RobustMapViewProps> = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  children,
  onMapReady,
  onClick,
  className = 'h-full w-full',
}) => {
  const { isLoaded, loadError, retry } = useGoogleMapsLoader();
  const [initError, setInitError] = useState<Error | null>(null);
  const initAttemptedRef = useRef(false);

  // Map initialization callback
  const handleMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      // Prevent double initialization
      if (initAttemptedRef.current) {
        console.warn('🗺️ Map already initialized, skipping duplicate init');
        return;
      }

      try {
        console.log('🗺️ Initializing map instance');
        initAttemptedRef.current = true;

        // Configure map options
        mapInstance.setOptions({
          gestureHandling: 'greedy',
          draggable: true,
          scrollwheel: true,
        });

        // Register with unified map service
        mapService.setMap(mapInstance);

        // Notify parent component
        if (onMapReady) {
          onMapReady(mapInstance);
        }

        console.log('✅ Map initialized successfully');
      } catch (error) {
        console.error('❌ Map initialization failed:', error);
        setInitError(error instanceof Error ? error : new Error('Unknown map initialization error'));
        mapService.setMap(null);
      }
    },
    [onMapReady]
  );

  // Map unmount callback
  const handleMapUnmount = useCallback(() => {
    console.log('🗺️ Unmounting map');
    try {
      mapService.reset();
      initAttemptedRef.current = false;
    } catch (error) {
      console.error('⚠️ Error during map unmount:', error);
    }
  }, []);

  // Reset error state when retrying
  const handleRetry = useCallback(() => {
    setInitError(null);
    initAttemptedRef.current = false;
    retry();
  }, [retry]);

  // Show loading state
  if (!isLoaded) {
    return <LoadingFallback />;
  }

  // Show error state
  if (loadError || initError) {
    return <ErrorFallback error={loadError || initError || undefined} onRetry={handleRetry} />;
  }

  // Render map
  return (
    <GoogleMap
      mapContainerClassName={className}
      center={center}
      zoom={zoom}
      options={defaultMapOptions}
      onLoad={handleMapLoad}
      onUnmount={handleMapUnmount}
      onClick={onClick}
    >
      {children}
    </GoogleMap>
  );
};

/**
 * Exported component with error boundary
 */
export const RobustMapView: React.FC<RobustMapViewProps> = (props) => {
  return (
    <MapErrorBoundary>
      <RobustMapViewInternal {...props} />
    </MapErrorBoundary>
  );
};
