
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Filter } from 'lucide-react';
import SearchBar from './SearchBar';

interface FilterControlsProps {
  filters: {
    showPublic: boolean;
    showFollowers: boolean;
  };
  onFiltersChange: (filters: { showPublic: boolean; showFollowers: boolean }) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  onSearch: (query: string) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  onSearch,
}) => {
  return (
    <div className="flex flex-col gap-4 mb-4 sticky top-0 bg-lo-off-white p-2 z-10">
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <SearchBar onSearch={onSearch} />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem
                checked={filters.showPublic}
                onCheckedChange={(checked) => 
                  onFiltersChange({ ...filters, showPublic: checked as boolean })
                }
              >
                Public Messages
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.showFollowers}
                onCheckedChange={(checked) => 
                  onFiltersChange({ ...filters, showFollowers: checked as boolean })
                }
              >
                Follower Messages
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Select
          value={sortBy}
          onValueChange={onSortChange}
        >
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="expiring">Expiring Soon</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FilterControls;

