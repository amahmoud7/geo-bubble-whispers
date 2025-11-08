import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import SpectaclesBridge, {
  SpectaclesConnectionStatus,
  SpectaclesLocation,
  ARMessage,
  StatusChangeEvent,
} from '../plugins/spectacles-bridge';
import { Capacitor } from '@capacitor/core';

// ============================================================================
// Type Definitions
// ============================================================================

interface SpectaclesContextType {
  // Connection state
  isConnected: boolean;
  isPairing: boolean;
  connectionStatus: SpectaclesConnectionStatus;
  deviceId: string | null;
  error: string | null;

  // Connection methods
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;

  // Data sync
  sendMessages: (messages: ARMessage[]) => Promise<boolean>;
  getSpectaclesLocation: () => Promise<SpectaclesLocation | null>;

  // AR mode state
  isARModeActive: boolean;
  setARModeActive: (active: boolean) => void;
}

// ============================================================================
// Context Creation
// ============================================================================

const SpectaclesContext = createContext<SpectaclesContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface SpectaclesProviderProps {
  children: ReactNode;
  autoConnect?: boolean; // Auto-connect on mount if previously paired
}

export const SpectaclesProvider: React.FC<SpectaclesProviderProps> = ({
  children,
  autoConnect = true,
}) => {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<SpectaclesConnectionStatus>('disconnected');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isARModeActive, setIsARModeActive] = useState(false);

  // Check if running on native platform
  const isNative = Capacitor.isNativePlatform();

  /**
   * Connect to Spectacles
   * Attempts auto-connection to last paired device
   */
  const connect = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      setIsPairing(true);
      setConnectionStatus('connecting');

      console.log('[SpectaclesContext] Attempting to connect to Spectacles...');

      const result = await SpectaclesBridge.connect();

      if (result.connected) {
        setIsConnected(true);
        setDeviceId(result.deviceId || null);
        setConnectionStatus('connected');
        setIsPairing(false);

        console.log('[SpectaclesContext] Successfully connected to Spectacles:', result.deviceId);

        return true;
      } else {
        throw new Error(result.message || 'Connection failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Spectacles';
      console.error('[SpectaclesContext] Connection error:', errorMessage);

      setError(errorMessage);
      setIsConnected(false);
      setDeviceId(null);
      setConnectionStatus('error');
      setIsPairing(false);

      return false;
    }
  }, []);

  /**
   * Disconnect from Spectacles
   */
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      console.log('[SpectaclesContext] Disconnecting from Spectacles...');

      await SpectaclesBridge.disconnect();

      setIsConnected(false);
      setDeviceId(null);
      setConnectionStatus('disconnected');
      setIsARModeActive(false);
      setError(null);

      console.log('[SpectaclesContext] Disconnected successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      console.error('[SpectaclesContext] Disconnect error:', errorMessage);
      setError(errorMessage);
    }
  }, []);

  /**
   * Send messages to Spectacles for AR display
   */
  const sendMessages = useCallback(async (messages: ARMessage[]): Promise<boolean> => {
    if (!isConnected) {
      console.warn('[SpectaclesContext] Cannot send messages - not connected');
      return false;
    }

    try {
      console.log(`[SpectaclesContext] Sending ${messages.length} messages to Spectacles...`);

      const result = await SpectaclesBridge.sendMessages({ messages });

      console.log(`[SpectaclesContext] Successfully sent ${result.count} messages`);
      return result.sent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send messages';
      console.error('[SpectaclesContext] Send messages error:', errorMessage);
      setError(errorMessage);
      return false;
    }
  }, [isConnected]);

  /**
   * Get Spectacles GPS location
   */
  const getSpectaclesLocation = useCallback(async (): Promise<SpectaclesLocation | null> => {
    if (!isConnected) {
      console.warn('[SpectaclesContext] Cannot get location - not connected');
      return null;
    }

    try {
      const location = await SpectaclesBridge.getSpectaclesLocation();
      console.log('[SpectaclesContext] Got Spectacles location:', location);
      return location;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      console.error('[SpectaclesContext] Get location error:', errorMessage);
      setError(errorMessage);
      return null;
    }
  }, [isConnected]);

  /**
   * Handle status change events from native plugin
   */
  const handleStatusChange = useCallback((event: StatusChangeEvent) => {
    console.log('[SpectaclesContext] Status change:', event);

    setConnectionStatus(event.status);
    setIsConnected(event.connected);

    // Handle specific status changes
    switch (event.status) {
      case 'connected':
        setError(null);
        setIsPairing(false);
        break;
      case 'disconnected':
        setIsARModeActive(false);
        setDeviceId(null);
        break;
      case 'error':
        setIsPairing(false);
        break;
    }
  }, []);

  /**
   * Initialize connection status and listeners
   */
  useEffect(() => {
    let listenerRemove: (() => void) | null = null;

    const initialize = async () => {
      try {
        // Register status listener
        console.log('[SpectaclesContext] Registering status listener...');
        await SpectaclesBridge.addStatusListener();

        const result = await SpectaclesBridge.addListener('statusChange', handleStatusChange);
        listenerRemove = result.remove;

        // Get initial status
        const status = await SpectaclesBridge.getStatus();
        setIsConnected(status.connected);
        setIsPairing(status.pairing);
        setDeviceId(status.deviceId || null);
        setConnectionStatus(status.connected ? 'connected' : 'disconnected');

        console.log('[SpectaclesContext] Initial status:', status);

        // Auto-connect if enabled and was previously paired
        if (autoConnect && status.deviceId && !status.connected && !status.pairing) {
          console.log('[SpectaclesContext] Auto-connecting to previously paired device...');
          await connect();
        }
      } catch (err) {
        console.error('[SpectaclesContext] Initialization error:', err);
      }
    };

    initialize();

    // Cleanup
    return () => {
      if (listenerRemove) {
        console.log('[SpectaclesContext] Removing status listener...');
        listenerRemove();
      }
      SpectaclesBridge.removeStatusListener();
    };
  }, [autoConnect, connect, handleStatusChange]);

  // Context value
  const value: SpectaclesContextType = {
    isConnected,
    isPairing,
    connectionStatus,
    deviceId,
    error,
    connect,
    disconnect,
    sendMessages,
    getSpectaclesLocation,
    isARModeActive,
    setARModeActive: setIsARModeActive, // Fix: map interface name to actual state setter
  };

  return (
    <SpectaclesContext.Provider value={value}>
      {children}
    </SpectaclesContext.Provider>
  );
};

// ============================================================================
// Hook for consuming context
// ============================================================================

export const useSpectacles = (): SpectaclesContextType => {
  const context = useContext(SpectaclesContext);

  if (context === undefined) {
    throw new Error('useSpectacles must be used within a SpectaclesProvider');
  }

  return context;
};

// ============================================================================
// Export
// ============================================================================

export default SpectaclesContext;
