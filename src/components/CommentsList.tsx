
import React, { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import CommentWithReplies from './comment/CommentWithReplies';

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
    
    // Find and update the likes count for this comment in the updatedComments array
    const updateComment = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1
          };
        }
        // Check for the comment in replies if it exists
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateComment(comment.replies)
          };
        }
        return comment;
      });
    };
    
    const newComments = updateComment(updatedComments);
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
      {updatedComments.map((comment) => (
        <CommentWithReplies
          key={comment.id}
          comment={comment}
          likedComments={likedComments}
          replyingTo={replyingTo}
          replyText={replyText}
          handleLike={handleLike}
          handleReplyClick={handleReplyClick}
          handleSubmitReply={handleSubmitReply}
          setReplyText={setReplyText}
          formatRelativeTime={formatRelativeTime}
        />
      ))}
    </div>
  );
};

export default CommentsList;
