# Spectacles AR Invocation Flow - Complete Guide

## 🎯 Your Desired Flow

```
1. User puts on Spectacles hardware
2. User opens Lo app on phone
3. User taps designated button on Home page
4. App checks if Spectacles is nearby (proximity detection)
5. App verifies Spectacles is connected to same device (pairing verification)
6. App activates AR lens on Spectacles
7. AR UI appears in Spectacles showing Lo posts
```

---

## 🔍 Current Implementation

### Step-by-Step Breakdown

**1. Physical Setup**
```
User Action: Put on Spectacles hardware
Hardware State: Spectacles powered on, Bluetooth active
```

**2. App Opens**
```javascript
// In App.tsx (line 116)
<SpectaclesProvider autoConnect={false}>
  // autoConnect=false means manual connection required
```

**3. User Taps Glasses Icon 👓**
```typescript
// Location: Top-right of Home page, next to Events toggle
// File: src/pages/Home.tsx (line 159-161)

<SpectaclesToggle
  className="animate-fade-in scale-90"
/>
```

**4. Connection Process Begins**
```typescript
// In SpectaclesToggle.tsx handleToggle() (line 55-74)

if (!isConnected) {
  // STEP 1: Discovery
  console.log('[SpectaclesToggle] Connecting to Spectacles...');

  // STEP 2: Proximity Check (BLE signal strength)
  // STEP 3: Device Verification (saved device ID)
  const success = await connect();

  if (success) {
    // Connected! Show confirmation
    toast({
      title: '👓 Spectacles Connected!',
      description: 'Tap again to activate AR mode',
    });
  }
}
```

**5. AR Mode Activation**
```typescript
// User taps button again (line 75-84)

else if (!isARModeActive) {
  setARModeActive(true);

  toast({
    title: '✨ AR Mode Active',
    description: 'Lo posts are now visible in your Spectacles',
  });
}
```

**6. Message Sync**
```typescript
// Automatic via useSpectaclesSync hook
// File: src/hooks/useSpectaclesSync.ts

useEffect(() => {
  if (isConnected && isARModeActive) {
    // Filter messages within 500m
    // Transform to AR coordinates
    // Batch and send to Spectacles
    syncMessages();
  }
}, [isConnected, isARModeActive, messages]);
```

**7. AR Lens Activation (on Spectacles)**
```typescript
// On Spectacles hardware via Lens Studio
// File: Lens Studio - LoARController.ts

onMessagesReceived(messagesJson: string) {
  this.messages = JSON.parse(messagesJson);

  // Render AR bubbles at calculated positions
  this.messages.forEach(msg => {
    this.positionMessageBubble(msg.id, msg.position);
  });
}
```

---

## ✅ How the Checks Work

### 1. **Proximity Detection** (Is Spectacles Nearby?)

**Method**: Bluetooth Low Energy (BLE) signal strength

```swift
// In SpectaclesBridge.swift (to be implemented with SDK)

func connect(_ call: CAPPluginCall) {
    // BLE automatically scans for nearby devices
    // Signal strength (RSSI) indicates distance:
    // - Strong signal (-40 to -60 dBm) = Very close (< 1 meter)
    // - Medium signal (-60 to -80 dBm) = Nearby (1-5 meters)
    // - Weak signal (-80 to -100 dBm) = Far (5-10 meters)
    // - No signal = Not in range

    bondingManager?.scanForDevices { devices in
        // Filters by signal strength automatically
        let nearbySpectacles = devices.filter { $0.rssi > -80 }

        if nearbySpectacles.isEmpty {
            call.reject("No Spectacles nearby")
        } else {
            // Proceed with connection
        }
    }
}
```

**User Feedback**:
- ✅ Spectacles in range → Connection proceeds
- ❌ Spectacles too far → "Move closer to your Spectacles"
- ❌ Spectacles off → "Turn on your Spectacles"

### 2. **Device Verification** (Same Device?)

**Method**: Device ID matching

```swift
// In SpectaclesBridge.swift

private var lastKnownDeviceId: String?

func connect(_ call: CAPPluginCall) {
    // Load saved device ID from UserDefaults
    if let savedDeviceId = UserDefaults.standard.string(forKey: "lo_spectacles_device_id") {
        lastKnownDeviceId = savedDeviceId

        // Verify scanned device matches saved device
        reconnectToDevice(savedDeviceId) { success in
            if success {
                // Same device verified ✅
                call.resolve(["connected": true, "deviceId": savedDeviceId])
            } else {
                // Different device or not found
                // Prompt user to pair new device
                self.startPairing(call)
            }
        }
    } else {
        // First time - no saved device
        startPairing(call)
    }
}
```

**User Feedback**:
- ✅ Known device found → Auto-connects
- ⚠️ Different device → "New Spectacles detected. Pair?"
- ❌ No device → "Looking for Spectacles..."

### 3. **AR Lens Invocation** (Activate AR UI)

**Method**: Lens ID targeting

