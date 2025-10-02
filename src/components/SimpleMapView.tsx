import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { defaultMapOptions } from '@/config/mapStyles';

// Static libraries array to prevent LoadScript warning
const GOOGLE_MAPS_LIBRARIES = ['places'] as const;

interface SimpleMapViewProps {
  isEventsOnlyMode?: boolean;
}

const SimpleMapView = React.forwardRef<any, SimpleMapViewProps>(({ isEventsOnlyMode = false }, ref) => {
  // Use hardcoded location for simplicity
  const userLocation = { lat: 37.7749, lng: -122.4194 };

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script-home', // Different ID to avoid conflicts
    googleMapsApiKey: 'AIzaSyCja18mhM6OgcQPkZp7rCZM6C29SGz3S4U',
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  // Simple onLoad function
  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    console.log('🗺️ SimpleMapView: Map loaded successfully:', mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    console.log('🗺️ SimpleMapView: Map unmounting');
  }, []);

  // Debug logging
  console.log('🗺️ SimpleMapView: isLoaded =', isLoaded, 'loadError =', loadError);
  console.log('🗺️ SimpleMapView: window.google =', typeof window.google);
  
  // Check if Google Maps is already loaded globally
  if (typeof window.google !== 'undefined' && window.google.maps) {
    console.log('🗺️ SimpleMapView: Google Maps already loaded globally!');
  }

  // Handle loading error
  if (loadError) {
    console.error('🚨 SimpleMapView: Load Error:', loadError);
    return (
      <div className="w-full h-full bg-red-100 flex items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-xl font-bold text-red-600 mb-2">Map Load Error</h2>
          <p className="text-red-700">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    console.log('⏳ SimpleMapView: Still loading...', new Date().toISOString());
    return (
      <div className="w-full h-full bg-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-blue-700">Loading Google Maps...</h2>
          <p className="text-blue-600 mt-2">Please wait... (${new Date().getSeconds()}s)</p>
          <div className="mt-4 text-xs text-blue-500">
            API Key: AIzaSyC...SGz3S4U<br/>
            ID: google-map-script-home<br/>
            Libraries: {JSON.stringify(GOOGLE_MAPS_LIBRARIES)}
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ SimpleMapView: Loaded successfully, rendering map...');

  return (
    <div className="map-container relative w-full h-full">
      {/* Debug info */}
      <div className="absolute top-4 left-4 z-50 bg-white/90 rounded-lg p-3 shadow-lg text-xs">
        <div className="text-green-600 font-semibold">✅ SimpleMapView Active</div>
        <div>Center: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</div>
        <div>API: AIzaSyC...SGz3S4U</div>
      </div>

      {/* Simple Google Map */}
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={userLocation}
        zoom={13}
        onLoad={(mapInstance) => {
          console.log('🗺️ SimpleMapView GoogleMap onLoad callback triggered:', mapInstance);
          onLoad(mapInstance);
        }}
        onUnmount={onUnmount}
        options={defaultMapOptions}
      />
    </div>
  );
});

SimpleMapView.displayName = 'SimpleMapView';

export default SimpleMapView;