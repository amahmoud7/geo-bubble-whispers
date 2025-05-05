
import React from 'react';
import { MapPin, Search } from 'lucide-react';

interface PlacementIndicatorProps {
  isPlacingPin: boolean;
  isManualMode?: boolean;
}

const PlacementIndicator: React.FC<PlacementIndicatorProps> = ({ 
  isPlacingPin, 
  isManualMode = false 
}) => {
  if (!isPlacingPin) return null;

  return (
    <div className="absolute left-1/2 top-8 z-20 transform -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
      {isManualMode ? (
        <>
          <Search className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Click anywhere on the map to place your Lo</span>
        </>
      ) : (
        <>
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Click anywhere on the map to place your Lo</span>
        </>
      )}
    </div>
  );
};

export default PlacementIndicator;
