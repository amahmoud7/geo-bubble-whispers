
import React, { useState, useEffect } from 'react';
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
import MapViewList from './map/MapViewList';
import { Button } from './ui/button';
import { Map, List } from 'lucide-react';

const MapView: React.FC = () => {
  const { userLocation } = useUserLocation();
  const { filters, filteredMessages, handleFilterChange } = useMessages();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  
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
      {/* View mode toggle */}
      <div className="absolute top-4 right-4 z-50 bg-white rounded-lg shadow-md p-1 flex gap-1">
        <Button 
          variant={viewMode === 'map' ? "default" : "outline"} 
          size="sm" 
          onClick={() => setViewMode('map')}
          className="h-8 w-8 p-0"
        >
          <Map size={16} />
        </Button>
        <Button 
          variant={viewMode === 'split' ? "default" : "outline"} 
          size="sm" 
          onClick={() => setViewMode('split')}
          className="h-8 w-8 p-0"
        >
          <div className="flex h-4 w-4">
            <div className="w-1/2 bg-primary rounded-l-sm"></div>
            <div className="w-1/2 border-l border-background"></div>
          </div>
        </Button>
        <Button 
          variant={viewMode === 'list' ? "default" : "outline"} 
          size="sm" 
          onClick={() => setViewMode('list')}
          className="h-8 w-8 p-0"
        >
          <List size={16} />
        </Button>
      </div>

      <div className="flex h-full w-full">
        {/* Map section - adjusts width based on view mode */}
        <div 
          className={`relative ${
            viewMode === 'map' ? 'w-full' : 
            viewMode === 'split' ? 'w-1/2' : 
            'hidden'
          }`}
        >
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
        </div>

        {/* List section - adjusts width based on view mode */}
        <div 
          className={`bg-background ${
            viewMode === 'list' ? 'w-full' : 
            viewMode === 'split' ? 'w-1/2' : 
            'hidden'
          } overflow-y-auto`}
        >
          <MapViewList 
            messages={filteredMessages}
            onMessageClick={handleMessageClick}
            selectedMessage={selectedMessage}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Message Creation Controller - positioned relative to map section */}
      <div 
        className={`absolute ${
          viewMode === 'map' ? 'inset-0' : 
          viewMode === 'split' ? 'left-0 w-1/2 h-full' : 
          'hidden'
        } pointer-events-none z-10`}
      >
        <div className="relative w-full h-full pointer-events-auto">
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
      </div>
    </div>
  );
};

export default MapView;
