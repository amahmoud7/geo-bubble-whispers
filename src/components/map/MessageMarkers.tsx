
import React from 'react';
import { Marker } from '@react-google-maps/api';

interface Message {
  id: string;
  position: { x: number; y: number };
  isPublic: boolean;
  mediaUrl?: string;
}

interface MessageMarkersProps {
  messages: Message[];
  onMessageClick: (id: string) => void;
}

const MessageMarkers: React.FC<MessageMarkersProps> = ({ messages, onMessageClick }) => {
  const getCustomIcon = (message: Message) => {
    if (!message.mediaUrl) {
      // Default marker for messages without media
      return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: message.isPublic ? '#9370DB' : '#0EA5E9',
        fillOpacity: 0.6,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      };
    }

    // Custom icon with image preview for messages with media
    return {
      url: message.mediaUrl,
      scaledSize: new google.maps.Size(40, 40),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(20, 20),
      // Add a white border effect using shadow
      shadow: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><circle cx="22" cy="22" r="20" fill="white"/></svg>',
      shadowSize: new google.maps.Size(44, 44),
      shadowAnchor: new google.maps.Point(22, 22)
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
          zIndex={message.mediaUrl ? 2 : 1} // Put image markers on top
          // Make markers visible in street view
          visible={true}
        />
      ))}
    </>
  );
};

export default MessageMarkers;