```swift
// In SpectaclesBridge.swift

func connect(_ call: CAPPluginCall) {
    bondingManager?.bind(lensId: "lo-ar-view") { result in
        switch result {
        case .success(let session):
            // Spectacles now loads "lo-ar-view" lens
            // Lens becomes active and ready to receive data
            self.session = session

        case .failure(let error):
            call.reject("Failed to activate AR lens")
        }
    }
}
```

**What Happens on Spectacles**:
1. Spectacles receives `bind(lensId: "lo-ar-view")` command
2. Hardware loads the Lo AR View lens from storage
3. Lens initializes (starts Location API, renders base UI)
4. Lens sends "ready" signal back to phone
5. Phone starts syncing messages
6. User sees AR UI appear in Spectacles display

---

## 🎨 Enhanced Button with Pre-Flight Checks

Here's an improved version that shows explicit checks to the user:

```typescript
// Enhanced SpectaclesToggle.tsx

const handleToggle = async () => {
  if (isProcessing || isPairing) return;
  setIsProcessing(true);

  try {
    if (!isConnected) {
      // PHASE 1: Pre-flight checks
      toast({
        title: '🔍 Checking for Spectacles',
        description: 'Looking for nearby devices...',
        duration: 2000,
      });

      // Step 1: Check Bluetooth permissions
      const hasBluetoothPermission = await checkBluetoothPermission();
      if (!hasBluetoothPermission) {
        throw new Error('Bluetooth permission denied');
      }

      // Step 2: Proximity scan
      const nearbyDevices = await scanForNearbySpectacles();
      if (nearbyDevices.length === 0) {
        toast({
          title: '📡 No Spectacles Found',
          description: 'Make sure Spectacles are on and nearby',
          variant: 'destructive',
          duration: 4000,
        });
        return;
      }

      // Step 3: Device verification
      toast({
        title: '✓ Spectacles Detected',
        description: 'Verifying device pairing...',
        duration: 2000,
      });

      const isKnownDevice = await verifyDevicePairing();
      if (!isKnownDevice) {
        toast({
          title: '⚠️ New Device Detected',
          description: 'Tap to pair with these Spectacles',
          duration: 4000,
        });
        // Proceed with pairing flow
      }

      // PHASE 2: Connection
      const success = await connect();

      if (success) {
        toast({
          title: '👓 Spectacles Connected!',
          description: 'Tap again to activate AR mode',
          duration: 3000,
        });
      }

    } else if (!isARModeActive) {
      // PHASE 3: AR activation with checks
      toast({
        title: '🚀 Activating AR Mode',
        description: 'Loading AR lens on Spectacles...',
        duration: 2000,
      });

      // Verify connection is still active
      const status = await getConnectionStatus();
      if (!status.connected) {
        throw new Error('Connection lost');
      }

      // Verify lens is available
      const lensReady = await verifyLensAvailable('lo-ar-view');
      if (!lensReady) {
        toast({
          title: '⚠️ AR Lens Not Found',
          description: 'Please push the Lo AR View lens to your Spectacles',
          variant: 'destructive',
          duration: 5000,
        });
        return;
      }

      // Activate AR mode
      setARModeActive(true);

      toast({
        title: '✨ AR Mode Active',
        description: 'Look around to see Lo posts in AR!',
        duration: 3000,
      });

    } else {
      // Deactivate AR mode
      setARModeActive(false);
      toast({
        title: '📱 Map Mode',
        description: 'AR mode deactivated',
        duration: 2000,
      });
    }

  } catch (err) {
    console.error('[SpectaclesToggle] Error:', err);

    toast({
      title: '❌ Connection Error',
      description: err.message || 'Failed to connect to Spectacles',
      variant: 'destructive',
      duration: 4000,
    });
  } finally {
    setIsProcessing(false);
  }
};
```

---

## 🔧 Implementing Additional Helper Functions

Add these to `SpectaclesBridge.swift`:

```swift
// Check if Spectacles is nearby (proximity detection)
@objc func scanForNearbySpectacles(_ call: CAPPluginCall) {
    guard let bondingManager = bondingManager else {
        call.reject("Bonding manager not initialized")
        return
    }

    bondingManager.scanForDevices(timeout: 5.0) { devices in
        // Filter by signal strength (RSSI)
        let nearbyDevices = devices.filter { $0.rssi > -80 } // Within ~5 meters

        let deviceList = nearbyDevices.map { device in
            return [
                "id": device.identifier,
                "name": device.name ?? "Spectacles",
                "rssi": device.rssi,
                "distance": self.estimateDistance(rssi: device.rssi)
            ]
        }

        call.resolve([
            "devices": deviceList,
            "count": deviceList.count
        ])
    }
}

// Verify device pairing
@objc func verifyDevicePairing(_ call: CAPPluginCall) {
    guard let savedDeviceId = UserDefaults.standard.string(forKey: "lo_spectacles_device_id") else {
        call.resolve(["isKnown": false, "deviceId": nil])
        return
    }

    guard let deviceId = call.getString("deviceId") else {
        call.reject("Device ID required")
        return
    }

    let isKnown = deviceId == savedDeviceId

    call.resolve([
        "isKnown": isKnown,
        "savedDeviceId": savedDeviceId
    ])
}

// Verify AR lens is available
@objc func verifyLensAvailable(_ call: CAPPluginCall) {
    guard let lensId = call.getString("lensId") else {
        call.reject("Lens ID required")
        return
    }

    // Query Spectacles for available lenses
    session?.queryLenses { lenses in
        let isAvailable = lenses.contains { $0.id == lensId }

        call.resolve([
            "available": isAvailable,
            "lensId": lensId
        ])
    }
}

// Estimate distance from RSSI signal strength
private func estimateDistance(rssi: Int) -> String {
    switch rssi {
    case -50...0:
        return "Very close (< 1m)"
    case -70...(-51):
        return "Nearby (1-3m)"
    case -80...(-71):
        return "Medium (3-5m)"
    default:
        return "Far (> 5m)"
    }
}
```

