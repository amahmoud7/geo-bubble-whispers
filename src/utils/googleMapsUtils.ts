/**
 * Google Maps Utilities
 * Provides utility functions for Google Maps integration with iOS compatibility
 */

import { environment } from '@/config/environment';

export interface MapConfig {
  apiKey: string;
  libraries: string[];
  version: string;
  loadTimeout: number;
}

export interface MapValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Get the Google Maps configuration with iOS optimizations
 */
export function getMapConfig(): MapConfig {
  const apiKey = environment.get('GOOGLE_MAPS_API_KEY');
  
  return {
    apiKey: apiKey || '',
    libraries: ['places'],
    version: 'weekly',
    loadTimeout: 15000 // Increased timeout for slower connections
  };
}

/**
 * Validate Google Maps configuration
 */
export function validateMapConfig(): MapValidationResult {
  const config = getMapConfig();
  const result: MapValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // Check API key
  if (!config.apiKey) {
    result.isValid = false;
    result.errors.push('Google Maps API key is missing');
    result.suggestions.push('Set VITE_GOOGLE_MAPS_API_KEY in your .env file');
  } else if (!config.apiKey.startsWith('AIza')) {
    result.isValid = false;
    result.errors.push('Google Maps API key format appears invalid');
    result.suggestions.push('API key should start with "AIza"');
  } else if (config.apiKey.length !== 39) {
    result.warnings.push(`API key length is ${config.apiKey.length}, expected 39 characters`);
  }

  // Check network connectivity
  if (!navigator.onLine) {
    result.warnings.push('Device appears to be offline');
    result.suggestions.push('Check your internet connection');
  }

  // Check required browser features
  if (!('geolocation' in navigator)) {
    result.warnings.push('Geolocation not supported in this browser');
  }

  // Check WebGL support (important for iOS performance)
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    result.warnings.push('WebGL not supported - maps may perform poorly');
    result.suggestions.push('Try using a different browser or updating your iOS version');
  }

  return result;
}

/**
 * iOS-specific map options
 */
export function getIOSMapOptions(baseOptions: google.maps.MapOptions = {}): google.maps.MapOptions {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInStandaloneMode = (window.navigator as any).standalone === true;
  
  const iosOptions: google.maps.MapOptions = {
    ...baseOptions,
    // iOS-specific optimizations
    gestureHandling: 'greedy', // Better touch handling on iOS
    
    // Reduce visual complexity on iOS for better performance
    styles: isIOS ? [
      {
        featureType: 'poi',
        stylers: [{ visibility: 'off' }] // Hide points of interest for cleaner look
      },
      {
        featureType: 'transit',
        stylers: [{ visibility: 'off' }] // Hide transit info
      }
    ] : baseOptions.styles,
    
    // Control visibility based on screen size and device
    zoomControl: !isIOS, // Hide zoom control on mobile iOS
    streetViewControl: false, // Street view often doesn't work well in WebViews
    fullscreenControl: !isInStandaloneMode, // Hide fullscreen if already in standalone mode
    mapTypeControl: false, // Simplify interface on mobile
    
    // Performance optimizations for iOS
    maxZoom: 18, // Limit max zoom to improve performance
    minZoom: 8,  // Set reasonable min zoom
  };

  return iosOptions;
}

/**
 * Test Google Maps API connectivity
 */
