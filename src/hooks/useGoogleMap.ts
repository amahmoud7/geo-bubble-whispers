
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export const useGoogleMap = () => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const [isAttemptingStreetView, setIsAttemptingStreetView] = useState<boolean>(false);
  const [isInStreetView, setIsInStreetView] = useState(false);
  const [streetViewPosition, setStreetViewPosition] = useState<{ lat: number; lng: number } | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);

    const streetViewControl = map.getStreetView();
    streetViewControl.addListener('visible_changed', () => {
      setIsAttemptingStreetView(streetViewControl.getVisible());
      setIsInStreetView(streetViewControl.getVisible());
    });

    streetViewControl.addListener('position_changed', () => {
      if (streetViewControl.getVisible()) {
        const position = streetViewControl.getPosition();
        if (position) {
          setStreetViewPosition({
            lat: position.lat(),
            lng: position.lng()
          });
        }
      }
    });

    // Add click listener for street view
    streetViewControl.addListener('click', (event: google.maps.MouseEvent) => {
      if (streetViewControl.getVisible() && event.latLng) {
        const position = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        // Dispatch a custom event with the clicked position
        window.dispatchEvent(new CustomEvent('streetViewClick', { 
          detail: position 
        }));
      }
    });
  }, []);

  const handleCancelStreetView = useCallback(() => {
    if (map) {
      const streetViewControl = map.getStreetView();
      streetViewControl.setVisible(false);
      setIsAttemptingStreetView(false);
      setIsInStreetView(false);
      setStreetViewPosition(null);
    }
  }, [map]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onSearchBoxLoad = useCallback((ref: google.maps.places.SearchBox) => {
    setSearchBox(ref);
  }, []);

  return {
    map,
    searchBox,
    isAttemptingStreetView,
    isInStreetView,
    streetViewPosition,
    onLoad,
    onUnmount,
    onSearchBoxLoad,
    handleCancelStreetView,
  };
};
