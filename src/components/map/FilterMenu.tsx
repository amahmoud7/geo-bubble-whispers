
import React from 'react';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem 
} from '@/components/ui/dropdown-menu';

interface FilterMenuProps {
  filters: {
    showPublic: boolean;
    showFollowers: boolean;
  };
  onFilterChange: (type: 'showPublic' | 'showFollowers', checked: boolean) => void;
}

const FilterMenu: React.FC<FilterMenuProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="absolute top-4 right-4 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="bg-white">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuCheckboxItem
            checked={filters.showPublic}
            onCheckedChange={(checked) => 
              onFilterChange('showPublic', checked as boolean)
            }
          >
            Public Messages
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.showFollowers}
            onCheckedChange={(checked) => 
              onFilterChange('showFollowers', checked as boolean)
            }
          >
            Follower Messages
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FilterMenu;
