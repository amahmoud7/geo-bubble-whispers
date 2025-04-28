
import React from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import MessageDetail from './MessageDetail';
import CreateMessage from './CreateMessage';
import MessageMarkers from './map/MessageMarkers';
import MapControls from './map/MapControls';
import StreetViewControls from './map/StreetViewControls';
import CreateMessageButton from './map/CreateMessageButton';
import PlacementIndicator from './map/PlacementIndicator';
import { usePinPlacement } from '@/hooks/usePinPlacement';
import { useGoogleMap } from '@/hooks/useGoogleMap';
import { useMessages } from '@/hooks/useMessages';
import { useMessageState } from '@/hooks/useMessageState';
import { useUserLocation } from '@/hooks/useUserLocation';
import { defaultMapOptions } from '@/config/mapStyles';
import { mockMessages } from '@/mock/messages';

const MapView: React.FC = () => {
  const { userLocation } = useUserLocation();
  const { filters, filteredMessages, handleFilterChange } = useMessages();
  const {
    selectedMessage,
    setSelectedMessage,
    isCreating,
    setIsCreating,
    handleClose
  } = useMessageState();

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

  const handleCreateMessage = () => {
    setIsCreating(true);
    startPinPlacement();
    setSelectedMessage(null);

    if (isInStreetView && streetViewPosition) {
      setNewPinPosition(streetViewPosition);
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

      <CreateMessageButton onClick={handleCreateMessage} />

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
                isPublic: true,
                user: {
                  avatar: ''
                }
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
