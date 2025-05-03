
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MessageCardFooterProps {
  expiresAt: string;
  messageId: string;
  position: {
    x: number;
    y: number;
  };
  onViewMessage: () => void;
}

const MessageCardFooter: React.FC<MessageCardFooterProps> = ({
  expiresAt,
  messageId,
  position,
  onViewMessage
}) => {
  const navigate = useNavigate();
  
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const handleViewLocation = () => {
    navigate('/home', { 
      state: { 
        center: { lat: position.x, lng: position.y },
        messageId: messageId,
        activateStreetView: true
      }
    });
  };

  return (
    <div className="p-4 pt-0 flex flex-col gap-2">
      <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>{getTimeRemaining(expiresAt)} left</span>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onViewMessage}
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
    </div>
  );
};

export default MessageCardFooter;
