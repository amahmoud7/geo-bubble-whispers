import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Navigation, Layers3 } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem 
} from '@/components/ui/dropdown-menu';

interface ModernMapControlsProps {
  filters: {
    showPublic: boolean;
    showFollowers: boolean;
  };
  onFilterChange: (type: 'showPublic' | 'showFollowers', checked: boolean) => void;
  onSearchBoxLoad: (ref: google.maps.places.SearchBox) => void;
  map?: google.maps.Map | null;
}

const ModernMapControls: React.FC<ModernMapControlsProps> = ({
  filters,
  onFilterChange,
  onSearchBoxLoad,
  map
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isLoadingLocation, setIsLoadingLocation] = React.useState(false);

  React.useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) {
      return;
    }

    const searchBox = new google.maps.places.SearchBox(inputRef.current);
    onSearchBoxLoad(searchBox);

    return () => {
      google.maps.event.clearInstanceListeners(searchBox);
    };
  }, [onSearchBoxLoad]);

  const handleReturnToLocation = () => {
    setIsLoadingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          if (map) {
            const userLocation = new google.maps.LatLng(latitude, longitude);
            map.setCenter(userLocation);
            map.setZoom(16);
          }
          
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setIsLoadingLocation(false);
    }
  };

  return (
    <>
      {/* Modern Centered Search Bar */}
      <div
        className="absolute inset-x-0 z-30"
        style={{ top: 'calc(env(safe-area-inset-top, 24px) + 72px)' }}
      >
        <div className="px-6">
          <div className="relative max-w-md mx-auto">
            <div className="relative flex items-center">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search places, events, locations..."
                className="w-full h-12 pl-12 pr-14 bg-white/95 backdrop-blur-xl shadow-2xl border-0 rounded-3xl text-base placeholder:text-gray-500 focus:bg-white focus:shadow-3xl transition-all duration-300 focus:ring-2 focus:ring-lo-teal/20"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              
              {/* Filter Button - Inside Search Bar */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="icon"
                      variant="ghost" 
                      className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mt-2 shadow-xl border-0 rounded-2xl backdrop-blur-xl bg-white/95">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">Content Filters</p>
                    </div>
                    <DropdownMenuCheckboxItem
                      checked={filters.showPublic}
                      onCheckedChange={(checked) => 
                        onFilterChange('showPublic', checked as boolean)
                      }
                      className="px-3 py-3 rounded-xl mx-1 my-1"
                    >
                      <div className="flex items-center space-x-3">
                        <Layers3 className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Public Posts</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filters.showFollowers}
                      onCheckedChange={(checked) => 
                        onFilterChange('showFollowers', checked as boolean)
                      }
                      className="px-3 py-3 rounded-xl mx-1 my-1"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-4 w-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                        <span className="font-medium">Following</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons - Bottom Right Stack */}
      <div className="absolute bottom-28 right-4 z-20 flex flex-col space-y-3">
        {/* Return to Location Button */}
        <Button
          onClick={handleReturnToLocation}
          disabled={isLoadingLocation}
          className="h-14 w-14 bg-white/95 backdrop-blur-xl shadow-2xl border-0 rounded-full hover:bg-white hover:shadow-3xl transition-all duration-300 transform hover:scale-105 active:scale-95"
          variant="outline"
        >
          <Navigation 
            className={`h-6 w-6 text-gray-700 ${isLoadingLocation ? 'animate-pulse' : ''}`} 
            fill={isLoadingLocation ? 'currentColor' : 'none'}
          />
        </Button>
      </div>
    </>
  );
};

export default ModernMapControls;
