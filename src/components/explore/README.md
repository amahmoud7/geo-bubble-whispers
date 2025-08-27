# Explore Components

This directory contains all components related to the Twitter/X-like Explore page functionality.

## Components Overview

### PostCard
- **Purpose**: Modern Twitter-like post card component
- **Features**: 
  - User avatar and metadata display
  - Content with media support (images/videos)
  - Event post formatting with special badges
  - Engagement actions (like, comment, share, bookmark)
  - Location display with distance calculation
  - Responsive design with hover effects

### FilterTabs
- **Purpose**: Tab-based filtering system
- **Filters**: All, Public, Following, Events
- **Features**: Badge counts, active state styling, responsive design

### SortOptions
- **Purpose**: Dropdown for sorting posts
- **Options**: Recent, Popular, Nearby
- **Features**: Icon indicators, descriptions, active state management

### SearchWithFilters
- **Purpose**: Advanced search with multiple filter options
- **Features**:
  - Real-time search with debouncing
  - Post type filtering (text, image, video, event)
  - Privacy filtering (public, followers only)
  - Location radius slider
  - Time range filtering
  - Media presence filtering
  - Recent searches history
  - Active filters display with badges

### InfiniteScrollFeed
- **Purpose**: Infinite scroll feed container with performance optimizations
- **Features**:
  - Intersection Observer for loading more posts
  - Pull-to-refresh functionality
  - Virtual scrolling considerations
  - Skeleton loading states
  - Network status detection
  - Distance calculations for location-based sorting
  - Error handling with retry options

### PostSkeletonLoader
- **Purpose**: Loading state placeholders
- **Features**: 
  - Realistic post structure mimicking
  - Varied content length simulation
  - Media placeholder support
  - Multiple skeleton variations

## Hook Integration

### useExploreFeed
Custom hook that provides:
- Combined message and event data processing
- Real-time filtering and sorting
- Search functionality
- Pagination management
- Location-based features
- Performance optimizations

## Usage Example

```tsx
import { useExploreFeed } from '@/hooks/useExploreFeed';
import {
  FilterTabs,
  SortOptions,
  SearchWithFilters,
  InfiniteScrollFeed,
  PostSkeletonLoader
} from '@/components/explore';

const ExplorePage = () => {
  const {
    posts,
    currentFilter,
    currentSort,
    isLoading,
    hasMore,
    filterCounts,
    setFilter,
    setSort,
    setSearchFilters,
    loadMore,
    refresh
  } = useExploreFeed();

  return (
    <div>
      <FilterTabs
        activeFilter={currentFilter}
        onFilterChange={setFilter}
        counts={filterCounts}
      />
      <SortOptions
        activeSort={currentSort}
        onSortChange={setSort}
      />
      <SearchWithFilters
        onSearch={setSearchFilters}
      />
      <InfiniteScrollFeed
        posts={posts}
        loading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onRefresh={refresh}
        // ... other handlers
      />
    </div>
  );
};
```

## Styling

All components use:
- Tailwind CSS for styling
- shadcn/ui base components
- Custom `lo-teal` color scheme
- Responsive design patterns
- Smooth transitions and animations
- Modern rounded corners and shadows

## Performance Considerations

- Debounced search (300ms)
- Intersection Observer for infinite scroll
- Virtual scrolling ready (can be extended)
- Lazy loading of media
- Efficient re-renders with React.memo where needed
- Local storage for recent searches

## Accessibility

- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly
- Focus management

## Future Enhancements

- Virtual scrolling implementation
- Advanced caching strategies
- Offline support improvements
- More granular filtering options
- Analytics integration points
- Improved mobile gestures