import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PostSkeletonLoaderProps {
  count?: number;
  showMedia?: boolean;
  className?: string;
}

const PostSkeleton: React.FC<{ showMedia?: boolean }> = ({ showMedia = Math.random() > 0.5 }) => {
  const hasLongContent = Math.random() > 0.7;
  const hasEventBadge = Math.random() > 0.8;

  return (
    <Card className="border-0 border-b border-gray-100 rounded-none">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            {/* User info */}
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
            
            {/* Location and badges */}
            <div className="flex items-center gap-2">
              {hasEventBadge && <Skeleton className="h-5 w-12 rounded-full" />}
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4 rounded ml-auto" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          {hasLongContent && (
            <>
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
            </>
          )}
        </div>

        {/* Event details skeleton */}
        {hasEventBadge && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-4 w-40 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        )}

        {/* Media */}
        {showMedia && (
          <div className="mt-3">
            <Skeleton className="aspect-video w-full rounded-xl" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-2">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-6" />
            </div>
            <div className="flex items-center space-x-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex items-center space-x-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
};

const PostSkeletonLoader: React.FC<PostSkeletonLoaderProps> = ({ 
  count = 3, 
  showMedia = true,
  className = '' 
}) => {
  return (
    <div className={`space-y-0 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <PostSkeleton 
          key={`skeleton-${index}`} 
          showMedia={showMedia && Math.random() > 0.4} 
        />
      ))}
    </div>
  );
};

export default PostSkeletonLoader;

// Alternative compact skeleton for grid views
export const CompactPostSkeleton: React.FC = () => (
  <Card className="p-4">
    <div className="flex items-start space-x-3 mb-3">
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-3 w-20 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <div className="space-y-2 mb-3">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
    <Skeleton className="aspect-video w-full rounded-lg" />
    <div className="flex items-center justify-between mt-3">
      <div className="flex space-x-4">
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-3" />
      </div>
      <Skeleton className="h-3 w-3" />
    </div>
  </Card>
);

// Loading placeholder for search results
export const SearchResultsSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center space-x-2 mb-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-32" />
    </div>
    <PostSkeletonLoader count={5} showMedia={false} />
  </div>
);