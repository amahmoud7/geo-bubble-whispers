
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import FilterControls from '@/components/FilterControls';

interface Message {
  id: string;
  content: string;
  mediaUrl?: string;
  isPublic: boolean;
  timestamp: string;
  expiresAt: string;
  location: string;
  user: {
    name: string;
    avatar: string;
  };
  position: {
    x: number;
    y: number;
  };
}

interface MapViewListProps {
  messages: Message[];
  onMessageClick: (id: string) => void;
  selectedMessage: string | null;
  filters: {
    showPublic: boolean;
    showFollowers: boolean;
  };
  onFilterChange: (type: 'showPublic' | 'showFollowers', checked: boolean) => void;
}

const MapViewList: React.FC<MapViewListProps> = ({ 
  messages, 
  onMessageClick, 
  selectedMessage,
  filters,
  onFilterChange
}) => {
  const handleFiltersChange = (newFilters: { showPublic: boolean; showFollowers: boolean }) => {
    if (newFilters.showPublic !== filters.showPublic) {
      onFilterChange('showPublic', newFilters.showPublic);
    }
    if (newFilters.showFollowers !== filters.showFollowers) {
      onFilterChange('showFollowers', newFilters.showFollowers);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4 sticky top-0 z-10 bg-background pt-2">
        <h2 className="text-lg font-semibold mb-2">Lo Messages</h2>
        <FilterControls 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          sortBy="recent"
          onSortChange={() => {}} 
          onSearch={() => {}}
        />
      </div>

      <div className="flex-grow overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No messages found in this area
          </div>
        ) : (
          messages.map((message) => (
            <Card 
              key={message.id}
              onClick={() => onMessageClick(message.id)}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                selectedMessage === message.id ? 'ring-2 ring-primary' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <img src={message.user.avatar} alt={message.user.name} />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold truncate">{message.user.name}</p>
                      <Badge variant={message.isPublic ? "default" : "secondary"} className="ml-2">
                        {message.isPublic ? 'Public' : 'Followers'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {message.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate max-w-[100px]">{message.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {message.mediaUrl && (
                  <div className="mt-3 w-full h-32 rounded-md overflow-hidden">
                    <img 
                      src={message.mediaUrl} 
                      alt="Message media" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MapViewList;
