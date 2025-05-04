
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import StreetViewControls from './StreetViewControls';
import { useGoogleMap } from '@/hooks/useGoogleMap';
import { useMessageState } from '@/hooks/useMessageState';
import { toast } from '@/hooks/use-toast';

interface StreetViewControllerProps {
  map: google.maps.Map | null;
  isPlacingPin: boolean;
  setNewPinPosition: (position: { lat: number; lng: number }) => void;
  onCreateMessage: () => void;
}

const StreetViewController: React.FC<StreetViewControllerProps> = ({
  map,
  isPlacingPin,
  setNewPinPosition,
  onCreateMessage
}) => {
  const location = useLocation();
  const { setSelectedMessage } = useMessageState();
  const {
    isAttemptingStreetView,
    isInStreetView,
    streetViewPosition,
    handleCancelStreetView,
    activateStreetView,
  } = useGoogleMap();

  // Handle street view activation from navigation state
  useEffect(() => {
    if (location.state && location.state.activateStreetView && location.state.center && map) {
      const { lat, lng } = location.state.center;
      
      // Set a small timeout to ensure map is fully loaded
      setTimeout(() => {
        activateStreetView({ lat, lng });
        
        if (location.state.messageId) {
          setSelectedMessage(location.state.messageId);
        }
      }, 500);
    }
  }, [location.state, map, activateStreetView, setSelectedMessage]);

  // Listen for street view clicks to place pins
  useEffect(() => {
    const handleStreetViewClick = (e: CustomEvent<{lat: number, lng: number}>) => {
      if (isPlacingPin && isInStreetView && e.detail) {
        setNewPinPosition(e.detail);
        toast({
          title: "Street View location selected",
          description: "Now you can create your Lo at this location",
        });
      }
    };

    window.addEventListener('streetViewClick', handleStreetViewClick as EventListener);
    
    return () => {
      window.removeEventListener('streetViewClick', handleStreetViewClick as EventListener);
    };
  }, [isPlacingPin, isInStreetView, setNewPinPosition]);

  if (!isAttemptingStreetView) return null;

  return (
    <StreetViewControls
      onCancelStreetView={handleCancelStreetView}
      onCreateMessage={onCreateMessage}
      isInStreetView={isInStreetView}
    />
  );
};

export default StreetViewController;
