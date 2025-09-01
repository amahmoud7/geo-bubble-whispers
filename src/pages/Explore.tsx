import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import TabbedMapViewList from '@/components/map/TabbedMapViewList';
import { useMessages } from '@/hooks/useMessages';
import { useEventMessages } from '@/hooks/useEventMessages';
import EventDetailModal from '@/components/message/EventDetailModal';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">Explore Lo</h1>
          <Sparkles className="h-5 w-5 text-emerald-500" />
        </div>
        
        {/* Placeholder for balance */}
        <div className="w-10" />
      </div>

      {/* List Content */}
      <div className="h-[calc(100vh-128px)]">
        <TabbedMapViewList
          messages={filteredMessages}
          events={events}
          onMessageClick={handleMessageClick}
          onEventClick={handleEventClick}
          selectedMessage={selectedMessage}
        />
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