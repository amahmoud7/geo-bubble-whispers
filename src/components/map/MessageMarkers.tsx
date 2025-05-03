
import React from 'react';
import { Marker } from '@react-google-maps/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
        return (
          <Marker
            key={message.id}
            position={{ lat: message.position.x, lng: message.position.y }}
            onClick={() => onMessageClick(message.id)}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="${message.isPublic ? '#9370DB' : '#0EA5E9'}" stroke="white" stroke-width="2"/>
                  ${!message.user?.avatar ? 
                    `<text x="18" y="22" font-family="Arial" font-size="14" fill="white" text-anchor="middle">${message.user?.name?.charAt(0) || '?'}</text>` : ''}
                </svg>`
              ),
              anchor: new google.maps.Point(18, 18),
              scaledSize: new google.maps.Size(36, 36)
            }}
            // This ensures the custom marker is visible in street view
            visible={true}
            // Give avatar markers higher z-index
            zIndex={2}
            animation={google.maps.Animation.DROP}
          >
            {/* We use DOM overlay for actual avatar images since SVG can't embed external images */}
            {message.user?.avatar && (
              <div
                className="custom-marker-overlay"
                style={{
                  position: 'absolute',
                  transform: 'translate(-50%, -50%)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  backgroundColor: message.isPublic ? '#9370DB' : '#0EA5E9',
                }}
              >
                <img
                  src={message.user.avatar}
                  alt={message.user.name?.charAt(0) || ''}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = message.user?.name?.charAt(0) || '?';
                    target.parentElement!.style.display = 'flex';
                    target.parentElement!.style.alignItems = 'center';
                    target.parentElement!.style.justifyContent = 'center';
                    target.parentElement!.style.color = 'white';
                    target.parentElement!.style.fontWeight = 'bold';
                  }}
                />
              </div>
            )}
          </Marker>
        );
      })}
    </>
  );
};

export default MessageMarkers;
