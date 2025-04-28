
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

    // Add click listener for street view with correct event type
    streetViewControl.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (streetViewControl.getVisible() && event.latLng) {
        const position = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
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

    // Add search box event listener
    ref.addListener('places_changed', () => {
      const places = ref.getPlaces();
      if (!places || places.length === 0) {
        return;
      }

      // Get the first place and update map
      const place = places[0];
      if (!place.geometry || !place.geometry.location) {
        toast({
          title: "No location found",
          description: "Please try a different search term",
          variant: "destructive"
        });
        return;
      }

      // Update map to show the selected location
      if (map) {
        if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else {
          map.setCenter(place.geometry.location);
          map.setZoom(15);
        }

        // Notify user
        toast({
          title: "Location found",
          description: `Showing results for ${place.name || 'selected location'}`
        });
      }
    });
  }, [map]);

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
