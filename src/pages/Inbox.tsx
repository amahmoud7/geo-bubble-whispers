import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Camera, Edit3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';

// Mock data for conversations - in real app this would come from Supabase
const mockConversations = [
  {
    id: '1',
    name: '310 niggaz',
    lastMessage: 'Sent 4m ago',
    avatar: '/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png',
    isOnline: true,
    hasCamera: true,
    timestamp: '4m ago'
  },
  {
    id: '2', 
    name: 'The og pan african uncle chat',
    lastMessage: 'Sent 30m ago',
    avatar: '/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png',
    isOnline: true,
    hasCamera: true,
    timestamp: '30m ago'
  },
  {
    id: '3',
    name: 'Hanoak Amanios',
    lastMessage: 'Yea lol',
    avatar: '/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png',
    isOnline: false,
    hasCamera: true,
    timestamp: '6h'
  },
  {
    id: '4',
    name: 'FREE DEALS, FREEBIES & GLITCHES',
    lastMessage: 'Frugal Season | Side Hustles sent a photo',
    avatar: '/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png',
    isOnline: false,
    hasCamera: false,
    timestamp: '14h'
  },
  {
    id: '5',
    name: 'Ashhad Khan, bilalallall, Moiz Ahmed, RAH...',
    lastMessage: 'Shakti Bhandari was active 1h ago',
    avatar: '/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png',
    isOnline: false,
    hasCamera: true,
    timestamp: '1h ago'
  }
];

const Inbox = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'requests'>('messages');
  const { user } = useAuth();

  const filteredConversations = mockConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Please sign in to view your inbox.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-md mx-auto bg-background min-h-screen">
        {/* Header */}
        <div className="sticky top-16 bg-background border-b border-border z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Link to="/home">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-semibold">{user.email?.split('@')[0] || 'User'}</h1>
                <span className="text-muted-foreground">▼</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <div className="h-5 w-5 border border-foreground transform rotate-45"></div>
              </Button>
              <Button variant="ghost" size="icon">
                <Edit3 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-4">
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-3 text-center border-b-2 font-medium transition-colors ${
                activeTab === 'messages'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 text-center border-b-2 font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Requests
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 bg-muted border-none"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="px-4 space-y-1">
          {activeTab === 'messages' ? (
            filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center space-x-3 py-3 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={conversation.avatar} alt={conversation.name} />
                      <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {conversation.isOnline && (
                      <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-background rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate pr-2">{conversation.name}</h3>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {conversation.hasCamera && (
                          <Camera className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate pr-2">
                        {conversation.lastMessage}
                      </p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {conversation.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No conversations found</p>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No message requests</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;