import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useLocation } from 'react-router-dom';
import MessageDetail from './MessageDetail';
import CreateMessage from './CreateMessage';
import MessageMarkers from './map/MessageMarkers';
import MapControls from './map/MapControls';
import StreetViewControls from './map/StreetViewControls';
import PlacementIndicator from './map/PlacementIndicator';
import { usePinPlacement } from '@/hooks/usePinPlacement';
import { useGoogleMap } from '@/hooks/useGoogleMap';
import { defaultMapOptions } from '@/config/mapStyles';
import { mockMessages } from '@/mock/messages';
import { toast } from '@/hooks/use-toast';

const MapView: React.FC = () => {
  const location = useLocation();
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    showPublic: true,
    showFollowers: true,
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 40.7128,
    lng: -74.0060
  });
  const [, forceUpdate] = useState({});

  const {
    map,
    searchBox,
    isAttemptingStreetView,
    isInStreetView,
    streetViewPosition,
    onLoad,
    onUnmount,
    onSearchBoxLoad,
    handleCancelStreetView,
  } = useGoogleMap();

  const {
    newPinPosition,
    isPlacingPin,
    handleMapClick,
    startPinPlacement,
    endPinPlacement,
    setNewPinPosition,
  } = usePinPlacement();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCja18mhM6OgcQPkZp7rCZM6C29SGz3S4U',
    libraries: ['places']
  });

  useEffect(() => {
    if (location.state) {
      const { center, messageId } = location.state as { center?: { lat: number; lng: number }, messageId?: string };
      
      if (center) {
        setUserLocation(center);
        if (messageId) {
          setSelectedMessage(messageId);
        }
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (map && userLocation) {
      map.panTo(userLocation);
      map.setZoom(15);
    }
  }, [map, userLocation]);

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

  const handleCreateMessage = () => {
    setIsCreating(true);
    startPinPlacement();
    setSelectedMessage(null);

    if (isInStreetView && streetViewPosition) {
      setNewPinPosition(streetViewPosition);
    }
  };

  const handleClose = () => {
    setSelectedMessage(null);
    setIsCreating(false);
    endPinPlacement();
    forceUpdate({});
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

      {isAttemptingStreetView && (
        <StreetViewControls
          onCancelStreetView={handleCancelStreetView}
          onCreateMessage={handleCreateMessage}
          isInStreetView={isInStreetView}
        />
      )}

      <PlacementIndicator isPlacingPin={isPlacingPin} />

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
          onMessageClick={setSelectedMessage}
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
