
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface CreateMessageButtonProps {
  onClick: () => void;
  variant?: "default" | "street-view";
}

const CreateMessageButton: React.FC<CreateMessageButtonProps> = ({
  onClick,
  variant = "default"
}) => {
  return (
    <Button 
      onClick={onClick} 
      variant="default" 
      className={`
        ${variant === "default" 
          ? "absolute bottom-8 left-1/2 transform -translate-x-1/2" 
          : "absolute right-8 bottom-8"
        } 
        z-20 h-12 w-12 rounded-full shadow-lg text-center
        ${variant === "street-view" ? "bg-lo-teal hover:bg-lo-teal/90" : ""}
      `}
    >
      <MessageSquare className="h-6 w-6" />
    </Button>
  );
};

export default CreateMessageButton;
