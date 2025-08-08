// Platform and Core Services
export { PlatformService } from './platform';
export { AppService } from './app';

// Location and Navigation
export { GeolocationService } from './geolocation';
export type { GeolocationPosition, GeolocationOptions } from './geolocation';

// Media and Camera
export { CameraService } from './camera';
export type { CameraOptions, CameraPhoto } from './camera';

// File System
export { FilesystemService } from './filesystem';
export type { FileInfo, WriteFileOptions, ReadFileOptions } from './filesystem';

// Communication
export { NotificationService } from './notifications';
export type { NotificationPermission, LocalNotification } from './notifications';
export { ShareService } from './share';
export type { ShareOptions } from './share';

// User Interface
export { HapticService } from './haptics';
export type { HapticImpact, HapticNotification } from './haptics';
export { StatusBarService } from './statusbar';
export type { StatusBarStyle, StatusBarAnimation } from './statusbar';
export { KeyboardService } from './keyboard';
export type { KeyboardState, KeyboardResizeMode, KeyboardStyleMode } from './keyboard';

// Initialize all services
export async function initializeNativeServices(): Promise<void> {
  try {
    console.log('Initializing native services...');
    
    // Initialize core services
    await AppService.initialize();
    await NotificationService.initialize();
    await KeyboardService.initialize();
    
    console.log('Native services initialized successfully');
  } catch (error) {
    console.error('Error initializing native services:', error);
  }
}