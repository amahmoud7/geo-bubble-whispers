import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { GripHorizontal } from 'lucide-react';
import { LiveStream } from '@/types/livestream';

const MapView: React.FC = () => {
  const { userLocation } = useUserLocation();
  const { filters, filteredMessages, addMessage, updateMessage, handleFilterChange } = useMessages();
  const { events, eventsStartingSoon } = useEventMessages();
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Draggable list state
  const [listPosition, setListPosition] = useState(50); // Percentage from bottom (0-100)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ y: number; position: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
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

  // Snap positions: 0% = full map, 50% = hybrid, 100% = full list
  const snapPositions = [0, 50, 100];
  
  const snapToClosest = useCallback((position: number) => {
    const closest = snapPositions.reduce((prev, curr) => 
      Math.abs(curr - position) < Math.abs(prev - position) ? curr : prev
    );
    setListPosition(closest);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ y: e.clientY, position: listPosition });
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [listPosition]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart({ y: e.touches[0].clientY, position: listPosition });
    document.body.style.userSelect = 'none';
  }, [listPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStart || !containerRef.current) return;
    
    const containerHeight = containerRef.current.offsetHeight;
    const deltaY = e.clientY - dragStart.y;
    const deltaPercentage = -(deltaY / containerHeight) * 100;
    const newPosition = Math.max(0, Math.min(100, dragStart.position + deltaPercentage));
    
    setListPosition(newPosition);
  }, [isDragging, dragStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !dragStart || !containerRef.current) return;
    
    const containerHeight = containerRef.current.offsetHeight;
    const deltaY = e.touches[0].clientY - dragStart.y;
    const deltaPercentage = -(deltaY / containerHeight) * 100;
    const newPosition = Math.max(0, Math.min(100, dragStart.position + deltaPercentage));
    
    setListPosition(newPosition);
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      snapToClosest(listPosition);
    }
  }, [isDragging, listPosition, snapToClosest]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      document.body.style.userSelect = '';
      snapToClosest(listPosition);
    }
  }, [isDragging, listPosition, snapToClosest]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  if (!isLoaded) return <div>Loading...</div>;

  // Get the user avatar for the new pin
  const userAvatar = user?.user_metadata?.avatar_url || '/placeholder.svg';
  const userName = user?.user_metadata?.name;

  // Add cursor-pin class when in pin placement mode
  const mapContainerClassName = `map-container relative w-full h-[calc(100vh-4rem)] ${isPlacingPin ? 'cursor-pin' : ''}`;

  return (
    <div ref={containerRef} className={mapContainerClassName}>
      {/* Full Screen Map Background */}
      <div className="absolute inset-0">
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

      {/* Draggable List Overlay */}
      <div 
        className={`absolute left-0 right-0 list-overlay-blur border-t border-gray-200/50 shadow-2xl list-panel ${
          isDragging ? 'dragging' : ''
        }`}
        style={{
          bottom: 0,
          height: `${listPosition}%`,
          borderTopLeftRadius: listPosition > 0 ? '24px' : '0px',
          borderTopRightRadius: listPosition > 0 ? '24px' : '0px',
          background: listPosition > 0 
            ? 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0.90))' 
            : 'transparent',
        }}
      >
        {/* Drag Handle */}
        <div 
          className={`absolute top-0 left-0 right-0 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing z-50 drag-handle ${
            listPosition > 0 ? 'opacity-100' : 'opacity-0'
          }`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="w-12 h-1.5 rounded-full drag-indicator"></div>
        </div>

        {/* List Content */}
        {listPosition > 0 && (
          <div className="pt-8 h-full">
            <MapViewList 
              messages={filteredMessages}
              onMessageClick={handleMessageClick}
              selectedMessage={selectedMessage}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}
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