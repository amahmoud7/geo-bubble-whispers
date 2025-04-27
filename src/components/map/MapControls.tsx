
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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
        className="absolute bottom-8 right-8 rounded-full h-14 w-14 shadow-lg"
        onClick={onCreateMessage}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </>
  );
};

export default MapControls;
