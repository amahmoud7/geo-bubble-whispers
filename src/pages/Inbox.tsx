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
    name: 'Sarah Johnson',
    lastMessage: 'Hey, how are you doing?',
    avatar: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=150&h=150&fit=crop&crop=face',
    isOnline: true,
    hasCamera: true,
    timestamp: '4m ago'
  },
  {
    id: '2', 
    name: 'Mike Chen',
    lastMessage: 'Thanks for the help yesterday!',
    avatar: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=150&h=150&fit=crop&crop=face',
    isOnline: true,
    hasCamera: true,
    timestamp: '30m ago'
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    lastMessage: 'Yea lol',
    avatar: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop&crop=face',
    isOnline: false,
    hasCamera: true,
    timestamp: '6h'
  },
  {
    id: '4',
    name: 'Developer Community',
    lastMessage: 'New coding challenge posted',
    avatar: 'https://images.unsplash.com/photo-1527576539890-dfa815648363?w=150&h=150&fit=crop&crop=center',
    isOnline: false,
    hasCamera: false,
    timestamp: '14h'
  },
  {
    id: '5',
    name: 'Alex Thompson',
    lastMessage: 'See you at the meeting tomorrow',
    avatar: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=150&h=150&fit=crop&crop=face',
    isOnline: false,
    hasCamera: true,
    timestamp: '1h ago'
  },
  {
    id: '6',
    name: 'Jessica Williams',
    lastMessage: 'Perfect! Let\'s do it',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    isOnline: true,
    hasCamera: false,
    timestamp: '2h ago'
  },
  {
    id: '7',
    name: 'David Park',
    lastMessage: 'Can you send me the files?',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isOnline: false,
    hasCamera: true,
    timestamp: '1d ago'
  }
];

// Mock data for users to create new conversations with
const mockUsers = [
  {
    id: '8',
    name: 'Lisa Anderson',
    username: '@lisa_a',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    isOnline: true
  },
  {
    id: '9',
    name: 'James Wilson',
    username: '@james_w',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isOnline: false
  },
  {
    id: '10',
    name: 'Maria Garcia',
    username: '@maria_g',
    avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face',
    isOnline: true
  }
];

const Inbox = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'requests'>('messages');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const { user } = useAuth();

  const filteredConversations = mockConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
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
      
      <div className="w-full bg-background min-h-screen">
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
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowNewConversation(!showNewConversation)}
              >
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

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {showNewConversation ? (
            /* New Conversation View */
            <div className="px-4 space-y-1">
              <div className="py-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Suggested</h3>
              </div>
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 py-3 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    // In real app, this would create a new conversation
                    setShowNewConversation(false);
                    setActiveTab('messages');
                  }}
                >
                  <div className="relative">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {user.isOnline && (
                      <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-background rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.username}</p>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    Message
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            /* Conversations List */
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;