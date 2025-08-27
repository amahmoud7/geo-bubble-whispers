import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Clock, TrendingUp, MapPin, ChevronDown } from 'lucide-react';

export type SortType = 'recent' | 'popular' | 'nearby';

interface SortOptionsProps {
  activeSort: SortType;
  onSortChange: (sort: SortType) => void;
  className?: string;
}

const SortOptions: React.FC<SortOptionsProps> = ({
  activeSort,
  onSortChange,
  className = ''
}) => {
  const sortOptions = [
    {
      key: 'recent' as SortType,
      label: 'Most Recent',
      icon: Clock,
      description: 'Latest posts first'
    },
    {
      key: 'popular' as SortType,
      label: 'Most Popular',
      icon: TrendingUp,
      description: 'Highest engagement first'
    },
    {
      key: 'nearby' as SortType,
      label: 'Nearby',
      icon: MapPin,
      description: 'Closest to you first'
    }
  ];

  const getCurrentSortOption = () => {
    return sortOptions.find(option => option.key === activeSort) || sortOptions[0];
  };

  const currentOption = getCurrentSortOption();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`bg-white border-gray-200 hover:bg-gray-50 ${className}`}
        >
          <currentOption.icon className="h-4 w-4 mr-2 text-lo-teal" />
          <span className="font-medium">{currentOption.label}</span>
          <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 p-1">
        {sortOptions.map(({ key, label, icon: Icon, description }) => {
          const isActive = activeSort === key;
          
          return (
            <DropdownMenuItem
              key={key}
              className={`flex items-start space-x-3 p-3 cursor-pointer rounded-md ${
                isActive 
                  ? 'bg-lo-light-teal text-lo-teal' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onSortChange(key)}
            >
              <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                isActive ? 'text-lo-teal' : 'text-gray-500'
              }`} />
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm ${
                  isActive ? 'text-lo-teal' : 'text-gray-900'
                }`}>
                  {label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {description}
                </div>
              </div>
              {isActive && (
                <div className="h-2 w-2 bg-lo-teal rounded-full flex-shrink-0 mt-1" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SortOptions;