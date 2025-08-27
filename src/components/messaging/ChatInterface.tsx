import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { useDirectMessaging } from '@/hooks/useDirectMessaging';
import { useRealtimeMessaging } from '@/hooks/useRealtimeMessaging';
import { useAuth } from '@/hooks/useAuth';
import type { DirectMessage, UserPresence } from '@/hooks/useDirectMessaging';
import { formatDistanceToNow } from 'date-fns';

interface ChatInterfaceProps {
  conversationId: string;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  className = '',
}) => {
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState<DirectMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { 
    conversations,
    useConversationMessages,
    markAsRead,
    userPresence 
  } = useDirectMessaging();

  // Enable real-time messaging
  useRealtimeMessaging();

  const { data: messages = [], isLoading } = useConversationMessages(conversationId);

  // Find the current conversation
  const conversation = conversations.find(conv => conv.id === conversationId);

  // Get other user's presence
  const otherUserPresence: UserPresence | undefined = conversation 
    ? userPresence[conversation.other_user_id]
    : undefined;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length]);

  // Mark messages as read when they come into view
  useEffect(() => {
    if (!user || messages.length === 0) return;

    const unreadMessages = messages
      .filter(msg => 
        msg.sender_id !== user.id && 
        !msg.status?.some(s => s.user_id === user.id && s.status === 'read')
      )
      .map(msg => msg.id);

    if (unreadMessages.length > 0) {
      markAsRead.mutate(unreadMessages);
    }
  }, [messages, user, markAsRead]);

  const handleReply = (message: DirectMessage) => {
    setReplyingTo(message);
  };

  const handleClearReply = () => {
    setReplyingTo(null);
  };

  const isUserOnline = () => {
    if (!otherUserPresence) return false;
    
    // Consider user online if they were active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const lastSeen = new Date(otherUserPresence.last_seen);
    
    return otherUserPresence.is_online && lastSeen > fiveMinutesAgo;
  };

  const isUserTyping = () => {
    return otherUserPresence?.is_typing_in_conversation === conversationId;
  };

  const getLastSeenText = () => {
    if (!otherUserPresence) return '';
    
    if (isUserOnline()) return 'Online';
    
    const lastSeen = new Date(otherUserPresence.last_seen);
    return `Last seen ${formatDistanceToNow(lastSeen, { addSuffix: true })}`;
  };

  const groupMessagesByDate = (messages: DirectMessage[]) => {
    const groups: { date: string; messages: DirectMessage[] }[] = [];
    let currentDate = '';
    let currentGroup: DirectMessage[] = [];

    messages.forEach(message => {
      const messageDate = new Date(message.created_at).toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  if (!conversation) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">
            Conversation not found
          </h2>
          <p className="text-muted-foreground">
            This conversation may have been deleted or you don't have access to it.
          </p>
          <Link to="/inbox" className="inline-block mt-4">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inbox
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center space-x-3">
          <Link to="/inbox">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={conversation.other_user_avatar || ''} 
                  alt={conversation.other_user_name || 'User'} 
                />
                <AvatarFallback>
                  {(conversation.other_user_name || conversation.other_user_username || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isUserOnline() && (
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            
            <div className="min-w-0">
              <h2 className="font-semibold text-sm truncate">
                {conversation.other_user_name || conversation.other_user_username || 'Unknown User'}
              </h2>
              <div className="text-xs text-muted-foreground">
                {isUserTyping() ? (
                  <span className="text-blue-500">typing...</span>
                ) : (
                  getLastSeenText()
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Call buttons */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={conversation.other_user_avatar || ''} 
                    alt={conversation.other_user_name || 'User'} 
                  />
                  <AvatarFallback>
                    {(conversation.other_user_name || conversation.other_user_username || 'U')
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h3 className="font-semibold text-muted-foreground mb-2">
                Start your conversation
              </h3>
              <p className="text-sm text-muted-foreground">
                Send a message to {conversation.other_user_name || 'this user'} to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {groupMessagesByDate(messages).map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
                  <Badge variant="secondary" className="text-xs">
                    {formatDateHeader(group.date)}
                  </Badge>
                </div>

                {/* Messages for this date */}
                {group.messages.map((message, index) => {
                  const isOwn = message.sender_id === user?.id;
                  const previousMessage = group.messages[index - 1];
                  const showAvatar = !isOwn && (
                    !previousMessage || 
                    previousMessage.sender_id !== message.sender_id ||
                    new Date(message.created_at).getTime() - new Date(previousMessage.created_at).getTime() > 300000 // 5 minutes
                  );

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      onReply={handleReply}
                      className="group"
                    />
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message input */}
      <MessageInput
        conversationId={conversationId}
        replyingTo={replyingTo}
        onClearReply={handleClearReply}
      />
    </div>
  );
};