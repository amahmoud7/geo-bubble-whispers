import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Square, 
  Loader2, 
  Zap, 
  Calendar, 
  MapPin,
  ExternalLink,
  Clock,
  TrendingUp,
  AlertCircle,
  Wifi,
  WifiOff,
  Settings,
  Target
} from 'lucide-react';
import { useRealTimeEvents } from '@/hooks/useRealTimeEvents';
import { toast } from '@/hooks/use-toast';

interface RealTimeEventsButtonProps {
  className?: string;
  currentCity?: string;
  detectedLocation?: { city: string; state: string };
}

const RealTimeEventsButton: React.FC<RealTimeEventsButtonProps> = ({ 
  className = '', 
  currentCity = 'Los Angeles',
  detectedLocation 
}) => {
  const {
    syncStatus,
    isLoading,
    startRealTimeSync,
    stopRealTimeSync,
    toggleRealTimeSync,
    manualSync,
    getSyncStats,
    canStart,
    canStop,
    hasError
  } = useRealTimeEvents();

  const [showStats, setShowStats] = useState(false);
  const [progress, setProgress] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('good');
  const stats = getSyncStats();

  // Simulate progress during loading
  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);
      
      return () => clearInterval(interval);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [isLoading]);

  // Mock connection quality detection (in real app, this would be based on response times)
  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.random();
      if (random > 0.8) setConnectionQuality('poor');
      else if (random > 0.3) setConnectionQuality('good');
      else setConnectionQuality('excellent');
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleToggleSync = async () => {
    try {
      const result = await toggleRealTimeSync();
      
      if (result.success) {
        toast({
          title: syncStatus.isActive ? "🔴 Real-Time Stopped" : "🟢 Real-Time Started",
          description: result.message,
          duration: 3000,
        });
      } else {
        toast({
          title: "❌ Sync Error",
          description: result.message,
          variant: "destructive",
          duration: 4000,
        });
      }
    } catch (error) {
      toast({
        title: "💥 Connection Error",
        description: "Failed to connect to Ticketmaster API",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const handleManualSync = async () => {
    try {
      const result = await manualSync();
      
      if (result.success) {
        toast({
          title: "🔄 Events Synced",
          description: `Updated ${result.eventsCount || 0} events from Ticketmaster`,
          duration: 3000,
        });
      } else {
        toast({
          title: "❌ Sync Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "💥 Sync Error",
        description: "Failed to sync events",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = () => {
    if (hasError) return 'text-red-500';
    if (syncStatus.isActive) return 'text-green-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (hasError) return 'Error';
    if (isLoading) return 'Syncing...';
    if (syncStatus.isActive) return 'Live';
    return 'Stopped';
  };

  const getConnectionIcon = () => {
    if (connectionQuality === 'excellent') return <Wifi className="w-4 h-4 text-green-500" />;
    if (connectionQuality === 'poor') return <WifiOff className="w-4 h-4 text-red-500" />;
    return <Wifi className="w-4 h-4 text-yellow-500" />;
  };

  const formatCityDisplay = (city: string, state?: string) => {
    if (state) return `${city}, ${state}`;
    return city;
  };

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* City Detection Header */}
      {detectedLocation && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-600" />
            <div className="text-sm">
              <span className="font-medium text-blue-900">
                {formatCityDisplay(detectedLocation.city, detectedLocation.state)}
              </span>
              <p className="text-blue-600 text-xs">Auto-detected location</p>
            </div>
          </div>
          {getConnectionIcon()}
        </div>
      )}

      {/* Main Control Button */}
      <div className="relative">
        <Button
          onClick={handleToggleSync}
          disabled={isLoading}
          className={`
            group relative overflow-hidden min-w-[220px] h-16 text-lg font-bold rounded-2xl 
            transition-all duration-300 shadow-lg hover:shadow-xl
            ${syncStatus.isActive 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
            }
            ${isLoading ? 'scale-95 opacity-90' : 'hover:scale-105 active:scale-95'}
            ${hasError ? 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : ''}
            touch-manipulation
          `}
          aria-label={`${syncStatus.isActive ? 'Stop' : 'Start'} real-time event sync for ${currentCity}`}
        >
          {/* Background Animation */}
          {syncStatus.isActive && !hasError && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          )}
          
          {/* Progress Bar */}
          {isLoading && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 overflow-hidden">
              <Progress value={progress} className="h-full bg-white" />
            </div>
          )}
          
          <div className="relative flex items-center space-x-3">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : syncStatus.isActive ? (
              <Square className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
            
            <div className="flex flex-col items-start">
              <span className="text-base leading-tight">
                {syncStatus.isActive ? 'Stop Live Events' : 'Start Live Events'}
              </span>
              <span className="text-xs opacity-90 leading-tight flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{currentCity}</span>
                {syncStatus.isActive && <span className="animate-pulse">• Live</span>}
              </span>
            </div>
            
            {syncStatus.isActive && !isLoading && (
              <Zap className="w-5 h-5 animate-pulse ml-2" />
            )}
          </div>
        </Button>

        {/* Enhanced Status Indicators */}
        <div className="absolute -top-2 -right-2 flex items-center space-x-2">
          {/* Connection Quality */}
          <Badge variant="secondary" className={`
            text-xs px-2 py-1 rounded-full border-2 font-medium
            ${connectionQuality === 'excellent' ? 'bg-green-100 border-green-400 text-green-700' : 
              connectionQuality === 'poor' ? 'bg-red-100 border-red-400 text-red-700' : 
              'bg-yellow-100 border-yellow-400 text-yellow-700'}
            ${syncStatus.isActive ? 'opacity-100' : 'opacity-60'}
          `}>
            {getConnectionIcon()}
          </Badge>
          
          {/* Main Status */}
          <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${
            hasError ? 'bg-red-500 animate-pulse' : 
            syncStatus.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}></div>
        </div>
      </div>

      {/* Enhanced Stats Section */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        {/* Quick Stats Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{stats.eventsCount}</span>
                <span className="text-xs text-gray-500">events</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <div className="flex flex-col">
                <span className={`font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
                <span className="text-xs text-gray-500">status</span>
              </div>
            </div>
            
            {syncStatus.isActive && (
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{formatTime(stats.runtime)}</span>
                  <span className="text-xs text-gray-500">uptime</span>
                </div>
              </div>
            )}
          </div>

          {/* Manual Sync Button */}
          <Button
            onClick={handleManualSync}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200 border-gray-300"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            <span className="ml-2 font-medium">Refresh</span>
          </Button>
        </div>
        
        {/* Performance Metrics */}
        {syncStatus.isActive && (
          <div className="flex items-center space-x-4 pt-2 border-t border-gray-200">
            <Badge variant="secondary" className={`
              text-xs font-medium
              ${connectionQuality === 'excellent' ? 'bg-green-100 text-green-800' : 
                connectionQuality === 'poor' ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'}
            `}>
              {connectionQuality.toUpperCase()} CONNECTION
            </Badge>
            <span className="text-xs text-gray-500">
              {stats.successRate}% success rate
            </span>
          </div>
        )}
      </div>

      {/* Enhanced Error Display */}
      {hasError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-sm font-semibold text-red-800">Connection Error</p>
                <p className="text-xs text-red-600 leading-relaxed">{syncStatus.error}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => window.location.reload()}
                  variant="ghost"
                  size="sm"
                  className="text-red-700 hover:text-red-800 hover:bg-red-100 rounded-lg h-8 px-3"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Retry
                </Button>
                <span className="text-xs text-red-500">Auto-retry in 30s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Sync Time */}
      {stats.lastSync && !syncStatus.isActive && (
        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 flex items-center justify-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>
              Last sync: {stats.lastSync.toLocaleString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </p>
        </div>
      )}

      {/* Advanced Stats Toggle */}
      {(stats.totalSyncs > 0 || syncStatus.isActive) && (
        <div className="space-y-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full p-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>{showStats ? 'Hide' : 'Show'} Advanced Metrics</span>
          </button>
          
          {showStats && (
            <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3 animate-in slide-in-from-top-2 duration-300">
              <h4 className="font-semibold text-sm text-gray-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Performance Metrics</span>
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Total Syncs</span>
                  <p className="font-semibold text-gray-900">{stats.totalSyncs}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Success Rate</span>
                  <p className="font-semibold text-green-600">{stats.successRate}%</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Events Found</span>
                  <p className="font-semibold text-amber-600">{stats.eventsCount}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Runtime</span>
                  <p className="font-semibold text-blue-600">{formatTime(stats.runtime)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealTimeEventsButton;