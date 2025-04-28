
import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { StandaloneSearchBox } from '@react-google-maps/api';

interface SearchBoxProps {
  onSearchBoxLoad: (ref: google.maps.places.SearchBox) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearchBoxLoad }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-64">
      <div className="relative">
        {window.google?.maps ? (
          <StandaloneSearchBox onLoad={onSearchBoxLoad}>
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
          </StandaloneSearchBox>
        ) : (
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search locations..."
            className="pl-10 pr-4 h-10 w-full bg-white"
            disabled
          />
        )}
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
};

export default SearchBox;
