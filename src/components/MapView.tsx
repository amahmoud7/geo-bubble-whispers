
import React, { useState, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import MessageDetail from './MessageDetail';
import CreateMessage from './CreateMessage';
import { Button } from '@/components/ui/button';
import { Filter, MapPin, Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';

// Mock data for message bubbles
const mockMessages = [
  {
    id: '1',
    position: { x: '30%', y: '40%' },
    user: {
      name: 'Alex Smith',
      avatar: 'https://github.com/shadcn.png',
    },
    content: 'Just spotted a great street performance here! 🎸',
    mediaUrl: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21',
    isPublic: true,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 82800000).toISOString(),
    location: 'Central Park, New York',
  },
  {
    id: '2',
    position: { x: '70%', y: '20%' },
    user: {
      name: 'Jordan Lee',
      avatar: 'https://github.com/shadcn.png',
    },
    content: 'This coffee shop has the best latte in town! ☕️',
    mediaUrl: '',
    isPublic: true,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    expiresAt: new Date(Date.now() + 79200000).toISOString(),
    location: 'Downtown, Seattle',
  },
  {
    id: '3',
    position: { x: '50%', y: '60%' },
    user: {
      name: 'Taylor Swift',
      avatar: 'https://github.com/shadcn.png',
    },
    content: 'Amazing sunset view from this spot! 🌅',
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    isPublic: false,
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    expiresAt: new Date(Date.now() + 75600000).toISOString(),
    location: 'Malibu Beach, California',
  },
];

const MapView: React.FC = () => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    showPublic: true,
    showFollowers: true,
  });

  const handleBubbleClick = (id: string) => {
    setSelectedMessage(id);
    setIsCreating(false);
  };

  const handleCreateMessage = () => {
    setIsCreating(true);
    setSelectedMessage(null);
  };

  const handleClose = () => {
    setSelectedMessage(null);
    setIsCreating(false);
  };

  const filteredMessages = mockMessages.filter(message => {
    if (message.isPublic && filters.showPublic) return true;
    if (!message.isPublic && filters.showFollowers) return true;
    return false;
  });

  useEffect(() => {
    // Mock geolocation initialization
    console.log('Map initialized with user location');
  }, []);

  return (
    <div className="map-container bg-lo-off-white relative">
      {/* Map placeholder - would be replaced with actual map implementation */}
      <div className="absolute inset-0 bg-gradient-to-b from-lo-light-blue to-lo-light-purple opacity-30"></div>
      
      {/* Filter controls */}
      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuCheckboxItem
              checked={filters.showPublic}
              onCheckedChange={(checked) => 
                setFilters(prev => ({ ...prev, showPublic: checked as boolean }))
              }
            >
              Public Messages
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.showFollowers}
              onCheckedChange={(checked) => 
                setFilters(prev => ({ ...prev, showFollowers: checked as boolean }))
              }
            >
              Follower Messages
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Current location indicator */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-6 h-6 bg-lo-blue rounded-full flex items-center justify-center">
          <MapPin className="h-3 w-3 text-white" />
        </div>
      </div>
      
      {/* Message bubbles */}
      {filteredMessages.map((message) => (
        <MessageBubble
          key={message.id}
          id={message.id}
          position={{
            x: message.position.x,
            y: message.position.y,
          }}
          onClick={handleBubbleClick}
          size={16}
          color={message.isPublic ? 'rgba(147, 112, 219, 0.6)' : 'rgba(14, 165, 233, 0.6)'}
          pulse={message.id === selectedMessage}
        />
      ))}
      
      {/* Selected message detail */}
      {selectedMessage && (
        <MessageDetail 
          message={mockMessages.find(m => m.id === selectedMessage)!}
          onClose={handleClose}
        />
      )}
      
      {/* Create message button */}
      <Button
        className="absolute bottom-8 right-8 rounded-full h-14 w-14 shadow-lg"
        onClick={handleCreateMessage}
      >
        <Plus className="h-6 w-6" />
      </Button>
      
      {/* Create message form */}
      {isCreating && (
        <CreateMessage onClose={handleClose} />
      )}
    </div>
  );
};

export default MapView;
