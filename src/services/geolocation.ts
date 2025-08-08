import { Geolocation } from '@capacitor/geolocation';
import { PlatformService } from './platform';

export interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export class GeolocationService {
  static async getCurrentPosition(options?: GeolocationOptions): Promise<GeolocationPosition> {
    try {
      if (PlatformService.isNative()) {
        // Check permissions first
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== 'granted') {
          const requestResult = await Geolocation.requestPermissions();
          if (requestResult.location !== 'granted') {
            throw new Error('Location permission denied');
          }
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: options?.timeout ?? 10000,
          maximumAge: options?.maximumAge ?? 0
        });

        return {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined
        };
      } else {
        // Fallback to web geolocation API
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude ?? undefined,
                altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
                heading: position.coords.heading ?? undefined,
                speed: position.coords.speed ?? undefined
              });
            },
            (error) => {
              reject(new Error(`Geolocation error: ${error.message}`));
            },
            {
              enableHighAccuracy: options?.enableHighAccuracy ?? true,
              timeout: options?.timeout ?? 10000,
              maximumAge: options?.maximumAge ?? 0
            }
          );
        });
      }
    } catch (error) {
      console.error('GeolocationService error:', error);
      throw error;
    }
  }

  static async watchPosition(
    callback: (position: GeolocationPosition) => void,
    errorCallback?: (error: Error) => void,
    options?: GeolocationOptions
  ): Promise<string> {
    try {
      if (PlatformService.isNative()) {
        const watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: options?.enableHighAccuracy ?? true,
            timeout: options?.timeout ?? 10000,
            maximumAge: options?.maximumAge ?? 0
          },
          (position, err) => {
            if (err) {
              errorCallback?.(new Error(err.message));
              return;
            }

            if (position) {
              callback({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude ?? undefined,
                altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
                heading: position.coords.heading ?? undefined,
                speed: position.coords.speed ?? undefined
              });
            }
          }
        );
        return watchId;
      } else {
        // Fallback to web geolocation API
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            callback({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude ?? undefined,
              altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
              heading: position.coords.heading ?? undefined,
              speed: position.coords.speed ?? undefined
            });
          },
          (error) => {
            errorCallback?.(new Error(`Geolocation error: ${error.message}`));
          },
          {
            enableHighAccuracy: options?.enableHighAccuracy ?? true,
            timeout: options?.timeout ?? 10000,
            maximumAge: options?.maximumAge ?? 0
          }
        );
        return watchId.toString();
      }
    } catch (error) {
      console.error('GeolocationService watch error:', error);
      throw error;
    }
  }

  static async clearWatch(watchId: string): Promise<void> {
    try {
      if (PlatformService.isNative()) {
        await Geolocation.clearWatch({ id: watchId });
      } else {
        navigator.geolocation.clearWatch(parseInt(watchId));
      }
    } catch (error) {
      console.error('GeolocationService clearWatch error:', error);
    }
  }
}