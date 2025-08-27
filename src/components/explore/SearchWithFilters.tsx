import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Search,
  Filter,
  X,
  MapPin,
  Calendar,
  Image,
  Video,
  Type,
  Users,
  Globe,
  Clock
} from 'lucide-react';
import debounce from 'lodash/debounce';

export interface SearchFilters {
  query: string;
  type: 'all' | 'text' | 'image' | 'video' | 'event';
  privacy: 'all' | 'public' | 'followers';
  radiusMiles: number;
  timeframe: 'all' | '1h' | '24h' | '7d' | '30d';
  location?: string;
  hasMedia: boolean;
}

interface SearchWithFiltersProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
}

const defaultFilters: SearchFilters = {
  query: '',
  type: 'all',
  privacy: 'all',
  radiusMiles: 10,
  timeframe: 'all',
  hasMedia: false
};

const SearchWithFilters: React.FC<SearchWithFiltersProps> = ({
  onSearch,
  initialFilters = {},
  placeholder = 'Search posts, places, or events...',
  className = '',
  isLoading = false
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    ...defaultFilters,
    ...initialFilters
  });
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('geo-bubble-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const updated = [
      query,
      ...recentSearches.filter(item => item !== query)
    ].slice(0, 5);
    
    setRecentSearches(updated);
    localStorage.setItem('geo-bubble-recent-searches', JSON.stringify(updated));
  }, [recentSearches]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchFilters: SearchFilters) => {
      onSearch(searchFilters);
      if (searchFilters.query.trim()) {
        saveRecentSearch(searchFilters.query);
      }
    }, 300),
    [onSearch, saveRecentSearch]
  );

  // Handle filter changes
  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  }, [filters, debouncedSearch]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    updateFilters({ query: value });
  };

  // Handle recent search selection
  const handleRecentSearchSelect = (query: string) => {
    updateFilters({ query });
    setShowRecentSearches(false);
    searchInputRef.current?.blur();
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('geo-bubble-recent-searches');
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.privacy !== 'all') count++;
    if (filters.radiusMiles !== 10) count++;
    if (filters.timeframe !== 'all') count++;
    if (filters.hasMedia) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Reset filters
  const resetFilters = () => {
    const resetFilters = { ...defaultFilters, query: filters.query };
    setFilters(resetFilters);
    debouncedSearch(resetFilters);
  };

  const typeOptions = [
    { value: 'all', label: 'All types', icon: Search },
    { value: 'text', label: 'Text posts', icon: Type },
    { value: 'image', label: 'Images', icon: Image },
    { value: 'video', label: 'Videos', icon: Video },
    { value: 'event', label: 'Events', icon: Calendar }
  ];

  const privacyOptions = [
    { value: 'all', label: 'All posts', icon: Globe },
    { value: 'public', label: 'Public only', icon: Globe },
    { value: 'followers', label: 'Followers only', icon: Users }
  ];

  const timeframeOptions = [
    { value: 'all', label: 'All time', icon: Clock },
    { value: '1h', label: 'Last hour', icon: Clock },
    { value: '24h', label: 'Last day', icon: Clock },
    { value: '7d', label: 'Last week', icon: Clock },
    { value: '30d', label: 'Last month', icon: Clock }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={placeholder}
            value={filters.query}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowRecentSearches(recentSearches.length > 0)}
            onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
            className="pl-10 pr-12 bg-white border-gray-200 rounded-full"
          />
          
          {/* Filter toggle button */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full ${
                  activeFiltersCount > 0 
                    ? 'text-lo-teal bg-lo-light-teal hover:bg-lo-light-teal' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Filter className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-lo-teal text-white text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={resetFilters}
                      className="text-lo-teal hover:text-lo-teal hover:bg-lo-light-teal"
                    >
                      Reset all
                    </Button>
                  )}
                </div>

                {/* Post type filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Post Type
                  </label>
                  <Select
                    value={filters.type}
                    onValueChange={(value: any) => updateFilters({ type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <option.icon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Privacy filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Privacy
                  </label>
                  <Select
                    value={filters.privacy}
                    onValueChange={(value: any) => updateFilters({ privacy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {privacyOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <option.icon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location radius */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Radius: {filters.radiusMiles} miles
                  </label>
                  <Slider
                    value={[filters.radiusMiles]}
                    onValueChange={(value) => updateFilters({ radiusMiles: value[0] })}
                    min={1}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 mi</span>
                    <span>50 mi</span>
                  </div>
                </div>

                {/* Timeframe filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Time Range
                  </label>
                  <Select
                    value={filters.timeframe}
                    onValueChange={(value: any) => updateFilters({ timeframe: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeframeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <option.icon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Media filter */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Has Media
                  </label>
                  <Button
                    variant={filters.hasMedia ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilters({ hasMedia: !filters.hasMedia })}
                    className={filters.hasMedia ? "bg-lo-teal hover:bg-lo-teal/90" : ""}
                  >
                    {filters.hasMedia ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Recent searches dropdown */}
        {showRecentSearches && recentSearches.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Recent Searches</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRecentSearches}
                  className="text-gray-400 hover:text-gray-600 h-auto p-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="py-1">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  onClick={() => handleRecentSearchSelect(search)}
                >
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="truncate">{search}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active filters display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-sm text-gray-600">Filters:</span>
          
          {filters.type !== 'all' && (
            <Badge variant="secondary" className="bg-lo-light-teal text-lo-teal">
              {typeOptions.find(opt => opt.value === filters.type)?.label}
              <button
                onClick={() => updateFilters({ type: 'all' })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.privacy !== 'all' && (
            <Badge variant="secondary" className="bg-lo-light-teal text-lo-teal">
              {privacyOptions.find(opt => opt.value === filters.privacy)?.label}
              <button
                onClick={() => updateFilters({ privacy: 'all' })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.radiusMiles !== 10 && (
            <Badge variant="secondary" className="bg-lo-light-teal text-lo-teal">
              {filters.radiusMiles} miles
              <button
                onClick={() => updateFilters({ radiusMiles: 10 })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.timeframe !== 'all' && (
            <Badge variant="secondary" className="bg-lo-light-teal text-lo-teal">
              {timeframeOptions.find(opt => opt.value === filters.timeframe)?.label}
              <button
                onClick={() => updateFilters({ timeframe: 'all' })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.hasMedia && (
            <Badge variant="secondary" className="bg-lo-light-teal text-lo-teal">
              Has Media
              <button
                onClick={() => updateFilters({ hasMedia: false })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchWithFilters;