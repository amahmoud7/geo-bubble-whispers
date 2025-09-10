
import React, { useState } from 'react';
import { Clock, ImageOff } from 'lucide-react';
import { getMessageType } from '../map/utils/messageTypeUtils';

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
  const [imageError, setImageError] = useState(false);
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

  const messageType = getMessageType(mediaUrl, false); // Explicitly pass false for isLivestream

  return (
    <div className="p-4 overflow-auto flex-grow">
      <p className="mb-3 text-base">{content}</p>
      {mediaUrl && (
        <div className="w-full rounded-md overflow-hidden h-56 bg-gray-100 mb-3">
          {messageType === 'video' ? (
            <video
              src={mediaUrl}
              controls
              className="w-full h-full object-cover"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <div className="text-center text-gray-500">
                <ImageOff className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Image unavailable</p>
              </div>
            </div>
          ) : (
            <img
              src={mediaUrl}
              alt="Message media"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Failed to load image:', mediaUrl);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', mediaUrl?.substring(0, 50) + '...');
              }}
            />
          )}
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
