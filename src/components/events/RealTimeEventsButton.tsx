import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  AlertCircle
} from 'lucide-react';
import { useRealTimeEvents } from '@/hooks/useRealTimeEvents';
import { toast } from '@/hooks/use-toast';

interface RealTimeEventsButtonProps {
  className?: string;
}

const RealTimeEventsButton: React.FC<RealTimeEventsButtonProps> = ({ className = '' }) => {
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
  const stats = getSyncStats();

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

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      {/* Main Control Button */}
      <div className="relative">
        <Button
          onClick={handleToggleSync}
          disabled={isLoading}
          className={`
            relative overflow-hidden min-w-[200px] h-14 text-lg font-bold rounded-2xl transition-all duration-300
            ${syncStatus.isActive 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg' 
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg'
            }
            ${isLoading ? 'scale-95 opacity-90' : 'hover:scale-105 active:scale-95'}
            ${hasError ? 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : ''}
          `}
        >
          {/* Background Animation */}
          {syncStatus.isActive && !hasError && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
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
                {syncStatus.isActive ? 'Stop Real-Time' : 'Start Real-Time'}
              </span>
              <span className="text-xs opacity-90 leading-tight">
                Ticketmaster Events
              </span>
            </div>
            
            {syncStatus.isActive && (
              <Zap className="w-5 h-5 animate-pulse ml-2" />
            )}
          </div>
        </Button>

        {/* Status Indicator */}
        <div className="absolute -top-2 -right-2 flex items-center space-x-1">
          <div className={`w-3 h-3 rounded-full ${
            hasError ? 'bg-red-500' : 
            syncStatus.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}></div>
        </div>
      </div>

      {/* Stats and Manual Sync */}
      <div className="flex items-center justify-between">
        {/* Quick Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{stats.eventsCount} events</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span className={getStatusColor()}>
              {getStatusText()}
            </span>
          </div>
          
          {syncStatus.isActive && (
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>{formatTime(stats.runtime)}</span>
            </div>
          )}
        </div>

        {/* Manual Sync Button */}
        <Button
          onClick={handleManualSync}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="rounded-lg hover:bg-gray-50 transition-all duration-200"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          <span className="ml-2">Sync Now</span>
        </Button>
      </div>

      {/* Error Display */}
      {hasError && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Sync Error</p>
            <p className="text-xs text-red-600">{syncStatus.error}</p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            variant="ghost"
            size="sm"
            className="text-red-700 hover:text-red-800 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Last Sync Time */}
      {stats.lastSync && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Last sync: {stats.lastSync.toLocaleString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
      )}

      {/* Advanced Stats Toggle */}
      {(stats.totalSyncs > 0 || syncStatus.isActive) && (
        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showStats ? 'Hide' : 'Show'} Advanced Stats
          </button>
          
          {showStats && (
            <div className="mt-2 space-y-2 text-xs text-gray-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Total Syncs:</span> {stats.totalSyncs}
                </div>
                <div>
                  <span className="font-medium">Success Rate:</span> {stats.successRate}%
                </div>
                <div>
                  <span className="font-medium">Events Found:</span> {stats.eventsCount}
                </div>
                <div>
                  <span className="font-medium">Runtime:</span> {formatTime(stats.runtime)}
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