# Capacitor Native Integration Guide

This document outlines the complete Capacitor plugin integration implemented for the Geo Bubble Whispers iOS app.

## 🚀 Installed Plugins

### Core Plugins
- **@capacitor/core** `^7.2.0` - Core Capacitor functionality
- **@capacitor/cli** `^7.2.0` - Capacitor CLI tools
- **@capacitor/ios** `^7.2.0` - iOS platform support

### Native Functionality Plugins
- **@capacitor/app** `^7.0.1` - App state management, URL handling
- **@capacitor/geolocation** `^6.0.1` - Native location services
- **@capacitor/camera** `^6.0.2` - Camera and photo library access
- **@capacitor/filesystem** `^6.0.1` - File system operations
- **@capacitor/push-notifications** `^6.0.2` - Push notification support
- **@capacitor/local-notifications** `^6.1.2` - Local notification scheduling
- **@capacitor/share** `^6.0.2` - Native sharing capabilities
- **@capacitor/haptics** `^6.0.1` - Haptic feedback
- **@capacitor/status-bar** `^6.0.1` - Status bar control
- **@capacitor/keyboard** `^6.0.2` - Keyboard management
- **@capacitor/device** `^6.0.2` - Device information

## 📱 iOS Permissions Configured

The `ios-info-additions.plist` includes:

```xml
<!-- Location Services -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to show nearby messages and place your own messages on the map.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need your location to show nearby messages and provide location-based notifications.</string>

<!-- Camera and Photo Library -->
<key>NSCameraUsageDescription</key>
<string>We need camera access to let you take photos and videos for your messages and stories.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photo library to let you select photos and videos for your messages.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>We need access to save photos and videos to your library from the app.</string>

<!-- Microphone for video recording -->
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access to record audio for videos and live streams.</string>

<!-- Background modes for notifications -->
<key>UIBackgroundModes</key>
<array>
    <string>background-processing</string>
    <string>remote-notification</string>
</array>
```

## 🏗️ Service Architecture

### Platform Detection
```typescript
import { PlatformService } from '@/services';

// Check platform
PlatformService.isNative(); // true on iOS/Android
PlatformService.isIOS(); // true on iOS
PlatformService.isWeb(); // true in browser
```

### Geolocation Service
```typescript
import { GeolocationService } from '@/services';

// Get current position
const position = await GeolocationService.getCurrentPosition({
  enableHighAccuracy: true,
  timeout: 10000
});

// Watch position changes
const watchId = await GeolocationService.watchPosition(
  (position) => console.log(position),
  (error) => console.error(error)
);
```

### Camera Service
```typescript
import { CameraService } from '@/services';

// Take photo
const photo = await CameraService.getPhoto({
  quality: 85,
  allowEditing: true,
  resultType: 'dataUrl',
  source: 'prompt' // camera, photos, or prompt
});

// Pick multiple images
const photos = await CameraService.pickImages({ multiple: true });
```

### Share Service
```typescript
import { ShareService } from '@/services';

// Share content
await ShareService.share({
  title: 'My Message',
  text: 'Check this out!',
  url: 'https://example.com'
});

// Share message with location
await ShareService.shareMessage(messageId, content, { lat, lng });
```

### Haptic Feedback
```typescript
import { HapticService } from '@/services';

// Impact feedback
await HapticService.impact('medium'); // light, medium, heavy

// Notification feedback  
await HapticService.notification('success'); // success, warning, error

// Convenience methods
await HapticService.buttonPress();
await HapticService.messageReceived();
await HapticService.pinDrop();
```

### Notifications
```typescript
import { NotificationService } from '@/services';

// Initialize notifications
await NotificationService.initialize();

// Check permissions
const permissions = await NotificationService.checkPermissions();

// Show local notification
await NotificationService.showLocalNotification({
  id: 1,
  title: 'New Message',
  body: 'You have a new message nearby!',
  schedule: { at: new Date(Date.now() + 5000) }
});
```

