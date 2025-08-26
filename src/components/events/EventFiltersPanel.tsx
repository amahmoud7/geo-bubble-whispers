import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Music,
  Theater,
  Trophy,
  Gamepad2,
  Palette,
  Star,
  Filter,
  X,
  ChevronDown,
  SlidersHorizontal,
  MapPin,
  Clock,
  DollarSign,
  Zap,
  ArrowUpDown
} from 'lucide-react';

interface EventFilters {
  categories: string[];
  priceRange: [number, number];
  dateRange: 'today' | 'thisWeek' | 'thisMonth' | 'all';
  sources: string[];
  startingSoon: boolean;
  distance: number;
  sortBy: 'date' | 'price' | 'distance' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

interface EventFiltersPanelProps {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  eventCount: number;
  isLoading?: boolean;
  onResetFilters: () => void;
}

const EventFiltersPanel: React.FC<EventFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  eventCount,
  isLoading = false,
  onResetFilters
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = [
    { id: 'music', label: 'Music & Concerts', icon: Music, color: 'bg-purple-100 text-purple-800' },
    { id: 'sports', label: 'Sports', icon: Trophy, color: 'bg-green-100 text-green-800' },
    { id: 'theater', label: 'Theater & Arts', icon: Theater, color: 'bg-red-100 text-red-800' },
    { id: 'arts', label: 'Visual Arts', icon: Palette, color: 'bg-indigo-100 text-indigo-800' },
    { id: 'family', label: 'Family & Kids', icon: Star, color: 'bg-orange-100 text-orange-800' },
    { id: 'gaming', label: 'Gaming & Esports', icon: Gamepad2, color: 'bg-blue-100 text-blue-800' },
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Today', description: 'Events happening today' },
    { value: 'thisWeek', label: 'This Week', description: 'Next 7 days' },
    { value: 'thisMonth', label: 'This Month', description: 'Next 30 days' },
    { value: 'all', label: 'All Time', description: 'All upcoming events' },
  ];

  const sortOptions = [
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'price', label: 'Price', icon: DollarSign },
    { value: 'distance', label: 'Distance', icon: MapPin },
    { value: 'popularity', label: 'Popularity', icon: Star },
  ];

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleSourceToggle = (source: string) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter(s => s !== source)
      : [...filters.sources, source];
    
    onFiltersChange({ ...filters, sources: newSources });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.sources.length > 0 && filters.sources.length < 2) count++;
    if (filters.startingSoon) count++;
    if (filters.distance < 50) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {isLoading ? 'Loading...' : `${eventCount} events found`}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <Button
              onClick={onResetFilters}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
          
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="text-gray-600"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            {isExpanded ? 'Less' : 'More'} Filters
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="p-4 space-y-4">
        {/* Categories */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">Event Categories</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isSelected = filters.categories.includes(category.id);
              const Icon = category.icon;
              
              return (
                <Button
                  key={category.id}
                  onClick={() => handleCategoryToggle(category.id)}
                  variant="outline"
                  size="sm"
                  className={`rounded-full transition-all duration-200 ${
                    isSelected 
                      ? `${category.color} border-current font-medium` 
                      : 'hover:bg-gray-50 text-gray-600 border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Quick toggles */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Switch
              checked={filters.startingSoon}
              onCheckedChange={(checked) => 
                onFiltersChange({ ...filters, startingSoon: checked })
              }
              id="starting-soon"
            />
            <Label htmlFor="starting-soon" className="flex items-center space-x-2 cursor-pointer">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Starting Soon</span>
            </Label>
          </div>

          <div className="flex items-center space-x-4">
            <Label className="text-sm font-medium text-gray-700">Date Range:</Label>
            <Select
              value={filters.dateRange}
              onValueChange={(value: any) => onFiltersChange({ ...filters, dateRange: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-4">
          <Label className="text-sm font-medium text-gray-700">Sort by:</Label>
          <div className="flex items-center space-x-2">
            <Select
              value={filters.sortBy}
              onValueChange={(value: any) => onFiltersChange({ ...filters, sortBy: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => onFiltersChange({ 
                ...filters, 
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
              })}
              variant="outline"
              size="sm"
              className="px-3"
            >
              <ArrowUpDown className={`w-4 h-4 ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <div className="border-t border-gray-100 p-4 space-y-6">
            {/* Price Range */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
              </Label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => onFiltersChange({ ...filters, priceRange: value as [number, number] })}
                max={500}
                min={0}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Free</span>
                <span>$500+</span>
              </div>
            </div>

            {/* Distance */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Distance: {filters.distance === 50 ? 'Any distance' : `Within ${filters.distance} miles`}
              </Label>
              <Slider
                value={[filters.distance]}
                onValueChange={([value]) => onFiltersChange({ ...filters, distance: value })}
                max={50}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 mile</span>
                <span>Any distance</span>
              </div>
            </div>

            {/* Event Sources */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Event Sources</Label>
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleSourceToggle('ticketmaster')}
                  variant="outline"
                  size="sm"
                  className={`rounded-full ${
                    filters.sources.includes('ticketmaster')
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Ticketmaster
                </Button>
                <Button
                  onClick={() => handleSourceToggle('eventbrite')}
                  variant="outline"
                  size="sm"
                  className={`rounded-full ${
                    filters.sources.includes('eventbrite')
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Eventbrite
                </Button>
              </div>
            </div>

            <Separator />

            {/* Applied Filters Summary */}
            {activeFiltersCount > 0 && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Active Filters</Label>
                <div className="flex flex-wrap gap-2">
                  {filters.categories.map(categoryId => {
                    const category = categories.find(c => c.id === categoryId);
                    if (!category) return null;
                    
                    return (
                      <Badge
                        key={categoryId}
                        variant="secondary"
                        className={`${category.color} cursor-pointer hover:opacity-80`}
                        onClick={() => handleCategoryToggle(categoryId)}
                      >
                        {category.label}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    );
                  })}
                  
                  {filters.startingSoon && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-800 cursor-pointer hover:opacity-80"
                      onClick={() => onFiltersChange({ ...filters, startingSoon: false })}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Starting Soon
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                  
                  {filters.dateRange !== 'all' && (
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-800 cursor-pointer hover:opacity-80"
                      onClick={() => onFiltersChange({ ...filters, dateRange: 'all' })}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      {dateRangeOptions.find(d => d.value === filters.dateRange)?.label}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default EventFiltersPanel;