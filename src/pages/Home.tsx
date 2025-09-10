
import React, { useState, useRef, useEffect } from 'react';
import MapView from '../components/MapView';
import EventsToggle from '@/components/events/EventsToggle';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import CreateLoModal from '@/components/post/CreateLoModal';
import ARMessageView from '@/components/ar/ARMessageView';
import TrendingLocations from '@/components/social/TrendingLocations';
import TestPostManager from '@/components/dev/TestPostManager';
import { Sparkles, MapPin, Camera, Bell, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { pushNotificationService } from '@/services/pushNotifications';
import { Button } from '@/components/ui/button';
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
          window.dispatchEvent(new CustomEvent('refreshMessages'));
        }, 100);
        
        // After 3 seconds, replace with normal ID (animation will stop)
        setTimeout(() => {
          const finalMessage = {
            ...newMessageWithAnimation,
            id: data.id
          };
          console.log('📍 Replacing with final message:', finalMessage);
          // Don't add again, just update the existing one
          window.dispatchEvent(new CustomEvent('refreshMessages'));
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
    <div className="h-screen w-screen flex flex-col relative overflow-hidden">
      {/* Liquid Glass Header with Logo and Controls */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <div className="glass-card flex items-center px-4 py-2">
          <img 
            src="/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png" 
            alt="Lo Logo" 
            className="h-8 drop-shadow-lg"
          />
          <Sparkles className="w-5 h-5 text-teal-400 ml-2 animate-pulse" />
          <span className="ml-2 text-white font-semibold liquid-text">Lo</span>
        </div>
        
        {/* New feature buttons with liquid glass */}
        <div className="glass-card flex items-center gap-1 p-2">
          {/* AR View Button */}
          <button
            onClick={() => setShowARView(true)}
            className="glass p-2 rounded-full hover:bg-white/20 transition-all glass-float"
            title="AR View"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
          
          {/* Notifications Button */}
          <button
            onClick={handleNotificationToggle}
            className={cn(
              "glass p-2 rounded-full hover:bg-white/20 transition-all glass-float",
              notificationsEnabled && "bg-teal-500/20"
            )}
            title="Notifications"
          >
            <Bell className={cn(
              "w-5 h-5",
              notificationsEnabled ? "text-teal-400" : "text-white"
            )} />
          </button>
          
          {/* Trending Button */}
          <button
            onClick={() => setShowTrending(!showTrending)}
            className="glass p-2 rounded-full hover:bg-white/20 transition-all glass-float"
            title="Trending"
          >
            <TrendingUp className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
      
      {/* Main Map View - Full Screen */}
      <div className="flex-1 relative">
        <MapView ref={mapViewRef} isEventsOnlyMode={isEventsOnlyMode} />
      </div>

      {/* Trending Locations Panel */}
      {showTrending && (
        <div className="absolute top-20 right-4 z-40 w-80 max-h-[70vh] overflow-hidden animate-slide-in-right">
          <TrendingLocations
            onLocationSelect={handleTrendingLocationSelect}
            userLocation={userLocation}
          />
        </div>
      )}

      {/* Events Toggle (Ticketmaster & Eventbrite) */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-40">
        <EventsToggle 
          className="animate-fade-in" 
          onEventsOnlyModeChange={handleEventsOnlyModeChange}
        />
      </div>

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

export default Home;
