import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Skeleton for event markers on map
export const EventMarkerSkeleton: React.FC = () => (
  <div className="relative">
    {/* Outer glow skeleton */}
    <Skeleton className="absolute inset-0 rounded-full w-10 h-10 -top-2 -left-2 opacity-50" />
    
    {/* Main marker skeleton */}
    <Skeleton className="w-8 h-8 rounded-full" />
    
    {/* Tail skeleton */}
    <div className="absolute left-1/2 transform -translate-x-1/2 top-6">
      <Skeleton className="w-2 h-2 rounded-sm" />
    </div>
  </div>
);

// Skeleton for event detail modal
export const EventDetailSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Hero image skeleton */}
    <Skeleton className="w-full h-80 lg:h-96 rounded-t-3xl" />
    
    <div className="px-6 space-y-6">
      {/* Title and badges */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
      </div>

      {/* Event details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 rounded-2xl border border-gray-200 space-y-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex space-x-3">
        <Skeleton className="h-14 flex-1 rounded-2xl" />
        <Skeleton className="h-14 w-14 rounded-2xl" />
      </div>
    </div>
  </div>
);

// Skeleton for event list items
export const EventListItemSkeleton: React.FC = () => (
  <Card className="overflow-hidden">
    <div className="flex">
      {/* Event image skeleton */}
      <Skeleton className="w-24 h-24 lg:w-32 lg:h-32 flex-shrink-0" />
      
      <CardContent className="flex-1 p-4">
        <div className="space-y-3">
          {/* Title and source badge */}
          <div className="flex items-start justify-between">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>

          {/* Venue and date */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      </CardContent>
    </div>
  </Card>
);

// Skeleton for event grid items
export const EventGridItemSkeleton: React.FC = () => (
  <Card className="overflow-hidden">
    {/* Event image skeleton */}
    <Skeleton className="w-full h-48" />
    
    <CardContent className="p-4">
      <div className="space-y-3">
        {/* Badges */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>

        {/* Venue and date */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Price and action */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Skeleton for event stats/metrics
export const EventStatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="text-center p-4 rounded-xl border border-gray-200">
        <Skeleton className="w-8 h-8 mx-auto mb-3 rounded-full" />
        <Skeleton className="h-6 w-12 mx-auto mb-2" />
        <Skeleton className="h-4 w-16 mx-auto" />
      </div>
    ))}
  </div>
);

// Skeleton for real-time events button
export const RealTimeButtonSkeleton: React.FC = () => (
  <div className="space-y-4">
    {/* City detection header skeleton */}
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="flex items-center space-x-2">
        <Skeleton className="w-4 h-4" />
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="w-4 h-4" />
    </div>

    {/* Main button skeleton */}
    <Skeleton className="min-w-[220px] h-16 rounded-2xl" />

    {/* Stats section skeleton */}
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="w-4 h-4" />
              <div>
                <Skeleton className="h-4 w-8 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  </div>
);

// Skeleton for event cluster popover
export const EventClusterSkeleton: React.FC = () => (
  <div className="w-80 p-0 bg-white rounded-2xl">
    {/* Header */}
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
    
    {/* Event list */}
    <div className="max-h-64">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-3 border-b border-gray-50 last:border-b-0">
          <Skeleton className="h-4 w-full mb-2" />
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Skeleton className="w-3 h-3" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex items-center space-x-1">
              <Skeleton className="w-3 h-3" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-3 w-16 mt-1" />
        </div>
      ))}
    </div>
  </div>
);

// Skeleton for events manager component
export const EventsManagerSkeleton: React.FC = () => (
  <Card className="w-full max-w-2xl mx-auto">
    <CardHeader>
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="h-4 w-full" />
    </CardHeader>
    
    <CardContent className="space-y-4">
      {/* Button row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
      </div>

      {/* Results section */}
      <div className="p-4 bg-muted rounded-lg">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-6 w-20 mb-1" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div>
            <Skeleton className="h-6 w-24 mb-1" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
        <Skeleton className="h-4 w-full mt-2" />
      </div>

      {/* Info section */}
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-2">
            <Skeleton className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Pulsing map overlay skeleton for loading events
export const MapEventLoadingSkeleton: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none">
    {/* Floating skeleton markers at various positions */}
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="absolute"
        style={{
          top: `${Math.random() * 80 + 10}%`,
          left: `${Math.random() * 80 + 10}%`,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <div className="animate-pulse">
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
      </div>
    ))}
    
    {/* Loading overlay */}
    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading events...</p>
        <p className="text-sm text-gray-500 mt-1">Finding events in your area</p>
      </div>
    </div>
  </div>
);

export default {
  EventMarkerSkeleton,
  EventDetailSkeleton,
  EventListItemSkeleton,
  EventGridItemSkeleton,
  EventStatsSkeleton,
  RealTimeButtonSkeleton,
  EventClusterSkeleton,
  EventsManagerSkeleton,
  MapEventLoadingSkeleton
};