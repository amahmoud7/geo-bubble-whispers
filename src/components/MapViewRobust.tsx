import React, { useState, useEffect, useCallback } from 'react';
import { OverlayView } from '@react-google-maps/api';
import { RobustMapView } from './map/RobustMapView';
import { useMapService } from '@/hooks/useMapService';
import ModernMapControls from './map/ModernMapControls';
import StreetViewController from './map/StreetViewController';
import MessageCreationController from './map/MessageCreationController';
import MessageDisplayController from './map/MessageDisplayController';
import LiveStreamMarkers from './livestream/LiveStreamMarkers';
import LiveStreamViewer from './livestream/LiveStreamViewer';
import { usePinPlacement } from '@/hooks/usePinPlacement';
import { useMessages } from '@/hooks/useMessages';
import { useMessageState } from '@/hooks/useMessageState';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useLiveStreams } from '@/hooks/useLiveStreams';
import { useAuth } from '@/hooks/useAuth';
import { useEventMessages, type EventMessage } from '@/hooks/useEventMessages';
import EventMarkerIcon from './map/EventMarkerIcon';
import EventDetailModal from './message/EventDetailModal';
import { LiveStream } from '@/types/livestream';
import { eventBus } from '@/utils/eventBus';

const DEFAULT_CENTER = { lat: 34.0522, lng: -118.2437 };

type MapCoordinates = { lat: number; lng: number };

export type MapViewHandle = {
  panTo: (location: MapCoordinates) => void;
};

interface MapViewProps {
  isEventsOnlyMode?: boolean;
}

const MapViewRobust = React.forwardRef<MapViewHandle, MapViewProps>(
  ({ isEventsOnlyMode = false }, ref) => {
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
      handleClose,
    } = useMessageState();

    // Use the unified map service instead of multiple competing systems
    const { map, isReady, panTo, setZoom, getZoom, getBounds } = useMapService();

    const {
      newPinPosition,
      isPlacingPin,
      handleMapClick,
      startPinPlacement,
      endPinPlacement,
      setNewPinPosition,
    } = usePinPlacement();

    // Expose methods via ref
    React.useImperativeHandle(
      ref,
      () => ({
        panTo: (location: MapCoordinates) => {
          panTo(location);
          setZoom(15);
        },
      }),
      [panTo, setZoom]
    );

    // Update bounds when map moves
    const updateBoundsFromMap = useCallback(() => {
      const bounds = getBounds();
      if (!bounds) {
        updateBounds(null);
        return;
      }

      const northEast = bounds.getNorthEast();
      const southWest = bounds.getSouthWest();
      updateBounds({
        north: northEast.lat(),
        south: southWest.lat(),
        east: northEast.lng(),
        west: southWest.lng(),
      });
    }, [getBounds, updateBounds]);

    // Listen for map idle events to update bounds
    useEffect(() => {
      if (!map || !isReady) return;

      const idleListener = map.addListener('idle', updateBoundsFromMap);
      updateBoundsFromMap(); // Update immediately

      return () => {
        if (idleListener) {
          google.maps.event.removeListener(idleListener);
        }
      };
    }, [map, isReady, updateBoundsFromMap]);

    // Listen for navigate to message events
    useEffect(() => {
      return eventBus.on('navigateToMessage', (detail) => {
        if (!detail) return;

        panTo({ lat: detail.lat, lng: detail.lng });

        const currentZoom = getZoom();
        if (currentZoom && currentZoom < 15) {
          setZoom(15);
        }

        if (detail.messageId) {
          setSelectedMessage(detail.messageId);
        }
      });
    }, [panTo, getZoom, setZoom, setSelectedMessage]);

    const handleCreateMessage = useCallback(() => {
      setIsCreating(true);
      startPinPlacement();
      setSelectedMessage(null);

      // Handle street view position if active
      if (map) {
        const streetViewControl = map.getStreetView();
        if (streetViewControl?.getVisible()) {
          const position = streetViewControl.getPosition();
          if (position) {
            setNewPinPosition({
              lat: position.lat(),
              lng: position.lng(),
            });
          }
        }
      }
    }, [map, setIsCreating, setNewPinPosition, setSelectedMessage, startPinPlacement]);

    // Listen for external create message events
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
    const userAvatar = user?.user_metadata?.avatar_url || '/placeholder.svg';
    const userName = user?.user_metadata?.name;

    // No-op for search box - will be handled by ModernMapControls
    const handleSearchBoxLoad = useCallback(() => {
      // Placeholder for compatibility
    }, []);

    const mapContainerClassName = `map-container relative w-full h-full ${
      isPlacingPin ? 'cursor-pin' : ''
    }`;

    return (
      <div className={mapContainerClassName}>
        <div className="absolute inset-0">
          <ModernMapControls
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearchBoxLoad={handleSearchBoxLoad}
            map={map}
          />

          <StreetViewController
            map={map}
            isPlacingPin={isPlacingPin}
            setNewPinPosition={setNewPinPosition}
            onCreateMessage={handleCreateMessage}
          />

          <RobustMapView
            center={mapCenter}
            zoom={13}
            onMapReady={updateBoundsFromMap}
            onClick={handleMapClick}
          >
            {/* Events-only mode: Show ONLY event markers */}
            {isEventsOnlyMode ? (
              <>
                {events.map((event) => {
                  if (event.lat == null || event.lng == null) return null;

                  return (
                    <OverlayView
                      key={event.id}
                      position={{ lat: event.lat, lng: event.lng }}
                      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                      <EventMarkerIcon
                        event={event}
                        onClick={() => handleEventClick(event)}
                      />
                    </OverlayView>
                  );
                })}
              </>
            ) : (
              <>
                {/* Regular mode: Show all markers */}
                <MessageDisplayController
                  messages={filteredMessages}
                  selectedMessageId={selectedMessage}
                  onMessageClick={handleMessageClick}
                  onClose={handleClose}
                />

                <MessageCreationController
                  isCreating={isCreating}
                  newPinPosition={newPinPosition}
                  onCancel={() => {
                    setIsCreating(false);
                    endPinPlacement();
                  }}
                  onSubmit={(message) => {
                    addMessage(message);
                    setIsCreating(false);
                    endPinPlacement();
                  }}
                  userAvatar={userAvatar}
                  userName={userName}
                />

                <LiveStreamMarkers
                  liveStreams={liveStreams}
                  onStreamSelect={handleStreamSelect}
                />

                {events.map((event) => {
                  if (event.lat == null || event.lng == null) return null;

                  return (
                    <OverlayView
                      key={event.id}
                      position={{ lat: event.lat, lng: event.lng }}
                      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                      <EventMarkerIcon
                        event={event}
                        onClick={() => handleEventClick(event)}
                      />
                    </OverlayView>
                  );
                })}
              </>
            )}
          </RobustMapView>
        </div>

        {/* Live Stream Viewer Modal */}
        {showStreamViewer && selectedStream && (
          <LiveStreamViewer
            stream={selectedStream}
            onClose={handleCloseStreamViewer}
          />
        )}

        {/* Event Detail Modal */}
        {showEventModal && selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={handleCloseEventModal}
          />
        )}
      </div>
    );
  }
);

MapViewRobust.displayName = 'MapViewRobust';

export default MapViewRobust;
