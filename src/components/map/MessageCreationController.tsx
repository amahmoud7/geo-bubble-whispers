
import React, { useState } from 'react';
import CreateMessageButton from './CreateMessageButton';
import PlacementIndicator from './PlacementIndicator';
import MessageMarkers from './MessageMarkers';
import CreateMessage from '../CreateMessage';
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
}

const MessageCreationController: React.FC<MessageCreationControllerProps> = ({ 
  isCreating,
  isInStreetView,
  isPlacingPin,
  newPinPosition,
  userAvatar,
  userName,
  handleClose,
  handleCreateMessage
}) => {
  // Track if we're in manual location selection mode
  const [isManualLocationMode, setIsManualLocationMode] = useState(false);

  return (
    <>
      {!isInStreetView && (
        <CreateMessageButton onClick={handleCreateMessage} />
      )}

      {isPlacingPin && !isInStreetView && (
        <PlacementIndicator 
          isPlacingPin={isPlacingPin} 
          isManualMode={isManualLocationMode}
        />
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
      
      {isCreating && (
        <CreateMessage 
          onClose={handleClose}
          initialPosition={newPinPosition}
        />
      )}
    </>
  );
};

export default MessageCreationController;
