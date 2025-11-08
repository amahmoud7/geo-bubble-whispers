/**
 * Enhanced Map Context - Single Source of Truth for Google Maps
 * 
 * This context consolidates:
 * - Google Maps API loading (formerly GoogleMapsContext)
 * - Map instance management (formerly MapContext + useGoogleMap)
 * - Street View state management
 * - Error handling and recovery
 * 
 * Benefits:
 * - One authoritative map state
 * - No race conditions between multiple state systems
 * - Clear error handling and recovery
 * - Proper listener cleanup
 */

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { environment } from '@/config/environment';
import { toast } from '@/hooks/use-toast';
import { eventBus } from '@/utils/eventBus';

const LIBRARIES = ['places'] as const;

interface StreetViewState {
  isActive: boolean;
  isAttempting: boolean;
  position: { lat: number; lng: number } | null;
  panorama: google.maps.StreetViewPanorama | null;
}

interface EnhancedMapContextValue {
  // Core map state
  map: google.maps.Map | null;
  setMap: (map: google.maps.Map | null) => void;
  
  // Loading state
  isLoaded: boolean;
  isInitializing: boolean;
  loadError: Error | undefined;
  
  // Street View state
  streetView: StreetViewState;
  activateStreetView: (position: { lat: number; lng: number }) => void;
  deactivateStreetView: () => void;
  
  // SearchBox state
  searchBox: google.maps.places.SearchBox | null;
  setSearchBox: (searchBox: google.maps.places.SearchBox | null) => void;
  
  // Actions
  retry: () => void;
  
  // Diagnostics
  diagnostics: {
    environment: string;
    userAgent: string;
    networkOnline: boolean;
    keyFormat: string;
    keyLength: number;
  };
}

const EnhancedMapContext = createContext<EnhancedMapContextValue | undefined>(undefined);

interface EnhancedMapProviderProps {
  children: ReactNode;
}

