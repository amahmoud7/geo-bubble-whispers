
import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import EventsToggle from '@/components/events/EventsToggle';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import CreateLoModal from '@/components/post/CreateLoModal';
import ARMessageView from '@/components/ar/ARMessageView';
import TrendingLocations from '@/components/social/TrendingLocations';
import TestPostManager from '@/components/dev/TestPostManager';
import { Sparkles, Camera, Bell, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/useMessages';
import { eventBus } from '@/utils/eventBus';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { pushNotificationService } from '@/services/pushNotifications';
import { useGoogleMapsLoader } from '@/contexts/GoogleMapsContext';
import { cn } from '@/lib/utils';

const Home = () => {
  const [isEventsOnlyMode, setIsEventsOnlyMode] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showARView, setShowARView] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const mapViewRef = useRef<any>(null);
  const { addMessage } = useMessages();
  const { user } = useAuth();

  // Initialize geolocation and notifications
  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    // Check notification permission status
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleEventsOnlyModeChange = (enabled: boolean) => {
    setIsEventsOnlyMode(enabled);
    console.log('🏠 HOME: Events-only mode changed to:', enabled);
  };

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      const granted = await pushNotificationService.requestPermission();
      setNotificationsEnabled(granted);
    } else {
      // Disable notifications
      pushNotificationService.stopLocationTracking();
      setNotificationsEnabled(false);
      toast({
        title: 'Notifications disabled',
        description: 'You can re-enable them anytime',
      });
    }
  };

  const handleTrendingLocationSelect = (location: any) => {
    // Navigate to location on map
    if (mapViewRef.current) {
      mapViewRef.current.panTo({ lat: location.lat, lng: location.lng });
    }
    setShowTrending(false);
  };

  const handleCreateMessage = () => {
    console.log('📍 HOME: Opening post creation modal');
    console.log('📍 HOME: Current showPostModal state:', showPostModal);
    setShowPostModal(true);
    console.log('📍 HOME: showPostModal set to true');
  };

  const handlePostCreated = async (post: any) => {
    console.log('📍 New post created:', post);
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create posts",
        variant: "destructive"
      });
      return;
    }

    try {
      // First, ensure user has a profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating user profile...');
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.email?.split('@')[0] || 'Anonymous',
            avatar_url: null
          });
        
        if (createProfileError) {
          console.error('Failed to create profile:', createProfileError);
        }
      }

      // Save to database - using only fields that exist in the table
      const messageData = {
        content: post.content || '',
        user_id: user.id,
        lat: post.location.lat,
        lng: post.location.lng,
        location: post.location.name || null,
        is_public: !post.isPrivate,
        media_url: post.mediaUrl || null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };

      console.log('📍 Attempting to save post with data:', messageData);
      console.log('📍 Current user:', user);

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        throw error;
      }

      // Add to local state for immediate UI update with animation
      if (data) {
        // First add with temporary "new-" prefix for drop animation
        const newMessageWithAnimation = {
          id: `new-${data.id}`,
          content: data.content,
          isPublic: data.is_public,
          location: data.location || '',
          timestamp: data.created_at || new Date().toISOString(),
          expiresAt: data.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          mediaUrl: data.media_url,
          user: {
            name: user.email?.split('@')[0] || 'Anonymous',
            avatar: user.user_metadata?.avatar_url || ''
          },
          position: {
            x: data.lat || post.location.lat,
            y: data.lng || post.location.lng
          }
        };
        
        console.log('📍 Adding animated message to map:', newMessageWithAnimation);
        addMessage(newMessageWithAnimation);
        
        // Trigger a refresh of messages to ensure they show on the map
        setTimeout(() => {
          console.log('🔄 Triggering global message refresh...');
        eventBus.emit('refreshMessages', undefined);
        }, 100);
        
        // After 3 seconds, replace with normal ID (animation will stop)
        setTimeout(() => {
          const finalMessage = {
            ...newMessageWithAnimation,
            id: data.id
          };
          console.log('📍 Replacing with final message:', finalMessage);
          // Don't add again, just update the existing one
        eventBus.emit('refreshMessages', undefined);
        }, 3000);
      }

      toast({
        title: "Lo posted! 🎉",
        description: "Your Lo is now live on the map",
      });
      
      setShowPostModal(false);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Failed to create Lo",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden relative">
      <header
        className="relative z-30 px-4"
        style={{ paddingTop: 'env(safe-area-inset-top, 1rem)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="glass flex min-h-[44px] items-center gap-2 rounded-3xl px-4 py-2">
            <img 
              src="/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png" 
              alt="Lo Logo" 
              className="h-8 drop-shadow-lg"
            />
            <Sparkles className="h-5 w-5 text-teal-400" />
            <span className="text-white font-semibold liquid-text">Lo</span>
          </div>

          <div className="glass flex min-h-[44px] items-center gap-2 rounded-3xl px-3 py-2">
            <button
              onClick={() => setShowARView(true)}
              className="glass flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-3 transition-colors hover:bg-white/20"
              title="AR View"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>

            <button
              onClick={handleNotificationToggle}
              className={cn(
                "glass flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-3 transition-colors hover:bg-white/20",
                notificationsEnabled && "bg-teal-500/20"
              )}
              title="Notifications"
            >
              <Bell className={cn(
                "h-5 w-5",
                notificationsEnabled ? "text-teal-400" : "text-white"
              )} />
            </button>

            <button
              onClick={() => setShowTrending(!showTrending)}
              className="glass flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-3 transition-colors hover:bg-white/20"
              title="Trending"
            >
              <TrendingUp className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative flex-1">
        <MapComponent isEventsOnlyMode={isEventsOnlyMode} userLocation={userLocation} />

        {showTrending && (
          <div className="pointer-events-auto absolute top-6 right-4 z-40 w-80 max-h-[70vh] overflow-hidden animate-slide-in-right">
            <TrendingLocations
              onLocationSelect={handleTrendingLocationSelect}
              userLocation={userLocation}
            />
          </div>
        )}

        <div className="pointer-events-auto absolute bottom-32 left-1/2 z-40 -translate-x-1/2">
          <EventsToggle 
            onEventsOnlyModeChange={handleEventsOnlyModeChange}
          />
        </div>
      </main>

      <BottomNavigation onPostClick={handleCreateMessage} />

      {/* Post Creation Modal */}
      <CreateLoModal 
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onPostCreated={handlePostCreated}
      />
      
      {/* AR View */}
      <ARMessageView
        isOpen={showARView}
        onClose={() => setShowARView(false)}
        userLocation={userLocation}
      />
      
      {/* Test Post Manager (Development) */}
      <TestPostManager />
    </div>
  );
};

