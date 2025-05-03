
import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Share2 } from 'lucide-react';
import { useMessageInteractions } from '@/hooks/useMessageInteractions';

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
  const { handleShare } = useMessageInteractions({
    initialLiked: liked,
    initialLikes: likes,
    messageId,
    userName,
    content
  });

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
