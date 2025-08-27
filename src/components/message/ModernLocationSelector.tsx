import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Navigation, Search, Edit3, Eye, EyeOff, 
  Crosshair, Map, Globe, Lock 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PinPosition } from '@/hooks/usePinPlacement';

interface ModernLocationSelectorProps {
  position: PinPosition | null;
  onPositionChange: (position: PinPosition) => void;
  isPinPlaced: boolean;
  locationName: string;
  onLocationNameChange: (name: string) => void;
  isPrivate: boolean;
  onPrivacyChange: (isPrivate: boolean) => void;
}

interface NearbyLocation {
  id: string;
  name: string;
  category: string;
  distance: string;
  coordinates: PinPosition;
}

const ModernLocationSelector: React.FC<ModernLocationSelectorProps> = ({
  position,
  onPositionChange,
  isPinPlaced,
  locationName,
  onLocationNameChange,
  isPrivate,
  onPrivacyChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [nearbyLocations, setNearbyLocations] = useState<NearbyLocation[]>([
    {
      id: '1',
      name: 'Central Park',
      category: 'Park',
      distance: '0.2 miles',
      coordinates: { lat: 40.785091, lng: -73.968285 }
    },
    {
      id: '2', 
      name: 'Times Square',
      category: 'Tourist Attraction',
      distance: '1.5 miles',
      coordinates: { lat: 40.758896, lng: -73.985130 }
    },
    {
      id: '3',
      name: 'Brooklyn Bridge',
      category: 'Landmark',
      distance: '3.2 miles', 
      coordinates: { lat: 40.706086, lng: -73.996864 }
    }
  ]);
  const [customLocationName, setCustomLocationName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        onPositionChange(newPos);
        onLocationNameChange('Current Location');
        toast({
          title: "Location found",
          description: "Using your current location",
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location access denied",
          description: "Please enable location services to use this feature",
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, [onPositionChange, onLocationNameChange]);

  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    // TODO: Integrate with Google Places API or similar
    // For now, simulate search
    setTimeout(() => {
      setIsSearching(false);
      // Mock search results
      if (query.toLowerCase().includes('coffee')) {
        setNearbyLocations(prev => [
          {
            id: 'search-1',
            name: 'Starbucks Coffee',
            category: 'Coffee Shop',
            distance: '0.1 miles',
            coordinates: { lat: 40.7589, lng: -73.9851 }
          },
          ...prev.slice(0, 2)
        ]);
      }
    }, 1000);
  }, []);

  const selectLocation = (location: NearbyLocation) => {
    onPositionChange(location.coordinates);
    onLocationNameChange(location.name);
    toast({
      title: "Location selected",
      description: `Selected ${location.name}`,
    });
  };

  const handleCustomLocation = () => {
    if (customLocationName.trim() && position) {
      onLocationNameChange(customLocationName);
      setShowCustomInput(false);
      setCustomLocationName('');
      toast({
        title: "Custom location set",
        description: `Location named "${customLocationName}"`,
      });
    }
  };

  const formatCoordinates = (pos: PinPosition) => {
    return `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
  };

  return (
    <div className="space-y-4">
      {/* Current Location Status */}
      <Card className={`border-2 ${isPinPlaced ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${isPinPlaced ? 'bg-green-100' : 'bg-orange-100'}`}>
                <MapPin className={`h-4 w-4 ${isPinPlaced ? 'text-green-600' : 'text-orange-600'}`} />
              </div>
              <div>
                <p className="font-medium">
                  {isPinPlaced ? (locationName || 'Location Selected') : 'Select Location'}
                </p>
                {position && (
                  <p className="text-xs text-muted-foreground">
                    {formatCoordinates(position)}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isPinPlaced && (
                <Badge variant="secondary" className="gap-1">
                  {isPrivate ? (
                    <>
                      <Lock className="h-3 w-3" />
                      Private
                    </>
                  ) : (
                    <>
                      <Globe className="h-3 w-3" />
                      Public
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={getCurrentLocation}
        >
          <Navigation className="h-4 w-4" />
          Use Current
        </Button>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => toast({ title: "Map selector", description: "Click on the map to place a pin" })}
        >
          <Crosshair className="h-4 w-4" />
          Place Pin
        </Button>
      </div>

      {/* Search Bar */}
      <div className="space-y-2">
        <Label htmlFor="location-search">Search Places</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="location-search"
            placeholder="Search for restaurants, parks, landmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchLocations(searchQuery)}
            className="pl-10"
          />
        </div>
        {isSearching && (
          <p className="text-sm text-muted-foreground">Searching...</p>
        )}
      </div>

      {/* Nearby Locations */}
      <div className="space-y-2">
        <Label>Suggested Locations</Label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {nearbyLocations.map((location) => (
            <Card 
              key={location.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => selectLocation(location)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-1 bg-primary/10 rounded">
                      <MapPin className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{location.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {location.category} • {location.distance}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <MapPin className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Location Name */}
      {isPinPlaced && (
        <div className="space-y-3">
          {!showCustomInput ? (
            <div className="flex items-center justify-between">
              <div>
                <Label>Location Name</Label>
                <p className="text-sm text-muted-foreground">
                  {locationName || 'Unnamed Location'}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCustomInput(true)}
                className="gap-2"
              >
                <Edit3 className="h-3 w-3" />
                Edit
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="custom-location">Custom Location Name</Label>
              <div className="flex space-x-2">
                <Input
                  id="custom-location"
                  placeholder="Enter custom location name..."
                  value={customLocationName}
                  onChange={(e) => setCustomLocationName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomLocation()}
                />
                <Button
                  size="sm"
                  onClick={handleCustomLocation}
                  disabled={!customLocationName.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Privacy Settings */}
      {isPinPlaced && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-3">
            {isPrivate ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="location-privacy">Hide precise location</Label>
              <p className="text-xs text-muted-foreground">
                {isPrivate 
                  ? 'Others will see general area only' 
                  : 'Others will see exact location'
                }
              </p>
            </div>
          </div>
          <Switch
            id="location-privacy"
            checked={isPrivate}
            onCheckedChange={onPrivacyChange}
          />
        </div>
      )}

      {/* Mini Map Preview */}
      {position && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Map className="h-4 w-4" />
              Location Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-32 bg-muted flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Map preview for {formatCoordinates(position)}
              </p>
              {/* TODO: Integrate with Google Maps Static API */}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModernLocationSelector;