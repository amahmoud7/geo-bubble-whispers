
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Video } from 'lucide-react';
import SearchBox from './SearchBox';
import FilterMenu from './FilterMenu';

interface MapControlsProps {
  onCreateMessage: () => void;
  onStartLiveStream: () => void;
  filters: {
    showPublic: boolean;
    showFollowers: boolean;
  };
  onFilterChange: (type: 'showPublic' | 'showFollowers', checked: boolean) => void;
  onSearchBoxLoad: (ref: google.maps.places.SearchBox) => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  onCreateMessage,
  onStartLiveStream,
  filters,
  onFilterChange,
  onSearchBoxLoad
}) => {
  return (
    <>
      <SearchBox onSearchBoxLoad={onSearchBoxLoad} />
      <FilterMenu filters={filters} onFilterChange={onFilterChange} />
      
      {/* Live Stream Button */}
      <Button
        className="absolute bottom-24 right-8 rounded-full h-14 w-14 shadow-lg bg-red-500 hover:bg-red-600"
        onClick={onStartLiveStream}
      >
        <Video className="h-6 w-6" />
      </Button>
      
      {/* Create Message Button */}
      <Button
        className="absolute bottom-8 right-8 rounded-full h-14 w-14 shadow-lg"
        onClick={onCreateMessage}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </>
  );
};

export default MapControls;
