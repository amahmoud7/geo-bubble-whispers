
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-center text-sm text-muted-foreground">
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
      </CardFooter>
    </Card>
  );
};

export default MessageCard;
