/**
 * Map Loading Component
 * 
 * Displays while Google Maps API is loading
 */

import React from 'react';
import { MapPin, Loader2 } from 'lucide-react';

const MapLoading: React.FC = () => {
  // Log loading state
  React.useEffect(() => {
    console.log('🗺️ MapLoading component mounted - showing loading UI');
    
    // If still loading after 10 seconds, log warning
    const timeout = setTimeout(() => {
      console.warn('⚠️ Map is taking longer than expected to load (>10s)');
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-lo-navy via-lo-dark-blue to-lo-near-black">
      <div className="space-y-6 text-center">
        {/* Animated Map Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-lo-teal opacity-75"></div>
            <div className="relative rounded-full bg-lo-teal p-6">
              <MapPin className="h-12 w-12 text-lo-navy" />
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">
            Loading Map
          </h2>
          <div className="flex items-center justify-center gap-2 text-lo-teal">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Initializing Google Maps...</p>
          </div>
        </div>

        {/* Loading Dots Animation */}
        <div className="flex justify-center gap-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-lo-teal [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-lo-teal [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-lo-teal"></div>
        </div>
        
        {/* Debug info */}
        {import.meta.env.DEV && (
          <div className="mt-6 text-xs text-white/50">
            <p>If this takes more than 10 seconds, check console logs</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapLoading;
