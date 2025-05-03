
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, MessageSquareReply } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  replies?: Comment[];
}

interface CommentsListProps {
  comments: Comment[];
}

const CommentsList: React.FC<CommentsListProps> = ({ comments }) => {
  // State to track liked comments
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  // State to track comments with active reply inputs
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  // State to track reply input values
  const [replyText, setReplyText] = useState<string>('');
  // State to manage updated comments with replies
  const [updatedComments, setUpdatedComments] = useState<Comment[]>(comments);

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

  // Handle liking a comment
  const handleLike = (commentId: string, currentLikes: number) => {
    // Toggle like state for this comment
    const isCurrentlyLiked = likedComments[commentId] || false;
    const newLikedComments = { ...likedComments, [commentId]: !isCurrentlyLiked };
    setLikedComments(newLikedComments);
    
    // Find and update the likes count for this comment
    const newComments = updatedComments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1
        };
      }
      return comment;
    });
    
    setUpdatedComments(newComments);
    
    // Show toast notification
    if (!isCurrentlyLiked) {
      toast({
        title: "Comment liked",
        description: "You've liked this comment",
      });
    }
  };

  // Handle toggling reply input field
  const handleReplyClick = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyText('');
  };

  // Handle submitting a reply
  const handleSubmitReply = (commentId: string) => {
    if (replyText.trim() === '') return;
    
    // Create a new reply
    const newReply: Comment = {
      id: `reply-${Date.now()}`,
      user: {
        name: 'You', // In a real app, this would be the current user's name
        avatar: 'https://i.pravatar.cc/150?u=user', // In a real app, this would be the current user's avatar
      },
      content: replyText,
      timestamp: new Date().toISOString(),
      likes: 0
    };
    
    // Add the reply to the comment
    const newComments = updatedComments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply]
        };
      }
      return comment;
    });
    
    setUpdatedComments(newComments);
    setReplyingTo(null);
    setReplyText('');
    
    // Show toast notification
    toast({
      title: "Reply posted",
      description: "Your reply has been added",
    });
  };

  return (
    <div className="space-y-1">
      <ScrollArea className="max-h-[240px] pr-4">
        {updatedComments.map((comment) => (
          <div key={comment.id} className="mb-4">
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
                  <button 
                    className="text-xs font-medium mr-3 hover:text-neutral-800"
                    onClick={() => handleReplyClick(comment.id)}
                  >
                    Reply
                  </button>
                </div>
                
                {/* Reply input field */}
                {replyingTo === comment.id && (
                  <div className="flex items-center mt-2">
                    <input
                      type="text"
                      className="flex-1 text-xs border border-gray-300 rounded-full px-3 py-1.5"
                      placeholder={`Reply to ${comment.user.name}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSubmitReply(comment.id);
                      }}
                    />
                    <button 
                      className="ml-2 text-xs font-medium text-blue-500 hover:text-blue-700"
                      onClick={() => handleSubmitReply(comment.id)}
                    >
                      Post
                    </button>
                  </div>
                )}
                
                {/* Display replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-6 mt-2">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start mb-2 group">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={reply.user.avatar} alt={reply.user.name} />
                          <AvatarFallback className="text-xs bg-purple-100 text-purple-500">
                            {reply.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="text-xs">
                            <span className="font-semibold mr-2">{reply.user.name}</span>
                            <span className="text-neutral-700">{reply.content}</span>
                          </div>
                          
                          <div className="flex items-center mt-1 text-xs text-neutral-500">
                            <span className="mr-3">{formatRelativeTime(reply.timestamp)}</span>
                            {reply.likes > 0 && (
                              <span className="mr-3">{reply.likes} likes</span>
                            )}
                          </div>
                        </div>
                        
                        <button 
                          className="h-5 w-5 text-neutral-500 hover:text-red-500 group-hover:opacity-100 opacity-0"
                          onClick={() => handleLike(reply.id, reply.likes)}
                        >
                          <Heart 
                            className={`h-3 w-3 ${likedComments[reply.id] ? 'fill-red-500 text-red-500' : ''}`} 
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                className="h-5 w-5 text-neutral-500 hover:text-red-500 group-hover:opacity-100 opacity-0"
                onClick={() => handleLike(comment.id, comment.likes)}
              >
                <Heart 
                  className={`h-3 w-3 ${likedComments[comment.id] ? 'fill-red-500 text-red-500' : ''}`} 
                />
              </button>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default CommentsList;
