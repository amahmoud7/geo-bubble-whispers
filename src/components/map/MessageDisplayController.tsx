
import React from 'react';
import MessageDetail from '../MessageDetail';
import MessageMarkers from './MessageMarkers';
import { Message } from '@/types/database';

interface MessageDisplayControllerProps {
  selectedMessage: string | null;
  filteredMessages: any[];
  onMessageClick: (id: string) => void;
  onClose: () => void;
}

const MessageDisplayController: React.FC<MessageDisplayControllerProps> = React.memo(({ 
  selectedMessage, 
  filteredMessages, 
  onMessageClick,
  onClose
}) => {
  return (
    <>
      <MessageMarkers 
        messages={filteredMessages}
        onMessageClick={onMessageClick}
      />
      
      {selectedMessage && (() => {
        const foundMessage = filteredMessages.find(m => m.id === selectedMessage);
        return foundMessage ? (
          <MessageDetail 
            message={foundMessage}
            onClose={onClose}
          />
        ) : null;
      })()}
    </>
  );
});

MessageDisplayController.displayName = 'MessageDisplayController';

export default MessageDisplayController;
