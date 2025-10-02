import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { environment } from '@/config/environment';

// Simple libraries array 
const LIBRARIES = ['places'] as const;

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
  diagnostics: {
    environment: string;
    userAgent: string;
    networkOnline: boolean;
    keyFormat: string;
    keyLength: number;
  };
  testApiKey: () => Promise<boolean>;
  retry: () => void;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const [authError, setAuthError] = useState<string | null>(null);

  // Get API key directly from environment config
  const googleMapsApiKey = environment.get('GOOGLE_MAPS_API_KEY') || '';

  console.log('🗺️ GoogleMapsContext initializing...');
  console.log('🗺️ API key from environment:', googleMapsApiKey ? `${googleMapsApiKey.substring(0, 20)}...` : 'Missing');
  console.log('🗺️ API key type:', typeof googleMapsApiKey);
  console.log('🗺️ API key length:', googleMapsApiKey ? googleMapsApiKey.length : 'N/A');
  console.log('🗺️ Libraries:', LIBRARIES);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey,
    libraries: LIBRARIES,
    version: 'weekly',
    preventGoogleFontsLoading: true,
    loadingElement: <div>Loading Maps...</div>
  });

  useEffect(() => {
    const handleAuthFailure = () => {
      setAuthError(
        'Google Maps authentication failed. Check API key restrictions for this bundle/host.'
      );
    };

    window.addEventListener('gm_authFailure', handleAuthFailure);
    return () => {
      window.removeEventListener('gm_authFailure', handleAuthFailure);
    };
  }, []);

  console.log('🗺️ useJsApiLoader state:', { isLoaded, hasError: !!loadError });

  // Enhanced error logging - avoid circular references
  if (loadError) {
    console.error('🚨 Google Maps load error:', loadError.message);
    console.error('🚨 Error name:', loadError.name);
    console.error('🚨 Navigator online:', navigator.onLine);
  }
  
  if (isLoaded) {
    console.log('✅ Google Maps API loaded successfully!');
    console.log('✅ window.google available:', !!window.google);
    console.log('✅ window.google.maps available:', !!(window.google && window.google.maps));
    
    // Log some additional details about the loaded API
    if (window.google && window.google.maps) {
      console.log('✅ Google Maps version:', window.google.maps.version);
      console.log('✅ Available libraries:', Object.keys(window.google.maps));
    }
  }

  // Diagnostic information
  const diagnostics = {
    environment: environment.isDevelopment() ? 'development' : 'production',
    userAgent: navigator.userAgent,
    networkOnline: navigator.onLine,
    keyFormat: googleMapsApiKey && googleMapsApiKey.startsWith('AIza') && googleMapsApiKey.length === 39 ? 'valid' : 'invalid',
    keyLength: googleMapsApiKey ? googleMapsApiKey.length : 0,
    timestamp: Date.now(),
  };

  // Test API key by making a simple request
  const testApiKey = useCallback(async (): Promise<boolean> => {
    if (!googleMapsApiKey) return false;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${googleMapsApiKey}`
      );
      const data = await response.json();
      return data.status === 'OK' || data.status === 'ZERO_RESULTS';
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  }, [googleMapsApiKey]);

  // Retry loading the maps
  const retry = useCallback(() => {
    console.log('🗺️ Retrying Google Maps load');
    window.location.reload();
  }, []);

  return (
    <GoogleMapsContext.Provider value={{ 
      isLoaded: isLoaded && !authError,
      loadError: loadError || (authError ? new Error(authError) : undefined),
      diagnostics,
      testApiKey,
      retry
    }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGoogleMapsLoader = () => {
  const context = useContext(GoogleMapsContext);
  if (context === undefined) {
    throw new Error('useGoogleMapsLoader must be used within a GoogleMapsProvider');
  }
  return context;
};
