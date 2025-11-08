# Google Maps API Key - iOS Configuration

## Current Issue

The app shows `InvalidKeyMapError` because the Google Maps API key is not configured to allow the iOS app.

**Current Key:** `AIzaSyBFw0Qbyq9zTFTd-tUY6dQVgbT6kB_B6yQ`

---

## Fix Steps

### 1. Go to Google Cloud Console

https://console.cloud.google.com/apis/credentials

### 2. Find Your API Key

Look for the key: `AIzaSyBFw0Qbyq9zTFTd...`

### 3. Configure iOS Restrictions

1. Click on the API key
2. Under **Application restrictions**, select **iOS apps**
3. Click **Add an item**
4. Enter your iOS Bundle ID: `com.geobubblewhispers.app`
5. Click **Done**
6. Click **Save**

### 4. Enable Required APIs

Make sure these APIs are enabled:
- ✅ Maps JavaScript API
- ✅ Places API
- ✅ Geocoding API (if using address lookups)

### 5. Wait for Propagation

Changes can take a few minutes to propagate. Usually it's instant, but can take up to 5 minutes.

---

## Alternative: Create iOS-Specific Key

You can also create a separate API key just for iOS:

1. Click **Create Credentials** → **API Key**
2. Click **Restrict Key**
3. Name it: "Google Maps - iOS"
4. Under **Application restrictions**, select **iOS apps**
5. Add bundle ID: `com.geobubblewhispers.app`
6. Under **API restrictions**, select:
   - Maps JavaScript API
   - Places API
7. Click **Save**

### Then Update .env.local:

```bash
VITE_GOOGLE_MAPS_API_KEY_IOS=your-new-ios-key-here
```

---

## Verify It Works

After configuring:

1. Clean build in Xcode: `Cmd + Shift + K`
2. Rebuild and run: `Cmd + R`
3. Check the map loads without errors
4. Console should show: `✅ Google Maps API loaded successfully`

---

## Troubleshooting

### Still getting InvalidKeyMapError?

1. **Check Bundle ID matches exactly:** `com.geobubblewhispers.app`
2. **Wait 5 minutes** for Google's changes to propagate
3. **Clear app data:** Delete app from device and reinstall
4. **Check billing:** Make sure billing is enabled on the Google Cloud project

### Map loads but is gray/blank?

- This means the key is working but Maps JavaScript API isn't enabled
- Go to: https://console.cloud.google.com/apis/library
- Search for "Maps JavaScript API"
- Click **Enable**

---

## Current Configuration

**Location:** `.env.development`
**Key:** `AIzaSyBFw0Qbyq9zTFTd-tUY6dQVgbT6kB_B6yQ`
**Platform:** Used for both web and iOS (needs iOS bundle ID restriction added)

---

## Security Note

The current key should have these restrictions:
- **HTTP referrers** for web: `localhost:8080`, `localhost:5173`, your production domain
- **iOS apps** for mobile: `com.geobubblewhispers.app`

This prevents unauthorized use of your API key.
