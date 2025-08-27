import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, Edit3, MessageCircle, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDirectMessaging } from '@/hooks/useDirectMessaging';
import { useRealtimeMessaging } from '@/hooks/useRealtimeMessaging';
import Navigation from '@/components/Navigation';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import { ConversationList } from '@/components/messaging/ConversationList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Mock data for finding new users to message
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
  
  // Use the real messaging system
  const { 
    conversations, 
    conversationsLoading, 
    createOrGetConversation,
    userPresence 
  } = useDirectMessaging();
  
  // Enable real-time messaging
  useRealtimeMessaging();

  const filteredUsers = mockUsers.filter(mockUser =>
    mockUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mockUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleStartConversation = async (userId: string) => {
    try {
      await createOrGetConversation.mutateAsync(userId);
      setShowNewConversation(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Navigation />
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Please sign in to view your inbox.</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
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
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowNewConversation(!showNewConversation)}
              >
                {showNewConversation ? <ArrowLeft className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
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

        {/* Search Bar - Only show when not in new conversation view */}
        {!showNewConversation && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 bg-muted border-none"
              />
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {showNewConversation ? (
            /* New Conversation View */
            <div className="px-4 space-y-1">
              <div className="py-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Find people to message</h3>
              </div>
              {filteredUsers.map((mockUser) => (
                <div
                  key={mockUser.id}
                  className="flex items-center space-x-3 py-3 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleStartConversation(mockUser.id)}
                >
                  <div className="relative">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
                      <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {mockUser.isOnline && (
                      <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-background rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{mockUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{mockUser.username}</p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={createOrGetConversation.isPending}
                  >
                    {createOrGetConversation.isPending ? 'Starting...' : 'Message'}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            /* Conversations List */
            <div className="flex-1">
              {activeTab === 'messages' ? (
                <ConversationList
                  conversations={conversations}
                  userPresence={userPresence}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No message requests</h3>
                  <p className="text-sm text-muted-foreground">
                    When someone who isn't following you sends you a message, it will appear here
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default Inbox;