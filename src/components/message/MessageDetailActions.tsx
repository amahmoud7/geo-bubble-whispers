
import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Share2 } from 'lucide-react';
import { useMessageInteractions } from '@/hooks/useMessageInteractions';

interface MessageDetailActionsProps {
  liked: boolean;
  likes: number;
  onLike: () => void;
  onComment: () => void;
  messageId: string;
  userName: string;
  messageContent: string;
}

const MessageDetailActions: React.FC<MessageDetailActionsProps> = ({
  liked,
  likes,
  onLike,
  onComment,
  messageId,
  userName,
  messageContent
}) => {
  const { handleShare } = useMessageInteractions({
    initialLiked: liked,
    initialLikes: likes,
    messageId,
    userName,
    content: messageContent
  });

  return (
    <div className="flex justify-between w-full border-t border-b py-2">
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
        Comment
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

export default MessageDetailActions;
