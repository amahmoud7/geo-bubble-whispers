import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, OverlayView } from '@react-google-maps/api';
import { useAuth } from '@/hooks/useAuth';
import { useUserLocation } from '@/hooks/useUserLocation';

// RELIABLE MAP VIEW - ZERO OVER-ENGINEERING
// This implementation focuses on RELIABILITY over features
// Every complexity removed makes it more likely to work

const API_KEY = 'AIzaSyAjEgLbwLxPJ1PDPU446fL8fvsfWhUviuU'; // Direct API key - no abstraction
const LIBRARIES: ['places'] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 37.7749, // San Francisco
  lng: -122.4194
};

const defaultOptions = {
  disableDefaultUI: false, // Keep UI for debugging
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
  fullscreenControl: true,
  gestureHandling: 'greedy' as const,
  styles: [
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0EA5E9" }, { lightness: 20 }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#f6f7fb" }]
    }
  ]
};

interface ReliableMapViewProps {
  isEventsOnlyMode?: boolean;
}

const ReliableMapView: React.FC<ReliableMapViewProps> = ({ 
  isEventsOnlyMode = false 
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { userLocation } = useUserLocation();

  console.log('🗺️ ReliableMapView: Initializing...');
  console.log('🗺️ API Key present:', !!API_KEY);
  console.log('🗺️ User location:', userLocation);

  // Load Google Maps API with minimal configuration
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'reliable-google-map-script',
    googleMapsApiKey: API_KEY,
    libraries: LIBRARIES,
  });

  // Update center when user location is available
  useEffect(() => {
    if (userLocation) {
      console.log('📍 Updating map center to user location:', userLocation);
      setCenter(userLocation);
    }
  }, [userLocation]);

  // Map load callback - minimal setup
  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    console.log('✅ Google Map loaded successfully!');
    setMap(mapInstance);
    setLoading(false);
    
    // Add user location marker if available
    if (userLocation) {
      new google.maps.Marker({
        position: userLocation,
        map: mapInstance,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 10
        }
      });
    }
  }, [userLocation]);

  const onUnmount = useCallback(() => {
    console.log('🗺️ Map unmounted');
    setMap(null);
  }, []);

  // Error handling - simple and clear
  if (loadError) {
    console.error('🚨 Google Maps load error:', loadError);
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Maps Failed to Load</h2>
          <p className="text-gray-600 mb-4">
            Error: {loadError.message}
          </p>
          <div className="space-y-2 text-sm text-left bg-gray-50 p-4 rounded">
            <div>API Key: {API_KEY ? '✅ Present' : '❌ Missing'}</div>
            <div>Libraries: {LIBRARIES.join(', ')}</div>
            <div>Error Type: {loadError.name}</div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Loading state - clear and informative
  if (!isLoaded || loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Google Maps...</h2>
          <div className="space-y-1 text-sm text-gray-500">
            <div>API Status: {isLoaded ? '✅ Loaded' : '⏳ Loading...'}</div>
            <div>Location: {userLocation ? '✅ Found' : '🔍 Searching...'}</div>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering Google Map component');

  return (
    <div className="w-full h-full relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={defaultOptions}
      >
        {/* Minimal content - just the map working */}
        {userLocation && (
          <Marker
            position={userLocation}
            title="Your Location"
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 8
            }}
          />
        )}
      </GoogleMap>
      
      {/* Debug overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg text-xs font-mono">
        <div className="font-semibold text-green-600 mb-2">✅ Map Loaded Successfully</div>
        <div>Center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}</div>
        <div>User: {user ? user.email : 'Not signed in'}</div>
        <div>Location: {userLocation ? '✅ Available' : '❌ Not available'}</div>
        <div>Events Mode: {isEventsOnlyMode ? '🎉 ON' : '📍 OFF'}</div>
        <div className="mt-2 pt-2 border-t">
          <div>API: {API_KEY.substring(0, 20)}...</div>
          <div>Map Instance: {map ? '✅ Ready' : '❌ Not ready'}</div>
        </div>
      </div>
    </div>
  );
};

export default ReliableMapView;