### File System
```typescript
import { FilesystemService } from '@/services';

// Write file
await FilesystemService.writeFile({
  path: 'data.json',
  data: JSON.stringify(data),
  directory: 'documents'
});

// Read file
const content = await FilesystemService.readFile({
  path: 'data.json',
  directory: 'documents'
});

// Save photo
await FilesystemService.savePhoto(base64Data, 'photo.jpg');
```

## 🔧 Configuration

### Capacitor Config (`capacitor.config.ts`)
```typescript
export default {
  appId: 'app.lovable.822f9e01fc9740d1b5062512241aa634',
  appName: 'geo-bubble-whispers',
  webDir: 'dist',
  plugins: {
    Geolocation: {
      permissions: {
        ios: ["locationWhenInUse", "locationAlways"]
      }
    },
    Camera: {
      permissions: {
        ios: ["camera", "photos"]
      }
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]      
    },
    StatusBar: {
      style: "default",
      backgroundColor: "#FFFFFF"
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true
    }
  }
};
```

## 🎯 Component Integration Examples

### Updated Geolocation Hook
```typescript
// src/hooks/useUserLocation.ts
import { GeolocationService } from '@/services';

export const useUserLocation = () => {
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const position = await GeolocationService.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
        setUserLocation({ lat: position.lat, lng: position.lng });
      } catch (error) {
        console.log('Error getting location:', error);
      }
    };
    getCurrentLocation();
  }, []);
};
```

### Camera Integration
```typescript
// src/components/message/FileUploadArea.tsx
import { CameraService, PlatformService } from '@/services';

const handleCameraCapture = async () => {
  const photo = await CameraService.getPhoto({
    quality: 85,
    source: 'camera',
    resultType: 'dataUrl'
  });
  // Handle photo...
};

// Native UI vs Web UI
{PlatformService.isNative() ? (
  <NativeCameraButtons />
) : (
  <WebFileInput />
)}
```

### Haptic-Enhanced Interactions
```typescript
// src/hooks/useMessageInteractions.ts
import { HapticService, ShareService } from '@/services';

const handleLike = async () => {
  // Haptic feedback on like
  await HapticService.messageReceived();
  // ... like logic
};

const handleShare = async () => {
  await HapticService.buttonPress();
  await ShareService.shareMessage(messageId, content);
};
```

## 🧪 Testing

Run the test suite in browser console:
```javascript
// Open browser console and run:
testNativeServices();
```

This will test all services and report their status.

## 📱 iOS Build Process

1. **Sync Capacitor**: `npx cap sync ios`
2. **Open Xcode**: `npx cap open ios`
3. **Configure signing** in Xcode
4. **Build and run** on device/simulator

## 🔍 Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Ensure all permissions are added to `ios-info-additions.plist`
   - Check iOS Settings > App > Permissions

2. **Plugin Import Errors**
   - Verify all plugins are installed: `npm ls @capacitor/`
   - Run `npx cap sync` after adding new plugins

3. **Build Failures**
   - Clean and rebuild: `npm run build`
   - Clear Capacitor cache: `npx cap clean ios`

### Debug Mode

Enable debug logging in native services:
```typescript
// Add to App.tsx initialization
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Debug mode enabled for native services');
  (window as any).testNativeServices = testNativeServices;
}
```

## 🚀 Production Deployment

1. **Build optimized bundle**: `npm run build`
2. **Sync with iOS**: `npx cap sync ios`  
3. **Configure for App Store**: Update signing, icons, splash screens
4. **Test on real devices** with all native features
5. **Submit to App Store** following Apple guidelines

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Plugin API Reference](https://capacitorjs.com/docs/apis)
- [Apple App Store Guidelines](https://developer.apple.com/app-store/guidelines/)

---

*This integration provides a complete native iOS experience while maintaining web compatibility through platform detection and graceful fallbacks.*