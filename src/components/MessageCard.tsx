
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import MessageCardHeader from './message-card/MessageCardHeader';
import MessageCardContent from './message-card/MessageCardContent';
import MessageCardFooter from './message-card/MessageCardFooter';
import MessageCardActions from './message-card/MessageCardActions';

interface MessageCardProps {
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
    position: {
      x: number;
      y: number;
    };
  };
  onSelect: (id: string) => void;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, onSelect }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(Math.floor(Math.random() * 20));
  const commentsCount = Math.floor(Math.random() * 5); // Mock comments count

  const handleViewMessage = () => {
    // Navigate to the message and pass the ID to the onSelect handler
    onSelect(message.id);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    
    if (!liked) {
      toast({
        title: "Post liked",
        description: "You've liked this Lo",
      });
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(message.id);
    toast({
      title: "Comment",
      description: "Opening comments section",
    });
  };

  return (
    <Card className="slide-up">
      <CardHeader className="p-0">
        <MessageCardHeader
          user={message.user}
          location={message.location}
          isPublic={message.isPublic}
          timestamp={message.timestamp}
        />
      </CardHeader>
      
      <CardContent className="p-0">
        <MessageCardContent
          content={message.content}
          mediaUrl={message.mediaUrl}
        />
      </CardContent>
      
      <CardFooter className="p-0 flex-col gap-2">
        <MessageCardFooter
          expiresAt={message.expiresAt}
          messageId={message.id}
          position={message.position}
          onViewMessage={handleViewMessage}
        />
        
        <div className="px-4 pb-4">
          <MessageCardActions
            messageId={message.id}
            userName={message.user.name}
            content={message.content}
            liked={liked}
            likes={likes}
            commentsCount={commentsCount}
            onLike={handleLike}
            onComment={handleComment}
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default MessageCard;
