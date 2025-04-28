
import React from 'react';
import { Marker } from '@react-google-maps/api';

interface Message {
  id: string;
  position: { x: number; y: number };
  isPublic: boolean;
  user: {
    avatar: string;
  };
}

interface MessageMarkersProps {
  messages: Message[];
  onMessageClick: (id: string) => void;
}

const MessageMarkers: React.FC<MessageMarkersProps> = ({ messages, onMessageClick }) => {
  const getCustomIcon = (message: Message) => {
    if (!message.user?.avatar) {
      // Default marker if no avatar is available
      return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: message.isPublic ? '#9370DB' : '#0EA5E9',
        fillOpacity: 0.6,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      };
    }

    // Custom icon with user avatar preview
    return {
      url: message.user.avatar,
      scaledSize: new google.maps.Size(32, 32),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(16, 16),
      // Add a white border effect using shadow
      shadow: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><circle cx="18" cy="18" r="16" fill="white"/></svg>',
      shadowSize: new google.maps.Size(36, 36),
      shadowAnchor: new google.maps.Point(18, 18)
    };
  };

  return (
    <>
      {messages.map((message) => (
        <Marker
          key={message.id}
          position={{ lat: message.position.x, lng: message.position.y }}
          onClick={() => onMessageClick(message.id)}
          icon={getCustomIcon(message)}
          animation={google.maps.Animation.DROP}
          zIndex={message.user?.avatar ? 2 : 1} // Put avatar markers on top
          // Make markers visible in street view
          visible={true}
        />
      ))}
    </>
  );
};

export default MessageMarkers;

