
import React from 'react';
import CreateMessageForm from './CreateMessageForm';

interface CreateMessageModalProps {
  onClose: () => void;
  initialPosition?: { lat: number; lng: number };
  addMessage: (newMessage: any) => void;
  updateMessage: (id: string, updates: any) => void;
}

const CreateMessageModal: React.FC<CreateMessageModalProps> = ({ 
  onClose, 
  initialPosition, 
  addMessage, 
  updateMessage 
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <CreateMessageForm 
        onClose={onClose} 
        initialPosition={initialPosition}
        addMessage={addMessage}
        updateMessage={updateMessage}
      />
    </div>
  );
};

export default CreateMessageModal;
