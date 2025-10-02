
import React from 'react';
import PlacementIndicator from './PlacementIndicator';
import MessageMarkers from './MessageMarkers';
import CreateMessageModal from '../message/CreateMessageModal';
import { PinPosition } from '@/hooks/usePinPlacement';
import type { MapMessage } from '@/types/messages';

interface MessageCreationControllerProps {
  isCreating: boolean;
  isInStreetView: boolean;
  isPlacingPin: boolean;
  newPinPosition: PinPosition | null;
  userAvatar: string;
  userName: string | undefined;
  handleClose: () => void;
  handleCreateMessage: () => void;
  addMessage: (newMessage: MapMessage) => void;
  updateMessage: (id: string, updates: Partial<MapMessage>) => void;
}

const MessageCreationController: React.FC<MessageCreationControllerProps> = ({ 
  isCreating,
  isInStreetView,
  isPlacingPin,
  newPinPosition,
  userAvatar,
  userName,
  handleClose,
  handleCreateMessage,
  addMessage,
  updateMessage
}) => {
  return (
    <>
      {isPlacingPin && !isInStreetView && (
        <PlacementIndicator isPlacingPin={isPlacingPin} />
      )}

      {isPlacingPin && newPinPosition && (
        <MessageMarkers
          messages={[
            {
              id: 'new-pin',
              position: {
                lat: newPinPosition.lat,
                lng: newPinPosition.lng,
                x: newPinPosition.lat,
                y: newPinPosition.lng,
              },
              isPublic: true,
              user: {
                avatar: userAvatar,
                name: userName || 'New'
              }
            }
          ]}
          onMessageClick={() => {}}
        />
      )}
      
      {isCreating && newPinPosition && (
        <CreateMessageModal 
          onClose={handleClose}
          initialPosition={newPinPosition}
          addMessage={addMessage}
          updateMessage={updateMessage}
        />
      )}
    </>
  );
};

export default MessageCreationController;
