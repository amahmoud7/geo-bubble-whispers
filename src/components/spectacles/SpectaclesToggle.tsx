import React, { useState, useEffect } from 'react';
import { Glasses, Loader2, Wifi, WifiOff, Zap } from 'lucide-react';
import { useSpectacles } from '@/contexts/SpectaclesContext';
import { toast } from '@/hooks/use-toast';

interface SpectaclesToggleProps {
  className?: string;
  onARModeChange?: (active: boolean) => void;
}

/**
 * SpectaclesToggle Component
 *
 * One-tap connection toggle for Snap Spectacles AR integration
 * Features:
 * - Auto-discovery and connection
 * - Glass morphism UI matching EventsToggle style
 * - Visual feedback for connection states
 * - AR mode activation
 */
const SpectaclesToggle: React.FC<SpectaclesToggleProps> = ({
  className = '',
  onARModeChange,
}) => {
  const {
    isConnected,
    isPairing,
    connectionStatus,
    error,
    connect,
    disconnect,
    isARModeActive,
    setARModeActive,
  } = useSpectacles();

  const [isProcessing, setIsProcessing] = useState(false);

  // Notify parent component of AR mode changes
  useEffect(() => {
    onARModeChange?.(isARModeActive);
  }, [isARModeActive, onARModeChange]);

  /**
   * Handle toggle button click
   * - Not connected → Connect
   * - Connected but AR off → Activate AR mode
   * - Connected with AR on → Deactivate AR mode
   */
  const handleToggle = async () => {
    if (isProcessing || isPairing) return;

    setIsProcessing(true);

    try {
      if (!isConnected) {
        // Connect to Spectacles
        console.log('[SpectaclesToggle] Connecting to Spectacles...');

        const success = await connect();

        if (success) {
          toast({
            title: '👓 Spectacles Connected!',
            description: 'Tap again to activate AR mode',
            duration: 3000,
          });
        } else {
          toast({
            title: '❌ Connection Failed',
            description: error || 'Unable to connect to Spectacles',
            variant: 'destructive',
            duration: 4000,
          });
        }
      } else if (!isARModeActive) {
        // Activate AR mode
        console.log('[SpectaclesToggle] Activating AR mode...');
        setARModeActive(true);

        toast({
          title: '✨ AR Mode Active',
          description: 'Lo posts are now visible in your Spectacles',
          duration: 3000,
        });
      } else {
        // Deactivate AR mode (but stay connected)
        console.log('[SpectaclesToggle] Deactivating AR mode...');
        setARModeActive(false);

        toast({
          title: '📱 Map Mode',
          description: 'Switched back to map view',
          duration: 2000,
        });
      }
    } catch (err) {
      console.error('[SpectaclesToggle] Toggle error:', err);

      toast({
        title: '❌ Error',
        description: 'Failed to toggle Spectacles mode',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle disconnect
   */
  const handleDisconnect = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggle from firing

    if (isProcessing) return;

    setIsProcessing(true);

    try {
      await disconnect();

      toast({
        title: '👓 Disconnected',
        description: 'Spectacles disconnected',
        duration: 2000,
      });
    } catch (err) {
      console.error('[SpectaclesToggle] Disconnect error:', err);

      toast({
        title: '❌ Disconnect Error',
        description: 'Failed to disconnect from Spectacles',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Get button state styling
   */
  const getButtonStyle = () => {
    if (isPairing || isProcessing) {
      return 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-blue-400/40';
    }

    if (isConnected && isARModeActive) {
      return 'bg-gradient-to-r from-purple-600/30 to-indigo-500/30 border-purple-400/40';
    }

    if (isConnected) {
      return 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border-emerald-400/40';
    }

    // Disconnected
    return 'bg-gradient-to-r from-slate-500/30 to-gray-500/30 border-slate-400/40';
  };

  /**
   * Get button label
   */
  const getLabel = () => {
    if (isPairing || isProcessing) return 'Connecting';
    if (isConnected && isARModeActive) return 'AR Active';
    if (isConnected) return 'AR Mode';
    return 'Connect';
  };

  /**
   * Get icon
   */
  const getIcon = () => {
    if (isPairing || isProcessing) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }

    if (isConnected && isARModeActive) {
      return (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-white rounded-full motion-safe:animate-pulse" />
          <Glasses className="w-3 h-3" />
        </div>
      );
    }

    if (isConnected) {
      return <Glasses className="w-4 h-4" />;
    }

    return <Glasses className="w-4 h-4 opacity-60" />;
  };

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* Main Toggle Button with Glass Morphism */}
      <button
        onClick={handleToggle}
        disabled={isPairing || isProcessing}
        className={`
          relative flex min-h-[36px] min-w-[80px] items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold text-white transition-transform duration-200
          backdrop-blur-xl
          ${getButtonStyle()}
          ${isPairing || isProcessing
            ? 'scale-95 opacity-80'
            : 'hover:scale-[1.02] active:scale-95'
          }
          disabled:cursor-not-allowed disabled:transform-none disabled:opacity-60
        `}
        aria-label={isConnected ? 'Toggle AR Mode' : 'Connect to Spectacles'}
      >
        {/* Animated Background for Active States */}
        {(isConnected || isPairing) && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        )}

        <div className="relative flex items-center space-x-1">
          {getIcon()}

          <span className="text-xs leading-tight font-semibold">{getLabel()}</span>
        </div>
      </button>

      {/* Connection Status Indicator (shown when connected) */}
      {isConnected && !isARModeActive && (
        <div className="flex items-center space-x-1 text-[10px] text-emerald-300/90">
          <Wifi className="w-3 h-3" />
          <span className="font-medium">Connected</span>
        </div>
      )}

      {/* AR Mode Active Indicator */}
      {isARModeActive && (
        <div className="flex items-center space-x-1 text-[10px] text-purple-300/90">
          <Zap className="w-3 h-3 animate-pulse" />
          <span className="font-medium">AR Live</span>
        </div>
      )}

      {/* Error Indicator */}
      {error && !isConnected && (
        <div className="flex items-center space-x-1 text-[10px] text-red-300/90">
          <WifiOff className="w-3 h-3" />
          <span className="font-medium truncate max-w-[80px]">Failed</span>
        </div>
      )}
    </div>
  );
};

export default SpectaclesToggle;
