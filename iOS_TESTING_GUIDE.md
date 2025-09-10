# 📱 Lo iOS Device Testing Guide

## ✅ Setup Complete!

Your Lo app is now synced to Xcode and ready for device testing. Xcode should already be open with your project.

## 🔧 In Xcode - Device Setup

### 1. **Select Your Device**
- In Xcode, click the device dropdown next to the play button
- Select your connected iPhone/iPad
- Make sure your device is unlocked and trusted

### 2. **Set Development Team** (if needed)
- Select the "App" target in the project navigator
- Go to "Signing & Capabilities" tab
- Choose your Apple Developer account under "Team"
- Xcode will automatically manage signing

### 3. **Build & Run**
- Click the **Play** button (▶️) or press `Cmd+R`
- App will install and launch on your device

## 🆕 New Features to Test on Device

### 📷 **AR View (Camera Icon)**
**Best Feature to Test on Physical Device!**
1. Tap camera icon in top-right corner
2. Allow camera permissions
3. Hold device up and move around
4. See messages overlaid in real world through camera
5. Test device rotation and movement

### 🔔 **Push Notifications (Bell Icon)**  
1. Tap bell icon in header
2. Allow notification permissions
3. Allow location permissions ("While Using App")
4. Move to different locations
5. Create messages to trigger proximity notifications

### 🎨 **Liquid Glass UI**
- Check all glass morphism effects work smoothly
- Test scrolling and interactions
- Verify animations are smooth on device

### 🏷️ **Social Features**
- **Reactions**: Tap heart on messages, select emojis
- **Trending**: Tap trending icon to see hot locations
- **Following**: Follow other users and see counts
- **Tags**: Add tags when creating messages

## 🚨 Permission Requests

The app will request these permissions (all updated for new features):

1. **Camera**: "Lo needs access to your camera to take photos, videos, and use AR view to see messages around you"
2. **Location**: "Lo uses your location to tag posts, show nearby content, and send notifications for messages near you"
3. **Notifications**: "Lo sends notifications about nearby messages and social interactions"
4. **Motion**: "Lo uses device motion sensors to provide accurate AR viewing of messages" (for AR accuracy)

**Important**: Allow all permissions for full feature testing!

## 📍 Testing Locations

### AR View Testing:
1. Go to an open area (good lighting)
2. Create a few test messages at different locations
3. Use AR view to see them positioned in real space
4. Walk around to test distance calculations

### Notification Testing:
1. Enable notifications
2. Create messages at current location
3. Walk away (50+ meters)
4. Come back - should get proximity notification

## 🐛 Troubleshooting

### Build Errors:
- Check development team is selected
- Ensure device is unlocked and trusted
- Try cleaning build folder (Product → Clean Build Folder)

### AR View Not Working:
- Ensure good lighting
- Check camera permissions are granted
- Try landscape orientation
- Physical device works better than simulator

### Notifications Not Appearing:
- Check notification permissions in iOS Settings
- Ensure location services are enabled
- Make sure app is allowed to send notifications

### Performance Issues:
- Close other apps
- Restart device if needed
- Monitor in Xcode's debug navigator for memory/CPU usage

## 📊 What to Monitor

- **AR Performance**: Smooth camera view, accurate message positioning
- **Battery Usage**: AR and location features can be intensive
- **Memory Usage**: Check in Xcode debug navigator
- **Network**: Supabase real-time sync performance

## 🎯 Key Device-Specific Tests

1. **Device Rotation**: Test AR in portrait/landscape
2. **Background/Foreground**: Test notification delivery
3. **GPS Accuracy**: Compare map location with actual position
4. **Camera Quality**: AR overlay clarity and performance
5. **Touch Responsiveness**: Glass UI interactions

## 🔄 Updating Code

When you make changes:
```bash
npm run build
npx cap sync ios
```
Then rebuild in Xcode.

## 🌟 Best Testing Experience

- **Use on iPhone in good lighting for AR**
- **Enable all permissions for full experience** 
- **Test in different locations for full social features**
- **Try with multiple users for social interactions**

Happy testing on your device! 🚀📱