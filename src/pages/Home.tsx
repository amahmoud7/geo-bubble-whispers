import React, { useState, useRef } from 'react';
import MapView, { type MapViewHandle } from '../components/MapViewRobust';
import EventsToggle from '@/components/events/EventsToggle';
import SpectaclesToggle from '@/components/spectacles/SpectaclesToggle';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import CreateLoModal from '@/components/post/CreateLoModal';
import TestPostManager from '@/components/dev/TestPostManager';
import { EventsFetchTest } from '@/components/dev/EventsFetchTest';
import { toast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { eventBus } from '@/utils/eventBus';
import type { MapMessage } from '@/types/messages';
import { Search, Waves } from 'lucide-react';
import { Input } from '@/components/ui/input';

type Coordinates = { lat: number; lng: number };
type DraftPost = {
  content?: string;
  location: Coordinates & { name?: string };
  isPrivate?: boolean;
  mediaUrl?: string;
};

const Home = () => {
  const [isEventsOnlyMode, setIsEventsOnlyMode] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const mapViewRef = useRef<MapViewHandle | null>(null);
  const { addMessage, updateMessage } = useMessages();
  const { user } = useAuth();

  const handleEventsOnlyModeChange = (enabled: boolean) => {
    setIsEventsOnlyMode(enabled);
    console.log('🏠 HOME: Events-only mode changed to:', enabled);
  };

  const handleCreateMessage = () => {
    setShowPostModal(true);
    eventBus.emit('createMessage', undefined);
  };

  const handlePostCreated = async (post: DraftPost) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create posts',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        await supabase.from('profiles').insert({
          id: user.id,
          name: user.email?.split('@')[0] || 'Anonymous',
          avatar_url: null,
        });
      }

      const messagePayload = {
        content: post.content || '',
        user_id: user.id,
        lat: post.location.lat,
        lng: post.location.lng,
        location: post.location.name || null,
        is_public: !post.isPrivate,
        media_url: post.mediaUrl || null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const { data: record, error } = await supabase
        .from('messages')
        .insert(messagePayload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (record) {
        const optimisticLat = record.lat ?? post.location.lat;
        const optimisticLng = record.lng ?? post.location.lng;
        const optimisticMessage: MapMessage = {
          id: `new-${record.id}`,
          content: record.content ?? '',
          location: record.location ?? '',
          isPublic: Boolean(record.is_public),
          timestamp: record.created_at ?? new Date().toISOString(),
          expiresAt: record.expires_at ?? null,
          mediaUrl: record.media_url ?? null,
          user: {
            name: user.email?.split('@')[0] || 'Anonymous',
            avatar: user.user_metadata?.avatar_url || '/placeholder.svg',
          },
          position: {
            lat: optimisticLat,
            lng: optimisticLng,
            x: optimisticLat,
            y: optimisticLng,
          },
          lat: optimisticLat,
          lng: optimisticLng,
          liked: false,
          likes: 0,
          isEvent: false,
        };

        addMessage(optimisticMessage);
        eventBus.emit('messageCreated', { id: record.id });

        setTimeout(() => {
          updateMessage(optimisticMessage.id, { id: record.id });
        }, 2000);

        setTimeout(() => {
          eventBus.emit('refreshMessages', undefined);
        }, 120);
      }

      toast({
        title: 'Lo posted! 🎉',
        description: 'Your Lo is now live on the map',
      });

      setShowPostModal(false);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Failed to create Lo',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden bg-gradient-to-b from-sky-100 to-white">
      {/* Header with Wave Logo and Search */}
      <div className="absolute inset-x-0 top-0 z-40">
        <div className="px-6 pt-[calc(env(safe-area-inset-top,24px)+16px)] pb-4 space-y-4">
          {/* Logo and Toggle Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/90 backdrop-blur-sm p-2.5 rounded-2xl shadow-lg">
                <Waves className="h-6 w-6 text-lo-electric-blue" strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lo</h1>
            </div>
            <div className="flex items-center gap-2">
              <SpectaclesToggle
                className="animate-fade-in scale-90"
              />
              <EventsToggle
                className="animate-fade-in scale-90"
                onEventsOnlyModeChange={handleEventsOnlyModeChange}
              />
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search for places or people"
              className="h-12 pl-12 pr-4 rounded-2xl bg-white/90 backdrop-blur-sm border-0 shadow-lg text-sm placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>
      
      {/* Main Map View - Full Screen */}
      <div className="flex-1 relative">
        <MapView ref={mapViewRef} isEventsOnlyMode={isEventsOnlyMode} />
      </div>

      <BottomNavigation onPostClick={handleCreateMessage} />
      
      {/* Post Creation Modal */}
      <CreateLoModal 
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onPostCreated={handlePostCreated}
      />
      
      {/* Test Post Manager (Development) */}
      <TestPostManager />
      
      {/* Events Fetch Debugger (Development) */}
      <EventsFetchTest />
    </div>
  );
};

export default Home;