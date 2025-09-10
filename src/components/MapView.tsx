import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import ModernMapControls from './map/ModernMapControls';
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
import { useMapContext } from '@/contexts/MapContext';
import { defaultMapOptions } from '@/config/mapStyles';
import { mockMessages } from '@/mock/messages';
import { useAuth } from '@/hooks/useAuth';
import { useEventMessages } from '@/hooks/useEventMessages';
import EventMarkerIcon from './map/EventMarkerIcon';
import EventDetailModal from './message/EventDetailModal';
import { LiveStream } from '@/types/livestream';

// Static libraries array to prevent LoadScript warning
const GOOGLE_MAPS_LIBRARIES = ['places'] as const;

interface MapViewProps {
  isEventsOnlyMode?: boolean;
}

const MapView = React.forwardRef<any, MapViewProps>(({ isEventsOnlyMode = false }, ref) => {
  const { userLocation } = useUserLocation();
  const { filters, filteredMessages, addMessage, updateMessage, handleFilterChange } = useMessages();
  const { events, eventsStartingSoon } = useEventMessages();
  
  const { user } = useAuth();
  const { setMap: setMapInContext } = useMapContext();
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
    onLoad: originalOnLoad,
    onUnmount,
    onSearchBoxLoad,
  } = useGoogleMap();

  // Enhanced onLoad that also sets the map in context
  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    console.log('🗺️ Map loaded with options:', defaultMapOptions);
    console.log('🗺️ Map draggable:', mapInstance.get('draggable'));
    console.log('🗺️ Map scrollwheel:', mapInstance.get('scrollwheel'));
    console.log('🗺️ Map gesture handling:', mapInstance.get('gestureHandling'));
    
    // Force set gesture handling to greedy to avoid "two fingers" message
    mapInstance.setOptions({
      gestureHandling: 'greedy',
      draggable: true,
      scrollwheel: true
    });
    console.log('🗺️ FORCED gestureHandling to greedy');
    
    // Add event listeners to debug map interaction
    mapInstance.addListener('dragstart', () => {
      console.log('🗺️ Map drag started');
    });
    
    mapInstance.addListener('drag', () => {
      console.log('🗺️ Map is being dragged');
    });
    
    mapInstance.addListener('dragend', () => {
      console.log('🗺️ Map drag ended');
    });

    originalOnLoad(mapInstance);
    setMapInContext(mapInstance);
    // Also set globally for debugging
    (window as any).currentGoogleMap = mapInstance;
    console.log('🗺️ MAP CONTEXT: Map instance registered in context and globally');
  }, [originalOnLoad, setMapInContext]);

  const {
    newPinPosition,
    isPlacingPin,
    handleMapClick,
    startPinPlacement,
    endPinPlacement,
    setNewPinPosition,
  } = usePinPlacement();

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    panTo: (location: { lat: number; lng: number }) => {
      if (map) {
        map.panTo(location);
        map.setZoom(15);
      }
    }
  }), [map]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCja18mhM6OgcQPkZp7rCZM6C29SGz3S4U',
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const handleCreateMessage = useCallback(() => {
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
  }, [isInStreetView, map, startPinPlacement]);

  // Listen for external create message events (e.g., from bottom navigation)
  useEffect(() => {
    const handleExternalCreateMessage = () => {
      handleCreateMessage();
    };

    window.addEventListener('createMessage', handleExternalCreateMessage);

    return () => {
      window.removeEventListener('createMessage', handleExternalCreateMessage);
    };
  }, [handleCreateMessage]);

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
  const mapContainerClassName = `map-container relative w-full h-full ${isPlacingPin ? 'cursor-pin' : ''}`;

  return (
    <div className={mapContainerClassName}>
      {/* Full Screen Map Background */}
      <div className="absolute inset-0">
        <ModernMapControls
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearchBoxLoad={onSearchBoxLoad}
          map={map}
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
          {/* Show ONLY events when in events-only mode, or show everything when not */}
          {isEventsOnlyMode ? (
            // Events-only mode: Show ONLY event markers, nothing else
            <>
              {events.map((event) => {
                if (!event.lat || !event.lng) {
                  return null;
                }
                
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
            </>
          ) : (
            // Normal mode: Show all content (messages, live streams, and events)
            <>
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

              {/* Also show events in normal mode */}
              {events.map((event) => {
                if (!event.lat || !event.lng) {
                  return null;
                }
                
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
            </>
          )}
        </GoogleMap>

        {/* Hide message creation when in events-only mode */}
        {!isEventsOnlyMode && (
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
        )}
      </div>


      {/* Hide live stream components when in events-only mode */}
      {!isEventsOnlyMode && (
        <>
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
        </>
      )}

      {/* Event Detail Modal - always visible */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={handleCloseEventModal}
      />
    </div>
  );
});

MapView.displayName = 'MapView';

export default MapView;