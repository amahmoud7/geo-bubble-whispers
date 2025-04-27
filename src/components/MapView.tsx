import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import MessageDetail from './MessageDetail';
import CreateMessage from './CreateMessage';
import MessageMarkers from './map/MessageMarkers';
import MapControls from './map/MapControls';
import { usePinPlacement } from '@/hooks/usePinPlacement';
import { defaultMapOptions } from '@/config/mapStyles';
import { mockMessages } from '@/mock/messages';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const MapView: React.FC = () => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isAttemptingStreetView, setIsAttemptingStreetView] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    showPublic: true,
    showFollowers: true,
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 40.7128,
    lng: -74.0060
  });
  const [isInStreetView, setIsInStreetView] = useState(false);
  const [streetViewPosition, setStreetViewPosition] = useState<{ lat: number; lng: number } | null>(null);

  const {
    newPinPosition,
    isPlacingPin,
    handleMapClick,
    startPinPlacement,
    endPinPlacement
  } = usePinPlacement();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCja18mhM6OgcQPkZp7rCZM6C29SGz3S4U',
    libraries: ['places']
  });

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
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onSearchBoxLoad = (ref: google.maps.places.SearchBox) => {
    setSearchBox(ref);
  };

  useEffect(() => {
    if (!searchBox || !map) return;

    const listener = searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();
      if (!places || places.length === 0) return;

      const bounds = new google.maps.LatLngBounds();
      places.forEach((place) => {
        if (!place.geometry || !place.geometry.location) return;

        if (place.geometry.viewport) {
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });

      map.fitBounds(bounds);
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [searchBox, map]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.log('Error getting location');
        }
      );
    }
  }, []);

  const handleBubbleClick = (id: string) => {
    setSelectedMessage(id);
    setIsCreating(false);
  };

  const handleCreateMessage = () => {
    setIsCreating(true);
    startPinPlacement();
    setSelectedMessage(null);

    if (isInStreetView && streetViewPosition) {
      setNewPinPosition(streetViewPosition);
      toast({
        title: "Location selected",
        description: "Current street view position will be used for your Lo",
      });
    } else {
      toast({
        title: "Place your Lo",
        description: "Click on the map to place your Lo",
      });
    }
  };

  const handleClose = () => {
    setSelectedMessage(null);
    setIsCreating(false);
    endPinPlacement();
  };

  const handleFilterChange = (type: 'showPublic' | 'showFollowers', checked: boolean) => {
    setFilters(prev => ({ ...prev, [type]: checked }));
  };

  const filteredMessages = mockMessages.filter(message => {
    if (message.isPublic && filters.showPublic) return true;
    if (!message.isPublic && filters.showFollowers) return true;
    return false;
  });

  const handleCancelStreetView = () => {
    if (map) {
      const streetViewControl = map.getStreetView();
      streetViewControl.setVisible(false);
      setIsAttemptingStreetView(false);
      setIsInStreetView(false);
      setStreetViewPosition(null);
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="map-container relative w-full h-[calc(100vh-4rem)]">
      <MapControls
        onCreateMessage={handleCreateMessage}
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearchBoxLoad={onSearchBoxLoad}
      />

      <Button
        onClick={handleCreateMessage}
        className="absolute right-8 top-1/2 transform -translate-y-1/2 z-20 h-12 w-12 rounded-full shadow-lg"
        variant="default"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {isAttemptingStreetView && (
        <div className="absolute right-8 top-8 z-20 flex flex-col gap-2">
          <Button
            onClick={handleCancelStreetView}
            className="flex items-center gap-2 shadow-lg"
            variant="destructive"
          >
            <X className="h-4 w-4" />
            Exit Street View
          </Button>
          {isInStreetView && (
            <Button
              onClick={handleCreateMessage}
              className="flex items-center gap-2 shadow-lg"
              variant="default"
            >
              <MessageSquare className="h-4 w-4" />
              Drop Lo Here
            </Button>
          )}
        </div>
      )}

      {isPlacingPin && (
        <div className="absolute left-1/2 top-8 z-20 transform -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm">Click on the map to place your Lo</span>
        </div>
      )}

      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={userLocation}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={defaultMapOptions}
      >
        <MessageMarkers 
          messages={filteredMessages}
          onMessageClick={handleBubbleClick}
        />

        {isPlacingPin && newPinPosition && (
          <MessageMarkers
            messages={[
              {
                id: 'new-pin',
                position: { x: newPinPosition.lat, y: newPinPosition.lng },
                isPublic: true
              }
            ]}
            onMessageClick={() => {}}
          />
        )}
      </GoogleMap>

      {selectedMessage && (
        <MessageDetail 
          message={mockMessages.find(m => m.id === selectedMessage)!}
          onClose={handleClose}
        />
      )}
      
      {isCreating && newPinPosition && (
        <CreateMessage 
          onClose={handleClose}
          initialPosition={newPinPosition}
        />
      )}
    </div>
  );
};

export default MapView;
