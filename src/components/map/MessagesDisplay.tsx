
import React from 'react';
import MessageMarkers from './MessageMarkers';
import MessageDetail from '../MessageDetail';
import CreateMessage from '../CreateMessage';
import { mockMessages } from '@/mock/messages';

interface MessagesDisplayProps {
  selectedMessage: string | null;
  isCreating: boolean;
  newPinPosition: { lat: number; lng: number } | null;
  isPlacingPin: boolean;
  filteredMessages: typeof mockMessages;
  onMessageClick: (id: string) => void;
  onClose: () => void;
}

const MessagesDisplay: React.FC<MessagesDisplayProps> = ({
  selectedMessage,
  isCreating,
  newPinPosition,
  isPlacingPin,
  filteredMessages,
  onMessageClick,
  onClose,
}) => {
  return (
    <>
      <MessageMarkers 
        messages={filteredMessages}
        onMessageClick={onMessageClick}
      />

      {isPlacingPin && newPinPosition && (
        <MessageMarkers
          messages={[
            {
              id: 'new-pin',
              position: { x: newPinPosition.lat, y: newPinPosition.lng },
              isPublic: true
            }
          ]}
          onMessageClick={() => {}}
        />
      )}

      {selectedMessage && (
        <MessageDetail 
          message={mockMessages.find(m => m.id === selectedMessage)!}
          onClose={onClose}
        />
      )}
      
      {isCreating && newPinPosition && (
        <CreateMessage 
          onClose={onClose}
          initialPosition={newPinPosition}
        />
      )}
    </>
  );
};

export default MessagesDisplay;
