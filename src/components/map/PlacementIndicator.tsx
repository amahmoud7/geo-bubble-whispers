
import React from 'react';
import { MapPin } from 'lucide-react';

interface PlacementIndicatorProps {
  isPlacingPin: boolean;
}

const PlacementIndicator: React.FC<PlacementIndicatorProps> = ({ isPlacingPin }) => {
  if (!isPlacingPin) return null;

  return (
    <div className="absolute left-1/2 top-8 z-20 transform -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
      <MapPin className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">Click anywhere on the map to place your Lo</span>
    </div>
  );
};

export default PlacementIndicator;
