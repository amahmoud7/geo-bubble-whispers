// Hook to detect the nearest major city based on map center position
// This allows users to navigate the map and get events for different cities

import { useState, useEffect, useCallback } from 'react';
import { detectNearestCity, isWithinEventRadius, type City } from '@/utils/cityDetection';

export const useMapCityDetection = (map: google.maps.Map | null) => {
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [isWithinRange, setIsWithinRange] = useState(true);

  // Function to detect city from current map center
  const detectCityFromMapCenter = useCallback(() => {
    if (!map) return;

    const center = map.getCenter();
    if (!center) return;

    const centerLat = center.lat();
    const centerLng = center.lng();
    
    console.log(`🗺️ MAP CENTER: Detecting city from map center: ${centerLat}, ${centerLng}`);
    setMapCenter({ lat: centerLat, lng: centerLng });

    // Check if map center is within range of any major city
    const withinRange = isWithinEventRadius(centerLat, centerLng, 100); // Larger radius for map-based detection
    setIsWithinRange(withinRange);
    console.log(`🗺️ MAP CENTER: Within range of major cities: ${withinRange}`);

    if (withinRange) {
      // Detect nearest major city from map center
      const nearestCity = detectNearestCity(centerLat, centerLng);
      setCurrentCity(nearestCity);
      console.log(`🎯 MAP CITY: Detected ${nearestCity.displayName} (${nearestCity.id}) from map position`);
      console.log(`🎯 MAP CITY: Distance to ${nearestCity.displayName}: ${Math.round(calculateDistance(centerLat, centerLng, nearestCity.coordinates.lat, nearestCity.coordinates.lng))} miles`);
    } else {
      // No fallback - if user is outside major cities, don't show events
      setCurrentCity(null);
      console.log(`🗺️ MAP CENTER: Outside major cities - no events available`);
    }
  }, [map]);

  // Helper function for distance calculation (duplicated from utils for debugging)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  // Set up map listeners when map is available
  useEffect(() => {
    if (!map) return;

    console.log(`🗺️ MAP SETUP: Setting up map center detection listeners`);

    // Detect city from initial map center
    detectCityFromMapCenter();

    // Listen for map center changes (when user drags/pans the map)
    const centerChangedListener = map.addListener('center_changed', () => {
      // Debounce the detection to avoid too many calls
      setTimeout(detectCityFromMapCenter, 500);
    });

    // Listen for map zoom changes (might change the view significantly)
    const zoomChangedListener = map.addListener('zoom_changed', () => {
      setTimeout(detectCityFromMapCenter, 500);
    });

    // Listen for map idle (when user stops interacting)
    const idleListener = map.addListener('idle', () => {
      detectCityFromMapCenter();
    });

    console.log(`🗺️ MAP SETUP: Map listeners registered successfully`);

    // Cleanup listeners when component unmounts or map changes
    return () => {
      google.maps.event.removeListener(centerChangedListener);
      google.maps.event.removeListener(zoomChangedListener);
      google.maps.event.removeListener(idleListener);
      console.log(`🗺️ MAP CLEANUP: Removed map listeners`);
    };
  }, [map, detectCityFromMapCenter]);

  // Manual city detection function for immediate updates
  const updateCityDetection = useCallback(() => {
    detectCityFromMapCenter();
  }, [detectCityFromMapCenter]);

  return {
    currentCity,
    mapCenter,
    isWithinRange,
    updateCityDetection
  };
};