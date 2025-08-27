import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import FilterTabs, { type FilterType } from '@/components/explore/FilterTabs';
import SortOptions, { type SortType } from '@/components/explore/SortOptions';
import SearchWithFilters, { type SearchFilters } from '@/components/explore/SearchWithFilters';
import InfiniteScrollFeed from '@/components/explore/InfiniteScrollFeed';
import PostSkeletonLoader from '@/components/explore/PostSkeletonLoader';
import { useExploreFeed } from '@/hooks/useExploreFeed';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Sparkles } from 'lucide-react';

const Explore = () => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    posts,
    allPostsCount,
    currentFilter,
    currentSort,
    searchFilters,
    isLoading,
    hasMore,
    filterCounts,
    setFilter,
    setSort,
    setSearchFilters,
    loadMore,
    refresh,
    userLocation
  } = useExploreFeed({
    initialFilter: 'all',
    initialSort: 'recent',
    pageSize: 20
  });

  // Handle post interactions
  const handlePostClick = useCallback((postId: string) => {
    // Navigate to message detail or open modal
    console.log('Post clicked:', postId);
    // You can implement navigation to post detail here
    // navigate(`/post/${postId}`);
  }, []);

  const handleLike = useCallback((postId: string) => {
    console.log('Like post:', postId);
    // Implement like functionality
    toast({
      title: "Liked!",
      description: "Post has been liked.",
      duration: 1000
    });
  }, []);

  const handleComment = useCallback((postId: string) => {
    console.log('Comment on post:', postId);
    // Navigate to comment view or open modal
    handlePostClick(postId);
  }, [handlePostClick]);

  const handleShare = useCallback((postId: string) => {
    console.log('Share post:', postId);
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: 'Geo Bubble Whispers',
        text: 'Check out this post on Geo Bubble Whispers!',
        url: `${window.location.origin}/post/${postId}`
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
      toast({
        title: "Link copied!",
        description: "Post link has been copied to clipboard.",
        duration: 2000
      });
    }
  }, []);

  const handleBookmark = useCallback((postId: string) => {
    console.log('Bookmark post:', postId);
    // Implement bookmark functionality
    toast({
      title: "Bookmarked!",
      description: "Post has been saved to your bookmarks.",
      duration: 1000
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      toast({
        title: "Refreshed!",
        description: "Feed has been updated with latest posts.",
        duration: 1000
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh feed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  const handleFilterChange = useCallback((filter: FilterType) => {
    setFilter(filter);
    // Analytics or logging can be added here
    console.log('Filter changed to:', filter);
  }, [setFilter]);

  const handleSortChange = useCallback((sort: SortType) => {
    setSort(sort);
    console.log('Sort changed to:', sort);
  }, [setSort]);

  const handleSearchFiltersChange = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
    console.log('Search filters changed:', filters);
  }, [setSearchFilters]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-40">
        <div className="px-4 py-3">
          {/* Title and actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">Explore</h1>
              <Sparkles className="h-5 w-5 text-lo-teal" />
            </div>
            
            {/* Manual refresh button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-lo-teal hover:text-lo-teal hover:bg-lo-light-teal"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {/* Search with advanced filters */}
          <SearchWithFilters
            onSearch={handleSearchFiltersChange}
            initialFilters={searchFilters}
            placeholder="Search posts, events, places..."
            isLoading={isLoading}
          />

          {/* Sort options */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {allPostsCount > 0 ? (
                  <>Showing {posts.length} of {allPostsCount} posts</>
                ) : (
                  'No posts found'
                )}
              </span>
              {!userLocation && currentSort === 'nearby' && (
                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                  Location needed
                </span>
              )}
            </div>
            
            <SortOptions
              activeSort={currentSort}
              onSortChange={handleSortChange}
            />
          </div>
        </div>
        
        {/* Filter tabs */}
        <FilterTabs
          activeFilter={currentFilter}
          onFilterChange={handleFilterChange}
          counts={filterCounts}
        />
      </div>

      {/* Feed content */}
      <div className="pb-20">
        {/* Initial loading state */}
        {isLoading && posts.length === 0 ? (
          <div className="pt-4">
            <PostSkeletonLoader count={5} />
          </div>
        ) : (
          <InfiniteScrollFeed
            posts={posts}
            loading={isLoading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onRefresh={handleRefresh}
            onPostClick={handlePostClick}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onBookmark={handleBookmark}
            isRefreshing={isRefreshing}
            userLocation={userLocation}
          />
        )}

        {/* Trending topics suggestion when no search results */}
        {!isLoading && posts.length === 0 && searchFilters.query && (
          <div className="px-4 py-8 text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchFilters({ 
                ...searchFilters, 
                query: '', 
                type: 'all', 
                privacy: 'all',
                timeframe: 'all',
                hasMedia: false
              })}
              className="border-lo-teal text-lo-teal hover:bg-lo-light-teal"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Explore;