
import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Share2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MessageCardActionsProps {
  messageId: string;
  userName: string;
  content: string;
  liked: boolean;
  likes: number;
  commentsCount: number;
  onLike: (e: React.MouseEvent) => void;
  onComment: (e: React.MouseEvent) => void;
}

const MessageCardActions: React.FC<MessageCardActionsProps> = ({
  messageId,
  userName,
  content,
  liked,
  likes,
  commentsCount,
  onLike,
  onComment
}) => {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: `Lo from ${userName}`,
        text: content,
        url: window.location.href,
      }).catch(err => {
        toast({
          title: "Shared",
          description: "Link copied to clipboard",
        });
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/home?message=${messageId}`);
      toast({
        title: "Shared",
        description: "Link copied to clipboard",
      });
    }
  };

  return (
    <div className="flex justify-between w-full border-t pt-2">
      <Button 
        variant="ghost" 
        size="sm" 
        className={`flex-1 ${liked ? 'text-red-500' : ''}`} 
        onClick={onLike}
      >
        <Heart className={`h-4 w-4 mr-1 ${liked ? 'fill-current' : ''}`} />
        {likes > 0 && <span>{likes}</span>}
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex-1"
        onClick={onComment}
      >
        <MessageSquare className="h-4 w-4 mr-1" />
        {commentsCount > 0 ? <span>{commentsCount}</span> : 'Comment'}
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex-1"
        onClick={handleShare}
      >
        <Share2 className="h-4 w-4 mr-1" />
        Share
      </Button>
    </div>
  );
};

export default MessageCardActions;
