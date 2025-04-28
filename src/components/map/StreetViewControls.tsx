
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';

interface StreetViewControlsProps {
  onCancelStreetView: () => void;
  onCreateMessage: () => void;
  isInStreetView: boolean;
}

const StreetViewControls: React.FC<StreetViewControlsProps> = ({
  onCancelStreetView,
  onCreateMessage,
  isInStreetView,
}) => {
  return (
    <div className="absolute right-8 top-8 z-20 flex flex-col gap-2">
      <Button
        onClick={onCancelStreetView}
        className="flex items-center gap-2 shadow-lg"
        variant="destructive"
      >
        <X className="h-4 w-4" />
        Exit Street View
      </Button>
      {isInStreetView && (
        <Button
          onClick={onCreateMessage}
          className="flex items-center gap-2 shadow-lg"
          variant="default"
        >
          <MessageSquare className="h-4 w-4" />
          Drop Lo Here
        </Button>
      )}
    </div>
  );
};

export default StreetViewControls;
