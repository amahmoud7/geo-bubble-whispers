# Lo App Testing Guide

## 🚀 Quick Start

The app is ready to test! Here are the steps:

### 1. Run Database Migration (if needed)
```bash
# Apply the new social features migration
supabase migration up
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open in Browser
Navigate to `http://localhost:8080`

## 🆕 New Features to Test

### Liquid Glass UI
- All UI elements now have beautiful glass morphism effects
- Check buttons, modals, and overlays for the new liquid glass design

### AR View for Messages
1. Click the **camera icon** in the top-right header
2. Allow camera permissions when prompted
3. Point camera around to see nearby messages in AR
4. Works best on mobile devices

### Push Notifications
1. Click the **bell icon** in the top-right header
2. Allow notification permissions
3. Create messages in different locations
4. Move around to test proximity notifications

### Social Features

#### Message Reactions
1. Create or view any message
2. Click the heart icon to see reaction options
3. Select emoji reactions (❤️😂✨🔥👍)
4. Watch real-time reaction updates

#### Follow System
1. View other users' profiles
2. Click "Follow" button
3. Check followers/following counts
4. See mutual follow indicators

#### Trending Locations
1. Click the **trending icon** (📈) in header
2. View hot spots with activity levels
3. Click locations to navigate on map
4. See real-time trending updates

#### Message Tags
1. When creating messages, add tags
2. Use predefined tags (Food, Event, Music, etc.)
3. Create custom tags
4. Filter messages by tags

## 🔧 Development Commands

```bash
# Development server
npm run dev

# Build for testing
npm run build:dev

# Run linter (cleaned up)
npm run lint

# Type checking
npx tsc --noEmit
```

## 📱 Mobile Testing

### iOS (Capacitor)
```bash
# Build and deploy to iOS simulator
npm run deploy:ios
```

### Web Mobile
- Open dev tools and use mobile device simulation
- Test camera permissions and device orientation for AR

## 🌍 Environment Setup

Make sure you have:
- ✅ Supabase configured and running
- ✅ Google Maps API key set
- ✅ Camera permissions for AR testing
- ✅ Location permissions for notifications

## 🐛 Common Issues

### Camera not working in AR view
- Ensure you're using HTTPS or localhost
- Check browser camera permissions
- Test on physical mobile device for best results

### Notifications not appearing
- Check browser notification permissions
- Ensure location services are enabled
- Test by creating messages nearby

### Build errors
- Run `npm install` if dependencies are missing
- Check that all migrations are applied
- Verify environment variables are set

## 📊 Performance Notes

- Bundle size: ~2.4MB (optimized for development)
- Liquid Glass UI uses CSS backdrop-filter (modern browsers)
- AR requires WebRTC camera support
- Push notifications need service worker support

## 🎯 Key Test Scenarios

1. **Social Interaction Flow**:
   - Create account → Follow users → React to messages → View trending

2. **AR Experience**:
   - Enable camera → Place messages → View in AR → Navigate to locations

3. **Notification System**:
   - Enable notifications → Move around → Receive proximity alerts

4. **Cross-device Testing**:
   - Test on mobile and desktop
   - Verify responsive liquid glass UI
   - Check camera/GPS functionality

Happy testing! 🎉