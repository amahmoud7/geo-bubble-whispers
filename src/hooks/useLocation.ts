
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface LocationState {
  center?: { lat: number; lng: number };
  messageId?: string;
}

export const useLocationInit = (
  setUserLocation: (location: { lat: number; lng: number }) => void,
  setSelectedMessage: (messageId: string | null) => void
) => {
  const location = useLocation();

  useEffect(() => {
    if (location.state) {
      const { center, messageId } = location.state as LocationState;
      
      if (center) {
        setUserLocation(center);
        if (messageId) {
          setSelectedMessage(messageId);
        }
      }
    }
  }, [location.state, setUserLocation, setSelectedMessage]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!(location.state as LocationState)?.center) {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          }
        },
        () => {
          console.log('Error getting location');
        }
      );
    }
  }, [location.state, setUserLocation]);
};
