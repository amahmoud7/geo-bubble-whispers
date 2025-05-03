import React, { useEffect } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useLocation } from 'react-router-dom';
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
import { toast } from '@/hooks/use-toast';

const MapView: React.FC = () => {
  const { userLocation } = useUserLocation();
  const { filters, filteredMessages, handleFilterChange } = useMessages();
  const location = useLocation();
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
    activateStreetView,
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
      // In street view, we can immediately show the create message form
      // since we already have the position
      toast({
        title: "Location selected",
        description: "Now you can create your Lo at this location",
      });
    }
  };

  const handleMessageClick = (id: string) => {
    setSelectedMessage(id);
    if (isCreating) {
      setIsCreating(false);
      endPinPlacement();
    }
  };

  // Handle street view activation from navigation state
  useEffect(() => {
    if (location.state && location.state.activateStreetView && location.state.center && map) {
      const { lat, lng } = location.state.center;
      
      // Set a small timeout to ensure map is fully loaded
      setTimeout(() => {
        activateStreetView({ lat, lng });
        
        if (location.state.messageId) {
          setSelectedMessage(location.state.messageId);
        }
      }, 500);
    }
  }, [location.state, map, activateStreetView, setSelectedMessage]);

  // Listen for street view clicks to place pins
  useEffect(() => {
    const handleStreetViewClick = (e: CustomEvent<{lat: number, lng: number}>) => {
      if (isPlacingPin && isInStreetView && e.detail) {
        setNewPinPosition(e.detail);
        toast({
          title: "Street View location selected",
          description: "Now you can create your Lo at this location",
        });
      }
    };

    window.addEventListener('streetViewClick', handleStreetViewClick as EventListener);
    
    return () => {
      window.removeEventListener('streetViewClick', handleStreetViewClick as EventListener);
    };
  }, [isPlacingPin, isInStreetView, setNewPinPosition]);

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="map-container relative w-full h-[calc(100vh-4rem)]">
      <MapControls
        onCreateMessage={handleCreateMessage}
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearchBoxLoad={onSearchBoxLoad}
      />

      {!isInStreetView && (
        <CreateMessageButton onClick={handleCreateMessage} />
      )}

      {isAttemptingStreetView && (
        <StreetViewControls
          onCancelStreetView={handleCancelStreetView}
          onCreateMessage={handleCreateMessage}
          isInStreetView={isInStreetView}
        />
      )}

      {isPlacingPin && !isInStreetView && (
        <PlacementIndicator isPlacingPin={isPlacingPin} />
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
          onMessageClick={handleMessageClick}
        />

        {isPlacingPin && newPinPosition && (
          <MessageMarkers
            messages={[
              {
                id: 'new-pin',
                position: { x: newPinPosition.lat, y: newPinPosition.lng },
                isPublic: true,
                user: {
                  avatar: '',
                  name: 'New'
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
