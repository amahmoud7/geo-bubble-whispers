import React from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES = ['places'] as const;

const SimpleMapTest = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCja18mhM6OgcQPkZp7rCZM6C29SGz3S4U',
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  console.log('🧪 SimpleMapTest: isLoaded =', isLoaded, 'loadError =', loadError);

  if (loadError) {
    return (
      <div className="w-full h-screen bg-red-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Map Load Error</h1>
          <p className="text-red-700 mt-2">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-screen bg-blue-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-600">Loading Maps...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded shadow">
        <h1 className="font-bold text-green-600">✅ Google Maps Loaded Successfully!</h1>
        <p>API Key: AIzaSyC...SGz3S4U</p>
      </div>
      
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat: 37.7749, lng: -122.4194 }}
        zoom={13}
        onLoad={(map) => {
          console.log('✅ Google Maps instance loaded:', map);
        }}
      />
    </div>
  );
};

export default SimpleMapTest;