---

## 📱 Complete User Journey

### **Scenario: First-Time Connection**

```
1. User Action: Put on Spectacles, power on
2. User Action: Open Lo app
3. App State: Shows 👓 button (gray, "Connect")

4. User Action: Tap 👓 button
5. App Action: "🔍 Checking for Spectacles..."
6. App Action: BLE scan (5 seconds)

7. Check Result: Spectacles found nearby ✅
8. App Action: "✓ Spectacles Detected"
9. App Action: "⚠️ New Device - Tap to pair"

10. User Action: Tap 👓 button again to confirm pairing
11. Spectacles Action: Vibrates (pairing confirmation)
12. App Action: Saves device ID
13. App State: Shows 👓 button (green, "AR Mode")

14. User Action: Tap 👓 button to activate AR
15. App Action: "🚀 Activating AR Mode..."
16. App Action: Verify lens availability
17. Spectacles Action: Loads "Lo AR View" lens
18. App Action: "✨ AR Mode Active"
19. App Action: Syncs nearby messages

20. Spectacles Display: AR UI appears with Lo posts
21. User: Sees messages overlaid on real world 🎉
```

### **Scenario: Returning User**

```
1. User Action: Put on Spectacles, power on
2. User Action: Open Lo app

3. App State: Auto-detects saved device ID
4. App State: Shows 👓 button (green, "Connected")
   (if autoConnect=true in SpectaclesProvider)

5. User Action: Tap 👓 button once
6. App Action: "✨ AR Mode Active"
7. Spectacles Display: AR UI appears immediately
```

---

## 🎛️ Configuration Options

### Option 1: Manual Connection (Current)

```typescript
// In App.tsx
<SpectaclesProvider autoConnect={false}>
```

**Behavior**: User must tap button to connect

**Best for**: Battery saving, explicit user control

### Option 2: Auto-Connect

```typescript
// In App.tsx
<SpectaclesProvider autoConnect={true}>
```

**Behavior**: App auto-connects when Spectacles detected

**Best for**: Seamless UX, returning users

### Option 3: Background Monitoring

```typescript
// Enhanced SpectaclesProvider with background scan

useEffect(() => {
  // Monitor for Spectacles in background
  const interval = setInterval(async () => {
    if (!isConnected) {
      const devices = await scanForNearbySpectacles();
      if (devices.length > 0) {
        // Show notification: "Spectacles detected - tap to connect"
      }
    }
  }, 30000); // Every 30 seconds

  return () => clearInterval(interval);
}, [isConnected]);
```

**Behavior**: Proactive notifications

**Best for**: Convenience, hands-free setup

---

## 🚨 Error Handling

### Common Scenarios

**1. Spectacles Not Found**
```
Cause: Out of range, powered off, or already paired to another device
Solution: "Move closer" or "Turn on Spectacles"
```

**2. Connection Lost Mid-Session**
```
Cause: BLE timeout, Spectacles battery died, out of range
Solution: Auto-reconnect with toast notification
```

**3. AR Lens Not Available**
```
Cause: Lens not pushed to Spectacles yet
Solution: "Push 'Lo AR View' lens via Lens Studio"
```

**4. Different Device Detected**
```
Cause: User has multiple Spectacles, or sharing with friend
Solution: "Pair with new device?" confirmation dialog
```

---

## 🎯 Recommended Implementation

For your use case (explicit checks before invocation), I recommend:

1. **Use the enhanced button with pre-flight checks** (shown above)
2. **Add proximity indicator** (show signal strength: Weak/Medium/Strong)
3. **Add device name display** (e.g., "John's Spectacles")
4. **Add AR lens status** (Not installed / Ready / Active)

This gives users full visibility into the connection process and makes it clear when AR can be invoked.

---

## 🛠️ Next Steps to Implement

1. **Enhance Swift Plugin** with proximity and verification methods
2. **Update TypeScript Interface** to expose new methods
3. **Enhance SpectaclesToggle** with pre-flight check UI
4. **Add Connection Debug Panel** (dev mode) to show:
   - Signal strength (RSSI)
   - Device ID
   - Lens availability
   - Battery level

Would you like me to implement any of these enhancements?
