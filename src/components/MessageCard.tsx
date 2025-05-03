
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Heart, MessageSquare, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

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
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(Math.floor(Math.random() * 20));

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleViewLocation = () => {
    navigate('/home', { 
      state: { 
        center: { lat: message.position.x, lng: message.position.y },
        messageId: message.id,
        activateStreetView: true
      }
    });
  };

  const handleViewMessage = () => {
    // Navigate to the street view directly
    handleViewLocation();
    
    // Also pass the message ID to the onSelect handler for any additional functionality
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: `Lo from ${message.user.name}`,
        text: message.content,
        url: window.location.href,
      }).catch(err => {
        toast({
          title: "Shared",
          description: "Link copied to clipboard",
        });
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/home?message=${message.id}`);
      toast({
        title: "Shared",
        description: "Link copied to clipboard",
      });
    }
  };

  return (
    <Card className="slide-up">
      <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
            <AvatarImage 
              src={message.user.avatar} 
              alt={message.user.name.charAt(0)}
            />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
              {message.user.name.charAt(0)}
            </AvatarFallback>
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
          <p className="text-xs text-muted-foreground mt-1">
            {formatTimestamp(message.timestamp)}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-3">
        <p className="mb-2">{message.content}</p>
        {message.mediaUrl && (
          <div className="w-full rounded-md overflow-hidden h-56 bg-gray-100">
            <img
              src={message.mediaUrl}
              alt="Message media"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{getTimeRemaining(message.expiresAt)} left</span>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleViewMessage}
            >
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewLocation}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex justify-between w-full border-t pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 ${liked ? 'text-red-500' : ''}`} 
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 mr-1 ${liked ? 'fill-current' : ''}`} />
            {likes > 0 && <span>{likes}</span>}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={handleComment}
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
      </CardFooter>
    </Card>
  );
};

export default MessageCard;
