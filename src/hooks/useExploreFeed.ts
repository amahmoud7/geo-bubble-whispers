import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useEventMessages } from '@/hooks/useEventMessages';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useAuth } from '@/hooks/useAuth';
import type { FilterType } from '@/components/explore/FilterTabs';
import type { SortType } from '@/components/explore/SortOptions';
import type { SearchFilters } from '@/components/explore/SearchWithFilters';

interface ExplorePost {
  id: string;
  content: string;
  mediaUrl?: string;
  timestamp: string;
  location: string;
  user: {
    name: string;
    avatar: string;
    username?: string;
  };
  isPublic: boolean;
  position?: {
    x: number;
    y: number;
  };
  liked?: boolean;
  likes?: number;
  isEvent?: boolean;
  eventData?: {
    title: string;
    venue: string;
    url: string;
    startDate: string;
    priceMin?: number;
    priceMax?: number;
    source: string;
  };
  popularity?: number; // Calculated engagement score
  distance?: number; // Distance from user in miles
}

interface UseExploreFeedOptions {
  initialFilter?: FilterType;
  initialSort?: SortType;
  pageSize?: number;
}

// Calculate engagement score for popularity sorting
const calculatePopularity = (post: ExplorePost): number => {
  const likes = post.likes || 0;
  const ageInHours = (Date.now() - new Date(post.timestamp).getTime()) / (1000 * 60 * 60);
  
  // Decay factor - newer posts get higher scores
  const decayFactor = Math.exp(-ageInHours / 24); // 24-hour half-life
  
  // Base engagement score
  const engagementScore = likes * 1; // Can add comments, shares, etc.
  
  // Event posts get a slight boost
  const eventBoost = post.isEvent ? 1.2 : 1;
  
  return engagementScore * decayFactor * eventBoost;
};

// Calculate distance between two coordinates
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Apply search filters to posts
const applySearchFilters = (posts: ExplorePost[], filters: SearchFilters): ExplorePost[] => {
  return posts.filter(post => {
    // Query filter
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      const matchesContent = post.content.toLowerCase().includes(query);
      const matchesLocation = post.location.toLowerCase().includes(query);
      const matchesUser = post.user.name.toLowerCase().includes(query);
      const matchesEventTitle = post.eventData?.title?.toLowerCase().includes(query);
      
      if (!matchesContent && !matchesLocation && !matchesUser && !matchesEventTitle) {
        return false;
      }
    }

    // Type filter
    if (filters.type !== 'all') {
      if (filters.type === 'event' && !post.isEvent) return false;
      if (filters.type === 'text' && (post.mediaUrl || post.isEvent)) return false;
      if (filters.type === 'image' && (!post.mediaUrl || post.mediaUrl.includes('mp4'))) return false;
      if (filters.type === 'video' && (!post.mediaUrl || !post.mediaUrl.includes('mp4'))) return false;
    }

    // Privacy filter
    if (filters.privacy !== 'all') {
      if (filters.privacy === 'public' && !post.isPublic) return false;
      if (filters.privacy === 'followers' && post.isPublic) return false;
    }

    // Media filter
    if (filters.hasMedia && !post.mediaUrl) return false;

    // Distance filter
    if (filters.radiusMiles && post.distance && post.distance > filters.radiusMiles) {
      return false;
    }

    // Time filter
    if (filters.timeframe !== 'all') {
      const postDate = new Date(post.timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);

      switch (filters.timeframe) {
        case '1h':
          if (diffInHours > 1) return false;
          break;
        case '24h':
          if (diffInHours > 24) return false;
          break;
        case '7d':
          if (diffInHours > 24 * 7) return false;
          break;
        case '30d':
          if (diffInHours > 24 * 30) return false;
          break;
      }
    }

    return true;
  });
};

