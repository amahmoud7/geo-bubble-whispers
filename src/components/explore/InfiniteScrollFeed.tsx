import React, { useCallback, useEffect, useRef, useState } from 'react';
import PostCard from './PostCard';
import PostSkeletonLoader from './PostSkeletonLoader';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface Post {
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
}

interface InfiniteScrollFeedProps {
  posts: Post[];
  loading: boolean;
  hasMore: boolean;
  error?: string | null;
  onLoadMore: () => void;
  onRefresh?: () => void;
  onPostClick?: (postId: string) => void;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  isRefreshing?: boolean;
  className?: string;
  userLocation?: {
    lat: number;
    lng: number;
  };
}

// Custom hook for intersection observer
const useIntersectionObserver = (
  callback: () => void,
  options = { threshold: 0.1, rootMargin: '100px' }
) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, options]);

  return targetRef;
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

// Format distance for display
const formatDistance = (distance: number): string => {
  if (distance < 0.1) return 'Very close';
  if (distance < 1) return `${Math.round(distance * 10) / 10} mi`;
  if (distance < 10) return `${Math.round(distance)} mi`;
  return `${Math.round(distance)} miles`;
};

const InfiniteScrollFeed: React.FC<InfiniteScrollFeedProps> = ({
  posts,
  loading,
  hasMore,
  error,
  onLoadMore,
  onRefresh,
  onPostClick,
  onLike,
  onComment,
  onShare,
  onBookmark,
  isRefreshing = false,
  className = '',
  userLocation
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const loadMoreRef = useIntersectionObserver(
    useCallback(() => {
      if (hasMore && !loading && isOnline) {
        onLoadMore();
      }
    }, [hasMore, loading, onLoadMore, isOnline])
  );

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Pull to refresh functionality
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY > 0) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      setPullDistance(Math.min(diff, 100));
      setIsPulling(diff > 50);
    }
  };

  const handleTouchEnd = () => {
    if (isPulling && onRefresh) {
      onRefresh();
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  // Get distance for each post
  const getPostDistance = (post: Post): string | undefined => {
    if (!userLocation || !post.position) return undefined;
    
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      post.position.x,
      post.position.y
    );
    
    return formatDistance(distance);
  };

  if (error && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <WifiOff className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-500 text-center mb-4 max-w-md">
          {error || 'Unable to load posts. Please check your connection and try again.'}
        </p>
        {onRefresh && (
          <Button onClick={onRefresh} className="bg-lo-teal hover:bg-lo-teal/90">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-lo-light-teal z-10 transition-all duration-200"
          style={{ height: `${Math.min(pullDistance, 60)}px` }}
        >
          <div className="flex items-center space-x-2">
            <RefreshCw 
              className={`h-4 w-4 text-lo-teal transition-transform duration-200 ${
                isPulling ? 'animate-spin' : ''
              }`}
              style={{ 
                transform: `rotate(${Math.min(pullDistance * 3.6, 180)}deg)` 
              }}
            />
            <span className="text-lo-teal text-sm font-medium">
              {isPulling ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Loading state for refreshing */}
      {isRefreshing && (
        <div className="bg-lo-light-teal border-b border-lo-teal/20 py-2 px-4">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 text-lo-teal animate-spin" />
            <span className="text-lo-teal text-sm font-medium">Refreshing...</span>
          </div>
        </div>
      )}

      {/* Posts feed */}
      <div className="divide-y divide-gray-100">
        {posts.map((post, index) => (
          <PostCard
            key={`${post.id}-${index}`}
            post={post}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            onBookmark={onBookmark}
            onClick={onPostClick}
            showDistance={!!userLocation}
            distance={getPostDistance(post)}
          />
        ))}
      </div>

      {/* Loading more indicator */}
      {loading && hasMore && (
        <div className="py-8">
          <PostSkeletonLoader count={3} />
        </div>
      )}

      {/* Load more trigger */}
      {hasMore && !loading && (
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
          {!isOnline && (
            <div className="flex items-center space-x-2 text-gray-500">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">Offline</span>
            </div>
          )}
        </div>
      )}

      {/* End of feed */}
      {!hasMore && posts.length > 0 && (
        <div className="py-8 text-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="h-1 w-12 bg-gray-200 rounded-full"></div>
            <p className="text-gray-500 text-sm">You've seen all posts</p>
            {onRefresh && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onRefresh}
                className="text-lo-teal hover:text-lo-teal hover:bg-lo-light-teal"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh for new posts
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-6xl mb-4">📱</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No posts yet
          </h3>
          <p className="text-gray-500 text-center mb-4 max-w-md">
            Be the first to share something in your area, or try adjusting your filters.
          </p>
          {onRefresh && (
            <Button 
              onClick={onRefresh} 
              className="bg-lo-teal hover:bg-lo-teal/90"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      )}

      {/* Network status indicator */}
      {!isOnline && (
        <div className="fixed bottom-20 left-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <WifiOff className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">You're offline. Content may be outdated.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfiniteScrollFeed;