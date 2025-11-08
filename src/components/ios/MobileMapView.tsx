import React, { useState, useEffect } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { useGoogleMapsLoader } from '@/contexts/EnhancedMapContext';
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
import { environment } from '@/config/environment';
import { getIOSMapOptions, getErrorMessage } from '@/utils/googleMapsUtils';

// Mobile-optimized components
import MobileHeader from './MobileHeader';
import BottomSheet from './BottomSheet';
import TouchableArea from './TouchableArea';
import MessageCreationController from '../map/MessageCreationController';
import MessageDisplayController from '../map/MessageDisplayController';
import LiveStreamMarkers from '../livestream/LiveStreamMarkers';
import LiveStreamViewer from '../livestream/LiveStreamViewer';

// Import icons
import { Plus, Filter, Search, Layers, Navigation, RefreshCw, Settings } from 'lucide-react';
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

  const { isLoaded, loadError, apiKeyValid, retry, diagnostics } = useGoogleMapsLoader();

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

  // Enhanced error handling for mobile with user-friendly messages
  if (loadError || !apiKeyValid) {
    const errorInfo = getErrorMessage(loadError);
    
    console.error('🚨 Mobile Google Maps failed to load:', {
      loadError: loadError?.message,
      apiKeyValid,
      diagnostics,
      userLocation,
      timestamp: new Date().toISOString(),
      errorInfo
    });
    
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50">
        <div className="text-center max-w-sm">
          <div className="text-red-600 text-6xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{errorInfo.title}</h2>
          <p className="text-gray-600 text-sm mb-6">
            {errorInfo.message}
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={retry}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('/diagnostic', '_blank')}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Diagnose Issue
            </Button>
          </div>
          
          {/* Show suggestions */}
          {errorInfo.suggestions.length > 0 && (
            <div className="mt-6 text-xs text-left">
              <p className="font-semibold text-gray-700 mb-2">Try these solutions:</p>
              <ul className="text-gray-600 space-y-1">
                {errorInfo.suggestions.slice(0, 3).map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-400">
            <div>API Key: {diagnostics.keyFormat}</div>
            <div>Network: {diagnostics.networkOnline ? 'Online' : 'Offline'}</div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isLoaded) {
    console.log('⏳ Mobile Google Maps is loading...');
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <div>
            <p className="text-gray-800 font-medium text-lg">Loading Maps...</p>
            <p className="text-gray-500 text-sm mt-2">Preparing your location experience</p>
          </div>
          <div className="mt-8 text-xs text-gray-400">
            <p>Taking longer than expected?</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => window.open('/diagnostic', '_blank')}
              className="text-blue-600 p-0 h-auto"
            >
              Check diagnostics
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Log successful mobile load
  console.log('✅ Mobile Google Maps loaded successfully!');

  const userAvatar = user?.user_metadata?.avatar_url || '/placeholder.svg';
  const userName = user?.user_metadata?.name;

  const mapOptions = getIOSMapOptions({
    ...defaultMapOptions,
    mapTypeId: mapType,
    gestureHandling: 'greedy', // Better for mobile touch
    zoomControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false
  });

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
