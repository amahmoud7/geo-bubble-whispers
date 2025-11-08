# Google Auth Fix - Quick Start Guide

## ✅ What Was Fixed
Mobile users signing in with Google (e.g., toogtobe@gmail.com) will now stay in the Lo app instead of being redirected to an external webapp.

---

## 🚨 CRITICAL: Required Configuration

### Before Testing, You MUST Configure Supabase!

**Without this step, mobile authentication will fail with `redirect_uri_mismatch` error.**

#### Steps:

1. **Open Supabase Dashboard**
   ```
   https://app.supabase.com/project/YOUR_PROJECT_ID/auth/url-configuration
   ```

2. **Add These Two URLs to "Redirect URLs"**:
   ```
   com.geobubblewhispers.app://auth
   com.geobubblewhispers.app://auth/callback
   ```

3. **Click Save**

That's it! Your mobile authentication will now work.

---

## 📱 Testing on iPhone/iPad

### Build and Run:
```bash
# 1. Build the web assets
npm run build

# 2. Sync to iOS
npx cap sync ios

# 3. Open in Xcode
npx cap open ios

# 4. Build and run on device/simulator
```

### Test Flow:
1. Launch Lo app on iOS
2. Tap "Sign in with Google"
3. ✅ In-app browser opens (not Safari)
4. ✅ Sign in with Google account
5. ✅ Returns to Lo app automatically
6. ✅ Home screen appears - you're signed in!

---

## 🌐 Testing on Web

### Run Dev Server:
```bash
npm run dev
```

### Test Flow:
1. Open http://localhost:8080 in browser
2. Click "Sign in with Google"
3. ✅ Google OAuth opens in same tab
4. ✅ Sign in with Google account
5. ✅ Redirects to `/auth` then `/home`
6. ✅ You're signed in!

---

## 🔍 Verification

### Check Console Logs:

**Mobile (Expected)**:
```
Using native OAuth for Google on ios
OAuth callback received: com.geobubblewhispers.app://auth?access_token=...
OAuth success! User: {...}
```

**Web (Expected)**:
```
Using web OAuth for Google
```

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
- ❌ **Cause**: Mobile URLs not added to Supabase
- ✅ **Fix**: Add `com.geobubblewhispers.app://auth` to Supabase redirect URLs

### Opens External Safari (iOS)
- ❌ **Cause**: App not running as native Capacitor app
- ✅ **Fix**: Make sure to build with `npx cap sync ios` and run from Xcode

### Web Auth Broken
- ❌ **Cause**: Web URLs removed from Supabase
- ✅ **Fix**: Keep these URLs in Supabase:
  - `http://localhost:8080/auth`
  - `https://yourdomain.com/auth`

---

## 📦 What Was Changed

### Files Modified:
- ✅ `src/hooks/useAuth.tsx` - Platform-aware OAuth
- ✅ `vite.config.ts` - Capacitor package handling
- ✅ `package.json` - Added `@capacitor/browser`

### How It Works:
```typescript
// Detects if user is on mobile or web
if (PlatformService.isNative()) {
  // Mobile: Use custom URL scheme
  await nativeAuthService.signInWithGoogle();
} else {
  // Web: Use standard OAuth
  await supabase.auth.signInWithOAuth({...});
}
```

---

## ⚡ Quick Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Run web dev server
npm run dev

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

---

## 📞 Support

If you see errors:
1. Check console logs for platform detection
2. Verify Supabase redirect URLs are configured
3. Ensure Capacitor plugins installed: `@capacitor/browser`, `@capacitor/app`
4. Check `GOOGLE_AUTH_FIX.md` for detailed troubleshooting

---

## ✨ Success!

When working correctly:
- ✅ Mobile users: In-app OAuth, smooth experience
- ✅ Web users: Standard OAuth, no changes
- ✅ No external redirects
- ✅ Consistent authentication flow

---

**Last Updated**: January 2025  
**Build Status**: ✅ Passing  
**Breaking Changes**: None
