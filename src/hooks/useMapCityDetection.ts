// Hook to detect the nearest major city based on map center position
// This allows users to navigate the map and get events for different cities

import { useState, useEffect, useCallback } from 'react';
import { detectNearestCity, isWithinEventRadius, getOptimalSearchRadius, type City } from '@/utils/cityDetection';

export const useMapCityDetection = (map: google.maps.Map | null) => {
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [isWithinRange, setIsWithinRange] = useState(true);
  const [searchRadius, setSearchRadius] = useState<number>(50);
  const [detectionOptions, setDetectionOptions] = useState({ preferLargeMetros: true });

  // Function to detect city from current map center
  const detectCityFromMapCenter = useCallback(() => {
    if (!map) return;

    const center = map.getCenter();
    if (!center) return;

    const centerLat = center.lat();
    const centerLng = center.lng();
    
    console.log(`🗺️ MAP CENTER: Detecting city from map center: ${centerLat}, ${centerLng}`);
    setMapCenter({ lat: centerLat, lng: centerLng });

    // Calculate optimal search radius based on location
    const optimalRadius = getOptimalSearchRadius(centerLat, centerLng);
    setSearchRadius(optimalRadius);
    
    // Check if map center is within range of any major city (expanded coverage)
    const withinRange = isWithinEventRadius(centerLat, centerLng, 150); // Expanded radius for nationwide coverage
    setIsWithinRange(withinRange);
    console.log(`🗺️ MAP CENTER: Within range of major cities: ${withinRange} (optimal radius: ${optimalRadius} miles)`);

    if (withinRange) {
      // Detect nearest major city from map center with intelligent fallback
      const nearestCity = detectNearestCity(centerLat, centerLng, {
        maxDistance: 200, // Expanded search distance
        preferLargeMetros: detectionOptions.preferLargeMetros
      });
      setCurrentCity(nearestCity);
      const distance = Math.round(calculateDistance(centerLat, centerLng, nearestCity.coordinates.lat, nearestCity.coordinates.lng));
      console.log(`🎯 MAP CITY: Detected ${nearestCity.displayName} (${nearestCity.id}) from map position`);
      console.log(`🎯 MAP CITY: Distance to ${nearestCity.displayName}: ${distance} miles (metro: ${nearestCity.metroArea})`);
      console.log(`🎯 MAP CITY: Using radius: ${nearestCity.radius} miles, TM Market: ${nearestCity.ticketmasterMarketId || 'N/A'}`);
    } else {
      // Enhanced fallback - try to find the nearest city even if outside normal range
      const nearestCity = detectNearestCity(centerLat, centerLng, {
        maxDistance: 500, // Very large fallback radius
        preferLargeMetros: true
      });
      const distance = calculateDistance(centerLat, centerLng, nearestCity.coordinates.lat, nearestCity.coordinates.lng);
      
      if (distance <= 300) { // Still provide limited service for remote areas
        setCurrentCity(nearestCity);
        console.log(`🗺️ FALLBACK CITY: Using ${nearestCity.displayName} (${Math.round(distance)} miles away) for remote location`);
      } else {
        setCurrentCity(null);
        console.log(`🗺️ MAP CENTER: Location too remote - no events available (nearest: ${nearestCity.displayName} at ${Math.round(distance)} miles)`);
      }
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

  // Method to update detection preferences
  const updateDetectionOptions = useCallback((options: { preferLargeMetros?: boolean }) => {
    setDetectionOptions(prev => ({ ...prev, ...options }));
    // Re-run detection with new options
    setTimeout(() => detectCityFromMapCenter(), 100);
  }, [detectCityFromMapCenter]);

  return {
    currentCity,
    mapCenter,
    isWithinRange,
    searchRadius,
    updateCityDetection,
    updateDetectionOptions,
    detectionOptions
  };
};