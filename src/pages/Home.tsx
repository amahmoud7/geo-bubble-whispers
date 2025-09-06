
import React, { useState, useRef } from 'react';
import MapView from '../components/MapView';
import TicketmasterToggle from '@/components/events/TicketmasterToggle';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import CreateLoModal from '@/components/post/CreateLoModal';
import { Sparkles, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Home = () => {
  const [isEventsOnlyMode, setIsEventsOnlyMode] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const mapViewRef = useRef<any>(null);
  const { addMessage } = useMessages();
  const { user } = useAuth();

  const handleEventsOnlyModeChange = (enabled: boolean) => {
    setIsEventsOnlyMode(enabled);
    console.log('🏠 HOME: Events-only mode changed to:', enabled);
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

      // Add to local state for immediate UI update
      if (data) {
        const newMessage = {
          id: data.id,
          content: data.content,
          isPublic: data.is_public,
          location: data.location || '',
          timestamp: data.created_at || new Date().toISOString(),
          expiresAt: data.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          mediaUrl: data.media_url,
          user: {
            name: user.email?.split('@')[0] || 'Anonymous',
            avatar: ''
          },
          position: {
            x: data.lat || post.location.lat,
            y: data.lng || post.location.lng
          }
        };
        
        console.log('📍 Adding message to map:', newMessage);
        addMessage(newMessage);
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
    <div className="min-h-screen flex flex-col relative">
      {/* Simple Header with Logo */}
      <div className="absolute top-4 left-4 z-50 flex items-center">
        <img 
          src="/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png" 
          alt="Lo Logo" 
          className="h-12 drop-shadow-lg"
        />
        <Sparkles className="w-6 h-6 text-teal-500 ml-2 animate-pulse" />
      </div>
      
      {/* Main Map View */}
      <MapView isEventsOnlyMode={isEventsOnlyMode} />

      {/* Ticketmaster Events Toggle */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-40">
        <TicketmasterToggle 
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
    </div>
  );
};

export default Home;