export const EnhancedMapProvider: React.FC<EnhancedMapProviderProps> = ({ children }) => {
  // Map instance state
  const [map, setMapState] = useState<google.maps.Map | null>(null);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  
  // Street View state
  const [streetView, setStreetView] = useState<StreetViewState>({
    isActive: false,
    isAttempting: false,
    position: null,
    panorama: null,
  });
  
  // Error tracking
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Listener cleanup refs
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);
  
  // Get API key
  const googleMapsApiKey = environment.get('GOOGLE_MAPS_API_KEY') || '';

  console.log('🗺️ EnhancedMapContext initializing...');
  console.log('🗺️ API key:', googleMapsApiKey ? `${googleMapsApiKey.substring(0, 20)}...` : 'Missing');
  console.log('🗺️ API key length:', googleMapsApiKey.length);
  console.log('🗺️ Environment:', environment.isDevelopment() ? 'development' : 'production');
  
  // Critical: If API key is missing, show error immediately
  if (!googleMapsApiKey || googleMapsApiKey.length === 0) {
    console.error('🚨 CRITICAL: Google Maps API key is missing!');
    console.error('🚨 Check your .env.local file');
    setAuthError('Google Maps API key is missing. The map cannot load.');
  }

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey,
    libraries: LIBRARIES,
    version: 'weekly',
    preventGoogleFontsLoading: true,
  });

  // Listen for auth failures
  useEffect(() => {
    const handleAuthFailure = () => {
      setAuthError('Google Maps authentication failed. Check API key restrictions.');
    };

    window.addEventListener('gm_authFailure', handleAuthFailure);
    return () => {
      window.removeEventListener('gm_authFailure', handleAuthFailure);
    };
  }, []);

  // Enhanced setMap that also sets up Street View
  const setMap = useCallback((mapInstance: google.maps.Map | null) => {
    // Cleanup previous listeners
    listenersRef.current.forEach(listener => {
      google.maps.event.removeListener(listener);
    });
    listenersRef.current = [];

    setMapState(mapInstance);

    if (!mapInstance) {
      setStreetView({
        isActive: false,
        isAttempting: false,
        position: null,
        panorama: null,
      });
      return;
    }

    // Set up Street View
    const streetViewControl = mapInstance.getStreetView();
    
    streetViewControl.setOptions({
      enableCloseButton: true,
      imageDateControl: true,
      visible: false,
      motionTracking: false,
      motionTrackingControl: false,
      addressControl: true,
    });

    // Add Street View listeners
    const visibleListener = streetViewControl.addListener('visible_changed', () => {
      const isVisible = streetViewControl.getVisible();
      setStreetView(prev => ({
        ...prev,
        isActive: isVisible,
        isAttempting: isVisible,
        panorama: streetViewControl,
      }));
      
      if (isVisible) {
        toast({
          title: "Street View activated",
          description: "You can now drop a Lo in Street View mode",
        });
      }
    });

    const positionListener = streetViewControl.addListener('position_changed', () => {
      if (streetViewControl.getVisible()) {
        const position = streetViewControl.getPosition();
        if (position) {
          setStreetView(prev => ({
            ...prev,
            position: {
              lat: position.lat(),
              lng: position.lng(),
            },
          }));
        }
      }
    });

    const clickListener = streetViewControl.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (streetViewControl.getVisible() && event.latLng) {
        const position = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };
        eventBus.emit('streetViewClick', position);
      }
    });

    const panoListener = streetViewControl.addListener('pano_changed', () => {
      if (streetViewControl.getVisible()) {
        const position = streetViewControl.getPosition();
        if (position) {
          setStreetView(prev => ({
            ...prev,
            position: {
              lat: position.lat(),
              lng: position.lng(),
            },
          }));
        }
      }
    });

    // Store listeners for cleanup
    listenersRef.current = [visibleListener, positionListener, clickListener, panoListener];

    console.log('✅ Map instance and Street View configured');
  }, []);

  // Activate Street View at a specific position
  const activateStreetView = useCallback((position: { lat: number; lng: number }) => {
    if (!map) {
      console.warn('Cannot activate Street View: map not initialized');
      return;
    }
    
    setStreetView(prev => ({ ...prev, isAttempting: true }));
    
    const streetViewService = new google.maps.StreetViewService();
    
    streetViewService.getPanorama({
      location: new google.maps.LatLng(position.lat, position.lng),
      radius: 50,
    }, (data, status) => {
      if (status === google.maps.StreetViewStatus.OK) {
        const streetViewControl = map.getStreetView();
        streetViewControl.setPosition(new google.maps.LatLng(position.lat, position.lng));
        streetViewControl.setVisible(true);
        
        setStreetView(prev => ({
          ...prev,
          isActive: true,
          isAttempting: false,
          position,
          panorama: streetViewControl,
        }));
        
        toast({
          title: "Street View Loaded",
          description: "Now viewing location in Street View mode",
        });
      } else {
        setStreetView(prev => ({ ...prev, isAttempting: false }));
        
        toast({
          title: "Street View not available",
          description: "Street View isn't available at this location",
          variant: "destructive",
        });
      }
    });
  }, [map]);

  // Deactivate Street View
  const deactivateStreetView = useCallback(() => {
    if (map) {
      const streetViewControl = map.getStreetView();
      streetViewControl.setVisible(false);
      setStreetView({
        isActive: false,
        isAttempting: false,
        position: null,
        panorama: streetViewControl,
      });
    }
  }, [map]);

  // Retry loading
  const retry = useCallback(() => {
    console.log('🗺️ Retrying Google Maps load');
    setAuthError(null);
    window.location.reload();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      listenersRef.current.forEach(listener => {
        google.maps.event.removeListener(listener);
      });
      listenersRef.current = [];
    };
  }, []);

  // Diagnostics
  const diagnostics = {
    environment: environment.isDevelopment() ? 'development' : 'production',
    userAgent: navigator.userAgent,
    networkOnline: navigator.onLine,
    keyFormat: googleMapsApiKey && googleMapsApiKey.startsWith('AIza') && googleMapsApiKey.length === 39 ? 'valid' : 'invalid',
    keyLength: googleMapsApiKey ? googleMapsApiKey.length : 0,
  };

  const value: EnhancedMapContextValue = {
    map,
    setMap,
    isLoaded: isLoaded && !authError,
    isInitializing: !isLoaded && !loadError && !authError,
    loadError: loadError || (authError ? new Error(authError) : undefined),
    streetView,
    activateStreetView,
    deactivateStreetView,
    searchBox,
    setSearchBox,
    retry,
    diagnostics,
  };

  if (isLoaded) {
    console.log('✅ Google Maps API loaded successfully via EnhancedMapContext');
  }

  if (loadError) {
    console.error('🚨 Google Maps load error:', loadError.message);
  }

  return (
    <EnhancedMapContext.Provider value={value}>
      {children}
    </EnhancedMapContext.Provider>
  );
};

export const useEnhancedMapContext = () => {
  const context = useContext(EnhancedMapContext);
  if (context === undefined) {
    throw new Error('useEnhancedMapContext must be used within an EnhancedMapProvider');
  }
  return context;
};

// Backward compatibility exports
export const useMapContext = useEnhancedMapContext;
export const useGoogleMapsLoader = () => {
  const { isLoaded, loadError, diagnostics, retry } = useEnhancedMapContext();
  return { isLoaded, loadError, diagnostics, retry };
};
