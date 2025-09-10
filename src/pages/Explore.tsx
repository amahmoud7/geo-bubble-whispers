import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import TabbedMapViewList from '@/components/map/TabbedMapViewList';
import { useMessages } from '@/hooks/useMessages';
import { useEventMessages } from '@/hooks/useEventMessages';
import EventDetailModal from '@/components/message/EventDetailModal';
import MessageDetail from '@/components/MessageDetail';
import { ArrowLeft, Sparkles, Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Explore = () => {
  const navigate = useNavigate();
  const { filteredMessages } = useMessages();
  const { events } = useEventMessages();
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const handleMessageClick = (id: string) => {
    // Find the message to determine if it's a user post or event
    const clickedMessage = filteredMessages.find(m => m.id === id);
    
    if (clickedMessage?.isEvent) {
      // Handle event posts - open event modal  
      console.log('🎫 EXPLORE: Opening event modal for:', clickedMessage);
      setSelectedEvent(clickedMessage);
      setShowEventModal(true);
    } else {
      // Handle user posts - set selected message for detail view
      console.log('💬 EXPLORE: Opening message detail for:', clickedMessage);
      setSelectedMessage(id);
    }
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      {/* Compact Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 z-50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-8 w-8 rounded-full hover:bg-gray-100 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold bg-gradient-to-r from-lo-navy to-lo-teal bg-clip-text text-transparent">Explore</h1>
              <Sparkles className="h-4 w-4 text-lo-teal" />
            </div>
            
            {/* Trending indicator */}
            <div className="flex items-center space-x-1 px-2 py-1 bg-red-500/10 rounded-full">
              <TrendingUp className="h-3 w-3 text-red-500" />
              <span className="text-[10px] font-semibold text-red-500">Live</span>
            </div>
          </div>
          
          {/* Compact Search Bar */}
          <div className="relative">
            <Input
              placeholder="Search events, places, people..."
              className="h-9 pl-9 pr-4 bg-gray-100/80 border-0 rounded-xl text-sm placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-lo-teal/20 transition-all duration-200"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-hidden">
        <TabbedMapViewList
          messages={filteredMessages}
          events={events}
          onMessageClick={handleMessageClick}
          onEventClick={handleEventClick}
          selectedMessage={selectedMessage}
        />
      </div>

      {/* Message Detail Modal for user posts */}
      {selectedMessage && (() => {
        const foundMessage = filteredMessages.find(m => m.id === selectedMessage);
        return foundMessage && !foundMessage.isEvent ? (
          <MessageDetail 
            message={foundMessage}
            onClose={() => setSelectedMessage(null)}
          />
        ) : null;
      })()}

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={handleCloseEventModal}
      />

      <BottomNavigation />
    </div>
  );
};

export default Explore;