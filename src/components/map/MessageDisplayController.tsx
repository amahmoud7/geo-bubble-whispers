
import React from 'react';
import MessageDetail from '../MessageDetail';
import MessageMarkers from './MessageMarkers';
import { Message } from '@/types/database';

interface MessageDisplayControllerProps {
  selectedMessage: string | null;
  filteredMessages: any[];
  mockMessages: any[];
  onMessageClick: (id: string) => void;
  onClose: () => void;
}

const MessageDisplayController: React.FC<MessageDisplayControllerProps> = ({ 
  selectedMessage, 
  filteredMessages, 
  mockMessages, 
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
        const foundMessage = mockMessages.find(m => m.id === selectedMessage);
        return foundMessage ? (
          <MessageDetail 
            message={foundMessage}
            onClose={onClose}
          />
        ) : null;
      })()}
    </>
  );
};

export default MessageDisplayController;
