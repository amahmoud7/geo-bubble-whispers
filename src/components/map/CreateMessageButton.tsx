import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
interface CreateMessageButtonProps {
  onClick: () => void;
}
const CreateMessageButton: React.FC<CreateMessageButtonProps> = ({
  onClick
}) => {
  return <Button onClick={onClick} variant="default" className="absolute right-8 top-1/2 transform -translate-y-1/2 z-20 h-12 w-12 rounded-full shadow-lg text-center">
      <MessageSquare className="h-6 w-6" />
    </Button>;
};
export default CreateMessageButton;