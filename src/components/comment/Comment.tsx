
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart } from 'lucide-react';

interface CommentProps {
  comment: {
    id: string;
    user: {
      name: string;
      avatar: string;
    };
    content: string;
    timestamp: string;
    likes: number;
  };
  isLiked: boolean;
  onLike: () => void;
  formatRelativeTime: (timestamp: string) => string;
}

const Comment: React.FC<CommentProps> = ({ 
  comment, 
  isLiked, 
  onLike, 
  formatRelativeTime 
}) => {
  return (
    <div className="flex items-start group">
      <Avatar className="h-8 w-8 mr-2">
        <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
        <AvatarFallback className="text-xs bg-purple-100 text-purple-500">
          {comment.user.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="text-sm">
          <span className="font-semibold mr-2">{comment.user.name}</span>
          <span className="text-neutral-700">{comment.content}</span>
        </div>
        
        <div className="flex items-center mt-1 text-xs text-neutral-500">
          <span className="mr-3">{formatRelativeTime(comment.timestamp)}</span>
          {comment.likes > 0 && (
            <span className="mr-3">{comment.likes} likes</span>
          )}
        </div>
      </div>
      
      <button 
        className="h-5 w-5 text-neutral-500 hover:text-red-500 group-hover:opacity-100 opacity-0"
        onClick={onLike}
      >
        <Heart 
          className={`h-3 w-3 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
        />
      </button>
    </div>
  );
};

export default Comment;
