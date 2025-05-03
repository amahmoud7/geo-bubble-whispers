
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart } from 'lucide-react';

interface Comment {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
}

interface CommentsListProps {
  comments: Comment[];
}

const CommentsList: React.FC<CommentsListProps> = ({ comments }) => {
  // Format timestamp to a relative time (e.g., "2h ago")
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffMs = now.getTime() - commentTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else if (diffMins > 0) {
      return `${diffMins}m`;
    } else {
      return 'now';
    }
  };

  return (
    <div className="space-y-1">
      <ScrollArea className="max-h-[240px] pr-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start mb-3 group">
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
                <button className="text-xs font-medium opacity-0 group-hover:opacity-100">Reply</button>
              </div>
            </div>
            
            <button className="h-5 w-5 text-neutral-500 hover:text-red-500 group-hover:opacity-100 opacity-0">
              <Heart className="h-3 w-3" />
            </button>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default CommentsList;
