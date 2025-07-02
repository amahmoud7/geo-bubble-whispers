
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useUserLocation = () => {
  const location = useLocation();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 34.0522,
    lng: -118.2437
  });

  useEffect(() => {
    if (location.state) {
      const { center, messageId } = location.state as { 
        center?: { lat: number; lng: number }, 
        messageId?: string 
      };
      
      if (center) {
        setUserLocation(center);
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!location.state?.center) {
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
  }, [location.state]);

  return { userLocation };
};
