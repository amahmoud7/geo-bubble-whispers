
import React, { useState, useRef } from 'react';
import MapView from '../components/MapView';
import TicketmasterToggle from '@/components/events/TicketmasterToggle';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import SimplePostModal from '@/components/post/SimplePostModal';
import { Sparkles, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Home = () => {
  const [isEventsOnlyMode, setIsEventsOnlyMode] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const mapViewRef = useRef<any>(null);

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

  const handlePostCreated = (post: any) => {
    console.log('📍 New post created:', post);
    toast({
      title: "Lo posted!",
      description: "Your Lo has been shared with the community",
    });
    // Here you could also add the post to a global state or refresh the map
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
      <SimplePostModal 
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};

export default Home;
