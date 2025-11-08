import { registerPlugin } from '@capacitor/core';

/**
 * SpectaclesBridge Plugin
 *
 * Native bridge for Snap Spectacles AR/MR integration with Lo app
 * Provides one-tap connection, real-time data sync, and AR location services
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Connection status states
 */
export type SpectaclesConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'pairing';

/**
 * Connection result after connect() call
 */
export interface SpectaclesConnectionResult {
  connected: boolean;
  deviceId?: string;
  message?: string;
}

/**
 * Current connection status
 */
export interface SpectaclesStatus {
  connected: boolean;
  pairing: boolean;
  deviceId: string;
}

/**
 * Location data from Spectacles GPS
 */
export interface SpectaclesLocation {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number;
}

/**
 * Message object for AR display
 */
export interface ARMessage {
  id: string;
  content: string;
  lat: number;
  lng: number;
  distance?: number;
  bearing?: number;
  user: {
    name: string;
    avatar: string;
  };
  timestamp?: string;
  mediaUrl?: string | null;
  isPublic?: boolean;
}

/**
 * Send messages result
 */
export interface SendMessagesResult {
  sent: boolean;
  count: number;
}

/**
 * Status change event data
 */
export interface StatusChangeEvent {
  status: SpectaclesConnectionStatus;
  connected: boolean;
  timestamp: number;
}

/**
 * Status change listener callback
 */
export type StatusChangeListener = (event: StatusChangeEvent) => void;

// ============================================================================
// Plugin Interface
// ============================================================================

export interface SpectaclesBridgePlugin {
  /**
   * Connect to Spectacles
   *
   * Attempts auto-connection to last paired device.
   * Falls back to manual pairing if needed.
   *
   * @returns Promise with connection result
   *
   * @example
   * ```typescript
   * const result = await SpectaclesBridge.connect();
   * if (result.connected) {
   *   console.log('Connected to Spectacles:', result.deviceId);
   * }
   * ```
   */
  connect(): Promise<SpectaclesConnectionResult>;

  /**
   * Disconnect from Spectacles
   *
   * Closes active session and stops data sync.
   *
   * @returns Promise with disconnection result
   *
   * @example
   * ```typescript
   * await SpectaclesBridge.disconnect();
   * ```
   */
  disconnect(): Promise<{ disconnected: boolean; message: string }>;

  /**
   * Get current connection status
   *
   * @returns Promise with current status
   *
   * @example
   * ```typescript
   * const status = await SpectaclesBridge.getStatus();
   * console.log('Connected:', status.connected);
   * ```
   */
  getStatus(): Promise<SpectaclesStatus>;

  /**
   * Send messages to Spectacles for AR display
   *
   * Syncs nearby Lo posts to be rendered in AR view.
   * Automatically compresses and batches data for BLE efficiency.
   *
   * @param options Object containing array of messages
   * @returns Promise with send result
   *
   * @example
   * ```typescript
   * const result = await SpectaclesBridge.sendMessages({
   *   messages: [
   *     {
   *       id: 'msg-1',
   *       content: 'Hello from Lo!',
   *       lat: 37.7749,
   *       lng: -122.4194,
   *       distance: 45.2,
   *       bearing: 182.5,
   *       user: { name: 'Sarah', avatar: 'url' }
   *     }
   *   ]
   * });
   * console.log(`Sent ${result.count} messages`);
   * ```
   */
  sendMessages(options: { messages: ARMessage[] }): Promise<SendMessagesResult>;

  /**
   * Get Spectacles GPS location
   *
   * Returns current location from Spectacles device with heading.
   * More accurate than phone GPS for AR positioning.
   *
   * @returns Promise with location data
   *
   * @example
   * ```typescript
   * const location = await SpectaclesBridge.getSpectaclesLocation();
   * console.log(`Spectacles at ${location.lat}, ${location.lng}`);
   * console.log(`Heading: ${location.heading}°`);
   * ```
   */
  getSpectaclesLocation(): Promise<SpectaclesLocation>;

  /**
   * Add listener for connection status changes
   *
   * Receives real-time updates when connection state changes.
   *
   * @returns Promise that resolves when listener is registered
   *
   * @example
   * ```typescript
   * await SpectaclesBridge.addStatusListener();
   * SpectaclesBridge.addListener('statusChange', (event) => {
   *   console.log('Status changed:', event.status);
   * });
   * ```
   */
  addStatusListener(): Promise<void>;

  /**
   * Remove status change listener
   *
   * @returns Promise that resolves when listener is removed
   *
   * @example
   * ```typescript
   * await SpectaclesBridge.removeStatusListener();
   * ```
   */
  removeStatusListener(): Promise<void>;

  /**
   * Add event listener
   *
   * Standard Capacitor plugin listener for events.
   *
   * @param eventName Name of event to listen for
   * @param listenerFunc Callback function
   */
  addListener(
    eventName: 'statusChange',
    listenerFunc: StatusChangeListener
  ): Promise<{ remove: () => void }>;
}

// ============================================================================
// Plugin Registration
// ============================================================================

const SpectaclesBridge = registerPlugin<SpectaclesBridgePlugin>('SpectaclesBridge', {
  web: () => import('./spectacles-bridge.web').then(m => new m.SpectaclesBridgeWeb()),
});

export default SpectaclesBridge;
