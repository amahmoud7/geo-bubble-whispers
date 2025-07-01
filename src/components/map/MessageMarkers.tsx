import React from 'react';
import { Marker } from '@react-google-maps/api';
import { Avatar } from '@/components/ui/avatar';
import { getMessageType, getMarkerColor } from './utils/messageTypeUtils';
import { createCustomMarkerIcon } from './CustomMarkerIcon';

interface Message {
  id: string;
  position: { x: number; y: number };
  isPublic: boolean;
  mediaUrl?: string | null;
  user: {
    avatar: string;
    name?: string;
  };
}

interface MessageMarkersProps {
  messages: Message[];
  onMessageClick: (id: string) => void;
}

const MessageMarkers: React.FC<MessageMarkersProps> = ({ messages, onMessageClick }) => {
  return (
    <>
      {messages.map((message) => {
        const messageType = getMessageType(message.mediaUrl);
        const userName = message.user?.name || 'Unknown';
        
        // Create custom marker icon based on message type
        const markerIcon = createCustomMarkerIcon({
          messageType,
          userName,
          mediaUrl: message.mediaUrl,
          size: 36
        });

        const markerSize = messageType === 'text' ? 36 : 44;
        const anchorPoint = markerSize / 2;

        return (
          <Marker
            key={message.id}
            position={{ lat: message.position.x, lng: message.position.y }}
            onClick={() => onMessageClick(message.id)}
            icon={{
              url: markerIcon,
              anchor: new google.maps.Point(anchorPoint, anchorPoint),
              scaledSize: new google.maps.Size(markerSize, markerSize)
            }}
            visible={true}
            zIndex={2}
            animation={google.maps.Animation.DROP}
          />
        );
      })}
    </>
  );
};

export default MessageMarkers;
