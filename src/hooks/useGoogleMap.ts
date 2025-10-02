
import { useState, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { eventBus } from '@/utils/eventBus';

export const useGoogleMap = () => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const [isAttemptingStreetView, setIsAttemptingStreetView] = useState<boolean>(false);
  const [isInStreetView, setIsInStreetView] = useState(false);
  const [streetViewPosition, setStreetViewPosition] = useState<{ lat: number; lng: number } | null>(null);
  const streetViewPanoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);

    const streetViewControl = map.getStreetView();
    streetViewPanoramaRef.current = streetViewControl;
    
    // Configure Street View
    streetViewControl.setOptions({
      enableCloseButton: true,
      imageDateControl: true,
      visible: false,
      motionTracking: false,
      motionTrackingControl: false,
      addressControl: true,
    });
    
    streetViewControl.addListener('visible_changed', () => {
      setIsAttemptingStreetView(streetViewControl.getVisible());
      setIsInStreetView(streetViewControl.getVisible());
      
      if (streetViewControl.getVisible()) {
        toast({
          title: "Street View activated",
          description: "You can now drop a Lo in Street View mode",
        });
      }
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
    streetViewControl.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (streetViewControl.getVisible() && event.latLng) {
        const position = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        eventBus.emit('streetViewClick', position);
      }
    });

    // Add pano changed listener to update position
    streetViewControl.addListener('pano_changed', () => {
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

  const activateStreetView = useCallback((position: { lat: number; lng: number }) => {
    if (!map) return;
    
    setIsAttemptingStreetView(true);
    
    const streetViewService = new google.maps.StreetViewService();
    
    // Check if Street View is available at the location
    streetViewService.getPanorama({
      location: new google.maps.LatLng(position.lat, position.lng),
      radius: 50 // Within 50 meters
    }, (data, status) => {
      if (status === google.maps.StreetViewStatus.OK) {
        // Street View is available at this location
        const streetViewControl = map.getStreetView();
        streetViewControl.setPosition(new google.maps.LatLng(position.lat, position.lng));
        streetViewControl.setVisible(true);
        
        setIsInStreetView(true);
        setStreetViewPosition(position);
        
        toast({
          title: "Street View Loaded",
          description: "Now viewing location in Street View mode"
        });
      } else {
        // Street View is not available at this location
        setIsAttemptingStreetView(false);
        
        toast({
          title: "Street View not available",
          description: "Street View isn't available at this location",
          variant: "destructive"
        });
      }
    });
  }, [map]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onSearchBoxLoad = useCallback((ref: google.maps.places.SearchBox) => {
    console.log('🔍 Search box loaded:', ref);
    setSearchBox(ref);

    // Add search box event listener
    const placesChangedListener = ref.addListener('places_changed', () => {
      console.log('🔍 Places changed event triggered');
      const places = ref.getPlaces();
      console.log('🔍 Places found:', places?.length || 0);
      
      if (!places || places.length === 0) {
        console.log('🔍 No places returned from search');
        toast({
          title: "No results found",
          description: "Please try a different search term",
          variant: "destructive"
        });
        return;
      }

      // Get the first place and update map
      const place = places[0];
      console.log('🔍 Selected place:', place.name, place.geometry?.location?.toString());
      
      if (!place.geometry || !place.geometry.location) {
        console.log('🔍 Place has no geometry/location');
        toast({
          title: "No location found",
          description: "Please try a different search term",
          variant: "destructive"
        });
        return;
      }

      // Update map to show the selected location
      if (map) {
        console.log('🔍 Updating map to show location');
        if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else {
          map.setCenter(place.geometry.location);
          map.setZoom(15);
        }

        // Clear search input
        const inputs = document.querySelectorAll('input[placeholder*="Search places"]');
        inputs.forEach(input => (input as HTMLInputElement).value = '');

        // Notify user
        toast({
          title: "Location found",
          description: `Showing results for ${place.name || 'selected location'}`
        });
      } else {
        console.log('🔍 Map not available for location update');
      }
    });

    // Return cleanup function
    return () => {
      if (placesChangedListener) {
        google.maps.event.removeListener(placesChangedListener);
      }
    };
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
    activateStreetView,
  };
};
