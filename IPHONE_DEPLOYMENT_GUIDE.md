# iPhone 16 Pro Max Deployment Guide

## Prerequisites

Before deploying to your iPhone 16 Pro Max, ensure you have:

1. **Xcode 15+** installed (required for iOS 17+ support)
2. **Apple Developer Account** (free account works for personal device testing)
3. **USB-C cable** to connect your iPhone 16 Pro Max to your Mac
4. **Node.js and npm** installed (already confirmed ✓)
5. **Capacitor CLI** installed (already confirmed ✓)

## Step-by-Step Deployment Process

### Step 1: Build the Web App

First, create a production build of your web application:

```bash
# From the project root directory
npm run build
```

This creates optimized production files in the `dist/` directory.

### Step 2: Sync with Capacitor iOS

Copy the built web assets to the iOS project:

```bash
# Sync the web build with iOS
npx cap sync ios
```

This command:
- Copies web assets from `dist/` to the iOS app
- Updates iOS dependencies
- Syncs Capacitor plugins

### Step 3: Prepare Your iPhone

1. **Enable Developer Mode** on your iPhone 16 Pro Max:
   - Go to Settings → Privacy & Security
   - Scroll down to "Developer Mode"
   - Toggle it ON
   - Restart your device when prompted
   - Enter your passcode to enable

2. **Trust Your Computer**:
   - Connect your iPhone to your Mac via USB-C
   - Unlock your iPhone
   - Tap "Trust" when prompted
   - Enter your device passcode

### Step 4: Open in Xcode

```bash
# Open the iOS project in Xcode
npx cap open ios
```

### Step 5: Configure Xcode for Device Deployment

1. **Select Your Device**:
   - In Xcode, click the device selector (next to the app name)
   - Choose your iPhone 16 Pro Max from the list
   - If not visible, ensure it's connected and trusted

2. **Configure Signing**:
   - Select the "App" project in the navigator
   - Go to "Signing & Capabilities" tab
   - Enable "Automatically manage signing"
   - Select your Team (your Apple ID)
   - If no team, click "Add an Account" and sign in with your Apple ID

3. **Update Bundle Identifier** (if needed):
   - Change to something unique like: `com.yourname.geobubblewhispers`
   - This prevents conflicts with existing apps

### Step 6: Build and Run on Device

1. **Clean Build Folder** (recommended):
   - In Xcode: Product → Clean Build Folder (⇧⌘K)

2. **Build and Run**:
   - Click the ▶️ (Play) button in Xcode
   - Or press ⌘R

3. **First-time Setup**:
   - You may see "Untrusted Developer" error on first launch
   - On your iPhone: Settings → General → VPN & Device Management
   - Tap your developer profile
   - Tap "Trust [Your Name]"
   - Tap "Trust" again to confirm

### Step 7: Troubleshooting Common Issues

#### Issue: "Failed to register bundle identifier"
**Solution**: Change the bundle identifier in Xcode to something unique

#### Issue: "No account for team"
**Solution**: Add your Apple ID in Xcode → Settings → Accounts

#### Issue: "Device not available"
**Solution**: 
- Ensure Developer Mode is enabled
- Reconnect USB-C cable
- Restart Xcode

#### Issue: "Untrusted Developer"
**Solution**: Trust your developer certificate in iPhone Settings (see Step 6.3)

#### Issue: Build fails with "signing certificate" error
**Solution**: 
- Xcode → Settings → Accounts → Manage Certificates
- Click "+" to create a new certificate

### Step 8: App Permissions

When the app launches, it will request:
- **Location Services**: Required for map functionality
- **Camera Access**: For photo/video posts and livestreaming
- **Microphone Access**: For video recording and livestreaming

Make sure to allow these permissions for full functionality.

## Quick Deploy Script

For future deployments, use this quick script:

```bash
#!/bin/bash
# Save as deploy-ios.sh and run with: bash deploy-ios.sh

echo "🔨 Building web app..."
npm run build

echo "📱 Syncing with iOS..."
npx cap sync ios

echo "🎯 Opening Xcode..."
npx cap open ios

echo "✅ Ready to deploy! Press ▶️ in Xcode to run on your device"
```

## Testing Checklist

Once deployed, test these features:
- [ ] Map loads and shows current location
- [ ] Can create public/private Lo posts
- [ ] Photo/video upload works
- [ ] Livestream camera access works
- [ ] Events toggle shows/hides properly
- [ ] List view tabs (Public/Following/Events) work
- [ ] Bottom navigation works correctly
- [ ] All modals open/close properly

## Production Notes

For App Store release (future):
1. Create an App Store Connect account
2. Generate production certificates
3. Create App Store provisioning profile
4. Archive and upload through Xcode

## Need Help?

If you encounter issues:
1. Check Xcode console for error messages
2. Ensure all prerequisites are met
3. Try cleaning build folder and rebuilding
4. Restart both Xcode and your iPhone if needed

---

**Last Updated**: August 2024
**Tested on**: iPhone 16 Pro Max, iOS 17+, Xcode 15+