export async function testMapApiConnectivity(): Promise<{
  success: boolean;
  service: string;
  error?: string;
  latency?: number;
}[]> {
  const config = getMapConfig();
  const results = [];
  
  if (!config.apiKey) {
    return [{
      success: false,
      service: 'configuration',
      error: 'API key not configured'
    }];
  }

  // Test Geocoding API
  try {
    const startTime = Date.now();
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=San+Francisco&key=${config.apiKey}`;
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    const latency = Date.now() - startTime;
    
    results.push({
      success: data.status === 'OK',
      service: 'geocoding',
      error: data.status !== 'OK' ? data.error_message || data.status : undefined,
      latency
    });
  } catch (error) {
    results.push({
      success: false,
      service: 'geocoding',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test Static Maps API
  try {
    const startTime = Date.now();
    const staticUrl = `https://maps.googleapis.com/maps/api/staticmap?center=37.7749,-122.4194&zoom=13&size=100x100&key=${config.apiKey}`;
    const response = await fetch(staticUrl, { method: 'HEAD' });
    const latency = Date.now() - startTime;
    
    results.push({
      success: response.ok,
      service: 'staticmaps',
      error: !response.ok ? `HTTP ${response.status}` : undefined,
      latency
    });
  } catch (error) {
    results.push({
      success: false,
      service: 'staticmaps',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
}

/**
 * Get user-friendly error messages for common Google Maps issues
 */
export function getErrorMessage(error: any): { 
  title: string; 
  message: string; 
  suggestions: string[]; 
} {
  const errorStr = error?.message || error?.toString() || 'Unknown error';
  
  if (errorStr.includes('INVALID_REQUEST') || errorStr.includes('REQUEST_DENIED')) {
    return {
      title: 'API Key Issue',
      message: 'The Google Maps API key is invalid or has insufficient permissions.',
      suggestions: [
        'Check that the API key is correctly set in your .env file',
        'Ensure the Maps JavaScript API is enabled in Google Cloud Console',
        'Verify that your domain is allowed if you have domain restrictions',
        'Check that billing is set up for your Google Cloud project'
      ]
    };
  }
  
  if (errorStr.includes('OVER_QUERY_LIMIT')) {
    return {
      title: 'Quota Exceeded',
      message: 'Your Google Maps API quota has been exceeded.',
      suggestions: [
        'Check your Google Cloud Console for quota usage',
        'Consider upgrading your billing plan',
        'Implement request caching to reduce API calls'
      ]
    };
  }
  
  if (errorStr.includes('ZERO_RESULTS')) {
    return {
      title: 'No Results',
      message: 'The request was valid but no results were found.',
      suggestions: [
        'Try a different location or search term',
        'Check that the coordinates are valid',
        'Ensure the location exists in Google Maps'
      ]
    };
  }
  
  if (errorStr.includes('Network') || errorStr.includes('fetch')) {
    return {
      title: 'Network Error',
      message: 'Unable to connect to Google Maps services.',
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Check if you are behind a firewall or proxy',
        'Try connecting to a different network'
      ]
    };
  }
  
  // Default error handling
  return {
    title: 'Map Loading Error',
    message: 'Google Maps failed to load properly.',
    suggestions: [
      'Refresh the page and try again',
      'Check your internet connection',
      'Clear your browser cache',
      'Try using a different browser',
      'Contact support if the problem persists'
    ]
  };
}

/**
 * Create a debug report for troubleshooting
 */
export function createDebugReport(): {
  timestamp: string;
  environment: any;
  validation: MapValidationResult;
  userAgent: string;
  isIOS: boolean;
  isStandalone: boolean;
  networkOnline: boolean;
  apiKey: string;
} {
  const config = getMapConfig();
  const validation = validateMapConfig();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = (window.navigator as any).standalone === true;
  
  return {
    timestamp: new Date().toISOString(),
    environment: environment.getSafeConfig(),
    validation,
    userAgent: navigator.userAgent,
    isIOS,
    isStandalone,
    networkOnline: navigator.onLine,
    apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...${config.apiKey.substring(config.apiKey.length - 4)}` : 'MISSING'
  };
}

/**
 * Setup iOS-specific fixes and workarounds
 */
export function setupIOSFixes(): void {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (!isIOS) {
    return;
  }
  
  // Fix iOS viewport issues
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  }
  
  // Prevent zoom on input focus (common iOS issue)
  const style = document.createElement('style');
  style.innerHTML = `
    @media screen and (-webkit-min-device-pixel-ratio: 0) {
      select, textarea, input[type="text"], input[type="password"],
      input[type="datetime"], input[type="datetime-local"],
      input[type="date"], input[type="month"], input[type="time"],
      input[type="week"], input[type="number"], input[type="email"],
      input[type="url"], input[type="search"], input[type="tel"] {
        font-size: 16px !important;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Handle iOS safe area
  document.body.style.paddingTop = 'env(safe-area-inset-top)';
  document.body.style.paddingBottom = 'env(safe-area-inset-bottom)';
  document.body.style.paddingLeft = 'env(safe-area-inset-left)';
  document.body.style.paddingRight = 'env(safe-area-inset-right)';
  
  console.log('🍎 iOS-specific fixes applied');
}