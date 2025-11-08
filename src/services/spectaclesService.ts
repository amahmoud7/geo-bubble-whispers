import type { ARMessage, SpectaclesLocation } from '../plugins/spectacles-bridge';
import type { MapMessage } from '../types/messages';

// ============================================================================
// Constants
// ============================================================================

const MAX_AR_MESSAGES = 50; // Limit for BLE performance
const PROXIMITY_RADIUS_M = 500; // Only sync messages within 500m
const UPDATE_BATCH_INTERVAL_MS = 5000; // Batch updates every 5 seconds

// ============================================================================
// Coordinate Transformation Utilities
// ============================================================================

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Calculate bearing (direction) from one point to another
 * @returns Bearing in degrees (0-360, where 0 is North)
 */
export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;

  return bearing;
}

/**
 * Convert GPS coordinates to AR 3D space coordinates
 * Used by Lens Studio to position AR content
 *
 * @param userLocation User's current position from Spectacles GPS
 * @param messageLocation Message's GPS position
 * @param heading User's compass heading (0 = North)
 * @returns 3D coordinates for AR placement { x, y, z }
 */
export function gpsToARCoordinates(
  userLocation: SpectaclesLocation,
  messageLocation: { lat: number; lng: number },
  heading: number
): { x: number; y: number; z: number } {
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    messageLocation.lat,
    messageLocation.lng
  );

  const bearing = calculateBearing(
    userLocation.lat,
    userLocation.lng,
    messageLocation.lat,
    messageLocation.lng
  );

  // Calculate relative bearing (adjusted for user's heading)
  const relativeBearing = (bearing - heading + 360) % 360;
  const relativeBearingRad = (relativeBearing * Math.PI) / 180;

  // Depth mapping based on distance
  // Near: 0-50m → Z=55cm (arm's length)
  // Mid: 50-200m → Z=110cm (comfortable viewing)
  // Far: 200m+ → Z=160cm (far field)
  let z: number;
  if (distance < 50) {
    z = 0.55; // 55cm
  } else if (distance < 200) {
    z = 1.1; // 110cm
  } else {
    z = 1.6; // 160cm
  }

  // Calculate X offset based on bearing
  // Positive X = right, negative X = left
  const x = Math.sin(relativeBearingRad) * z;

  // Y at eye level (0 = center)
  const y = 0;

  return { x, y, z };
}

// ============================================================================
// Message Filtering & Transformation
// ============================================================================

/**
 * Filter messages by proximity to user location
 */
export function filterMessagesByProximity(
  messages: MapMessage[],
  userLocation: SpectaclesLocation,
  radiusMeters: number = PROXIMITY_RADIUS_M
): MapMessage[] {
  return messages.filter((message) => {
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      message.lat,
      message.lng
    );
    return distance <= radiusMeters;
  });
}

/**
 * Transform MapMessage to ARMessage format
 * Adds distance, bearing, and AR positioning data
 */
export function transformToARMessage(
  message: MapMessage,
  userLocation: SpectaclesLocation
): ARMessage {
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    message.lat,
    message.lng
  );

  const bearing = calculateBearing(
    userLocation.lat,
    userLocation.lng,
    message.lat,
    message.lng
  );

  return {
    id: message.id,
    content: message.content,
    lat: message.lat,
    lng: message.lng,
    distance: Math.round(distance * 10) / 10, // Round to 0.1m
    bearing: Math.round(bearing),
    user: message.user,
    timestamp: message.timestamp,
    mediaUrl: message.mediaUrl,
    isPublic: message.isPublic,
  };
}

/**
 * Prepare messages for AR sync
 * Filters, sorts, limits, and transforms messages
 */
export function prepareMessagesForAR(
  messages: MapMessage[],
  userLocation: SpectaclesLocation,
  maxMessages: number = MAX_AR_MESSAGES
): ARMessage[] {
  // Filter by proximity
  const nearbyMessages = filterMessagesByProximity(messages, userLocation);

  // Sort by distance (closest first)
  const sortedMessages = nearbyMessages.sort((a, b) => {
    const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
    const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
    return distA - distB;
  });

  // Limit to max for performance
  const limitedMessages = sortedMessages.slice(0, maxMessages);

  // Transform to AR format
  return limitedMessages.map((message) => transformToARMessage(message, userLocation));
}

// ============================================================================
// Batch Update Manager
// ============================================================================

/**
 * Batch update manager for efficient BLE data transfer
 * Accumulates updates and sends them at regular intervals
 */
export class SpectaclesBatchUpdater {
  private pendingMessages: ARMessage[] = [];
  private updateTimer: NodeJS.Timeout | null = null;
  private sendCallback: (messages: ARMessage[]) => Promise<boolean>;
  private intervalMs: number;

  constructor(
    sendCallback: (messages: ARMessage[]) => Promise<boolean>,
    intervalMs: number = UPDATE_BATCH_INTERVAL_MS
  ) {
    this.sendCallback = sendCallback;
    this.intervalMs = intervalMs;
  }

  /**
   * Add messages to batch queue
   */
  queueMessages(messages: ARMessage[]): void {
    this.pendingMessages = messages;

    // Start timer if not already running
    if (!this.updateTimer) {
      this.startTimer();
    }
  }

  /**
   * Send pending messages immediately
   */
  async flushNow(): Promise<boolean> {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }

    if (this.pendingMessages.length === 0) {
      return true;
    }

    const success = await this.sendCallback(this.pendingMessages);
    this.pendingMessages = [];
    return success;
  }

  /**
   * Start batch timer
   */
  private startTimer(): void {
    this.updateTimer = setTimeout(async () => {
      await this.flushNow();
      this.updateTimer = null;
    }, this.intervalMs);
  }

  /**
   * Stop all updates and clear queue
   */
  stop(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    this.pendingMessages = [];
  }
}

// ============================================================================
// Movement Detection
// ============================================================================

/**
 * Detect if user has moved significantly
 * Used to trigger message re-query
 */
export function hasMovedSignificantly(
  previousLocation: SpectaclesLocation,
  currentLocation: SpectaclesLocation,
  thresholdMeters: number = 150
): boolean {
  const distance = calculateDistance(
    previousLocation.lat,
    previousLocation.lng,
    currentLocation.lat,
    currentLocation.lng
  );

  return distance >= thresholdMeters;
}

// ============================================================================
// Compression Utilities (for future use with MessagePack)
// ============================================================================

/**
 * Compress AR message data for BLE transfer
 * Currently returns JSON, can be replaced with MessagePack
 */
export function compressARMessages(messages: ARMessage[]): string {
  // TODO: Replace with MessagePack compression when implemented
  // For now, use compact JSON
  return JSON.stringify(messages);
}

/**
 * Calculate approximate payload size in bytes
 */
export function estimatePayloadSize(messages: ARMessage[]): number {
  const json = compressARMessages(messages);
  return new Blob([json]).size;
}

// ============================================================================
// Exports
// ============================================================================

export default {
  calculateDistance,
  calculateBearing,
  gpsToARCoordinates,
  filterMessagesByProximity,
  transformToARMessage,
  prepareMessagesForAR,
  hasMovedSignificantly,
  compressARMessages,
  estimatePayloadSize,
  SpectaclesBatchUpdater,
};
