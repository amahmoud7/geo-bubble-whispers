
import React from 'react';
import CreateMessageForm from './CreateMessageForm';

interface CreateMessageModalProps {
  onClose: () => void;
  initialPosition?: { lat: number; lng: number };
  onManualPinPlacement?: () => void;
}

const CreateMessageModal: React.FC<CreateMessageModalProps> = ({ 
  onClose, 
  initialPosition,
  onManualPinPlacement
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <CreateMessageForm 
        onClose={onClose} 
        initialPosition={initialPosition}
        onManualPinPlacement={onManualPinPlacement} 
      />
    </div>
  );
};

export default CreateMessageModal;
