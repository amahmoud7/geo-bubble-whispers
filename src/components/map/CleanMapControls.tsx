import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, MapPin } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem 
} from '@/components/ui/dropdown-menu';

interface CleanMapControlsProps {
  filters: {
    showPublic: boolean;
    showFollowers: boolean;
  };
  onFilterChange: (type: 'showPublic' | 'showFollowers', checked: boolean) => void;
  onSearchBoxLoad: (ref: google.maps.places.SearchBox) => void;
}

const CleanMapControls: React.FC<CleanMapControlsProps> = ({
  filters,
  onFilterChange,
  onSearchBoxLoad
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!inputRef.current) return;

    const searchBox = new google.maps.places.SearchBox(inputRef.current);
    onSearchBoxLoad(searchBox);

    return () => {
      google.maps.event.clearInstanceListeners(searchBox);
    };
  }, [onSearchBoxLoad]);

  return (
    <>
      {/* Top Control Bar */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Bar - Expanded */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search locations, places, addresses..."
              className="pl-11 sm:pl-12 pr-4 h-10 sm:h-12 w-full bg-white/95 backdrop-blur-sm shadow-lg border-0 text-sm sm:text-base placeholder:text-gray-500 focus:bg-white transition-all rounded-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
          </div>

          {/* Filter Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="default"
                variant="outline" 
                className="h-10 sm:h-12 px-3 sm:px-4 bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:bg-white transition-all rounded-xl"
              >
                <Filter className="h-4 sm:h-5 w-4 sm:w-5 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mr-4 sm:mr-6">
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
      </div>


      {/* Left Side Quick Actions */}
      <div className="absolute left-4 sm:left-6 bottom-32 z-20 flex flex-col gap-3">
        {/* My Location Button */}
        <Button
          variant="outline"
          className="h-10 sm:h-12 px-3 sm:px-4 bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:bg-white transition-all rounded-xl active:scale-95"
          onClick={() => {
            // Get user's current location and center map
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                // This would center the map on user location
                console.log('Center map on:', latitude, longitude);
              });
            }
          }}
        >
          <MapPin className="h-4 sm:h-5 w-4 sm:w-5 mr-0 sm:mr-2" />
          <span className="hidden sm:inline">My Location</span>
        </Button>
      </div>
    </>
  );
};

export default CleanMapControls;