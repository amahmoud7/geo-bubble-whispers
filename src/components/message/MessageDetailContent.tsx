
import React from 'react';
import { Clock } from 'lucide-react';

interface MessageDetailContentProps {
  content: string;
  mediaUrl?: string;
  timestamp: string;
  expiresAt: string;
}

const MessageDetailContent: React.FC<MessageDetailContentProps> = ({
  content,
  mediaUrl,
  timestamp,
  expiresAt
}) => {
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

  // Calculate time remaining
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  return (
    <div className="p-4 overflow-auto flex-grow">
      <p className="mb-3 text-base">{content}</p>
      {mediaUrl && (
        <div className="w-full rounded-md overflow-hidden h-56 bg-gray-100 mb-3">
          <img
            src={mediaUrl}
            alt="Message media"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
        <span>Posted {formatTimestamp(timestamp)}</span>
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span>{getTimeRemaining(expiresAt)} left</span>
        </div>
      </div>
    </div>
  );
};

export default MessageDetailContent;