export const useExploreFeed = (options: UseExploreFeedOptions = {}) => {
  const {
    initialFilter = 'all',
    initialSort = 'recent',
    pageSize = 20
  } = options;

  const [currentFilter, setCurrentFilter] = useState<FilterType>(initialFilter);
  const [currentSort, setCurrentSort] = useState<SortType>(initialSort);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    privacy: 'all',
    radiusMiles: 10,
    timeframe: 'all',
    hasMedia: false
  });
  const [currentPage, setCurrentPage] = useState(1);

  const { user } = useAuth();
  const { userLocation } = useUserLocation();
  const { messages, loading: messagesLoading, refreshMessages, searchMessages } = useMessages();
  const { events, isLoading: eventsLoading, refetch: refreshEvents } = useEventMessages();

  // Convert messages to explore posts format
  const convertMessageToPost = useCallback((message: any): ExplorePost => {
    const post: ExplorePost = {
      id: message.id,
      content: message.content,
      mediaUrl: message.mediaUrl,
      timestamp: message.timestamp,
      location: message.location,
      user: {
        name: message.user.name,
        avatar: message.user.avatar,
        username: message.user.username
      },
      isPublic: message.isPublic,
      position: message.position,
      liked: message.liked,
      likes: message.likes,
      isEvent: message.isEvent,
      eventData: message.eventData
    };

    // Calculate popularity score
    post.popularity = calculatePopularity(post);

    // Calculate distance if user location is available
    if (userLocation && post.position) {
      post.distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        post.position.x,
        post.position.y
      );
    }

    return post;
  }, [userLocation]);

  // Convert events to explore posts format
  const convertEventToPost = useCallback((event: any): ExplorePost => {
    const post: ExplorePost = {
      id: `event-${event.id}`,
      content: `${event.event_title}\n\n${event.content || ''}`,
      mediaUrl: event.media_url,
      timestamp: event.created_at,
      location: event.event_venue || event.location,
      user: {
        name: `${event.event_source === 'eventbrite' ? 'Eventbrite' : 'Ticketmaster'} Events`,
        avatar: event.event_source === 'eventbrite' 
          ? 'https://cdn.evbstatic.com/s3-build/fe/build/images/logos/eb-orange-wordmark-no-text.6f6804bb.svg'
          : 'https://s1.ticketm.net/dam/a/66e/b68b8edc-ff0e-43a5-8cb8-a4ad0b56c66e_RETINA_PORTRAIT_3_2.jpg'
      },
      isPublic: true,
      position: {
        x: event.lat,
        y: event.lng
      },
      liked: false,
      likes: 0,
      isEvent: true,
      eventData: {
        title: event.event_title,
        venue: event.event_venue,
        url: event.event_url,
        startDate: event.event_start_date,
        priceMin: event.event_price_min,
        priceMax: event.event_price_max,
        source: event.event_source
      }
    };

    post.popularity = calculatePopularity(post);

    if (userLocation && post.position) {
      post.distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        post.position.x,
        post.position.y
      );
    }

    return post;
  }, [userLocation]);

  // Combine and process all posts
  const allPosts = useMemo(() => {
    const messagePosts = messages.map(convertMessageToPost);
    const eventPosts = events.map(convertEventToPost);
    
    return [...messagePosts, ...eventPosts];
  }, [messages, events, convertMessageToPost, convertEventToPost]);

  // Apply filters
  const filteredPosts = useMemo(() => {
    let posts = [...allPosts];

    // Apply tab filter
    switch (currentFilter) {
      case 'public':
        posts = posts.filter(post => post.isPublic);
        break;
      case 'following':
        // TODO: Implement following logic when user relationships are available
        posts = posts.filter(post => !post.isPublic);
        break;
      case 'events':
        posts = posts.filter(post => post.isEvent);
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    // Apply search filters
    posts = applySearchFilters(posts, searchFilters);

    return posts;
  }, [allPosts, currentFilter, searchFilters]);

  // Apply sorting
  const sortedPosts = useMemo(() => {
    const posts = [...filteredPosts];

    switch (currentSort) {
      case 'popular':
        return posts.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      case 'nearby':
        if (userLocation) {
          return posts.sort((a, b) => {
            const distanceA = a.distance || Infinity;
            const distanceB = b.distance || Infinity;
            return distanceA - distanceB;
          });
        }
        // Fallback to recent if no location
        return posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      case 'recent':
      default:
        return posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  }, [filteredPosts, currentSort, userLocation]);

  // Paginated posts
  const paginatedPosts = useMemo(() => {
    return sortedPosts.slice(0, currentPage * pageSize);
  }, [sortedPosts, currentPage, pageSize]);

  // Loading states
  const isLoading = messagesLoading || eventsLoading;

  // Filter counts for tab badges
  const filterCounts = useMemo(() => {
    return {
      all: allPosts.length,
      public: allPosts.filter(post => post.isPublic).length,
      following: allPosts.filter(post => !post.isPublic).length,
      events: allPosts.filter(post => post.isEvent).length
    };
  }, [allPosts]);

  // Handlers
  const handleFilterChange = useCallback((filter: FilterType) => {
    setCurrentFilter(filter);
    setCurrentPage(1); // Reset pagination
  }, []);

  const handleSortChange = useCallback((sort: SortType) => {
    setCurrentSort(sort);
    setCurrentPage(1); // Reset pagination
  }, []);

  const handleSearchFiltersChange = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
    setCurrentPage(1); // Reset pagination
    
    // Trigger search in messages hook if there's a query
    if (filters.query.trim()) {
      searchMessages(filters.query);
    }
  }, [searchMessages]);

  const loadMore = useCallback(() => {
    const hasMore = paginatedPosts.length < sortedPosts.length;
    if (hasMore && !isLoading) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginatedPosts.length, sortedPosts.length, isLoading]);

  const refresh = useCallback(async () => {
    setCurrentPage(1);
    await Promise.all([
      refreshMessages(),
      refreshEvents()
    ]);
  }, [refreshMessages, refreshEvents]);

  const hasMore = paginatedPosts.length < sortedPosts.length;

  return {
    // Data
    posts: paginatedPosts,
    allPostsCount: sortedPosts.length,
    
    // State
    currentFilter,
    currentSort,
    searchFilters,
    isLoading,
    hasMore,
    filterCounts,
    
    // Actions
    setFilter: handleFilterChange,
    setSort: handleSortChange,
    setSearchFilters: handleSearchFiltersChange,
    loadMore,
    refresh,
    
    // Utilities
    userLocation
  };
};