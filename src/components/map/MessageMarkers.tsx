
import React from 'react';
import { Marker } from '@react-google-maps/api';

interface Message {
  id: string;
  position: { x: number; y: number };
  isPublic: boolean;
}

interface MessageMarkersProps {
  messages: Message[];
  onMessageClick: (id: string) => void;
}

const MessageMarkers: React.FC<MessageMarkersProps> = ({ messages, onMessageClick }) => {
  return (
    <>
      {messages.map((message) => (
        <Marker
          key={message.id}
          position={{ lat: message.position.x, lng: message.position.y }}
          onClick={() => onMessageClick(message.id)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: message.isPublic ? '#9370DB' : '#0EA5E9',
            fillOpacity: 0.6,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }}
        />
      ))}
    </>
  );
};

export default MessageMarkers;
