import { WebPlugin } from '@capacitor/core';
import type {
  SpectaclesBridgePlugin,
  SpectaclesConnectionResult,
  SpectaclesStatus,
  SpectaclesLocation,
  ARMessage,
  SendMessagesResult,
  StatusChangeListener,
} from './spectacles-bridge';

/**
 * Web implementation of SpectaclesBridge for development/testing
 *
 * Simulates Spectacles connection and functionality in browser.
 * Useful for:
 * - Development without Spectacles hardware
 * - Automated testing
 * - Demo purposes
 */
export class SpectaclesBridgeWeb extends WebPlugin implements SpectaclesBridgePlugin {
  private isConnected = false;
  private deviceId = 'spectacles_web_sim';
  private statusListeners: StatusChangeListener[] = [];

  async connect(): Promise<SpectaclesConnectionResult> {
    console.log('[SpectaclesBridge Web] Simulating connection...');

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    this.isConnected = true;

    // Notify listeners
    this.notifyStatusChange('connected');

    return {
      connected: true,
      deviceId: this.deviceId,
      message: 'Connected to Spectacles (Web Simulation)',
    };
  }

  async disconnect(): Promise<{ disconnected: boolean; message: string }> {
    console.log('[SpectaclesBridge Web] Disconnecting...');

    this.isConnected = false;
    this.notifyStatusChange('disconnected');

    return {
      disconnected: true,
      message: 'Disconnected from Spectacles (Web Simulation)',
    };
  }

  async getStatus(): Promise<SpectaclesStatus> {
    return {
      connected: this.isConnected,
      pairing: false,
      deviceId: this.isConnected ? this.deviceId : '',
    };
  }

  async sendMessages(options: { messages: ARMessage[] }): Promise<SendMessagesResult> {
    if (!this.isConnected) {
      throw new Error('Not connected to Spectacles');
    }

    console.log(`[SpectaclesBridge Web] Sending ${options.messages.length} messages to Spectacles:`, options.messages);

    return {
      sent: true,
      count: options.messages.length,
    };
  }

  async getSpectaclesLocation(): Promise<SpectaclesLocation> {
    if (!this.isConnected) {
      throw new Error('Not connected to Spectacles');
    }

    // Try to get browser geolocation
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading || 0,
            });
          },
          error => {
            console.warn('[SpectaclesBridge Web] Geolocation error, using default location:', error);
            // Default to San Francisco
            resolve({
              lat: 37.7749,
              lng: -122.4194,
              accuracy: 10,
              heading: 0,
            });
          }
        );
      } else {
        // No geolocation, use default
        resolve({
          lat: 37.7749,
          lng: -122.4194,
          accuracy: 10,
          heading: 0,
        });
      }
    });
  }

  async addStatusListener(): Promise<void> {
    console.log('[SpectaclesBridge Web] Status listener registered');
    // Send initial status
    this.notifyStatusChange(this.isConnected ? 'connected' : 'disconnected');
  }

  async removeStatusListener(): Promise<void> {
    console.log('[SpectaclesBridge Web] Status listener removed');
    this.statusListeners = [];
  }

  /**
   * Override addListener to handle status change events
   */
  async addListener(eventName: 'statusChange', listenerFunc: StatusChangeListener): Promise<{ remove: () => void }> {
    if (eventName === 'statusChange') {
      this.statusListeners.push(listenerFunc);
      return {
        remove: () => {
          const index = this.statusListeners.indexOf(listenerFunc);
          if (index > -1) {
            this.statusListeners.splice(index, 1);
          }
        },
      };
    }
    return { remove: () => {} };
  }

  /**
   * Notify all status change listeners
   */
  private notifyStatusChange(status: 'connected' | 'disconnected' | 'connecting' | 'error') {
    const event = {
      status,
      connected: this.isConnected,
      timestamp: Date.now(),
    };

    this.statusListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[SpectaclesBridge Web] Error in status listener:', error);
      }
    });

    // Also emit via Capacitor's event system
    this.notifyListeners('statusChange', event);
  }
}
