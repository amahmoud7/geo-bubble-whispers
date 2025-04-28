
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import SearchBox from './SearchBox';
import FilterMenu from './FilterMenu';

interface MapControlsProps {
  onCreateMessage: () => void;
  filters: {
    showPublic: boolean;
    showFollowers: boolean;
  };
  onFilterChange: (type: 'showPublic' | 'showFollowers', checked: boolean) => void;
  onSearchBoxLoad: (ref: google.maps.places.SearchBox) => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  onCreateMessage,
  filters,
  onFilterChange,
  onSearchBoxLoad
}) => {
  return (
    <>
      <SearchBox onSearchBoxLoad={onSearchBoxLoad} />
      <FilterMenu filters={filters} onFilterChange={onFilterChange} />
      <Button
        className="absolute left-1/2 bottom-8 -translate-x-1/2 flex items-center gap-2 shadow-lg"
        onClick={onCreateMessage}
      >
        <MessageSquare className="h-4 w-4" />
        Drop Lo Here
      </Button>
    </>
  );
};

export default MapControls;
