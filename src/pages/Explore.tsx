import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import TabbedMapViewList from '@/components/map/TabbedMapViewList';
import { useMessages } from '@/hooks/useMessages';
import { useEventMessages } from '@/hooks/useEventMessages';
import EventDetailModal from '@/components/message/EventDetailModal';
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
    setSelectedMessage(id);
    // You could navigate to a message detail view or show a modal here
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-10 w-10 rounded-full hover:bg-gray-100 transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="text-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-lo-navy to-lo-teal bg-clip-text text-transparent">Explore</h1>
                <p className="text-xs text-gray-500 font-medium">Discover what's happening</p>
              </div>
              <div className="p-2 bg-gradient-to-r from-lo-teal/10 to-blue-500/10 rounded-full">
                <Sparkles className="h-5 w-5 text-lo-teal" />
              </div>
            </div>
            
            {/* Trending indicator */}
            <div className="flex items-center space-x-1 px-3 py-2 bg-red-500/10 rounded-full">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <span className="text-xs font-semibold text-red-500">Live</span>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Input
              placeholder="Search events, places, people..."
              className="h-11 pl-10 pr-4 bg-gray-100/80 border-0 rounded-2xl text-base placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-lo-teal/20 transition-all duration-200"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 pb-20">
        <div className="px-4 py-2">
          <TabbedMapViewList
            messages={filteredMessages}
            events={events}
            onMessageClick={handleMessageClick}
            onEventClick={handleEventClick}
            selectedMessage={selectedMessage}
          />
        </div>
      </div>

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