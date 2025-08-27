import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  MoreVertical, 
  Reply, 
  Edit3, 
  Trash2, 
  Copy, 
  Heart, 
  Smile, 
  ThumbsUp, 
  Laugh, 
  MapPin,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { DirectMessage } from '@/hooks/useDirectMessaging';
import { useAuth } from '@/hooks/useAuth';
import { useDirectMessaging } from '@/hooks/useDirectMessaging';

interface MessageBubbleProps {
  message: DirectMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  onReply?: (message: DirectMessage) => void;
  className?: string;
}

const EMOJI_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '😡'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  onReply,
  className = '',
}) => {
  const { user } = useAuth();
  const { addReaction, removeReaction, editMessage, deleteMessage } = useDirectMessaging();
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleReaction = async (emoji: string) => {
    if (!user) return;

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions?.find(
      r => r.user_id === user.id && r.reaction === emoji
    );

    if (existingReaction) {
      await removeReaction.mutateAsync({ messageId: message.id, reaction: emoji });
    } else {
      await addReaction.mutateAsync({ messageId: message.id, reaction: emoji });
    }
    setShowReactions(false);
  };

  const handleEdit = async () => {
    if (!editedContent.trim() || editedContent === message.content) {
      setIsEditing(false);
      return;
    }

    await editMessage.mutateAsync({ messageId: message.id, content: editedContent });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      await deleteMessage.mutateAsync(message.id);
    }
  };

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
    }
  };

  const handleVoicePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMessageStatus = () => {
    if (!isOwn || !message.status) return null;
    
    const otherUserStatus = message.status.find(s => s.user_id !== user?.id);
    if (!otherUserStatus) return 'sent';
    
    return otherUserStatus.status;
  };

  const renderMessageContent = () => {
    if (message.is_deleted) {
      return (
        <div className="text-muted-foreground italic text-sm">
          This message was deleted
        </div>
      );
    }

    if (message.media_type === 'location' && message.lat && message.lng) {
      return (
        <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
          <MapPin className="h-4 w-4 text-blue-500" />
          <div className="text-sm">
            <div className="font-medium">Location shared</div>
            <div className="text-muted-foreground">
              {message.lat.toFixed(6)}, {message.lng.toFixed(6)}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              window.open(`https://maps.google.com/?q=${message.lat},${message.lng}`, '_blank');
            }}
          >
            View
          </Button>
        </div>
      );
    }

    if (message.media_type === 'voice' && message.media_url) {
      return (
        <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg min-w-[200px]">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleVoicePlay}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="h-2 bg-muted rounded-full">
              <div className="h-full bg-blue-500 rounded-full w-1/3"></div>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {message.voice_duration ? formatDuration(message.voice_duration) : '0:00'}
          </span>
          <audio
            ref={audioRef}
            src={message.media_url}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>
      );
    }

    if (message.media_type === 'image' && message.media_url) {
      return (
        <div className="max-w-sm">
          <img
            src={message.media_url}
            alt="Shared image"
            className="rounded-lg max-w-full h-auto"
            loading="lazy"
          />
          {message.content && (
            <div className="mt-2 text-sm">{message.content}</div>
          )}
        </div>
      );
    }

    if (message.media_type === 'video' && message.media_url) {
      return (
        <div className="max-w-sm">
          <video
            src={message.media_url}
            controls
            className="rounded-lg max-w-full h-auto"
            preload="metadata"
          />
          {message.content && (
            <div className="mt-2 text-sm">{message.content}</div>
          )}
        </div>
      );
    }

    return (
      <div className="text-sm">
        {message.content}
        {message.edited_at && (
          <span className="text-xs text-muted-foreground ml-2">(edited)</span>
        )}
      </div>
    );
  };

  const renderReplyPreview = () => {
    if (!message.reply_to) return null;

    return (
      <div className="bg-muted/30 border-l-2 border-muted-foreground/30 pl-3 py-1 mb-2 text-xs">
        <div className="font-medium text-muted-foreground">
          {message.reply_to.sender.name || 'Unknown User'}
        </div>
        <div className="text-muted-foreground truncate">
          {message.reply_to.content || (
            message.reply_to.media_type ? `${message.reply_to.media_type} message` : 'Message'
          )}
        </div>
      </div>
    );
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    // Group reactions by emoji
    const reactionGroups = message.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.reaction]) {
        acc[reaction.reaction] = [];
      }
      acc[reaction.reaction].push(reaction);
      return acc;
    }, {} as Record<string, typeof message.reactions>);

    return (
      <div className="flex items-center space-x-1 mt-1">
        {Object.entries(reactionGroups).map(([emoji, reactions]) => (
          <Badge
            key={emoji}
            variant={reactions.some(r => r.user_id === user?.id) ? "default" : "secondary"}
            className="text-xs px-1 py-0 cursor-pointer"
            onClick={() => handleReaction(emoji)}
          >
            {emoji} {reactions.length}
          </Badge>
        ))}
      </div>
    );
  };

  const renderMessageStatus = () => {
    if (!isOwn) return null;
    
    const status = getMessageStatus();
    if (!status) return null;

    return (
      <div className="text-xs text-muted-foreground mt-1">
        {status === 'sent' && '✓'}
        {status === 'delivered' && '✓✓'}
        {status === 'read' && <span className="text-blue-500">✓✓</span>}
      </div>
    );
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} max-w-[80%] space-x-2`}>
        {showAvatar && !isOwn && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={message.sender.avatar_url || ''} alt={message.sender.name || 'User'} />
            <AvatarFallback>
              {(message.sender.name || message.sender.username || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          <div
            className={`relative rounded-2xl px-4 py-2 ${
              isOwn
                ? 'bg-blue-500 text-white'
                : 'bg-muted'
            }`}
          >
            {renderReplyPreview()}
            
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleEdit();
                    } else if (e.key === 'Escape') {
                      setIsEditing(false);
                      setEditedContent(message.content || '');
                    }
                  }}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleEdit}>
                  ✓
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  ✕
                </Button>
              </div>
            ) : (
              renderMessageContent()
            )}

            {/* Message actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute -top-2 ${isOwn ? '-left-8' : '-right-8'} h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity`}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? 'end' : 'start'}>
                {onReply && (
                  <DropdownMenuItem onClick={() => onReply(message)}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setShowReactions(true)}>
                  <Smile className="h-4 w-4 mr-2" />
                  React
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                {isOwn && message.content && !message.is_deleted && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {isOwn && !message.is_deleted && (
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {renderReactions()}
          
          <div className={`flex items-center space-x-1 mt-1 text-xs text-muted-foreground ${isOwn ? 'flex-row-reverse' : ''}`}>
            <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
            {renderMessageStatus()}
          </div>
        </div>
      </div>

      {/* Quick reactions dialog */}
      <Dialog open={showReactions} onOpenChange={setShowReactions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>React to message</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {EMOJI_REACTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                className="h-12 text-2xl"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};