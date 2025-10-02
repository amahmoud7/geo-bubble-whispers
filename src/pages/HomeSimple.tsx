import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMapsLoader } from '@/contexts/GoogleMapsContext';
import { useAuth } from '@/hooks/useAuth';

// Minimal Home component for debugging
const HomeSimple = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const { user } = useAuth();

  console.log('🏠 HomeSimple rendering...');
  console.log('🏠 Maps loaded:', isLoaded);
  console.log('🏠 Load error:', loadError);
  console.log('🏠 User:', user?.email);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('📍 Location found:', location);
          setUserLocation(location);
        },
        (error) => {
          console.error('❌ Location error:', error);
          // Use default San Francisco location
          setUserLocation({ lat: 37.7749, lng: -122.4194 });
        }
      );
    } else {
      console.warn('⚠️ Geolocation not supported');
      setUserLocation({ lat: 37.7749, lng: -122.4194 });
    }
  }, []);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8">
          <h1 className="text-xl font-bold text-red-600 mb-4">Maps Error</h1>
          <p className="text-gray-600 mb-4">{loadError.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: true,
    mapTypeControl: true,
    gestureHandling: 'greedy' as const
  };

  const center = userLocation || { lat: 37.7749, lng: -122.4194 };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <header className="bg-white shadow-sm border-b p-4">
        <h1 className="text-xl font-bold text-gray-900">Lo - Simple Test</h1>
        {user && <p className="text-sm text-gray-600">Welcome, {user.email}</p>}
      </header>

      {/* Map container */}
      <main className="h-96">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={13}
          options={mapOptions}
          onLoad={(map) => console.log('✅ Map loaded:', map)}
          onUnmount={() => console.log('🗺️ Map unmounted')}
        >
          {userLocation && (
            <Marker
              position={userLocation}
              title="Your Location"
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 8
              }}
            />
          )}
        </GoogleMap>
      </main>

      {/* Debug info */}
      <div className="p-4 bg-white border-t">
        <h2 className="font-semibold mb-2">Debug Info</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Maps Loaded: {isLoaded ? '✅ Yes' : '❌ No'}</div>
          <div>Location: {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : '❌ None'}</div>
          <div>User: {user ? user.email : '❌ Not signed in'}</div>
          <div>Error: {loadError ? loadError.message : '✅ None'}</div>
        </div>
      </div>
    </div>
  );
};

export default HomeSimple;