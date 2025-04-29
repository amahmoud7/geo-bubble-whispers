
import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Move } from 'lucide-react';

interface LocationInfoProps {
  isPinPlaced: boolean;
  onMovePin?: () => void;
}

const LocationInfo: React.FC<LocationInfoProps> = ({ isPinPlaced, onMovePin }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 mr-1" />
        {isPinPlaced ? (
          <span>Pin placed! Move it to adjust location</span>
        ) : (
          <span>Place your pin on the map</span>
        )}
      </div>
      {isPinPlaced && onMovePin && (
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
          onClick={onMovePin}
        >
          <Move className="h-4 w-4" />
          Move Pin
        </Button>
      )}
    </div>
  );
};

export default LocationInfo;
