import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePinPlacement } from '@/hooks/usePinPlacement';
import { useGoogleMap } from '@/hooks/useGoogleMap';
import { useMessages } from '@/hooks/useMessages';
import { useMessageState } from '@/hooks/useMessageState';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useLiveStreams } from '@/hooks/useLiveStreams';
import { useAuth } from '@/hooks/useAuth';
import { defaultMapOptions } from '@/config/mapStyles';
import { LiveStream } from '@/types/livestream';

// Mobile-optimized components
import MobileHeader from './MobileHeader';
import BottomSheet from './BottomSheet';
import TouchableArea from './TouchableArea';
import MessageCreationController from '../map/MessageCreationController';
import MessageDisplayController from '../map/MessageDisplayController';
import LiveStreamMarkers from '../livestream/LiveStreamMarkers';
import LiveStreamViewer from '../livestream/LiveStreamViewer';

// Import icons
import { Plus, Filter, Search, Layers, Navigation } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface MobileMapViewProps {
  className?: string;
}

const MobileMapView: React.FC<MobileMapViewProps> = ({ className }) => {
  const isMobile = useIsMobile();
  const { userLocation } = useUserLocation();
  const { filters, filteredMessages, addMessage, updateMessage, handleFilterChange } = useMessages();
  const { user } = useAuth();
  
  // State management
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [bottomSheetContent, setBottomSheetContent] = useState<'filters' | 'messages' | 'create'>('messages');
  const [showSearch, setShowSearch] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  
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
    onLoad,
    onUnmount,
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

  // Mobile-specific handlers
  const handleCreateMessage = () => {
    setIsCreating(true);
    startPinPlacement();
    setSelectedMessage(null);
    setBottomSheetContent('create');
    setShowBottomSheet(true);

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
    // On mobile, we might want to show message details in bottom sheet
    if (isMobile) {
      setBottomSheetContent('messages');
      setShowBottomSheet(true);
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

  const toggleBottomSheet = (content: 'filters' | 'messages' | 'create') => {
    if (showBottomSheet && bottomSheetContent === content) {
      setShowBottomSheet(false);
    } else {
      setBottomSheetContent(content);
      setShowBottomSheet(true);
    }
  };

  const centerOnUser = () => {
    if (map && userLocation) {
      map.panTo(userLocation);
      map.setZoom(16);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading map...</div>
      </div>
    );
  }

  const userAvatar = user?.user_metadata?.avatar_url || '/placeholder.svg';
  const userName = user?.user_metadata?.name;

  const mapOptions = {
    ...defaultMapOptions,
    mapTypeId: mapType,
    gestureHandling: 'greedy', // Better for mobile touch
    zoomControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false
  };

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      {/* Mobile Header */}
      <MobileHeader
        title="Map"
        leftButton="none"
        rightButton={
          <TouchableArea onPress={() => setShowSearch(!showSearch)}>
            <Search size={24} className="text-blue-600" />
          </TouchableArea>
        }
        className="absolute top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm"
      />

      {/* Google Map */}
      <GoogleMap
        mapContainerClassName={cn(
          "w-full h-full",
          isPlacingPin ? 'cursor-crosshair' : 'cursor-default'
        )}
        center={userLocation}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={mapOptions}
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
      </GoogleMap>

      {/* Floating Action Buttons */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-3 z-30">
        {/* Center on user */}
        <TouchableArea
          onPress={centerOnUser}
          className="bg-white rounded-full p-3 shadow-lg"
        >
          <Navigation size={24} className="text-gray-700" />
        </TouchableArea>

        {/* Map type toggle */}
        <TouchableArea
          onPress={() => {
            const types: ('roadmap' | 'satellite' | 'hybrid')[] = ['roadmap', 'satellite', 'hybrid'];
            const currentIndex = types.indexOf(mapType);
            const nextIndex = (currentIndex + 1) % types.length;
            setMapType(types[nextIndex]);
          }}
          className="bg-white rounded-full p-3 shadow-lg"
        >
          <Layers size={24} className="text-gray-700" />
        </TouchableArea>

        {/* Create message */}
        {user && (
          <TouchableArea
            onPress={handleCreateMessage}
            className="bg-blue-600 rounded-full p-3 shadow-lg"
          >
            <Plus size={24} className="text-white" />
          </TouchableArea>
        )}
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4 z-30 pb-safe-area-bottom">
        <TouchableArea
          onPress={() => toggleBottomSheet('messages')}
          className={cn(
            "bg-white rounded-full px-6 py-3 shadow-lg flex items-center gap-2",
            showBottomSheet && bottomSheetContent === 'messages' && "bg-blue-600"
          )}
        >
          <span className={cn(
            "font-medium",
            showBottomSheet && bottomSheetContent === 'messages' ? "text-white" : "text-gray-700"
          )}>
            Messages ({filteredMessages.length})
          </span>
        </TouchableArea>

        <TouchableArea
          onPress={() => toggleBottomSheet('filters')}
          className={cn(
            "bg-white rounded-full p-3 shadow-lg",
            showBottomSheet && bottomSheetContent === 'filters' && "bg-blue-600"
          )}
        >
          <Filter 
            size={20} 
            className={cn(
              showBottomSheet && bottomSheetContent === 'filters' ? "text-white" : "text-gray-700"
            )} 
          />
        </TouchableArea>
      </div>

      {/* Bottom Sheet */}
      <BottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        snapPoints={[0.3, 0.6, 0.9]}
        initialSnap={0}
        title={
          bottomSheetContent === 'messages' ? 'Messages' :
          bottomSheetContent === 'filters' ? 'Filters' :
          'Create Message'
        }
      >
        {bottomSheetContent === 'messages' && (
          <div className="px-4 pb-4">
            {filteredMessages.map((message) => (
              <TouchableArea
                key={message.id}
                onPress={() => handleMessageClick(message.id)}
                className="p-4 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={message.avatar_url || '/placeholder.svg'}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{message.username}</div>
                    <div className="text-gray-600 text-sm mt-1">{message.content}</div>
                    <div className="text-gray-400 text-xs mt-2">
                      {new Date(message.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </TouchableArea>
            ))}
          </div>
        )}

        {bottomSheetContent === 'filters' && (
          <div className="px-4 pb-4">
            {/* Filter controls would go here */}
            <div className="text-gray-600">Filter options coming soon...</div>
          </div>
        )}

        {bottomSheetContent === 'create' && (
          <MessageCreationController
            isCreating={isCreating}
            isInStreetView={isInStreetView}
            isPlacingPin={isPlacingPin}
            newPinPosition={newPinPosition}
            userAvatar={userAvatar}
            userName={userName}
            handleClose={() => {
              handleClose();
              setShowBottomSheet(false);
            }}
            handleCreateMessage={handleCreateMessage}
            addMessage={addMessage}
            updateMessage={updateMessage}
          />
        )}
      </BottomSheet>

      {/* Live Stream Viewer */}
      <LiveStreamViewer
        stream={selectedStream}
        isOpen={showStreamViewer}
        onClose={handleCloseStreamViewer}
      />
    </div>
  );
};

export default MobileMapView;