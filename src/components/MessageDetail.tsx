import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import MessageDetailHeader from './message/MessageDetailHeader';
import MessageDetailContent from './message/MessageDetailContent';
import MessageDetailActions from './message/MessageDetailActions';
import CommentsSection from './message/CommentsSection';
import { useMessageInteractions } from '@/hooks/useMessageInteractions';

interface MessageDetailProps {
  message: {
    id: string;
    user: {
      name: string;
      avatar: string;
    };
    content: string;
    mediaUrl?: string;
    isPublic: boolean;
    timestamp: string;
    expiresAt: string;
    location: string;
  };
  onClose: () => void;
}

// Updated mock comments data with reply support
const mockComments = [
  {
    id: '1',
    user: {
      name: 'Alex Johnson',
      avatar: 'https://i.pravatar.cc/150?u=alex',
    },
    content: 'This is such a beautiful place! 😍',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    likes: 5,
    replies: [
      {
        id: '1-reply-1',
        user: {
          name: 'Sam Williams',
          avatar: 'https://i.pravatar.cc/150?u=sam',
        },
        content: 'I agree! The lighting is perfect.',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), // 1 hour ago
        likes: 2,
      }
    ]
  },
  {
    id: '2',
    user: {
      name: 'Sam Williams',
      avatar: 'https://i.pravatar.cc/150?u=sam',
    },
    content: 'I was there last week! The atmosphere is amazing.',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    likes: 2,
    replies: []
  },
  {
    id: '3',
    user: {
      name: 'Taylor Chen',
      avatar: 'https://i.pravatar.cc/150?u=taylor',
    },
    content: 'Great shot! 📸 What camera did you use?',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    likes: 0,
    replies: []
  },
];

const MessageDetail: React.FC<MessageDetailProps> = ({ message, onClose }) => {
  const { liked, likes, showCommentInput, handleLike, handleComment } = useMessageInteractions({
    messageId: message.id,
    userName: message.user.name,
    content: message.content
  });
  
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(mockComments);
  
  const handleExtend = () => {
    toast({
      title: "Duration Extended",
      description: "Message will be available for another 24 hours.",
    });
  };

  const handleSubmitComment = () => {
    if (comment.trim()) {
      // Add the new comment to the list
      const newComment = {
        id: `comment-${Date.now()}`,
        user: {
          name: 'You', // In a real app, this would be the current user's name
          avatar: 'https://i.pravatar.cc/150?u=user', // In a real app, this would be the current user's avatar
        },
        content: comment.trim(),
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: []
      };
      
      setComments([newComment, ...comments]);
      setComment('');
      
      toast({
        title: "Comment posted",
        description: "Your comment has been added",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto bg-white fade-in flex flex-col max-h-[90vh]">
        <CardHeader className="p-0">
          <MessageDetailHeader 
            user={message.user}
            location={message.location}
            isPublic={message.isPublic}
            onClose={onClose}
          />
        </CardHeader>
        
        <CardContent className="p-0 overflow-auto flex-grow">
          <MessageDetailContent 
            content={message.content}
            mediaUrl={message.mediaUrl}
            timestamp={message.timestamp}
            expiresAt={message.expiresAt}
          />
          
          <CommentsSection 
            comments={comments}
            comment={comment}
            setComment={setComment}
            onSubmitComment={handleSubmitComment}
            showCommentInput={showCommentInput}
          />
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex-col gap-4">
          <MessageDetailActions 
            liked={liked}
            likes={likes}
            onLike={handleLike}
            onComment={handleComment}
            messageId={message.id}
            userName={message.user.name}
            messageContent={message.content}
          />
          
          <Button onClick={handleExtend} variant="outline" className="w-full">
            Extend for 24 More Hours
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MessageDetail;
