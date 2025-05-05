
import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export interface PinPosition {
  lat: number;
  lng: number;
}

export const usePinPlacement = () => {
  const [newPinPosition, setNewPinPosition] = useState<PinPosition | null>(null);
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (isPlacingPin && e.latLng) {
      const newPosition = {
        lat: e.latLng?.lat() || 0,
        lng: e.latLng?.lng() || 0
      };
      setNewPinPosition(newPosition);
      toast({
        title: "Location selected",
        description: "Now you can create your Lo at this location",
      });
      
      if (isManualMode) {
        setIsManualMode(false);
      }
    }
  }, [isPlacingPin, isManualMode]);

  // Add handler for street view clicks
  useEffect(() => {
    const handleStreetViewClick = (e: CustomEvent<PinPosition>) => {
      if (isPlacingPin && e.detail) {
        setNewPinPosition(e.detail);
        toast({
          title: "Street View location selected",
          description: "Now you can create your Lo at this street view location",
        });
        
        if (isManualMode) {
          setIsManualMode(false);
        }
      }
    };

    window.addEventListener('streetViewClick', handleStreetViewClick as EventListener);
    
    return () => {
      window.removeEventListener('streetViewClick', handleStreetViewClick as EventListener);
    };
  }, [isPlacingPin, isManualMode]);

  const startPinPlacement = useCallback((manual: boolean = false) => {
    setIsPlacingPin(true);
    setIsManualMode(manual);
    
    if (!manual) {
      setNewPinPosition(null);
    }
    
    toast({
      title: "Place your Lo",
      description: "Click anywhere on the map or in Street View to select a location",
    });
  }, []);

  const endPinPlacement = useCallback(() => {
    setIsPlacingPin(false);
    setIsManualMode(false);
    setNewPinPosition(null);
  }, []);

  return {
    newPinPosition,
    isPlacingPin,
    isManualMode,
    handleMapClick,
    startPinPlacement,
    endPinPlacement,
    setNewPinPosition,
    setIsManualMode
  };
};
