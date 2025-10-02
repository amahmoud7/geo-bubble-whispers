import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MessageCircle, Search, UserPlus, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDirectMessaging } from '@/hooks/useDirectMessaging';
import { useRealtimeMessaging } from '@/hooks/useRealtimeMessaging';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import { ConversationList } from '@/components/messaging/ConversationList';
import AppTopBar from '@/components/layout/AppTopBar';
import { Chip } from '@/components/ui/chip';

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
  const { conversations, createOrGetConversation, userPresence } = useDirectMessaging();
  
  // Enable real-time messaging
  useRealtimeMessaging();

  const filteredUsers = useMemo(
    () =>
      mockUsers.filter((mockUser) =>
        mockUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mockUser.username.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
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
      <div className="flex min-h-screen flex-col bg-slate-50 pb-24">
        <AppTopBar title="Messages" subtitle="connect" />
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-500">
          Please sign in to view your inbox.
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-24">
      <AppTopBar
        title={user.email?.split('@')[0] || 'Messages'}
        subtitle="inbox"
        leading={
          <Link to="/home">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        }
        trailing={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => setShowNewConversation((prev) => !prev)}
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        }
      />

      <div className="px-6 pt-3">
        <div className="flex gap-2">
          <Chip selected={activeTab === 'messages'} onClick={() => setActiveTab('messages')} className="flex-1">
            <MessageCircle className="mr-2 h-4 w-4" />
            Messages
          </Chip>
          <Chip selected={activeTab === 'requests'} onClick={() => setActiveTab('requests')} className="flex-1">
            <Users className="mr-2 h-4 w-4" />
            Requests
          </Chip>
        </div>

        {!showNewConversation && (
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search conversations"
              className="h-11 w-full rounded-full bg-white pl-11 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex-1 overflow-hidden px-6">
        {showNewConversation ? (
          <div className="space-y-3 rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-2">
              <h3 className="text-base font-semibold text-slate-900">Start a conversation</h3>
              <p className="text-xs text-slate-500">Suggested people you might know</p>
            </div>
            <div className="space-y-3">
              {filteredUsers.map((mockUser) => (
                <button
                  key={mockUser.id}
                  onClick={() => handleStartConversation(mockUser.id)}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
                        <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {mockUser.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-white bg-emerald-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{mockUser.name}</p>
                      <p className="text-xs text-slate-500">{mockUser.username}</p>
                    </div>
                  </div>
                  <MessageCircle className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        ) : activeTab === 'messages' ? (
          <ConversationList
            conversations={conversations}
            userPresence={userPresence}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
            <MessageCircle className="mb-3 h-10 w-10 text-slate-400" />
            You have no message requests yet.
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Inbox;