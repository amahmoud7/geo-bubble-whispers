import React, { useState, useEffect } from 'react';
import { TrendingUp, MapPin, Users, Clock, Navigation, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { pushNotificationService } from '@/services/pushNotifications';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TrendingLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  messageCount: number;
  uniqueUsers: number;
  lastActivity: string;
  trend: 'rising' | 'stable' | 'falling';
  heatLevel: number; // 1-5
}

interface TrendingLocationsProps {
  onLocationSelect?: (location: TrendingLocation) => void;
  className?: string;
  userLocation?: { lat: number; lng: number } | null;
}

const TrendingLocations: React.FC<TrendingLocationsProps> = ({
  onLocationSelect,
  className,
  userLocation
}) => {
  const [trendingLocations, setTrendingLocations] = useState<TrendingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d'>('24h');
  const [expandedView, setExpandedView] = useState(false);

  useEffect(() => {
    fetchTrendingLocations();
    const interval = setInterval(fetchTrendingLocations, 60000); // Update every minute
    subscribeToMessageUpdates();
    
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const fetchTrendingLocations = async () => {
    setLoading(true);
    
    // Calculate time range
    const now = new Date();
    let startTime = new Date();
    switch (selectedTimeframe) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    try {
      // Fetch messages grouped by location
      const { data: messages, error } = await supabase
        .from('messages')
        .select('lat, lng, location, user_id, created_at')
        .gte('created_at', startTime.toISOString())
        .eq('is_public', true);

      if (error) throw error;

      // Process messages to find trending locations
      const locationMap = new Map<string, {
        messages: any[];
        users: Set<string>;
        lastActivity: Date;
      }>();

      messages?.forEach(msg => {
        const key = `${msg.lat.toFixed(4)},${msg.lng.toFixed(4)}`;
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            messages: [],
            users: new Set(),
            lastActivity: new Date(msg.created_at)
          });
        }
        
        const location = locationMap.get(key)!;
        location.messages.push(msg);
        location.users.add(msg.user_id);
        
        const msgDate = new Date(msg.created_at);
        if (msgDate > location.lastActivity) {
          location.lastActivity = msgDate;
        }
      });

      // Convert to trending locations array
      const locations: TrendingLocation[] = [];
      locationMap.forEach((data, key) => {
        const [lat, lng] = key.split(',').map(Number);
        const messageCount = data.messages.length;
        
        // Calculate heat level (1-5)
        let heatLevel = 1;
        if (messageCount >= 50) heatLevel = 5;
        else if (messageCount >= 30) heatLevel = 4;
        else if (messageCount >= 15) heatLevel = 3;
        else if (messageCount >= 5) heatLevel = 2;

        // Determine trend (simplified - in production, compare with previous period)
        let trend: 'rising' | 'stable' | 'falling' = 'stable';
        const recentMessages = data.messages.filter(m => {
          const msgTime = new Date(m.created_at).getTime();
          const halfPeriod = (now.getTime() - startTime.getTime()) / 2;
          return msgTime > now.getTime() - halfPeriod;
        });
        
        if (recentMessages.length > messageCount * 0.6) trend = 'rising';
        else if (recentMessages.length < messageCount * 0.3) trend = 'falling';

        locations.push({
          id: key,
          name: data.messages[0]?.location || `Location ${locations.length + 1}`,
          lat,
          lng,
          messageCount,
          uniqueUsers: data.users.size,
          lastActivity: data.lastActivity.toISOString(),
          trend,
          heatLevel
        });
      });

      // Sort by message count and take top 10
      const trending = locations
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 10);

      setTrendingLocations(trending);

      // Send notifications for new trending locations
      if (userLocation && trending.length > 0) {
        const topLocation = trending[0];
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          topLocation.lat,
          topLocation.lng
        );
        
        if (distance < 5000 && topLocation.messageCount > 20) {
          pushNotificationService.sendTrendingNotification({
            name: topLocation.name,
            messageCount: topLocation.messageCount
          });
        }
      }
    } catch (error) {
      console.error('Error fetching trending locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessageUpdates = () => {
    const channel = supabase
      .channel('trending-locations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchTrendingLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const formatDistance = (location: TrendingLocation): string => {
    if (!userLocation) return '';
    
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      location.lat,
      location.lng
    );
    
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const getHeatIcon = (level: number) => {
    const icons = Array(level).fill(0);
    return icons.map((_, i) => (
      <Flame key={i} className="w-3 h-3 text-orange-500" />
    ));
  };

  const getTrendIcon = (trend: 'rising' | 'stable' | 'falling') => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <div className="w-4 h-4 bg-yellow-500 rounded-full" />;
    }
  };

  return (
    <div className={cn('glass-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Trending Locations</h3>
        </div>
        
        {/* Timeframe selector */}
        <div className="flex gap-1">
          {(['1h', '24h', '7d'] as const).map(time => (
            <button
              key={time}
              onClick={() => setSelectedTimeframe(time)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs transition-all',
                selectedTimeframe === time
                  ? 'glass-heavy text-white'
                  : 'glass text-white/60 hover:text-white'
              )}
            >
              {time === '1h' ? 'Hour' : time === '24h' ? 'Day' : 'Week'}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="liquid-loader" />
        </div>
      )}

      {/* Trending locations list */}
      {!loading && (
        <div className={cn(
          'space-y-2 transition-all',
          expandedView ? 'max-h-[600px]' : 'max-h-[300px]',
          'overflow-y-auto scrollbar-thin scrollbar-thumb-white/20'
        )}>
          {trendingLocations.map((location, index) => (
            <button
              key={location.id}
              onClick={() => onLocationSelect?.(location)}
              className="w-full glass p-3 rounded-xl hover:bg-white/10 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                    <span className="text-sm font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                  
                  {/* Location info */}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-white/70" />
                      <span className="font-medium text-white">
                        {location.name}
                      </span>
                      {getTrendIcon(location.trend)}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-white/60">
                        {location.messageCount} Los
                      </span>
                      <span className="text-xs text-white/60">
                        {location.uniqueUsers} people
                      </span>
                      {userLocation && (
                        <span className="text-xs text-white/60">
                          {formatDistance(location)} away
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Heat level */}
                <div className="flex items-center gap-1">
                  {getHeatIcon(location.heatLevel)}
                </div>
              </div>
              
              {/* Hover action */}
              <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="flex items-center gap-1 text-xs text-blue-400">
                  <Navigation className="w-3 h-3" />
                  View on map
                </span>
              </div>
            </button>
          ))}
          
          {trendingLocations.length === 0 && (
            <div className="text-center py-8 text-white/60">
              No trending locations in the selected timeframe
            </div>
          )}
        </div>
      )}

      {/* Expand/Collapse button */}
      {trendingLocations.length > 3 && (
        <Button
          onClick={() => setExpandedView(!expandedView)}
          variant="ghost"
          className="w-full mt-3 text-white/60 hover:text-white"
        >
          {expandedView ? 'Show less' : `Show all ${trendingLocations.length} locations`}
        </Button>
      )}
    </div>
  );
};

export default TrendingLocations;