# Google Auth Fix - Mobile App Configuration

## Problem Solved
Fixed issue where Google Sign-In redirected mobile users to external webapp instead of staying in the Lo app.

## What Changed

### Code Changes
**File**: `src/hooks/useAuth.tsx`

Added platform detection to automatically route OAuth requests:
- **Mobile (iOS/Android)**: Uses native OAuth with custom URL scheme
- **Web (Browser)**: Uses standard web OAuth with browser redirect

### How It Works

```
┌─────────────────────────────────────────────────────┐
│ User Clicks "Sign in with Google"                   │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ Platform Detection  │
        └─────────┬───────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
    ┌────────┐        ┌────────┐
    │ Mobile │        │  Web   │
    └────┬───┘        └───┬────┘
         │                │
         ▼                ▼
   Native OAuth      Web OAuth
   In-App Browser    Browser Tab
         │                │
         ▼                ▼
   Custom Scheme     Web Redirect
   com.geobubble    window.location
   whispers.app://  .origin/auth
         │                │
         └────────┬───────┘
                  │
                  ▼
          ✅ Authenticated
```

## Critical Configuration Required

### Supabase Dashboard Setup

⚠️ **IMPORTANT**: You must add mobile redirect URLs to Supabase or mobile authentication will fail!

#### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to: https://app.supabase.com/project/YOUR_PROJECT_ID
   - Click: **Authentication** → **URL Configuration**

2. **Add Mobile Redirect URLs**
   
   In the "Redirect URLs" section, add:
   ```
   com.geobubblewhispers.app://auth
   com.geobubblewhispers.app://auth/callback
   ```

3. **Keep Existing Web URLs**
   
   Keep these for web authentication:
   ```
   https://yourdomain.com/auth
   http://localhost:8080/auth
   http://localhost:8081/auth
   ```

4. **Save Changes**
   - Click "Save" at the bottom of the page

#### Visual Reference:
```
┌───────────────────────────────────────────────────────┐
│ Supabase Dashboard → Authentication → URL Config      │
├───────────────────────────────────────────────────────┤
│                                                        │
│ Site URL:                                             │
│ https://yourdomain.com                                │
│                                                        │
│ Redirect URLs (one per line):                        │
│ ┌──────────────────────────────────────────────────┐ │
│ │ https://yourdomain.com/auth                      │ │
│ │ http://localhost:8080/auth                       │ │
│ │ http://localhost:8081/auth                       │ │
│ │ com.geobubblewhispers.app://auth          ← ADD  │ │
│ │ com.geobubblewhispers.app://auth/callback ← ADD  │ │
│ └──────────────────────────────────────────────────┘ │
│                                                        │
│ [Save]                                                │
└───────────────────────────────────────────────────────┘
```

### Why This Is Required

Supabase validates OAuth redirect URLs for security. Without adding the mobile URLs:
- Mobile OAuth will fail with: `redirect_uri_mismatch` error
- Users will see: "Error 400: redirect_uri_mismatch"
- Authentication cannot complete

## Testing

### Web Testing (No Changes)
1. Open app in browser: `http://localhost:8080`
2. Click "Sign in with Google"
3. ✅ Should work as before (opens Google in same tab)
4. ✅ Redirects to `/auth` then `/home`

### Mobile Testing (iOS)
1. Build and run app on iOS device or simulator
2. Click "Sign in with Google"
3. ✅ Opens in-app browser (NOT external Safari)
4. ✅ Authenticate with Google account (e.g., toogtobe@gmail.com)
5. ✅ Returns to Lo app automatically
6. ✅ Shows home screen (not external webapp)
7. ✅ User is authenticated and can use app

### Mobile Testing (Android)
Same flow as iOS testing.

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Cause**: Mobile redirect URLs not added to Supabase
**Fix**: Follow "Supabase Dashboard Setup" section above

### Error: "OAuth popup was closed"
**Cause**: User canceled authentication
**Fix**: This is expected behavior - no action needed

### Mobile app opens external Safari
**Cause**: Platform detection not working or build issue
**Fix**: 
1. Verify app is built with Capacitor
2. Check console logs for "Using native OAuth" message
3. Rebuild iOS/Android app

### Web authentication not working
**Cause**: Accidentally broke web flow
**Fix**: 
1. Check browser console for errors
2. Verify `window.location.origin` is correct
3. Check Supabase redirect URLs include web URLs

## Technical Details

### Files Modified
- ✅ `src/hooks/useAuth.tsx` - Added platform detection and routing

### Files Used (No Changes)
- ✅ `src/services/nativeAuth.ts` - Native OAuth implementation
- ✅ `src/services/platform.ts` - Platform detection utilities
- ✅ `src/components/auth/login/SocialLoginButtons.tsx` - UI component

### Platform Detection
Uses `@capacitor/core` to detect platform:
- `PlatformService.isNative()` - Returns true for iOS/Android
- `PlatformService.isWeb()` - Returns true for browser
- `PlatformService.getPlatform()` - Returns 'ios', 'android', or 'web'

### OAuth Flow

#### Mobile Flow:
1. User clicks "Sign in with Google"
2. `useAuth.signInWithGoogle()` detects native platform
3. Calls `nativeAuthService.signInWithGoogle()`
4. Opens Google OAuth in Capacitor Browser
5. User authenticates
6. Google redirects to: `com.geobubblewhispers.app://auth?access_token=...`
7. iOS/Android captures custom URL scheme
8. `nativeAuthService` parses tokens
9. Sets Supabase session
10. Navigates to `/home`

#### Web Flow:
1. User clicks "Sign in with Google"
2. `useAuth.signInWithGoogle()` detects web platform
3. Calls Supabase OAuth with `window.location.origin/auth`
4. Opens Google OAuth in same tab
5. User authenticates
6. Google redirects to: `https://yourdomain.com/auth?access_token=...`
7. `AuthCallback` component parses URL
8. Sets Supabase session
9. Navigates to `/home`

## Rollback

If issues occur:

1. **Revert Code Changes**:
   ```bash
   git checkout HEAD -- src/hooks/useAuth.tsx
   ```

2. **Remove Mobile URLs from Supabase** (optional):
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Remove the two mobile URLs added

3. **Users Can Still Use Email/Password**:
   - Email/password authentication unaffected
   - Only Google/Apple OAuth impacted

## Success Metrics

### Before Fix
- ❌ Mobile users redirected to external webapp
- ❌ Lost app context
- ❌ Poor user experience
- ❌ Confusion about "which app to use"

### After Fix
- ✅ Mobile users stay in Lo app
- ✅ Seamless OAuth flow
- ✅ Consistent experience across platforms
- ✅ No external redirects

## Next Steps

1. ✅ Code changes applied
2. ⚠️ **YOU MUST**: Add mobile URLs to Supabase Dashboard
3. 🧪 Test on iOS device with real Google account
4. 🧪 Test on web browser to ensure no regression
5. 📱 Deploy updated app to TestFlight/App Store

## Support

If authentication issues persist:
1. Check Supabase redirect URLs are configured
2. Verify iOS custom URL scheme in Info.plist
3. Check console logs for platform detection
4. Verify Capacitor plugins are installed:
   - `@capacitor/browser`
   - `@capacitor/app`
   - `@capacitor/core`

---

**Date**: January 2025  
**Status**: ✅ Implemented  
**Impact**: Critical - Fixes mobile authentication  
**Breaking Changes**: None (backward compatible)
