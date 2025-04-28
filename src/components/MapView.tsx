
import React, { useEffect } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import MapControls from './map/MapControls';
import StreetViewControls from './map/StreetViewControls';
import PlacementIndicator from './map/PlacementIndicator';
import MessagesDisplay from './map/MessagesDisplay';
import { usePinPlacement } from '@/hooks/usePinPlacement';
import { useGoogleMap } from '@/hooks/useGoogleMap';
import { useMapState } from '@/hooks/useMapState';
import { useLocationInit } from '@/hooks/useLocation';
import { defaultMapOptions } from '@/config/mapStyles';

const MapView: React.FC = () => {
  const {
    selectedMessage,
    setSelectedMessage,
    isCreating,
    setIsCreating,
    filters,
    userLocation,
    setUserLocation,
    handleFilterChange,
    filteredMessages,
  } = useMapState();

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

  useLocationInit(setUserLocation, setSelectedMessage);

  useEffect(() => {
    if (map && userLocation) {
      map.panTo(userLocation);
      map.setZoom(15);
    }
  }, [map, userLocation]);

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
  };

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
        <MessagesDisplay
          selectedMessage={selectedMessage}
          isCreating={isCreating}
          newPinPosition={newPinPosition}
          isPlacingPin={isPlacingPin}
          filteredMessages={filteredMessages}
          onMessageClick={setSelectedMessage}
          onClose={handleClose}
        />
      </GoogleMap>
    </div>
  );
};

export default MapView;
