# Lo App - iPhone 16 Pro Max Deployment

## ✅ Completed Steps
1. ✓ Built production version of Lo app
2. ✓ Synced with iOS using Capacitor
3. ✓ Opened project in Xcode

## 📱 Next Steps in Xcode

### 1. Connect Your iPhone 16 Pro Max
- Connect via USB-C cable
- Unlock your iPhone
- Trust this computer when prompted

### 2. Select Your Device in Xcode
- At the top of Xcode, click on "Any iOS Device"
- Select your "iPhone 16 Pro Max" from the dropdown
- If not visible, ensure it's connected and trusted

### 3. Configure Code Signing
In Xcode:
1. Click on "App" in the project navigator (left panel)
2. Select "App" target
3. Go to "Signing & Capabilities" tab
4. Check "Automatically manage signing"
5. Team dropdown: Select your Apple ID
   - If no team exists, click "Add an Account" and sign in

### 4. Update Bundle Identifier (Important!)
- Change from `app.lo.social` to something unique like:
  - `com.akram.lo.app` or
  - `com.yourname.lo`
- This prevents conflicts and ensures uniqueness

### 5. Build and Deploy

#### First Time Setup on iPhone:
1. **Enable Developer Mode** (if not already enabled):
   - Settings → Privacy & Security → Developer Mode → ON
   - Restart device when prompted

2. **Run the App**:
   - Press the ▶️ Play button in Xcode (or ⌘R)
   - Wait for build to complete

3. **Trust Developer Certificate** (first time only):
   - If you see "Untrusted Developer" on your iPhone:
   - Go to Settings → General → VPN & Device Management
   - Find your developer profile
   - Tap "Trust [Your Name]"
   - Confirm by tapping "Trust" again

### 6. App Should Now Launch! 🎉

## 🔍 What to Test on Device

### Core Features:
- [ ] **Map View**: Loads with current location
- [ ] **Lo Post Button**: Opens creation modal
- [ ] **Camera Access**: Works for photos/videos
- [ ] **Livestream**: Camera and mic access work
- [ ] **Events Toggle**: Shows/hides event markers
- [ ] **List View**: Public/Following/Events tabs work
- [ ] **Bottom Navigation**: All buttons responsive

### Permissions (will prompt on first use):
- Location Services (for map)
- Camera (for posts/livestream)
- Microphone (for video/livestream)

## 🔧 Troubleshooting

### "Failed to register bundle identifier"
→ Change bundle ID to something unique in Signing & Capabilities

### "Could not launch App"
→ Trust developer certificate in Settings (see step 5.3)

### "No Devices Available"
→ Enable Developer Mode on iPhone and reconnect

### Build Failed
→ Clean Build Folder (Shift+Cmd+K) and try again

## 🚀 Future Updates

To deploy updates:
```bash
# 1. Make your code changes
# 2. Build and sync
npm run build
npx cap sync ios

# 3. In Xcode, just press Play (⌘R)
```

## 📝 Notes
- **App Name**: Lo
- **Bundle ID**: (update to your unique ID)
- **Version**: 1.0.0
- **Minimum iOS**: 13.0
- **Tested On**: iPhone 16 Pro Max, iOS 17+

---

Ready to test Lo on your iPhone 16 Pro Max! 🎊