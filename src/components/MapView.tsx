
import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import MapControls from './map/MapControls';
import StreetViewController from './map/StreetViewController';
import MessageCreationController from './map/MessageCreationController';
import MessageDisplayController from './map/MessageDisplayController';
import LiveStreamMarkers from './livestream/LiveStreamMarkers';
import LiveStreamViewer from './livestream/LiveStreamViewer';
import LiveStreamController from './livestream/LiveStreamController';
import { usePinPlacement } from '@/hooks/usePinPlacement';
import { useGoogleMap } from '@/hooks/useGoogleMap';
import { useMessages } from '@/hooks/useMessages';
import { useMessageState } from '@/hooks/useMessageState';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useLiveStreams } from '@/hooks/useLiveStreams';
import { defaultMapOptions } from '@/config/mapStyles';
import { mockMessages } from '@/mock/messages';
import { useAuth } from '@/hooks/useAuth';
import { useEventMessages } from '@/hooks/useEventMessages';
import EventMarkerIcon from './map/EventMarkerIcon';
import EventDetailModal from './message/EventDetailModal';
import MapViewList from './map/MapViewList';
import { Button } from './ui/button';
import { Map, List } from 'lucide-react';
import { LiveStream } from '@/types/livestream';

const MapView: React.FC = () => {
  const { userLocation } = useUserLocation();
  const { filters, filteredMessages, addMessage, updateMessage, handleFilterChange } = useMessages();
  const { events, eventsStartingSoon } = useEventMessages();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Live streaming state
  const { liveStreams } = useLiveStreams();
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [showStreamViewer, setShowStreamViewer] = useState(false);
  const [showLiveStreamController, setShowLiveStreamController] = useState(false);
  
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

  const handleStreamSelect = (stream: LiveStream) => {
    setSelectedStream(stream);
    setShowStreamViewer(true);
  };

  const handleCloseStreamViewer = () => {
    setShowStreamViewer(false);
    setSelectedStream(null);
  };

  const handleStartLiveStream = () => {
    setShowLiveStreamController(true);
  };

  const handleCloseLiveStreamController = () => {
    setShowLiveStreamController(false);
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
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
            onStartLiveStream={handleStartLiveStream}
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
              onMessageClick={handleMessageClick}
              onClose={handleClose}
            />
            
            <LiveStreamMarkers
              liveStreams={liveStreams}
              onStreamSelect={handleStreamSelect}
              selectedStreamId={selectedStreamId}
              setSelectedStreamId={setSelectedStreamId}
            />

            {/* Event Markers */}
            {events.map((event) => {
              if (!event.lat || !event.lng) return null;
              
              const isStartingSoon = eventsStartingSoon.some(e => e.id === event.id);
              
              return (
                <OverlayView
                  key={event.id}
                  position={{ lat: event.lat, lng: event.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div
                    style={{
                      position: 'absolute',
                      transform: 'translate(-50%, -100%)',
                      zIndex: 40,
                    }}
                  >
                    <EventMarkerIcon
                      isStartingSoon={isStartingSoon}
                      onClick={() => handleEventClick(event)}
                    />
                  </div>
                </OverlayView>
              );
            })}
          </GoogleMap>

          {/* Message Creation Controller positioned within map section */}
          <MessageCreationController
            isCreating={isCreating}
            isInStreetView={isInStreetView}
            isPlacingPin={isPlacingPin}
            newPinPosition={newPinPosition}
            userAvatar={userAvatar}
            userName={userName}
            handleClose={handleClose}
            handleCreateMessage={handleCreateMessage}
            addMessage={addMessage}
            updateMessage={updateMessage}
          />
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

      {/* Live Stream Viewer */}
      <LiveStreamViewer
        stream={selectedStream}
        isOpen={showStreamViewer}
        onClose={handleCloseStreamViewer}
      />
      
      {/* Live Stream Controller */}
      <LiveStreamController
        isOpen={showLiveStreamController}
        onClose={handleCloseLiveStreamController}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={handleCloseEventModal}
      />
    </div>
  );
};

export default MapView;
