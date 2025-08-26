import React, { useMemo, useState, useCallback } from 'react';
import { OverlayView } from '@react-google-maps/api';
import EventMarkerIcon from './EventMarkerIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, MapPin, Clock, Zap, Plus } from 'lucide-react';

interface EventMessage {
  id: string;
  event_title: string;
  event_venue?: string;
  event_start_date: string;
  event_source: string;
  lat?: number;
  lng?: number;
  event_price_min?: number;
  event_price_max?: number;
}

interface EventCluster {
  id: string;
  lat: number;
  lng: number;
  events: EventMessage[];
  center: { lat: number; lng: number };
}

interface EventClusterManagerProps {
  events: EventMessage[];
  onEventClick: (event: EventMessage) => void;
  zoom: number;
  bounds?: google.maps.LatLngBounds;
  maxClusterRadius?: number;
  minClusterSize?: number;
}

const EventClusterManager: React.FC<EventClusterManagerProps> = ({
  events,
  onEventClick,
  zoom,
  bounds,
  maxClusterRadius = 50,
  minClusterSize = 2
}) => {
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);

  // Calculate appropriate cluster radius based on zoom level
  const getClusterRadius = useCallback((zoomLevel: number) => {
    // More aggressive clustering at lower zoom levels
    if (zoomLevel < 12) return maxClusterRadius * 2;
    if (zoomLevel < 14) return maxClusterRadius * 1.5;
    if (zoomLevel < 16) return maxClusterRadius;
    return maxClusterRadius * 0.5; // Less clustering at high zoom
  }, [maxClusterRadius]);

  // Cluster events based on proximity
  const clusteredEvents = useMemo(() => {
    if (!events || events.length === 0) return { clusters: [], singleEvents: [] };

    const validEvents = events.filter(event => event.lat && event.lng);
    const clusterRadius = getClusterRadius(zoom);
    const clusters: EventCluster[] = [];
    const processedEventIds = new Set<string>();
    const singleEvents: EventMessage[] = [];

    validEvents.forEach((event, index) => {
      if (processedEventIds.has(event.id)) return;

      const nearbyEvents = [event];
      processedEventIds.add(event.id);

      // Find nearby events
      for (let i = index + 1; i < validEvents.length; i++) {
        const otherEvent = validEvents[i];
        if (processedEventIds.has(otherEvent.id)) continue;

        // Calculate distance in pixels (approximate)
        const distance = Math.sqrt(
          Math.pow((event.lat! - otherEvent.lat!) * 111000, 2) +
          Math.pow((event.lng! - otherEvent.lng!) * 111000 * Math.cos(event.lat! * Math.PI / 180), 2)
        );

        // Convert to screen pixels (rough approximation)
        const screenDistance = distance / (156543.03392 * Math.cos(event.lat! * Math.PI / 180) / Math.pow(2, zoom));

        if (screenDistance < clusterRadius) {
          nearbyEvents.push(otherEvent);
          processedEventIds.add(otherEvent.id);
        }
      }

      if (nearbyEvents.length >= minClusterSize) {
        // Create cluster
        const centerLat = nearbyEvents.reduce((sum, e) => sum + e.lat!, 0) / nearbyEvents.length;
        const centerLng = nearbyEvents.reduce((sum, e) => sum + e.lng!, 0) / nearbyEvents.length;

        clusters.push({
          id: `cluster-${index}`,
          lat: centerLat,
          lng: centerLng,
          events: nearbyEvents,
          center: { lat: centerLat, lng: centerLng }
        });
      } else {
        // Single event
        singleEvents.push(...nearbyEvents);
      }
    });

    return { clusters, singleEvents };
  }, [events, zoom, getClusterRadius, minClusterSize]);

  const getClusterIcon = (cluster: EventCluster) => {
    const eventCount = cluster.events.length;
    const hasStartingSoon = cluster.events.some(event => {
      const eventDate = new Date(event.event_start_date);
      return eventDate.getTime() - Date.now() < 2 * 60 * 60 * 1000;
    });

    const getClusterSize = () => {
      if (eventCount > 20) return 'w-16 h-16 text-lg';
      if (eventCount > 10) return 'w-14 h-14 text-base';
      if (eventCount > 5) return 'w-12 h-12 text-sm';
      return 'w-10 h-10 text-xs';
    };

    const getClusterColor = () => {
      if (hasStartingSoon) return 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse';
      if (eventCount > 10) return 'bg-gradient-to-br from-purple-500 to-purple-600';
      if (eventCount > 5) return 'bg-gradient-to-br from-blue-500 to-blue-600';
      return 'bg-gradient-to-br from-amber-500 to-orange-600';
    };

    return (
      <div className="relative">
        {/* Outer glow */}
        <div className={`absolute inset-0 rounded-full blur-sm ${getClusterColor()} opacity-40 scale-110`} />
        
        {/* Main cluster circle */}
        <div 
          className={`
            ${getClusterSize()} ${getClusterColor()}
            rounded-full border-3 border-white shadow-xl
            flex items-center justify-center text-white font-bold
            cursor-pointer hover:scale-110 transition-all duration-200
            ${hasStartingSoon ? 'animate-bounce' : ''}
          `}
        >
          {eventCount}
        </div>

        {/* Starting soon indicator */}
        {hasStartingSoon && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white">
              <Zap className="w-2 h-2 text-white ml-0.5" />
            </div>
          </>
        )}
      </div>
    );
  };

  const ClusterPopover: React.FC<{ cluster: EventCluster }> = ({ cluster }) => {
    const sortedEvents = cluster.events
      .sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime())
      .slice(0, 8); // Show max 8 events in preview

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div
            style={{
              position: 'absolute',
              transform: 'translate(-50%, -100%)',
              zIndex: 50,
            }}
          >
            {getClusterIcon(cluster)}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 bg-white rounded-2xl shadow-xl border-0" side="top">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {cluster.events.length} Events in This Area
              </h3>
              <Badge variant="secondary" className="text-xs">
                {cluster.events.filter(e => {
                  const eventDate = new Date(e.event_start_date);
                  return eventDate.getTime() > Date.now();
                }).length} upcoming
              </Badge>
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {sortedEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
                onClick={() => {
                  onEventClick(event);
                  setExpandedClusterId(null);
                }}
              >
                <h4 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                  {event.event_title}
                </h4>
                <div className="flex items-center space-x-3 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{event.event_venue}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(event.event_start_date).toLocaleDateString()}</span>
                  </div>
                </div>
                {event.event_price_min && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    From ${event.event_price_min}
                  </p>
                )}
              </div>
            ))}
            
            {cluster.events.length > 8 && (
              <div className="p-3 text-center border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  View {cluster.events.length - 8} more events
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const getCategoryFromTitle = (title: string): string => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('concert') || lowerTitle.includes('music')) return 'music';
    if (lowerTitle.includes('sport') || lowerTitle.includes('game')) return 'sports';
    if (lowerTitle.includes('theater') || lowerTitle.includes('play')) return 'theater';
    if (lowerTitle.includes('art') || lowerTitle.includes('gallery')) return 'arts';
    if (lowerTitle.includes('family') || lowerTitle.includes('kids')) return 'family';
    if (lowerTitle.includes('gaming') || lowerTitle.includes('esports')) return 'gaming';
    return 'general';
  };

  const getPriceRange = (min?: number, max?: number): 'low' | 'medium' | 'high' => {
    if (!min) return 'medium';
    if (min < 50) return 'low';
    if (min > 150) return 'high';
    return 'medium';
  };

  return (
    <>
      {/* Render clusters */}
      {clusteredEvents.clusters.map((cluster) => (
        <OverlayView
          key={cluster.id}
          position={cluster.center}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <ClusterPopover cluster={cluster} />
        </OverlayView>
      ))}

      {/* Render single events */}
      {clusteredEvents.singleEvents.map((event) => {
        if (!event.lat || !event.lng) return null;

        const isStartingSoon = new Date(event.event_start_date).getTime() - Date.now() < 2 * 60 * 60 * 1000;
        const category = getCategoryFromTitle(event.event_title);
        const priceRange = getPriceRange(event.event_price_min, event.event_price_max);

        return (
          <OverlayView
            key={event.id}
            position={{ lat: event.lat, lng: event.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              style={{
                position: 'absolute',
                transform: 'translate(-50%, -100%)',
                zIndex: 40,
              }}
            >
              <EventMarkerIcon
                isStartingSoon={isStartingSoon}
                eventCategory={category}
                eventSource={event.event_source}
                priceRange={priceRange}
                onClick={() => onEventClick(event)}
              />
            </div>
          </OverlayView>
        );
      })}
    </>
  );
};

export default EventClusterManager;