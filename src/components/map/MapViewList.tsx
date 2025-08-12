
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
    <div className="h-full flex flex-col">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Lo Messages
          </h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500 font-medium">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </span>
          </div>
        </div>
        <FilterControls 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          sortBy="recent"
          onSortChange={() => {}} 
          onSearch={() => {}}
        />
      </div>
      
      {/* Content Area */}
      <div className="flex-1 px-4 py-2 overflow-y-auto modern-scrollbar">

        <div className="space-y-3 pb-4">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No messages found</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                There are no messages in this area yet. Be the first to drop a pin!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <Card 
                key={message.id}
                onClick={() => onMessageClick(message.id)}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-0 shadow-sm bg-white/80 backdrop-blur-sm ${
                  selectedMessage === message.id 
                    ? 'ring-2 ring-blue-400 shadow-blue-100 bg-blue-50/80' 
                    : 'hover:shadow-gray-200'
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-md ring-2 ring-gray-100">
                      <img src={message.user.avatar} alt={message.user.name} className="object-cover" />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-gray-800 truncate text-base">{message.user.name}</p>
                        <Badge 
                          variant={message.isPublic ? "default" : "secondary"} 
                          className={`ml-2 rounded-full px-3 py-1 text-xs font-medium ${
                            message.isPublic 
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0' 
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {message.isPublic ? '🌍 Public' : '👥 Followers'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-3">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-6 text-xs">
                        <div className="flex items-center text-gray-500">
                          <div className="w-4 h-4 bg-gradient-to-br from-red-400 to-red-500 rounded-full flex items-center justify-center mr-2">
                            <MapPin className="h-2.5 w-2.5 text-white" />
                          </div>
                          <span className="truncate max-w-[120px] font-medium">{message.location}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Clock className="h-3 w-3 mr-1.5 opacity-70" />
                          <span className="font-medium">{formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {message.mediaUrl && (
                    <div className="mt-4 w-full h-36 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                      <img 
                        src={message.mediaUrl} 
                        alt="Message media" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                </CardContent>
            </Card>
          ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MapViewList;
