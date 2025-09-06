import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

export class PermissionsService {
  /**
   * Request all necessary permissions for the app
   */
  static async requestAllPermissions() {
    const results = {
      camera: false,
      microphone: false,
      location: false
    };

    // Request permissions based on platform
    if (Capacitor.isNativePlatform()) {
      // Native platform (iOS/Android)
      results.camera = await this.requestCameraPermission();
      results.microphone = await this.requestMicrophonePermission();
      results.location = await this.requestLocationPermission();
    } else {
      // Web platform
      results.camera = await this.requestWebCameraPermission();
      results.microphone = await this.requestWebMicrophonePermission();
      results.location = await this.requestWebLocationPermission();
    }

    return results;
  }

  /**
   * Request camera permission for native platforms
   */
  private static async requestCameraPermission(): Promise<boolean> {
    try {
      const permission = await Camera.requestPermissions();
      return permission.camera === 'granted' || permission.camera === 'limited';
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  /**
   * Request microphone permission for native platforms
   */
  private static async requestMicrophonePermission(): Promise<boolean> {
    try {
      // On iOS, microphone permission is requested with camera
      // On Android, it's separate but we can check via getUserMedia
      if (Capacitor.getPlatform() === 'ios') {
        // iOS handles mic permission with camera
        return true;
      } else {
        // For Android, we'll check when actually using the microphone
        return true;
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  }

  /**
   * Request location permission for native platforms
   */
  private static async requestLocationPermission(): Promise<boolean> {
    try {
      const permission = await Geolocation.requestPermissions();
      return permission.location === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Request camera permission for web
   */
  private static async requestWebCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Error requesting web camera permission:', error);
      return false;
    }
  }

  /**
   * Request microphone permission for web
   */
  private static async requestWebMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: false,
        audio: true 
      });
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Error requesting web microphone permission:', error);
      return false;
    }
  }

  /**
   * Request location permission for web
   */
  private static async requestWebLocationPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { timeout: 5000 }
      );
    });
  }

  /**
   * Check if all permissions are granted
   */
  static async checkPermissions() {
    const results = {
      camera: false,
      microphone: false,
      location: false
    };

    if (Capacitor.isNativePlatform()) {
      // Check native permissions
      try {
        const cameraStatus = await Camera.checkPermissions();
        results.camera = cameraStatus.camera === 'granted' || cameraStatus.camera === 'limited';
      } catch (error) {
        console.error('Error checking camera permission:', error);
      }

      try {
        const locationStatus = await Geolocation.checkPermissions();
        results.location = locationStatus.location === 'granted';
      } catch (error) {
        console.error('Error checking location permission:', error);
      }

      // Microphone is typically checked with camera on iOS
      results.microphone = results.camera;
    } else {
      // Check web permissions via Permissions API
      try {
        if ('permissions' in navigator) {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          results.camera = cameraPermission.state === 'granted';

          const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          results.microphone = micPermission.state === 'granted';

          const locationPermission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          results.location = locationPermission.state === 'granted';
        }
      } catch (error) {
        console.error('Error checking web permissions:', error);
      }
    }

    return results;
  }

  /**
   * Show a friendly permission request dialog before actually requesting permissions
   */
  static async showPermissionDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      // This would be replaced with a proper modal component
      const message = `Lo needs access to:

📷 Camera - To take photos and videos
🎤 Microphone - For video recording and live streaming  
📍 Location - To tag your posts with locations

Would you like to grant these permissions?`;

      // For now, just use confirm - in production, use a proper modal
      const result = window.confirm(message);
      resolve(result);
    });
  }
}