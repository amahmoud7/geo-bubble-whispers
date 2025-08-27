import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Search, 
  MoreVertical, 
  Archive, 
  VolumeX, 
  Volume2, 
  Trash2, 
  MessageCircle,
  Camera,
  Mic,
  Image as ImageIcon,
  MapPin
} from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import type { Conversation, UserPresence } from '@/hooks/useDirectMessaging';
import { useDirectMessaging } from '@/hooks/useDirectMessaging';

interface ConversationListProps {
  conversations: Conversation[];
  userPresence: Record<string, UserPresence>;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  className?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  userPresence,
  searchQuery = '',
  onSearchChange,
  className = '',
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const handleSearchChange = (query: string) => {
    setLocalSearchQuery(query);
    onSearchChange?.(query);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name?.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
    conv.other_user_username?.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
    conv.last_message_content?.toLowerCase().includes(localSearchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd');
    }
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    const { last_message_content, last_message_media_type, last_message_sender_id } = conversation;
    
    if (!last_message_content && !last_message_media_type) {
      return 'No messages yet';
    }

    const isOwn = last_message_sender_id === conversation.other_user_id;
    const prefix = isOwn ? '' : 'You: ';

    if (last_message_media_type) {
      const mediaIcons = {
        image: <ImageIcon className="h-3 w-3 inline mr-1" />,
        video: <Camera className="h-3 w-3 inline mr-1" />,
        voice: <Mic className="h-3 w-3 inline mr-1" />,
        location: <MapPin className="h-3 w-3 inline mr-1" />,
      };

      return (
        <span className="flex items-center">
          {mediaIcons[last_message_media_type as keyof typeof mediaIcons]}
          {prefix}
          {last_message_media_type === 'image' ? 'Photo' :
           last_message_media_type === 'video' ? 'Video' :
           last_message_media_type === 'voice' ? 'Voice message' :
           last_message_media_type === 'location' ? 'Location' :
           last_message_media_type}
        </span>
      );
    }

    return `${prefix}${last_message_content}`;
  };

  const isUserOnline = (userId: string) => {
    const presence = userPresence[userId];
    if (!presence) return false;
    
    // Consider user online if they were active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const lastSeen = new Date(presence.last_seen);
    
    return presence.is_online && lastSeen > fiveMinutesAgo;
  };

  const isUserTyping = (conversationId: string, userId: string) => {
    const presence = userPresence[userId];
    return presence?.is_typing_in_conversation === conversationId;
  };

  if (conversations.length === 0 && localSearchQuery === '') {
    return (
      <div className={`text-center py-12 ${className}`}>
        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No conversations yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Start a conversation by finding someone to message
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search bar */}
      {onSearchChange && (
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={localSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>
      )}

      {/* Conversations list */}
      <div className="divide-y">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {localSearchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isOnline={isUserOnline(conversation.other_user_id)}
              isTyping={isUserTyping(conversation.id, conversation.other_user_id)}
              lastMessagePreview={getLastMessagePreview(conversation)}
              formattedTime={formatTimestamp(conversation.last_message_at)}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isOnline: boolean;
  isTyping: boolean;
  lastMessagePreview: React.ReactNode;
  formattedTime: string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isOnline,
  isTyping,
  lastMessagePreview,
  formattedTime,
}) => {
  return (
    <Link
      to={`/chat/${conversation.id}`}
      className="block hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center space-x-3 p-4">
        {/* Avatar with online indicator */}
        <div className="relative">
          <Avatar className="h-14 w-14">
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
          {isOnline && (
            <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
          )}
        </div>

        {/* Conversation info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm truncate pr-2">
              {conversation.other_user_name || conversation.other_user_username || 'Unknown User'}
            </h3>
            <div className="flex items-center space-x-2 flex-shrink-0">
              {conversation.has_unread_messages && (
                <Badge className="h-2 w-2 p-0 bg-blue-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {formattedTime}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground truncate pr-2 flex-1">
              {isTyping ? (
                <span className="text-blue-500 italic">typing...</span>
              ) : (
                lastMessagePreview
              )}
            </div>
            
            {/* Conversation actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  {conversation.is_muted_by_1 || conversation.is_muted_by_2 ? (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Unmute
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4 w-4 mr-2" />
                      Mute
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Link>
  );
};