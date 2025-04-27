import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import MessageDetail from './MessageDetail';
import CreateMessage from './CreateMessage';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import SearchBox from './map/SearchBox';
import FilterMenu from './map/FilterMenu';
import MessageMarkers from './map/MessageMarkers';

const mockMessages = [
  {
    id: '1',
    position: { x: 40.7829, y: -73.9654 },
    user: {
      name: 'Alex Smith',
      avatar: 'https://github.com/shadcn.png',
    },
    content: 'Just spotted a great street performance here! 🎸',
    mediaUrl: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21',
    isPublic: true,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 82800000).toISOString(),
    location: 'Central Park, New York',
  },
  {
    id: '2',
    position: { x: 47.6062, y: -122.3321 },
    user: {
      name: 'Jordan Lee',
      avatar: 'https://github.com/shadcn.png',
    },
    content: 'This coffee shop has the best latte in town! ☕️',
    mediaUrl: '',
    isPublic: true,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    expiresAt: new Date(Date.now() + 79200000).toISOString(),
    location: 'Downtown, Seattle',
  },
  {
    id: '3',
    position: { x: 34.0259, y: -118.7798 },
    user: {
      name: 'Taylor Swift',
      avatar: 'https://github.com/shadcn.png',
    },
    content: 'Amazing sunset view from this spot! 🌅',
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    isPublic: false,
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    expiresAt: new Date(Date.now() + 75600000).toISOString(),
    location: 'Malibu Beach, California',
  },
];

const MapView: React.FC = () => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    showPublic: true,
    showFollowers: true,
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 40.7128,
    lng: -74.0060
  });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCja18mhM6OgcQPkZp7rCZM6C29SGz3S4U',
    libraries: ['places']
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onSearchBoxLoad = (ref: google.maps.places.SearchBox) => {
    setSearchBox(ref);
  };

  useEffect(() => {
    if (!searchBox || !map) return;

    const listener = searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();
      if (!places || places.length === 0) return;

      const bounds = new google.maps.LatLngBounds();
      places.forEach((place) => {
        if (!place.geometry || !place.geometry.location) return;

        if (place.geometry.viewport) {
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });

      map.fitBounds(bounds);
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [searchBox, map]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.log('Error getting location');
        }
      );
    }
  }, []);

  const handleBubbleClick = (id: string) => {
    setSelectedMessage(id);
    setIsCreating(false);
  };

  const handleCreateMessage = () => {
    setIsCreating(true);
    setSelectedMessage(null);
  };

  const handleClose = () => {
    setSelectedMessage(null);
    setIsCreating(false);
  };

  const handleFilterChange = (type: 'showPublic' | 'showFollowers', checked: boolean) => {
    setFilters(prev => ({ ...prev, [type]: checked }));
  };

  const filteredMessages = mockMessages.filter(message => {
    if (message.isPublic && filters.showPublic) return true;
    if (!message.isPublic && filters.showFollowers) return true;
    return false;
  });

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="map-container relative w-full h-[calc(100vh-4rem)]">
      <SearchBox onSearchBoxLoad={onSearchBoxLoad} />
      <FilterMenu filters={filters} onFilterChange={handleFilterChange} />

      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={userLocation}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#f5f5f5' }]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#e9e9e9' }]
            },
          ],
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
      >
        <Marker
          position={userLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }}
        />

        <MessageMarkers 
          messages={filteredMessages}
          onMessageClick={handleBubbleClick}
        />
      </GoogleMap>

      {selectedMessage && (
        <MessageDetail 
          message={mockMessages.find(m => m.id === selectedMessage)!}
          onClose={handleClose}
        />
      )}
      
      <Button
        className="absolute bottom-8 right-8 rounded-full h-14 w-14 shadow-lg"
        onClick={handleCreateMessage}
      >
        <Plus className="h-6 w-6" />
      </Button>
      
      {isCreating && (
        <CreateMessage onClose={handleClose} />
      )}
    </div>
  );
};

export default MapView;
