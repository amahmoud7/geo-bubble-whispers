import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Calendar, ExternalLink, DollarSign, Users, Globe, Star } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

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

interface EventMessage {
  id: string;
  content: string;
  media_url?: string;
  location?: string;
  lat?: number;
  lng?: number;
  event_source: string;
  external_event_id: string;
  event_url?: string;
  event_title: string;
  event_venue?: string;
  event_start_date: string;
  event_price_min?: number;
  event_price_max?: number;
  created_at: string;
  expires_at?: string;
}

interface TabbedMapViewListProps {
  messages: Message[];
  events: EventMessage[];
  onMessageClick: (id: string) => void;
  onEventClick: (event: EventMessage) => void;
  selectedMessage: string | null;
}

type TabType = 'public' | 'following' | 'events';

const TabbedMapViewList: React.FC<TabbedMapViewListProps> = ({ 
  messages, 
  events,
  onMessageClick,
  onEventClick,
  selectedMessage
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('public');

  // Filter messages for each tab
  const publicMessages = messages.filter(msg => msg.isPublic);
  const followingMessages = messages.filter(msg => !msg.isPublic);

  const renderTabButton = (tab: TabType, label: string, count: number, icon: React.ReactNode) => (
    <Button
      variant={activeTab === tab ? "default" : "ghost"}
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center space-x-2 h-12 rounded-xl font-semibold transition-all duration-200 ${
        activeTab === tab
          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:from-emerald-600 hover:to-green-700'
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{label}</span>
      <Badge variant="secondary" className={`ml-1 ${
        activeTab === tab ? 'bg-white/20 text-white border-0' : 'bg-gray-200 text-gray-600'
      }`}>
        {count}
      </Badge>
    </Button>
  );

  const renderMessageItem = (message: Message) => (
    <Card 
      key={message.id}
      onClick={() => onMessageClick(message.id)}
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-0 shadow-sm bg-white/80 backdrop-blur-sm ${
        selectedMessage === message.id 
          ? 'ring-2 ring-blue-400 shadow-blue-100 bg-blue-50/80' 
          : 'hover:shadow-gray-200'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border-2 border-white shadow-md ring-1 ring-gray-100">
            <img src={message.user.avatar} alt={message.user.name} className="object-cover" />
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <p className="font-semibold text-gray-800 truncate text-sm">{message.user.name}</p>
              <Badge 
                variant={message.isPublic ? "default" : "secondary"} 
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  message.isPublic 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-blue-100 text-blue-700 border-blue-200'
                }`}
              >
                {message.isPublic ? '🌍' : '👥'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {message.content}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
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
          <div className="mt-3 w-full h-24 rounded-lg overflow-hidden">
            <img 
              src={message.mediaUrl} 
              alt="Message media" 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderEventItem = (event: EventMessage) => (
    <Card 
      key={event.id}
      onClick={() => onEventClick(event)}
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-gray-200"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{event.event_title}</h3>
              <Badge className="ml-2 bg-purple-100 text-purple-700 border-purple-200 rounded-full px-2 py-0.5 text-xs">
                🎫 Event
              </Badge>
            </div>
            
            {event.event_venue && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                📍 {event.event_venue}
              </p>
            )}
            
            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{format(new Date(event.event_start_date), 'MMM d, h:mm a')}</span>
              </div>
              
              {(event.event_price_min || event.event_price_max) && (
                <div className="flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  <span>
                    {event.event_price_min && event.event_price_max 
                      ? `$${event.event_price_min} - $${event.event_price_max}`
                      : event.event_price_min 
                        ? `From $${event.event_price_min}`
                        : `Up to $${event.event_price_max}`
                    }
                  </span>
                </div>
              )}
              
              <div className="flex items-center">
                <span className="capitalize text-gray-400">{event.event_source}</span>
                {event.event_url && (
                  <ExternalLink className="h-3 w-3 ml-1" />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmptyState = (tab: TabType) => {
    const emptyStates = {
      public: {
        icon: <Globe className="w-8 h-8 text-gray-400" />,
        title: "No public Los yet",
        description: "Public Los from all users will appear here"
      },
      following: {
        icon: <Users className="w-8 h-8 text-gray-400" />,
        title: "No following Los yet",
        description: "Los from people you follow will appear here"
      },
      events: {
        icon: <Star className="w-8 h-8 text-gray-400" />,
        title: "No events found",
        description: "Events in your current map area will appear here"
      }
    };

    const state = emptyStates[tab];

    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-lo-teal/10 to-blue-500/10 rounded-3xl flex items-center justify-center">
          {state.icon}
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-3">{state.title}</h3>
        <p className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed">
          {state.description}
        </p>
        <div className="mt-6">
          <div className="w-12 h-1 bg-gradient-to-r from-lo-teal to-blue-500 rounded-full mx-auto"></div>
        </div>
      </div>
    );
  };

  const getTabData = () => {
    switch (activeTab) {
      case 'public':
        return { items: publicMessages, renderItem: renderMessageItem };
      case 'following':
        return { items: followingMessages, renderItem: renderMessageItem };
      case 'events':
        return { items: events, renderItem: renderEventItem };
      default:
        return { items: [], renderItem: renderMessageItem };
    }
  };

  const { items, renderItem } = getTabData();

  return (
    <div className="h-full flex flex-col">
      {/* Modern Tab Navigation */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200/30 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex space-x-3 mb-4">
          {renderTabButton('public', 'Public', publicMessages.length, <Globe className="w-4 h-4" />)}
          {renderTabButton('following', 'Following', followingMessages.length, <Users className="w-4 h-4" />)}
          {renderTabButton('events', 'Events', events.length, <Calendar className="w-4 h-4" />)}
        </div>
        
        {/* Enhanced Active Tab Info */}
        <div className="text-center">
          <h2 className="text-xl font-bold bg-gradient-to-r from-lo-navy to-lo-teal bg-clip-text text-transparent mb-1">
            {activeTab === 'public' && 'Public Los'}
            {activeTab === 'following' && 'Following'}
            {activeTab === 'events' && 'Live Events'}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            {items.length} {items.length === 1 ? 'item' : 'items'}
            {activeTab === 'events' && ' happening now'}
            {activeTab === 'public' && ' near you'}
            {activeTab === 'following' && ' from friends'}
          </p>
        </div>
      </div>
      
      {/* Enhanced Content Area */}
      <div className="flex-1 px-4 py-4 overflow-y-auto modern-scrollbar">
        <div className="space-y-4 pb-8">
          {items.length === 0 ? (
            renderEmptyState(activeTab)
          ) : (
            items.map((item: any) => renderItem(item))
          )}
        </div>
      </div>
    </div>
  );
};

export default TabbedMapViewList;