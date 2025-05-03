
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseMessageInteractionsProps {
  initialLiked?: boolean;
  initialLikes?: number;
  messageId: string;
  userName: string;
  content: string;
}

export const useMessageInteractions = ({
  initialLiked = false,
  initialLikes = 0,
  messageId,
  userName,
  content
}: UseMessageInteractionsProps) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const { user } = useAuth();
  
  const handleLike = async (e?: React.MouseEvent) => {
    // Prevent event bubbling if event is provided
    if (e) e.stopPropagation();
    
    // If not authenticated, show toast and return
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like posts",
        variant: "destructive"
      });
      return;
    }

    try {
      if (liked) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ user_id: user.id, message_id: messageId });
          
        if (error) throw error;
        
        setLiked(false);
        setLikes(prev => Math.max(0, prev - 1));
      } else {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, message_id: messageId });
          
        if (error) throw error;
        
        setLiked(true);
        setLikes(prev => prev + 1);
        
        toast({
          title: "Post liked",
          description: "You've liked this Lo",
        });
      }
    } catch (error: any) {
      console.error('Error managing like:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update like status",
        variant: "destructive"
      });
    }
  };

  const handleComment = (e?: React.MouseEvent) => {
    // Prevent event bubbling if event is provided
    if (e) e.stopPropagation();
    
    // If not authenticated, show toast and return
    if (!user && !showCommentInput) {
      toast({
        title: "Authentication required",
        description: "Please sign in to comment",
        variant: "destructive"
      });
      return;
    }
    
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
