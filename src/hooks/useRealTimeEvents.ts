import { useState, useEffect, useCallback, useRef } from 'react';
import { ticketmasterService } from '@/services/ticketmasterEvents';
import { useEventMessages } from './useEventMessages';

interface SyncStatus {
  isActive: boolean;
  lastSync?: Date;
  eventsCount?: number;
  error?: string;
  syncCount: number;
}

interface SyncResult {
  success: boolean;
  message: string;
  eventsCount?: number;
  newEvents?: number;
  updatedEvents?: number;
}

export const useRealTimeEvents = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isActive: false,
    syncCount: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const { refetch: refetchEvents } = useEventMessages();
  const syncRef = useRef<{ 
    startTime: number; 
    totalSyncs: number; 
    successfulSyncs: number; 
  }>({
    startTime: 0,
    totalSyncs: 0,
    successfulSyncs: 0
  });

  /**
   * Start real-time event synchronization
   */
  const startRealTimeSync = useCallback(async (): Promise<SyncResult> => {
    if (syncStatus.isActive) {
      return { success: false, message: 'Real-time sync is already active' };
    }

    setIsLoading(true);
    
    try {
      const result = await ticketmasterService.startRealTimeSync();
      
      if (result.success) {
        setSyncStatus(prev => ({
          ...prev,
          isActive: true,
          lastSync: new Date(),
          eventsCount: result.eventsCount,
          error: undefined,
          syncCount: prev.syncCount + 1
        }));
        
        syncRef.current = {
          startTime: Date.now(),
          totalSyncs: 1,
          successfulSyncs: 1
        };

        // Refetch events to update UI
        await refetchEvents();
      } else {
        setSyncStatus(prev => ({
          ...prev,
          error: result.message
        }));
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSyncStatus(prev => ({
        ...prev,
        error: errorMessage
      }));
      
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [syncStatus.isActive, refetchEvents]);

  /**
   * Stop real-time event synchronization
   */
  const stopRealTimeSync = useCallback((): void => {
    ticketmasterService.stopRealTimeSync();
    setSyncStatus(prev => ({
      ...prev,
      isActive: false,
      error: undefined
    }));
  }, []);

  /**
   * Toggle real-time sync on/off
   */
  const toggleRealTimeSync = useCallback(async (): Promise<SyncResult> => {
    if (syncStatus.isActive) {
      stopRealTimeSync();
      return { success: true, message: 'Real-time sync stopped' };
    } else {
      return await startRealTimeSync();
    }
  }, [syncStatus.isActive, startRealTimeSync, stopRealTimeSync]);

  /**
   * Manual sync trigger
   */
  const manualSync = useCallback(async (): Promise<SyncResult> => {
    if (isLoading) {
      return { success: false, message: 'Sync already in progress' };
    }

    setIsLoading(true);
    
    try {
      // If real-time is not active, do a one-time sync
      if (!syncStatus.isActive) {
        const result = await ticketmasterService.startRealTimeSync();
        // Immediately stop it for one-time sync
        setTimeout(() => ticketmasterService.stopRealTimeSync(), 1000);
        
        if (result.success) {
          setSyncStatus(prev => ({
            ...prev,
            lastSync: new Date(),
            eventsCount: result.eventsCount,
            error: undefined,
            syncCount: prev.syncCount + 1
          }));
          
          await refetchEvents();
        }
        
        return result;
      } else {
        // Real-time is active, just refetch
        await refetchEvents();
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date(),
          syncCount: prev.syncCount + 1
        }));
        
        return { success: true, message: 'Events refreshed from real-time data' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Manual sync failed';
      setSyncStatus(prev => ({ ...prev, error: errorMessage }));
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, syncStatus.isActive, refetchEvents]);

  /**
   * Get sync statistics
   */
  const getSyncStats = useCallback(() => {
    const runtime = syncStatus.isActive ? Date.now() - syncRef.current.startTime : 0;
    return {
      isActive: syncStatus.isActive,
      runtime: Math.floor(runtime / 1000), // seconds
      totalSyncs: syncRef.current.totalSyncs,
      successfulSyncs: syncRef.current.successfulSyncs,
      successRate: syncRef.current.totalSyncs > 0 
        ? Math.round((syncRef.current.successfulSyncs / syncRef.current.totalSyncs) * 100) 
        : 100,
      lastSync: syncStatus.lastSync,
      eventsCount: syncStatus.eventsCount || 0
    };
  }, [syncStatus]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (syncStatus.isActive) {
        ticketmasterService.stopRealTimeSync();
      }
    };
  }, [syncStatus.isActive]);

  /**
   * Track sync updates
   */
  useEffect(() => {
    if (syncStatus.isActive && syncStatus.syncCount > 0) {
      syncRef.current.totalSyncs++;
      if (!syncStatus.error) {
        syncRef.current.successfulSyncs++;
      }
    }
  }, [syncStatus.syncCount, syncStatus.error, syncStatus.isActive]);

  return {
    // State
    syncStatus,
    isLoading,
    
    // Actions
    startRealTimeSync,
    stopRealTimeSync,
    toggleRealTimeSync,
    manualSync,
    
    // Utils
    getSyncStats,
    
    // Computed
    canStart: !syncStatus.isActive && !isLoading,
    canStop: syncStatus.isActive,
    hasError: !!syncStatus.error
  };
};