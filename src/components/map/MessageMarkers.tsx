import React from 'react';
import { Marker } from '@react-google-maps/api';
import { Avatar } from '@/components/ui/avatar';

interface Message {
  id: string;
  position: { x: number; y: number };
  isPublic: boolean;
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
        // Use the actual avatar URL from the user if it exists and is a valid URL
        // otherwise create a fallback SVG with their initial
        const avatarUrl = message.user?.avatar && 
          (message.user.avatar.startsWith('http') || message.user.avatar.startsWith('/')) && 
          !message.user.avatar.includes('data:image/svg+xml')
            ? message.user.avatar
            : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="${message.isPublic ? '#0EA5E9' : '#0EA5E9'}" stroke="white" stroke-width="2"/>
                  <text x="18" y="22" font-family="Arial" font-size="14" fill="white" text-anchor="middle">${message.user?.name?.charAt(0) || '?'}</text>
                </svg>`
              );

        return (
          <Marker
            key={message.id}
            position={{ lat: message.position.x, lng: message.position.y }}
            onClick={() => onMessageClick(message.id)}
            icon={{
              url: avatarUrl,
              anchor: new google.maps.Point(18, 18),
              scaledSize: new google.maps.Size(36, 36),
              // Add rounded corners to the marker by using a circular image
              shape: {
                coords: [18, 18, 18],
                type: 'circle'
              }
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
