
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import MessageDetail from './MessageDetail';
import CreateMessage from './CreateMessage';
import MessageMarkers from './map/MessageMarkers';
import MapControls from './map/MapControls';
import { usePinPlacement } from '@/hooks/usePinPlacement';
import { defaultMapOptions } from '@/config/mapStyles';
import { mockMessages } from '@/mock/messages';

const MapView: React.FC = () => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
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

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="map-container relative w-full h-[calc(100vh-4rem)]">
      <MapControls
        onCreateMessage={handleCreateMessage}
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearchBoxLoad={onSearchBoxLoad}
      />

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
      
      {isCreating && (
        <CreateMessage 
          onClose={handleClose}
          initialPosition={newPinPosition || undefined}
        />
      )}
    </div>
  );
};

export default MapView;
