import { useEffect, useRef, useCallback } from 'react';
import { useSpectacles } from '@/contexts/SpectaclesContext';
import {
  prepareMessagesForAR,
  hasMovedSignificantly,
  SpectaclesBatchUpdater,
} from '@/services/spectaclesService';
import type { MapMessage } from '@/types/messages';
import type { SpectaclesLocation } from '@/plugins/spectacles-bridge';

/**
 * useSpectaclesSync Hook
 *
 * Automatically syncs nearby messages to Spectacles when AR mode is active
 *
 * Features:
 * - Filters messages by proximity (500m radius)
 * - Batches updates every 5 seconds for BLE efficiency
 * - Re-syncs when user moves significantly (150m threshold)
 * - Transforms messages with AR positioning data
 * - Handles connection state changes gracefully
 *
 * @param messages Array of map messages to sync
 * @param enabled Whether sync should be active (default: auto-detect from AR mode)
 *
 * @example
 * ```tsx
 * const { messages } = useMessages();
 * useSpectaclesSync(messages); // Auto-syncs when AR mode active
 * ```
 */
export function useSpectaclesSync(
  messages: MapMessage[],
  enabled?: boolean
) {
  const {
    isConnected,
    isARModeActive,
    sendMessages,
    getSpectaclesLocation,
  } = useSpectacles();

  // Refs for tracking state without causing re-renders
  const batchUpdaterRef = useRef<SpectaclesBatchUpdater | null>(null);
  const lastLocationRef = useRef<SpectaclesLocation | null>(null);
  const lastSyncedMessagesRef = useRef<string[]>([]);

  // Determine if sync should be active
  const shouldSync = enabled !== undefined ? enabled : isARModeActive;

  /**
   * Sync messages to Spectacles
   */
  const syncMessages = useCallback(async () => {
    if (!isConnected || !shouldSync) {
      console.log('[useSpectaclesSync] Skipping sync - not ready');
      return;
    }

    try {
      // Get current Spectacles location
      const location = await getSpectaclesLocation();

      if (!location) {
        console.warn('[useSpectaclesSync] No location available');
        return;
      }

      // Update last known location
      lastLocationRef.current = location;

      // Prepare messages for AR (filter, sort, transform)
      const arMessages = prepareMessagesForAR(messages, location);

      console.log(
        `[useSpectaclesSync] Prepared ${arMessages.length} messages for AR sync`,
        {
          userLocation: location,
          totalMessages: messages.length,
        }
      );

      // Check if messages have actually changed
      const currentMessageIds = arMessages.map((m) => m.id).sort();
      const hasChanged =
        JSON.stringify(currentMessageIds) !==
        JSON.stringify(lastSyncedMessagesRef.current);

      if (!hasChanged && lastSyncedMessagesRef.current.length > 0) {
        console.log('[useSpectaclesSync] No message changes detected, skipping sync');
        return;
      }

      // Queue messages for batch update
      if (batchUpdaterRef.current) {
        batchUpdaterRef.current.queueMessages(arMessages);
      } else {
        // No batch updater, send immediately
        const success = await sendMessages(arMessages);
        if (success) {
          lastSyncedMessagesRef.current = currentMessageIds;
          console.log(`[useSpectaclesSync] Synced ${arMessages.length} messages immediately`);
        }
      }
    } catch (error) {
      console.error('[useSpectaclesSync] Sync error:', error);
    }
  }, [isConnected, shouldSync, messages, sendMessages, getSpectaclesLocation]);

  /**
   * Check if user has moved and re-sync if needed
   */
  const checkMovementAndSync = useCallback(async () => {
    if (!isConnected || !shouldSync) return;

    try {
      const currentLocation = await getSpectaclesLocation();

      if (!currentLocation) return;

      const previousLocation = lastLocationRef.current;

      if (previousLocation) {
        const hasMoved = hasMovedSignificantly(previousLocation, currentLocation);

        if (hasMoved) {
          console.log('[useSpectaclesSync] User moved significantly, re-syncing messages');
          await syncMessages();
        }
      }
    } catch (error) {
      console.error('[useSpectaclesSync] Movement check error:', error);
    }
  }, [isConnected, shouldSync, syncMessages, getSpectaclesLocation]);

  /**
   * Initialize batch updater when connected
   */
  useEffect(() => {
    if (isConnected && shouldSync && !batchUpdaterRef.current) {
      console.log('[useSpectaclesSync] Initializing batch updater');

      batchUpdaterRef.current = new SpectaclesBatchUpdater(
        async (messages) => {
          const success = await sendMessages(messages);
          if (success) {
            lastSyncedMessagesRef.current = messages.map((m) => m.id).sort();
            console.log(`[useSpectaclesSync] Batch synced ${messages.length} messages`);
          }
          return success;
        },
        5000 // 5 second batch interval
      );
    }

    return () => {
      if (batchUpdaterRef.current) {
        console.log('[useSpectaclesSync] Stopping batch updater');
        batchUpdaterRef.current.stop();
        batchUpdaterRef.current = null;
      }
    };
  }, [isConnected, shouldSync, sendMessages]);

  /**
   * Sync when messages change
   */
  useEffect(() => {
    if (isConnected && shouldSync && messages.length > 0) {
      console.log('[useSpectaclesSync] Messages changed, syncing...');
      syncMessages();
    }
  }, [isConnected, shouldSync, messages, syncMessages]);

  /**
   * Periodic movement check (every 30 seconds)
   */
  useEffect(() => {
    if (!isConnected || !shouldSync) return;

    const intervalId = setInterval(() => {
      checkMovementAndSync();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [isConnected, shouldSync, checkMovementAndSync]);

  /**
   * Initial sync when AR mode is activated
   */
  useEffect(() => {
    if (isConnected && shouldSync) {
      console.log('[useSpectaclesSync] AR mode activated, performing initial sync');
      syncMessages();
    }
  }, [isConnected, shouldSync, syncMessages]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (batchUpdaterRef.current) {
        batchUpdaterRef.current.stop();
        batchUpdaterRef.current = null;
      }
      lastLocationRef.current = null;
      lastSyncedMessagesRef.current = [];
    };
  }, []);

  // Return sync control functions
  return {
    syncMessages,
    isActive: isConnected && shouldSync,
  };
}

export default useSpectaclesSync;
