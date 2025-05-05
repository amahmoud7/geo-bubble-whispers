
import React from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import MapControls from './map/MapControls';
import StreetViewController from './map/StreetViewController';
import MessageCreationController from './map/MessageCreationController';
import MessageDisplayController from './map/MessageDisplayController';
import { usePinPlacement } from '@/hooks/usePinPlacement';
import { useGoogleMap } from '@/hooks/useGoogleMap';
import { useMessages } from '@/hooks/useMessages';
import { useMessageState } from '@/hooks/useMessageState';
import { useUserLocation } from '@/hooks/useUserLocation';
import { defaultMapOptions } from '@/config/mapStyles';
import { mockMessages } from '@/mock/messages';
import { useAuth } from '@/hooks/useAuth';

const MapView: React.FC = () => {
  const { userLocation } = useUserLocation();
  const { filters, filteredMessages, handleFilterChange } = useMessages();
  const { user } = useAuth();
  
  const {
    selectedMessage,
    setSelectedMessage,
    isCreating,
    setIsCreating,
    handleClose
  } = useMessageState();

  const {
    map,
    isInStreetView,
    onLoad,
    onUnmount,
    onSearchBoxLoad,
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

  const handleCreateMessage = () => {
    setIsCreating(true);
    startPinPlacement();
    setSelectedMessage(null);

    if (isInStreetView && map) {
      const streetViewControl = map.getStreetView();
      const position = streetViewControl.getPosition();
      if (position) {
        const newPos = {
          lat: position.lat(),
          lng: position.lng()
        };
        setNewPinPosition(newPos);
      }
    }
  };

  const handleMessageClick = (id: string) => {
    setSelectedMessage(id);
    if (isCreating) {
      setIsCreating(false);
      endPinPlacement();
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  // Get the user avatar for the new pin
  const userAvatar = user?.user_metadata?.avatar_url || '/placeholder.svg';
  const userName = user?.user_metadata?.name;

  // Add cursor-pin class when in pin placement mode
  const mapContainerClassName = `map-container relative w-full h-[calc(100vh-4rem)] ${isPlacingPin ? 'cursor-pin' : ''}`;

  return (
    <div className={mapContainerClassName}>
      <MapControls
        onCreateMessage={handleCreateMessage}
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearchBoxLoad={onSearchBoxLoad}
      />

      <StreetViewController
        map={map}
        isPlacingPin={isPlacingPin}
        setNewPinPosition={setNewPinPosition}
        onCreateMessage={handleCreateMessage}
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
        <MessageDisplayController
          selectedMessage={selectedMessage}
          filteredMessages={filteredMessages}
          mockMessages={mockMessages}
          onMessageClick={handleMessageClick}
          onClose={handleClose}
        />
      </GoogleMap>

      <MessageCreationController
        isCreating={isCreating}
        isInStreetView={isInStreetView}
        isPlacingPin={isPlacingPin}
        newPinPosition={newPinPosition}
        userAvatar={userAvatar}
        userName={userName}
        handleClose={handleClose}
        handleCreateMessage={handleCreateMessage}
      />
    </div>
  );
};

export default MapView;
