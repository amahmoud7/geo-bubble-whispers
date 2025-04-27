
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Clock, MapPin, X, Heart, MessageSquare, Share2 } from 'lucide-react';

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

const MessageDetail: React.FC<MessageDetailProps> = ({ message, onClose }) => {
  // Calculate time remaining
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleExtend = () => {
    toast({
      title: "Duration Extended",
      description: "Message will be available for another 24 hours.",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto bg-white fade-in">
        <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={message.user.avatar} />
              <AvatarFallback>{message.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{message.user.name}</p>
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{message.location}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Badge variant={message.isPublic ? "default" : "secondary"}>
              {message.isPublic ? 'Public' : 'Followers'}
            </Badge>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <p className="mb-3">{message.content}</p>
          {message.mediaUrl && (
            <div className="w-full rounded-md overflow-hidden h-56 bg-gray-100 mb-3">
              <img
                src={message.mediaUrl}
                alt="Message media"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <span>Posted {formatTimestamp(message.timestamp)}</span>
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{getTimeRemaining(message.expiresAt)} left</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex-col gap-4">
          <div className="flex justify-between w-full border-t border-b py-2">
            <Button variant="ghost" size="sm" className="flex-1">
              <Heart className="h-4 w-4 mr-1" />
              Like
            </Button>
            <Button variant="ghost" size="sm" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-1" />
              Comment
            </Button>
            <Button variant="ghost" size="sm" className="flex-1">
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
          <Button onClick={handleExtend} variant="outline" className="w-full">
            Extend for 24 More Hours
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MessageDetail;
