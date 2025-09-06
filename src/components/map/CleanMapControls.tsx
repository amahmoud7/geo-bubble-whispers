import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Navigation } from 'lucide-react';
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
  map?: google.maps.Map | null;
}

const CleanMapControls: React.FC<CleanMapControlsProps> = ({
  filters,
  onFilterChange,
  onSearchBoxLoad,
  map
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isLoadingLocation, setIsLoadingLocation] = React.useState(false);

  React.useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) {
      console.log('❌ Google Places API not loaded or input ref missing');
      return;
    }

    console.log('✅ Initializing Google Places SearchBox');
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
            map.setZoom(15);
            console.log('📍 Centered map on user location:', latitude, longitude);
          }
          
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setIsLoadingLocation(false);
    }
  };

  return (
    <>
      {/* Top Control Bar - Optimized for iPhone */}
      <div className="absolute top-safe left-safe right-safe z-20" style={{ paddingTop: 'env(safe-area-inset-top, 16px)' }}>
        <div className="px-4 py-2">
          <div className="flex items-center gap-2">
            {/* Search Bar - Full Width */}
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search places..."
                className="pl-10 pr-4 h-11 w-full bg-white/95 backdrop-blur-sm shadow-lg border-0 text-base placeholder:text-gray-500 focus:bg-white transition-all rounded-2xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            {/* Filter Button - Compact */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="default"
                  variant="outline" 
                  className="h-11 w-11 p-0 bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:bg-white transition-all rounded-2xl"
                >
                  <Filter className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mr-4">
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
      </div>

      {/* Return to Current Location Button - Bottom Right */}
      <div className="absolute bottom-24 right-4 z-20">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:bg-white transition-all rounded-full active:scale-95"
          onClick={handleReturnToLocation}
          disabled={isLoadingLocation}
        >
          <Navigation 
            className={`h-5 w-5 ${isLoadingLocation ? 'animate-pulse' : ''}`} 
            fill={isLoadingLocation ? 'currentColor' : 'none'}
          />
        </Button>
      </div>
    </>
  );
};

export default CleanMapControls;