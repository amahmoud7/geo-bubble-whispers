
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
  // Create a function to generate custom markers
  const getCustomMarkerContent = (message: Message) => {
    // Create a div to hold our custom marker
    const div = document.createElement('div');
    div.className = 'custom-marker';
    div.style.position = 'absolute';
    div.style.transform = 'translate(-50%, -50%)';
    
    // Create the avatar element
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar-container';
    avatarDiv.style.width = '32px';
    avatarDiv.style.height = '32px';
    avatarDiv.style.borderRadius = '50%';
    avatarDiv.style.overflow = 'hidden';
    avatarDiv.style.border = '2px solid white';
    avatarDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    
    // Add background color based on message type
    avatarDiv.style.backgroundColor = message.isPublic ? '#9370DB' : '#0EA5E9';
    
    // Create image if avatar URL exists
    if (message.user?.avatar && message.user.avatar !== '') {
      const img = document.createElement('img');
      img.src = message.user.avatar;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      avatarDiv.appendChild(img);
    } else {
      // Add fallback initials if available
      if (message.user?.name) {
        avatarDiv.style.display = 'flex';
        avatarDiv.style.alignItems = 'center';
        avatarDiv.style.justifyContent = 'center';
        avatarDiv.style.color = 'white';
        avatarDiv.style.fontWeight = 'bold';
        avatarDiv.textContent = message.user.name.charAt(0);
      }
    }
    
    div.appendChild(avatarDiv);
    return div;
  };

  return (
    <>
      {messages.map((message) => {
        // Create the marker element for this message
        const markerElement = getCustomMarkerContent(message);
        
        return (
          <Marker
            key={message.id}
            position={{ lat: message.position.x, lng: message.position.y }}
            onClick={() => onMessageClick(message.id)}
            // Use advanced marker feature for custom HTML content
            icon={{
              url: message.user?.avatar || '',
              scaledSize: new google.maps.Size(32, 32),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(16, 16),
              // Use circle shape for avatar
              path: google.maps.SymbolPath.CIRCLE,
              scale: 16,
              fillColor: message.isPublic ? '#9370DB' : '#0EA5E9',
              fillOpacity: message.user?.avatar ? 0 : 0.7,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
            // Make markers visible in street view
            visible={true}
            // Make sure avatar markers have higher z-index
            zIndex={message.user?.avatar ? 2 : 1}
            animation={google.maps.Animation.DROP}
          />
        );
      })}
    </>
  );
};

export default MessageMarkers;
