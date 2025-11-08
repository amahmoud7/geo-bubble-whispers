import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, OverlayView } from '@react-google-maps/api';
import ModernMapControls from './map/ModernMapControls';
import StreetViewController from './map/StreetViewController';
import MessageCreationController from './map/MessageCreationController';
import MessageDisplayController from './map/MessageDisplayController';
import LiveStreamMarkers from './livestream/LiveStreamMarkers';
import LiveStreamViewer from './livestream/LiveStreamViewer';
import { usePinPlacement } from '@/hooks/usePinPlacement';
import { useGoogleMap } from '@/hooks/useGoogleMap';
import { useMessages } from '@/hooks/useMessages';
import { useMessageState } from '@/hooks/useMessageState';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useLiveStreams } from '@/hooks/useLiveStreams';
import { useMapContext } from '@/contexts/EnhancedMapContext';
import { defaultMapOptions } from '@/config/mapStyles';
import { useAuth } from '@/hooks/useAuth';
import { useEventMessages, type EventMessage } from '@/hooks/useEventMessages';
import EventMarkerIcon from './map/EventMarkerIcon';
import EventDetailModal from './message/EventDetailModal';
import { LiveStream } from '@/types/livestream';
import { eventBus } from '@/utils/eventBus';
import { useGoogleMapsLoader } from '@/contexts/EnhancedMapContext';
const DEFAULT_CENTER = { lat: 34.0522, lng: -118.2437 };

type MapCoordinates = { lat: number; lng: number };

export type MapViewHandle = {
  panTo: (location: MapCoordinates) => void;
};

const MapFallback: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onRetry?: () => void;
}> = ({ title, description, actionLabel, onRetry }) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-900 px-6 text-center text-white">
    <div className="max-w-md">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </div>
    {onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/20"
      >
        {actionLabel ?? 'Retry'}
      </button>
    ) : null}
    <a
      href="/diagnostic"
      className="text-xs font-medium text-slate-300 underline underline-offset-4 hover:text-white"
    >
      Open Google Maps diagnostics
    </a>
  </div>
);

interface MapViewProps {
  isEventsOnlyMode?: boolean;
}

const MapView = React.forwardRef<MapViewHandle, MapViewProps>(({ isEventsOnlyMode = false }, ref) => {
  const { userLocation } = useUserLocation();
  const {
    filters,
    filteredMessages,
    addMessage,
    updateMessage,
    handleFilterChange,
    updateBounds,
  } = useMessages();
  const { events, eventsStartingSoon } = useEventMessages();
  
  const { user } = useAuth();
  const { setMap: setMapInContext } = useMapContext();
  const [selectedEvent, setSelectedEvent] = useState<EventMessage | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Live streaming state
  const { liveStreams } = useLiveStreams();
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [showStreamViewer, setShowStreamViewer] = useState(false);
  
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

  const { isLoaded, loadError, retry } = useGoogleMapsLoader();

  const updateBoundsFromMap = useCallback(
    (instance: google.maps.Map | null) => {
      if (!instance) {
        updateBounds(null);
        return;
      }
      const bounds = instance.getBounds();
      if (!bounds) return;
      const northEast = bounds.getNorthEast();
      const southWest = bounds.getSouthWest();
      updateBounds({
        north: northEast.lat(),
        south: southWest.lat(),
        east: northEast.lng(),
        west: southWest.lng(),
      });
    },
    [updateBounds]
  );

  // Enhanced onLoad that also sets the map in context
  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      mapInstance.setOptions({
        gestureHandling: 'greedy',
        draggable: true,
        scrollwheel: true,
      });
      originalOnLoad(mapInstance);
      setMapInContext(mapInstance);
      updateBoundsFromMap(mapInstance);
    },
    [originalOnLoad, setMapInContext, updateBoundsFromMap]
  );

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
    panTo: (location: MapCoordinates) => {
      if (map) {
        map.panTo(location);
        map.setZoom(15);
      }
    },
  }), [map]);

  useEffect(() => {
    if (!map) return;
    const idleListener = map.addListener('idle', () => updateBoundsFromMap(map));
    updateBoundsFromMap(map);
    return () => idleListener.remove();
  }, [map, updateBoundsFromMap]);

  useEffect(() => {
    return eventBus.on('navigateToMessage', (detail) => {
      if (!map || !detail) return;
      map.panTo({ lat: detail.lat, lng: detail.lng });
      if (map.getZoom() && map.getZoom()! < 15) {
        map.setZoom(15);
      }
      if (detail.messageId) {
        setSelectedMessage(detail.messageId);
      }
    });
  }, [map, setSelectedMessage]);

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
  }, [isInStreetView, map, setIsCreating, setNewPinPosition, setSelectedMessage, startPinPlacement]);

  // Listen for external create message events (e.g., from bottom navigation)
  useEffect(() => {
    return eventBus.on('createMessage', handleCreateMessage);
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

  const handleEventClick = (event: EventMessage) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const mapCenter = userLocation || DEFAULT_CENTER;

  if (loadError) {
    return (
      <MapFallback
        title="Unable to load Google Maps"
        description={loadError.message || 'An unexpected error occurred while loading the map.'}
        actionLabel="Retry"
        onRetry={retry}
      />
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900">
        <div className="text-center text-white">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-white/80"></div>
          <h2 className="text-xl font-semibold">Loading Google Maps…</h2>
          <p className="mt-2 text-sm text-white/70">Preparing location data and controls.</p>
        </div>
      </div>
    );
  }

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
          center={mapCenter}
          zoom={13}
          onLoad={onLoad}
          onUnmount={() => {
            updateBounds(null);
            setMapInContext(null);
            onUnmount();
          }}
          onClick={handleMapClick}
          options={defaultMapOptions}
        >
          {/* Show ONLY events when in events-only mode, or show everything when not */}
          {isEventsOnlyMode ? (
            // Events-only mode: Show ONLY event markers, nothing else
            <>
              {events.map((event) => {
                if (event.lat == null || event.lng == null) {
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
                if (event.lat == null || event.lng == null) {
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
