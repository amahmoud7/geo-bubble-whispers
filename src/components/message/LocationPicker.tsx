
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LocationPickerProps {
  initialPosition?: { lat: number; lng: number };
  onLocationChange: (position: { lat: number; lng: number }) => void;
  isPinPlaced: boolean;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ 
  initialPosition, 
  onLocationChange,
  isPinPlaced
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<google.maps.places.PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  
  useEffect(() => {
    // Initialize Places service when component mounts
    if (window.google && window.google.maps && searchBoxRef.current) {
      const service = new google.maps.places.PlacesService(searchBoxRef.current);
      setPlacesService(service);
    }
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim() || !placesService) return;
    
    setIsSearching(true);
    
    const request = {
      query: searchQuery,
      fields: ['name', 'geometry', 'formatted_address']
    };

    placesService.findPlaceFromQuery(request, (results, status) => {
      setIsSearching(false);
      
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setSearchResults(results);
        
        // If we got results, use the first one
        if (results.length > 0 && results[0].geometry?.location) {
          const location = results[0].geometry.location;
          const newPosition = {
            lat: location.lat(),
            lng: location.lng()
          };
          
          onLocationChange(newPosition);
          toast({
            title: "Location found",
            description: `Selected: ${results[0].name || 'chosen location'}`
          });
        }
      } else {
        toast({
          title: "Location not found",
          description: "Try a different search term",
          variant: "destructive"
        });
        setSearchResults([]);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
        </div>
        <Button 
          type="button" 
          variant="secondary" 
          size="sm" 
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>
      
      {/* Invisible div for PlacesService */}
      <div ref={searchBoxRef} style={{ display: 'none' }}></div>
      
      {/* Location status */}
      <div className="flex items-center text-sm">
        <MapPin className="h-4 w-4 mr-1 text-primary" />
        {isPinPlaced ? (
          <span className="text-green-600">Location selected! You can drag the pin on the map to adjust.</span>
        ) : (
          <span className="text-amber-600">Please select a location by searching or clicking on the map</span>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;
