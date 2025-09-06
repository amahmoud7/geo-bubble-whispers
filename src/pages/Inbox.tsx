import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, Edit3, MessageCircle, UserPlus, Sparkles, Users } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pb-20">
      <Navigation />
      
      <div className="w-full min-h-screen">
        {/* Modern Header */}
        <div className="sticky top-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 z-10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Link to="/home">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100 transition-all duration-200">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="text-left">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-lo-navy to-lo-teal bg-clip-text text-transparent">
                      {user.email?.split('@')[0] || 'Messages'}
                    </h1>
                    <p className="text-xs text-gray-500 font-medium">Stay connected with friends</p>
                  </div>
                  <div className="p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full">
                    <MessageCircle className="h-4 w-4 text-purple-500" />
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowNewConversation(!showNewConversation)}
                className={`h-10 w-10 rounded-full transition-all duration-200 ${
                  showNewConversation 
                    ? 'bg-lo-teal/10 text-lo-teal hover:bg-lo-teal/20' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {showNewConversation ? <ArrowLeft className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              </Button>
            </div>

            {/* Modern Tabs */}
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex-1 py-3 px-4 text-center rounded-2xl font-semibold transition-all duration-300 ${
                  activeTab === 'messages'
                    ? 'bg-gradient-to-r from-lo-teal to-blue-500 text-white shadow-lg shadow-lo-teal/25'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/80 backdrop-blur-sm'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Messages</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-3 px-4 text-center rounded-2xl font-semibold transition-all duration-300 ${
                  activeTab === 'requests'
                    ? 'bg-gradient-to-r from-lo-teal to-blue-500 text-white shadow-lg shadow-lo-teal/25'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/80 backdrop-blur-sm'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Requests</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        {!showNewConversation && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search messages, people, content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-12 pr-4 bg-gray-100/80 border-0 rounded-2xl text-base placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-lo-teal/20 transition-all duration-200"
              />
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {showNewConversation ? (
            /* Enhanced New Conversation View */
            <div className="px-4 space-y-2">
              <div className="py-3">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Start New Conversation</h3>
                <p className="text-sm text-gray-500 font-medium">Find people to connect with</p>
              </div>
              {filteredUsers.map((mockUser) => (
                <div
                  key={mockUser.id}
                  className="flex items-center space-x-4 py-4 px-3 rounded-2xl hover:bg-white hover:shadow-lg cursor-pointer transition-all duration-300 bg-white/50 backdrop-blur-sm border border-gray-200/50"
                  onClick={() => handleStartConversation(mockUser.id)}
                >
                  <div className="relative">
                    <Avatar className="h-16 w-16 ring-2 ring-white shadow-lg">
                      <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
                      <AvatarFallback className="bg-gradient-to-r from-lo-teal to-blue-500 text-white font-semibold text-lg">{mockUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {mockUser.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 border-3 border-white rounded-full shadow-lg animate-pulse"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-gray-900">{mockUser.name}</h3>
                    <p className="text-sm text-gray-500 font-medium">{mockUser.username}</p>
                    <p className="text-xs text-gray-400 mt-1">{mockUser.bio}</p>
                  </div>
                  
                  <Button 
                    className="bg-gradient-to-r from-lo-teal to-blue-500 hover:from-lo-teal/90 hover:to-blue-500/90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2 rounded-full"
                    size="sm"
                    disabled={createOrGetConversation.isPending}
                  >
                    {createOrGetConversation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-white/50 rounded-full animate-pulse"></div>
                        <span>Starting...</span>
                      </div>
                    ) : (
                      'Message'
                    )}
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