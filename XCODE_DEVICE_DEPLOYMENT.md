# Xcode Device Deployment Guide

## Project Status
✅ **Build completed successfully**  
✅ **Capacitor synced to iOS**  
✅ **Xcode workspace opened**  
✅ **All 13 Capacitor plugins loaded**

## Xcode Project Location
```
/Users/akrammahmoud/geo-bubble-whispers/geo-bubble-whispers/ios/App/App.xcworkspace
```

## Step-by-Step Deployment to Physical Device

### 1. Connect Your iPhone
- Connect your iPhone 16 Pro Max to your Mac via USB cable
- Unlock your iPhone
- If prompted on iPhone, tap **Trust** this computer

### 2. Select Your Device in Xcode

Once Xcode opens:

1. **Wait for indexing to complete** (you'll see a progress indicator at the top)
2. **Click the device selector** at the top left (next to the Play/Stop buttons)
3. **Select your iPhone** from the list (it will show your iPhone's name)
   - It should appear under "iOS Devices"
   - Example: "Akram's iPhone 16 Pro Max"

### 3. Configure Signing & Capabilities

**IMPORTANT**: This step is required for physical device deployment

1. In Xcode, click on **"App"** in the left sidebar (the blue project icon)
2. Select the **"App" target** in the main panel
3. Click the **"Signing & Capabilities"** tab
4. Under **"Team"**, select your Apple ID / Developer account
   - If you don't see your account:
     - Click "Add an Account..."
     - Sign in with your Apple ID
     - You don't need a paid developer account for testing on your own device
5. **Check "Automatically manage signing"**
6. Xcode will automatically create a provisioning profile

### 4. Update Bundle Identifier (If Needed)

Still in **Signing & Capabilities**:

1. Look at the **Bundle Identifier**: `app.lo.social`
2. If you see signing errors, you may need to change it slightly:
   - Example: `app.lo.social.test` or `com.yourname.lo`
3. This is only needed if someone else is already using `app.lo.social`

### 5. Build and Run on Device

1. **Press the Play button** (▶️) or press `Cmd + R`
2. Xcode will:
   - Build the project
   - Install the app on your iPhone
   - Launch the app automatically
3. **First time only**: You'll need to trust the developer certificate on your iPhone:
   - On your iPhone, go to **Settings → General → VPN & Device Management**
   - Tap your Apple ID under "Developer App"
   - Tap **Trust "Your Apple ID"**
   - Return to home screen and launch Lo app

### 6. Expected App Behavior

When the app launches on your iPhone:

1. **Native splash screen appears** (2 seconds)
2. **Web splash screen with Lo logo animation** (2.5 seconds)
3. **Permission requests appear**:
   - 📷 Camera access
   - 🎤 Microphone access
   - 📍 Location access
4. **App loads to Home screen** with the map

### 7. Debugging (If Issues Occur)

**View Console Logs:**
1. In Xcode, click **View → Debug Area → Show Debug Area** (or press `Cmd + Shift + Y`)
2. You'll see all console logs from the app
3. Look for:
   - ✅ "Supabase connected successfully"
   - ✅ "Native splash screen hidden"
   - ⚠️ Any warnings or errors

**Common Issues:**

**Issue: "Failed to verify code signature"**
- Solution: Go to Settings & Capabilities, re-select your Team

**Issue: "Unable to install app"**
- Solution: Delete the app from your iPhone if it exists, then try again

**Issue: "iPhone is busy"**
- Solution: Wait for Xcode to finish preparing the device (shows at top of Xcode)

**Issue: App crashes on launch**
- Solution: Check Debug console for error messages
- Make sure you accepted all permissions on first launch

**Issue: Map not loading**
- Solution: Verify Google Maps API key is configured
- Check console for API errors

**Issue: Black screen after splash**
- Solution: Check Debug console for initialization errors
- App should load within 4 seconds even with network issues

### 8. Plugins Loaded (Verified)

Your app has these Capacitor plugins ready:
- ✅ @capacitor/app - App lifecycle
- ✅ @capacitor/browser - In-app browser
- ✅ @capacitor/camera - Camera & photo library
- ✅ @capacitor/device - Device information
- ✅ @capacitor/geolocation - GPS location
- ✅ @capacitor/haptics - Vibration feedback
- ✅ @capacitor/keyboard - Keyboard handling
- ✅ @capacitor/local-notifications - Local notifications
- ✅ @capacitor/network - Network status
- ✅ @capacitor/push-notifications - Push notifications
- ✅ @capacitor/share - Native share sheet
- ✅ @capacitor/splash-screen - Native splash screen (NEW!)
- ✅ @capacitor/status-bar - Status bar styling

### 9. Testing Checklist

Once the app is running on your device, test:

**Startup & Splash:**
- [ ] Native splash appears immediately
- [ ] Smooth transition to web splash
- [ ] Logo animation plays correctly
- [ ] App loads within 4 seconds
- [ ] No black screens or freezes

**Permissions:**
- [ ] Permission dialog appears after splash
- [ ] All three permissions listed (Camera, Mic, Location)
- [ ] Can grant all permissions
- [ ] Can skip permissions
- [ ] App loads after granting/skipping

**Core Features:**
- [ ] Map loads and displays correctly
- [ ] Can see current location on map
- [ ] Can create a new post
- [ ] Camera works when creating post
- [ ] Location is captured correctly
- [ ] Bottom navigation works

**Events Feature (NEW!):**
- [ ] Click Events button in top right
- [ ] Events toggle shows
- [ ] Events load from Ticketmaster & Eventbrite
- [ ] Events appear as pins on map
- [ ] Can click event pin to see details
- [ ] "Exit" button clears events

**Performance:**
- [ ] App feels responsive
- [ ] No lag when scrolling map
- [ ] Smooth animations
- [ ] No crashes or freezes

### 10. Quick Rebuild Commands

If you make changes and want to rebuild:

```bash
# In terminal, from project root:
cd /Users/akrammahmoud/geo-bubble-whispers/geo-bubble-whispers

# Rebuild web assets
npm run build

# Sync to iOS
npx cap sync ios

# Xcode will automatically reload the changes
# Just press the Play button again in Xcode
```

### 11. Xcode Shortcuts

Useful keyboard shortcuts:
- `Cmd + R` - Build and Run
- `Cmd + .` - Stop running app
- `Cmd + Shift + K` - Clean Build Folder (if issues occur)
- `Cmd + B` - Build only (don't run)
- `Cmd + Shift + Y` - Show/Hide Debug Console
- `Cmd + 0` - Show/Hide Navigator (left sidebar)

### 12. Viewing Device Logs

To see detailed iOS logs:
1. **Window → Devices and Simulators** in Xcode
2. Select your connected iPhone
3. Click **"Open Console"** button
4. You'll see all system and app logs in real-time

### 13. Taking Screenshots for Testing

To take screenshots from Xcode:
1. While app is running on device
2. **Debug → Take Screenshot** or `Cmd + S`
3. Screenshots save to Desktop automatically

### 14. Network Debugging

If you need to debug API calls:
1. Enable **Network Link Conditioner** on your iPhone:
   - Settings → Developer → Network Link Conditioner
   - Test with "3G" or "Edge" to simulate slow networks
2. This helps verify the app's 3-second timeout works correctly

### 15. Handling Updates

After making code changes:

**Small changes (UI, logic):**
```bash
npm run build && npx cap sync ios
# Then just press Play in Xcode
```

**Plugin or config changes:**
```bash
npm run build
npx cap sync ios
# Clean build in Xcode: Cmd + Shift + K
# Then build: Cmd + B
```

**Major changes (dependencies):**
```bash
npm install
npm run build
cd ios/App
pod install
cd ../..
npx cap sync ios
# Then rebuild in Xcode
```

## What's New in This Build

### Eventbrite Web Scraper
- Fetches local events without API key
- Combines with Ticketmaster events
- Shows events on map when Events button toggled

### Splash Screen Fix
- Fixed app initialization timeout issue
- Native splash screen properly hidden
- Smooth animations and transitions
- Guaranteed 4-second max startup time

### Performance Improvements
- Non-blocking initialization
- Better error handling
- Optimized plugin loading
- Faster startup on slow networks

## Troubleshooting Advanced Issues

### Issue: CocoaPods Problems
```bash
cd ios/App
pod deintegrate
pod install
cd ../..
npx cap sync ios
```

### Issue: Derived Data Corruption
1. Xcode → Preferences → Locations
2. Click arrow next to Derived Data path
3. Delete the `DerivedData` folder
4. Rebuild in Xcode

### Issue: Provisioning Profile Errors
1. Xcode → Preferences → Accounts
2. Select your Apple ID
3. Click "Download Manual Profiles"
4. Return to Signing & Capabilities and re-select Team

### Issue: App Size Too Large
The built app should be around 50-60MB. If larger:
- Check that you're using Release configuration
- Verify bitcode is disabled (it should be)
- Check for any large assets in the project

## Production Deployment (Future)

When ready to deploy to App Store:

1. **Change configuration to Release**:
   - Product → Scheme → Edit Scheme
   - Change "Build Configuration" to "Release"

2. **Archive the app**:
   - Product → Archive
   - Upload to App Store Connect

3. **Use production Capacitor config**:
   ```bash
   cp capacitor.config.prod.ts capacitor.config.ts
   npm run build
   npx cap sync ios
   ```

## Support Resources

- **Capacitor Docs**: https://capacitorjs.com/docs/ios
- **Xcode Help**: Help → Xcode Help in menu bar
- **Apple Developer**: https://developer.apple.com/support/

## Summary

✅ **Status**: Ready to test on device  
✅ **Xcode**: Opened and ready  
✅ **Build**: Successful  
✅ **Plugins**: All 13 loaded  
✅ **Splash**: Fixed and working  
✅ **Events**: Eventbrite scraper integrated  

**Next Steps**: Follow steps 1-6 above to deploy to your iPhone!

---

**Happy Testing! 🚀📱**
