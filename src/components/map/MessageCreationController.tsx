
import React from 'react';
import PlacementIndicator from './PlacementIndicator';
import MessageMarkers from './MessageMarkers';
import CreateMessageModal from '../message/CreateMessageModal';
import { PinPosition } from '@/hooks/usePinPlacement';

interface MessageCreationControllerProps {
  isCreating: boolean;
  isInStreetView: boolean;
  isPlacingPin: boolean;
  newPinPosition: PinPosition | null;
  userAvatar: string;
  userName: string | undefined;
  handleClose: () => void;
  handleCreateMessage: () => void;
  addMessage: (newMessage: any) => void;
  updateMessage: (id: string, updates: any) => void;
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
              position: { x: newPinPosition.lat, y: newPinPosition.lng },
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