// Clean Map Component using the centralized GoogleMapsContext
const MapComponent: React.FC<{
  isEventsOnlyMode: boolean;
  userLocation: { lat: number; lng: number } | null;
}> = ({ isEventsOnlyMode, userLocation }) => {
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  };

  const defaultCenter = {
    lat: 37.7749,
    lng: -122.4194
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    gestureHandling: 'greedy' as const,
    styles: [
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#0EA5E9" }, { lightness: 20 }]
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#f6f7fb" }]
      }
    ]
  };

  const onLoad = (mapInstance: google.maps.Map) => {
    console.log('✅ Map loaded successfully!');
    setMap(mapInstance);
  };

  const onUnmount = () => {
    console.log('🗺️ Map unmounted');
    setMap(null);
  };

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Maps Failed to Load</h2>
          <p className="text-gray-600 mb-4">Error: {loadError.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Google Maps...</h2>
          <div className="space-y-1 text-sm text-gray-500">
            <div>Status: Loading API...</div>
            <div>Location: {userLocation ? '✅ Found' : '🔍 Searching...'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation || defaultCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            title="Your Location"
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 8
            }}
          />
        )}
      </GoogleMap>
      
      {/* Debug overlay - can be removed in production */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg text-xs font-mono">
        <div className="font-semibold text-green-600 mb-2">✅ Map Ready</div>
        <div>Center: {(userLocation || defaultCenter).lat.toFixed(4)}, {(userLocation || defaultCenter).lng.toFixed(4)}</div>
        <div>Location: {userLocation ? '✅ Available' : '❌ Default'}</div>
        <div>Events Mode: {isEventsOnlyMode ? '🎉 ON' : '📍 OFF'}</div>
        <div>Map Instance: {map ? '✅ Ready' : '❌ Not ready'}</div>
      </div>
    </div>
  );
};

export default Home;
