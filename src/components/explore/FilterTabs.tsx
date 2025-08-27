import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Users, UserCheck, Calendar } from 'lucide-react';

export type FilterType = 'all' | 'public' | 'following' | 'events';

interface FilterTabsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts?: {
    all: number;
    public: number;
    following: number;
    events: number;
  };
}

const FilterTabs: React.FC<FilterTabsProps> = ({
  activeFilter,
  onFilterChange,
  counts
}) => {
  const tabs = [
    {
      key: 'all' as FilterType,
      label: 'All',
      icon: Globe,
      description: 'All posts',
      count: counts?.all
    },
    {
      key: 'public' as FilterType,
      label: 'Public',
      icon: Globe,
      description: 'Public posts',
      count: counts?.public
    },
    {
      key: 'following' as FilterType,
      label: 'Following',
      icon: UserCheck,
      description: 'Posts from people you follow',
      count: counts?.following
    },
    {
      key: 'events' as FilterType,
      label: 'Events',
      icon: Calendar,
      description: 'Event posts',
      count: counts?.events
    }
  ];

  return (
    <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-16 z-30">
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map(({ key, label, icon: Icon, description, count }) => {
          const isActive = activeFilter === key;
          
          return (
            <Button
              key={key}
              variant="ghost"
              className={`flex-shrink-0 h-12 px-4 rounded-none border-b-2 transition-all duration-200 ${
                isActive
                  ? 'border-lo-teal text-lo-teal bg-lo-light-teal/30'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => onFilterChange(key)}
            >
              <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
                {count !== undefined && count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs px-1.5 py-0.5 min-w-[20px] ${
                      isActive 
                        ? 'bg-lo-teal text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {count > 999 ? '999+' : count}
                  </Badge>
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterTabs;