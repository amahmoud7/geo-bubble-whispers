# Spectacles AR/MR Integration Setup Guide

Complete guide for integrating Snap Spectacles AR functionality with the Lo app.

## 📋 Prerequisites

### 1. Spectacles Developer Access

- **Snap Spectacles Developer Program**: $99/month subscription
- **Hardware**: Snap Spectacles (2024 model or later)
- **Developer Account**: Sign up at [spectacles.com/developers](https://spectacles.com/developers)

### 2. Development Tools

- **Xcode 15+**: For iOS development
- **Lens Studio 5.0+**: For AR lens development
- **CocoaPods**: For iOS dependency management
- **Node.js 18+**: Already required for React app

## 🎯 Implementation Status

✅ **Completed Components**:
- Native iOS plugin structure (`SpectaclesBridge.swift`)
- TypeScript API definitions (`src/plugins/spectacles-bridge.ts`)
- React Context (`SpectaclesContext.tsx`)
- UI Component (`SpectaclesToggle.tsx`)
- Data sync service (`spectaclesService.ts`)
- Auto-sync hook (`useSpectaclesSync.ts`)
- Bluetooth permissions
- Integration with Lo app

⏳ **Pending Implementation** (requires Spectacles SDK access):
- Spectacles Mobile Kit SDK integration
- Actual BLE connection logic
- Lens Studio AR lens development
- Hardware testing

## 📦 Phase 1: Spectacles Mobile Kit SDK Setup

### Step 1: Access the SDK

1. **Join Spectacles Developer Program**:
   ```bash
   # Visit https://spectacles.com/developers
   # Subscribe to developer program ($99/month)
   # Download Spectacles Mobile Kit for iOS
   ```

2. **Download SDK**:
   - Navigate to Snap Developer Portal
   - Download `SpectaclesMobileKit.framework` or CocoaPods spec
   - Note the installation method (framework vs pod)

### Step 2: Install SDK via CocoaPods

**Option A: If SDK is available via CocoaPods**

Edit `ios/App/Podfile` (line 44):
```ruby
# Uncomment this line:
pod 'SpectaclesMobileKit', '~> 1.0'
```

**Option B: If SDK is provided as downloadable framework**

1. Create frameworks directory:
   ```bash
   mkdir -p ios/App/Frameworks
   ```

2. Copy framework:
   ```bash
   cp -r ~/Downloads/SpectaclesMobileKit.framework ios/App/Frameworks/
   ```

3. Edit `ios/App/Podfile` (line 47):
   ```ruby
   # Uncomment this line:
   pod 'SpectaclesMobileKit', :path => './Frameworks/SpectaclesMobileKit'
   ```

**Option C: If using Snap's private spec repo**

Edit `ios/App/Podfile` (add at top):
```ruby
source 'https://github.com/Snapchat/Specs.git'
source 'https://github.com/CocoaPods/Specs.git'
```

Then uncomment line 51:
```ruby
pod 'SpectaclesMobileKit', '~> 1.0'
```

### Step 3: Install Dependencies

```bash
cd ios/App
pod install
cd ../..
```

### Step 4: Update Swift Plugin

Edit `ios/App/App/Plugins/SpectaclesBridge.swift`:

1. **Add import** (line 2):
   ```swift
   import SpectaclesMobileKit
   ```

2. **Replace simulation code** with actual SDK calls:

   Find `initializeBondingManager()` (line 38) and replace:
   ```swift
   private func initializeBondingManager() {
       bondingManager = BondingManager.Builder()
           .setClientIdentifier("app.lo.social")
           .setAppVersion(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0")
           .build()
   }
   ```

   Find `connect()` method (line 57) and implement real connection:
   ```swift
   @objc func connect(_ call: CAPPluginCall) {
       guard !isPairing else {
           call.reject("Connection already in progress")
           return
       }

       isPairing = true
       notifyStatusChange("connecting")

       if let deviceId = lastKnownDeviceId {
           // Attempt auto-reconnect
           reconnectToDevice(deviceId) { [weak self] success in
               if success {
                   call.resolve(["connected": true, "deviceId": deviceId])
               } else {
                   // Fall back to manual pairing
                   self?.startPairing(call)
               }
           }
       } else {
           // First time connection
           startPairing(call)
       }
   }
   ```

   Implement `startPairing()` and `reconnectToDevice()` methods (currently commented out at bottom of file).

### Step 5: Enable BLE Background Modes

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Click **+ Capability**
5. Add **Background Modes**
6. Enable:
   - ✅ **Uses Bluetooth LE accessories**
   - ✅ **External accessory communication**

### Step 6: Build and Test Connection

```bash
npm run build:dev
npx cap sync ios
npx cap open ios
```

In Xcode:
1. Select your device or simulator
2. Build and run (⌘+R)
3. Test the Spectacles toggle button
4. Monitor Xcode console for connection logs

## 🎨 Phase 2: Lens Studio AR Development

### Step 1: Set Up Lens Studio

1. **Download Lens Studio**:
   - Visit [ar.snap.com/lens-studio](https://ar.snap.com/lens-studio)
   - Download Lens Studio 5.0 or later
   - Install and launch

2. **Create New Project**:
   - Select **Spectacles** as the target device
   - Choose **Blank Project**
   - Name it: `Lo AR View`

### Step 2: Implement Location API

1. **Add Location API Module**:
   - In Lens Studio, go to **Resources Panel**
   - Click **+** → **Script**
   - Name it: `LoARController`

2. **Initialize Location Services**:
   ```typescript
   import { LocationService, GeoLocationAccuracy } from 'LensStudio';

   @component
   export class LoARController extends BaseScriptComponent {
       private locationService: LocationService;
       private messages: ARMessage[] = [];

       onAwake() {
           // Initialize location service
           this.locationService = this.sceneObject.createComponent('LocationService');
           this.locationService.accuracy = GeoLocationAccuracy.Navigation;

           // Listen for location updates
           this.locationService.onLocationUpdate.add((location) => {
               this.updateMessagePositions(location);
           });

           // Start tracking
           this.locationService.start();
       }

       private updateMessagePositions(location: Location) {
           const heading = location.northAlignedOrientation.y;

           this.messages.forEach(message => {
               const arPosition = this.gpsToARPosition(
                   location.latitude,
                   location.longitude,
                   heading,
                   message.lat,
                   message.lng
               );

               // Update message bubble position
               this.positionMessageBubble(message.id, arPosition);
           });
       }

       private gpsToARPosition(
           userLat: number,
           userLng: number,
           heading: number,
           msgLat: number,
           msgLng: number
       ): vec3 {
           // Calculate distance and bearing
           const distance = this.haversineDistance(userLat, userLng, msgLat, msgLng);
           const bearing = this.calculateBearing(userLat, userLng, msgLat, msgLng);

           // Relative bearing adjusted for user's heading
           const relativeBearing = (bearing - heading + 360) % 360;
           const bearingRad = (relativeBearing * Math.PI) / 180;

           // Depth mapping
           let z: number;
           if (distance < 50) {
               z = 0.55; // 55cm - near field
           } else if (distance < 200) {
               z = 1.1;  // 110cm - mid field
           } else {
               z = 1.6;  // 160cm - far field
           }

           // Calculate X offset
           const x = Math.sin(bearingRad) * z;

           // Y at eye level
           const y = 0;

           return new vec3(x, y, z);
       }

       private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
           const R = 6371e3; // Earth radius in meters
           const φ1 = (lat1 * Math.PI) / 180;
           const φ2 = (lat2 * Math.PI) / 180;
           const Δφ = ((lat2 - lat1) * Math.PI) / 180;
           const Δλ = ((lng2 - lng1) * Math.PI) / 180;

           const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                     Math.cos(φ1) * Math.cos(φ2) *
                     Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

           const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

           return R * c;
       }

       private calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
           const φ1 = (lat1 * Math.PI) / 180;
           const φ2 = (lat2 * Math.PI) / 180;
           const Δλ = ((lng2 - lng1) * Math.PI) / 180;

           const y = Math.sin(Δλ) * Math.cos(φ2);
           const x = Math.cos(φ1) * Math.sin(φ2) -
                     Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

           const θ = Math.atan2(y, x);
           return ((θ * 180) / Math.PI + 360) % 360;
       }

       // Called from Mobile Kit when messages are synced
       public onMessagesReceived(messagesJson: string) {
           this.messages = JSON.parse(messagesJson);
           print(`Received ${this.messages.length} messages from Lo app`);
       }
   }
   ```

### Step 3: Create Message Bubble UI

1. **Add UI Elements**:
   - Create **Screen Image** for bubble background
   - Add **Text** component for message content
   - Add **Image** component for user avatar
   - Group them into **Message Bubble** prefab

2. **Apply Glass Morphism Shader**:
   - Create new **Material**
   - Set **Blend Mode**: Alpha Blend
   - Add **Frosted Glass** effect
   - Set **Background Blur**: 10px
   - Set **Opacity**: 30%
   - Set **Border**: 1px white with 40% opacity

3. **Script Message Bubble**:
   ```typescript
   @component
   export class MessageBubble extends BaseScriptComponent {
       @input
       contentText: Text;

       @input
       avatarImage: Image;

       @input
       distanceText: Text;

       private messageId: string;

       setMessage(msg: ARMessage) {
           this.messageId = msg.id;
           this.contentText.text = msg.content;
           this.distanceText.text = `${Math.round(msg.distance)}m`;

           // Load avatar (implement texture loading)
           // this.avatarImage.mainPass.baseTex = loadTexture(msg.user.avatar);
       }

       setPosition(pos: vec3) {
           this.sceneObject.getTransform().setWorldPosition(pos);

           // Scale based on distance
           const scale = Math.max(0.5, Math.min(1.0, 1 - (pos.z - 0.55) / 1.6));
           this.sceneObject.getTransform().setWorldScale(new vec3(scale, scale, scale));
       }
   }
   ```

### Step 4: Implement Message Sync Receiver

1. **Add Mobile Connection API**:
   ```typescript
   import { MobileService } from 'LensStudio';

   @component
   export class MobileConnectionHandler extends BaseScriptComponent {
       private mobileService: MobileService;
       private arController: LoARController;

       onAwake() {
           this.mobileService = this.sceneObject.createComponent('MobileService');
           this.arController = this.sceneObject.getComponent('LoARController');

           // Listen for messages from mobile app
           this.mobileService.onMessageReceived.add((data) => {
               const payload = JSON.parse(data);

               if (payload.type === 'messages') {
                   this.arController.onMessagesReceived(payload.data);
               }
           });

           // Send ready signal
           this.mobileService.sendMessage(JSON.stringify({
               type: 'ready',
               lensId: 'lo-ar-view'
           }));
       }
   }
   ```

### Step 5: Build and Deploy Lens

1. **Test in Lens Studio**:
   - Click **Preview** button
   - Test with simulated messages
   - Verify positioning and glass morphism

2. **Push to Spectacles**:
   - Click **Push to Spectacles**
   - Select your paired Spectacles device
   - Wait for lens to install

3. **Set Lens ID**:
   - Note the Lens ID (e.g., `lo-ar-view`)
   - Update Swift plugin with this ID:
     ```swift
     bondingManager?.bind(lensId: "lo-ar-view")
     ```

## 🔧 Phase 3: Testing & Refinement

### Integration Testing

1. **Connection Test**:
   ```bash
   # Run Lo app on iPhone
   # Open app and tap Spectacles toggle
   # Verify:
   # - Button shows "Connecting"
   # - Spectacles vibrate (pairing confirmation)
   # - Button shows "Connected"
   # - Toast notification appears
   ```

2. **Message Sync Test**:
   ```bash
   # With Spectacles connected
   # Tap "AR Mode" button
   # Verify:
   # - Messages appear in Spectacles view
   # - Positions match real-world locations
   # - Distance indicators are accurate
   # - UI is readable with glass morphism
   ```

3. **Movement Test**:
   ```bash
   # Walk 150+ meters
   # Verify:
   # - Messages re-sync automatically
   # - New nearby messages appear
   # - Distant messages disappear
   # - No lag or jitter
   ```

### Performance Optimization

1. **Monitor BLE Throughput**:
   ```swift
   // Add logging to SpectaclesBridge.swift
   print("[BLE] Payload size: \(dataSize) bytes")
   print("[BLE] Transfer time: \(duration)ms")
   ```

2. **Optimize Message Payload**:
   - Limit to 50 messages max
   - Compress content to 200 chars
   - Use delta updates for position changes
   - Consider MessagePack instead of JSON

3. **Battery Monitoring**:
   - Test for 1 hour continuous use
   - Target < 5% battery drain per hour
   - Reduce update frequency if needed

## 📱 Usage Guide

### For Users

1. **Pair Spectacles** (one-time):
   - Open Lo app
   - Tap the glasses icon (👓) in top right
   - Follow pairing instructions
   - Grant Bluetooth permissions

2. **Activate AR Mode**:
   - Tap the glasses icon again
   - Button will show "AR Active"
   - Put on Spectacles
   - See Lo posts in AR view

3. **Interact with Messages**:
   - Look at a message bubble
   - Tap on Spectacles touchpad
   - Message expands to show full content

### For Developers

1. **Enable Debug Mode**:
   ```typescript
   // In SpectaclesContext.tsx
   const DEBUG = true;
   ```

2. **Monitor Logs**:
   ```bash
   # iOS console
   npx cap run ios --livereload

   # Spectacles console (in Lens Studio)
   # Window → Spectacles Console
   ```

3. **Test Without Hardware**:
   - Web implementation simulates connection
   - Use browser dev tools for testing
   - Check `SpectaclesBridgeWeb` logs

## 🐛 Troubleshooting

### Connection Issues

**Problem**: Can't connect to Spectacles

**Solutions**:
- Ensure Spectacles are charged and powered on
- Check Bluetooth is enabled on iPhone
- Verify app has Bluetooth permissions
- Try forgetting and re-pairing device
- Check Xcode console for error messages

### Message Sync Issues

**Problem**: Messages not appearing in AR

**Solutions**:
- Verify AR mode is activated (button shows "AR Active")
- Check that messages exist within 500m radius
- Monitor console for sync errors
- Test with fewer messages first
- Verify Location permissions are granted

### Positioning Issues

**Problem**: Messages appear in wrong locations

**Solutions**:
- Ensure GPS accuracy is high (< 10m)
- Wait for GPS to stabilize (30 seconds)
- Recalibrate compass (figure-8 motion)
- Test in open area (not urban canyon)
- Check coordinate transformation logic

### Performance Issues

**Problem**: Lag or slow updates

**Solutions**:
- Reduce max messages to 30
- Increase batch interval to 10 seconds
- Disable real-time subscriptions temporarily
- Test BLE connection quality
- Monitor CPU/memory usage

## 📚 Additional Resources

- [Spectacles Developer Documentation](https://docs.snap.com/spectacles)
- [Lens Studio Documentation](https://docs.snap.com/lens-studio)
- [Mobile Kit API Reference](https://docs.snap.com/spectacles/mobile-kit)
- [Location API Guide](https://docs.snap.com/spectacles/location-api)
- [Capacitor Plugin Development](https://capacitorjs.com/docs/plugins)

## 🎯 Next Steps

After completing this setup:

1. **User Testing**: Recruit beta testers with Spectacles
2. **Performance Tuning**: Optimize based on real-world usage
3. **Feature Expansion**:
   - Add voice commands (via Interaction Kit)
   - Implement hand gestures for interactions
   - Add AR filters/effects to messages
   - Support live streaming in AR
4. **App Store Submission**: Update app description with AR features

## 💡 Tips

- **Start Simple**: Test with 5-10 messages before scaling up
- **Use Simulation**: Web implementation is great for UI development
- **Monitor Battery**: BLE can drain battery if not optimized
- **Test Outdoors**: GPS accuracy is better in open areas
- **Iterate Quickly**: Use Lens Studio's live preview

---

**Created for Lo - Location-Based Social Platform**
**Spectacles AR Integration - Version 1.0**
**Last Updated**: 2025-01-08
