
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseMessageInteractionsProps {
  initialLiked?: boolean;
  initialLikes?: number;
  messageId: string;
  userName: string;
  content: string;
}

export const useMessageInteractions = ({
  initialLiked = false,
  initialLikes = Math.floor(Math.random() * 20),
  messageId,
  userName,
  content
}: UseMessageInteractionsProps) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [showCommentInput, setShowCommentInput] = useState(false);
  
  const handleLike = (e?: React.MouseEvent) => {
    // Prevent event bubbling if event is provided
    if (e) e.stopPropagation();
    
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    
    if (!liked) {
      toast({
        title: "Post liked",
        description: "You've liked this Lo",
      });
    }
  };

  const handleComment = (e?: React.MouseEvent) => {
    // Prevent event bubbling if event is provided
    if (e) e.stopPropagation();
    
    setShowCommentInput(!showCommentInput);
    
    if (!showCommentInput) {
      toast({
        title: "Comment",
        description: "Opening comments section",
      });
    }
  };

  const handleShare = (e?: React.MouseEvent) => {
    // Prevent event bubbling if event is provided
    if (e) e.stopPropagation();
    
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

  return {
    liked,
    likes,
    showCommentInput,
    handleLike,
    handleComment,
    handleShare
  };
};
