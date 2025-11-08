# Debug: Black Screen Issue

## Problem
Home screen shows black screen - no map or UI appears.

## What I Did
1. ✅ Added extensive debug logging to track map initialization
2. ✅ Enhanced error messages and loading states  
3. ✅ Rebuilt the app with debugging enabled
4. ✅ Synced to iOS

## Next Steps: Check Xcode Console

### 1. Open Xcode Console (if not already open)
```
Cmd + Shift + Y
```
Or: View → Debug Area → Activate Console

### 2. Run the App Again
- In Xcode, press ▶️ Play button (or Cmd+R)
- App will install and launch on your device
- **Watch the console for log messages**

### 3. Look for These Debug Messages

#### ✅ Good Signs (What we want to see):
```
🗺️ EnhancedMapContext initializing...
🗺️ API key: AIza... (20 chars shown)
🗺️ API key length: 39
🗺️ Environment: production
✅ Google Maps API loaded successfully via EnhancedMapContext
🗺️ RobustMapView: { isLoaded: true, loadError: undefined, initError: undefined }
✅ Map is ready to render
```

#### ❌ Bad Signs (Errors to look for):
```
🚨 CRITICAL: Google Maps API key is missing!
🚨 Check your .env.local file
🚨 Google Maps load error: [error message]
⚠️ Map is taking longer than expected to load (>10s)
```

### 4. Common Issues & Solutions

#### Issue 1: "API key is missing"
**Console shows:**
```
🗺️ API key: Missing
🗺️ API key length: 0
🚨 CRITICAL: Google Maps API key is missing!
```

**Solution:**
The environment variables weren't embedded in the build. This means:
- The `.env.production` file has the key
- But Vite didn't include it during `npm run build`

**Fix:**
```bash
# Check if API key is in .env.production
cat .env.production | grep VITE_GOOGLE_MAPS_API_KEY

# If it's there, rebuild ensuring env vars are loaded:
npm run build

# Then sync again:
npx cap sync ios
```

#### Issue 2: "Maps JavaScript API failed to load"
**Console shows:**
```
🚨 Map load error: [Google Maps error message]
```

**Possible causes:**
1. **API Key restrictions** - The key is restricted to specific bundle IDs
2. **API not enabled** - Maps JavaScript API isn't enabled in Google Cloud
3. **Billing not set up** - Google Cloud project doesn't have billing enabled
4. **Invalid key** - The API key format is wrong

**Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your API key
3. Click "Edit"
4. Under "Application restrictions":
   - Select "iOS apps"
   - Add bundle ID: `app.lo.social`
5. Under "API restrictions":
   - Ensure "Maps JavaScript API" is enabled
   - Ensure "Maps SDK for iOS" is enabled
6. Save and wait 5 minutes for changes to propagate
7. Rebuild and sync

#### Issue 3: Map loads but shows black screen
**Console shows:**
```
✅ Google Maps API loaded successfully
✅ Map is ready to render
```

But screen is still black.

**Possible causes:**
1. CSS issue hiding the map
2. React rendering issue
3. Z-index problem

**Fix:**
Tell me the console output and I'll investigate further.

### 5. Send Me the Console Logs

Take a screenshot or copy the console output that includes:
- Lines starting with 🗺️ (map logs)
- Lines starting with 🚨 (errors)
- Lines starting with ⚠️ (warnings)
- Any red error messages

Share the logs and I'll diagnose the exact issue.

### 6. Quick Test Commands

While the app is running, you can also check:

**In Xcode Console, type:**
```javascript
// Check if Google Maps loaded
window.google?.maps
// Should show object if loaded

// Check environment
import.meta.env.VITE_GOOGLE_MAPS_API_KEY  
// Should show your API key
```

---

## Alternative: Test in Safari on Mac First

If Xcode debugging is difficult, we can test in the browser first:

```bash
# Start dev server
npm run dev

# Open http://localhost:8080 in Safari
# Open Safari Console (Cmd+Option+C)
# Look for same debug messages
```

This will help us see if it's an iOS-specific issue or a general problem.

---

## Summary

**I've added extensive debug logging**. The console will now tell us exactly where the map initialization is failing:

1. Is the API key loading?
2. Is Google Maps API loading?
3. Is the map component rendering?

**Run the app in Xcode and share the console output** - that will tell us exactly what's wrong and how to fix it.
