
import { useState, useCallback } from 'react';

export interface PinPosition {
  lat: number;
  lng: number;
}

export const usePinPlacement = () => {
  const [newPinPosition, setNewPinPosition] = useState<PinPosition | null>(null);
  const [isPlacingPin, setIsPlacingPin] = useState(false);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (isPlacingPin) {
      const newPosition = {
        lat: e.latLng?.lat() || 0,
        lng: e.latLng?.lng() || 0
      };
      setNewPinPosition(newPosition);
    }
  }, [isPlacingPin]);

  const startPinPlacement = useCallback(() => {
    setIsPlacingPin(true);
  }, []);

  const endPinPlacement = useCallback(() => {
    setIsPlacingPin(false);
    setNewPinPosition(null);
  }, []);

  return {
    newPinPosition,
    isPlacingPin,
    handleMapClick,
    startPinPlacement,
    endPinPlacement,
    setNewPinPosition
  };
};
