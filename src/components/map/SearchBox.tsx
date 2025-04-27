
import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBoxProps {
  onSearchBoxLoad: (ref: google.maps.places.SearchBox) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearchBoxLoad }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const searchBox = new google.maps.places.SearchBox(inputRef.current);
    onSearchBoxLoad(searchBox);

    return () => {
      // Cleanup
      google.maps.event.clearInstanceListeners(searchBox);
    };
  }, [onSearchBoxLoad]);

  return (
    <div className="absolute top-4 left-4 z-10 w-64">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search locations..."
          className="pl-10 pr-4 h-10 w-full bg-white"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
};

export default SearchBox;
