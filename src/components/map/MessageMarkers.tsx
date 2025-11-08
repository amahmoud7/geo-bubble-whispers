import React from 'react';
import { Marker } from '@react-google-maps/api';
import { Avatar } from '@/components/ui/avatar';
import { getMessageType, getMarkerColor } from './utils/messageTypeUtils';
import { createCustomMarkerIcon } from './CustomMarkerIcon';

// Track render count to prevent infinite loops
let renderCount = 0;
let lastRenderTime = Date.now();

interface Message {
  id: string;
  position: { lat: number; lng: number };
  isPublic: boolean;
  mediaUrl?: string | null;
  isLivestream?: boolean;
  isLive?: boolean; // Track if livestream is currently live
  isEvent?: boolean; // Track if this is an event
  user: {
    avatar: string;
    name?: string;
  };
}

interface MessageMarkersProps {
  messages: Message[];
  onMessageClick: (id: string) => void;
}

const MessageMarkers: React.FC<MessageMarkersProps> = React.memo(({ messages, onMessageClick }) => {
  // Guard: Handle undefined or null messages
  if (!messages || !Array.isArray(messages)) {
    console.warn('⚠️ MessageMarkers: messages is undefined or not an array');
    return null;
  }
  
  // Prevent infinite loop logging spam - but don't return null, just stop logging
  const now = Date.now();
  const shouldLog = now - lastRenderTime >= 1000 || renderCount < 5;
  
  if (now - lastRenderTime < 1000) {
    renderCount++;
    if (renderCount > 10 && shouldLog) {
      console.error('🚨 INFINITE LOOP DETECTED: MessageMarkers rendering too frequently. Stopping logs.');
    }
  } else {
    renderCount = 0;
  }
  lastRenderTime = now;
  
  console.log(`🗺️ MessageMarkers: Rendering ${messages.length} messages`);
  if (messages.length > 0) {
    console.log('📍 First message position:', messages[0].position);
  }
  
  // Validation: Check if Google Maps is loaded
  if (!window.google?.maps) {
    console.warn('⚠️ MessageMarkers: Google Maps not loaded yet');
    return null;
  }
  
  // Validation: Filter messages with valid coordinates
  const validMessages = messages.filter(msg => {
    const hasValidCoords = 
      msg.position?.lat != null &&
      msg.position?.lng != null &&
      !isNaN(msg.position.lat) &&
      !isNaN(msg.position.lng) &&
      msg.position.lat >= -90 &&
      msg.position.lat <= 90 &&
      msg.position.lng >= -180 &&
      msg.position.lng <= 180;
    
    if (!hasValidCoords) {
      console.warn('⚠️ Invalid coordinates for message:', msg.id, msg.position);
    }
    
    return hasValidCoords;
  });
  
  console.log(`✅ MessageMarkers: ${validMessages.length}/${messages.length} messages have valid coordinates`);
  
  return (
    <>
      {validMessages.map((message) => {
        const isEvent = message.isEvent || false;
        const messageType = getMessageType(message.mediaUrl, message.isLivestream, isEvent);
        const userName = message.user?.name || 'Unknown';
        const isLivestream = message.isLivestream || false;
        const isLive = message.isLive || false;
        
        const markerIcon = createCustomMarkerIcon({
          messageType,
          userName,
          mediaUrl: message.mediaUrl,
          isLivestream,
          isLive,
          isEvent,
          size: 36
        });

        const markerSize = messageType === 'text' ? 36 : 
                          (messageType === 'livestream' && isLive) ? 48 : 
                          messageType === 'event' ? 48 : 44;
        const anchorPoint = markerSize / 2;

        return (
          <Marker
            key={message.id}
            position={{ lat: message.position.lat, lng: message.position.lng }}
            onClick={() => onMessageClick(message.id)}
            icon={{
              url: markerIcon,
              anchor: new google.maps.Point(anchorPoint, anchorPoint),
              scaledSize: new google.maps.Size(markerSize, markerSize)
            }}
            visible={true}
            zIndex={message.id.startsWith('new-') ? 100 : 2}
            animation={message.id.startsWith('new-') ? google.maps.Animation.BOUNCE : google.maps.Animation.DROP}
          />
        );
      })}
    </>
  );
});

MessageMarkers.displayName = 'MessageMarkers';

export default MessageMarkers;
