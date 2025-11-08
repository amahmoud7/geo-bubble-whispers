# App Bulletproofing Guide

## Critical Fixes Applied (Nov 8, 2025)

### Issue: Blank Screen on iOS Device
**Root Cause:** Missing error boundaries allowed provider initialization errors to crash the entire app silently.

### Fixes Applied:

#### 1. **Added Error Boundaries** ✅
- **Location:** `src/App.tsx`
- **Change:** Wrapped entire app with `<ErrorBoundary>`
- **Impact:** Any React errors now show user-friendly error screen instead of blank white screen
- **Result:** App can recover from errors gracefully

```typescript
// BEFORE (DANGEROUS):
return (
  <QueryClientProvider>
    <AuthProvider>
      {/* App could crash here with blank screen */}
    </AuthProvider>
  </QueryClientProvider>
);

// AFTER (SAFE):
return (
  <ErrorBoundary>
    <QueryClientProvider>
      <AuthProvider>
        {/* Errors caught and displayed */}
      </AuthProvider>
    </ErrorBoundary>
  </ErrorBoundary>
);
```

#### 2. **Fixed Spectacles Auto-Connect** ✅
- **Location:** `src/App.tsx` line 117
- **Change:** `autoConnect={true}` → `autoConnect={false}`
- **Reason:** Auto-connecting to non-existent Spectacles hardware was blocking app startup
- **Impact:** App starts immediately, Spectacles connect manually when needed

#### 3. **Added Nested Error Boundary for Spectacles** ✅
- **Location:** Around `<SpectaclesProvider>`
- **Change:** Isolated Spectacles with dedicated error boundary
- **Result:** Even if Spectacles fails completely, rest of app works

#### 4. **Fixed iOS Viewport** ✅
- **Location:** `index.html`
- **Change:** Added `viewport-fit=cover` and iOS-specific meta tags
- **Impact:** Proper safe area rendering on notched iPhones

---

## Prevention Checklist: Don't Break the App Again!

### Before Adding ANY New Feature:

#### ✅ 1. Error Boundary Coverage
- [ ] Is the new component wrapped in ErrorBoundary?
- [ ] Does it have a fallback UI if it fails?
- [ ] Can the app function if this feature is broken?

```typescript
// GOOD:
<ErrorBoundary fallback={<div>Feature unavailable</div>}>
  <NewFeature />
</ErrorBoundary>

// BAD:
<NewFeature /> // Can crash entire app
```

#### ✅ 2. Context Provider Safety
- [ ] Does the provider handle initialization errors?
- [ ] Does it have try/catch around async initialization?
- [ ] Does autoConnect default to `false`?
- [ ] Is there a loading/error state?

```typescript
// GOOD:
useEffect(() => {
  const init = async () => {
    try {
      await initializeFeature();
    } catch (err) {
      console.error('Non-fatal error:', err);
      // App continues working
    }
  };
  init();
}, []);

// BAD:
useEffect(() => {
  initializeFeature(); // Can throw and crash
}, []);
```

#### ✅ 3. Import Verification
- [ ] Do all imports actually exist?
- [ ] Are there circular dependencies?
- [ ] Run `npm run build` before committing

```bash
# ALWAYS run before committing:
npm run build
npx cap sync ios
```

#### ✅ 4. Console Logging
- [ ] Added debug logs for initialization?
- [ ] Logs show what's happening?
- [ ] Errors are logged, not just thrown?

```typescript
// GOOD:
console.log('🎯 Feature initializing...');
try {
  await setup();
  console.log('✅ Feature ready');
} catch (err) {
  console.error('❌ Feature failed:', err);
  // Graceful degradation
}

// BAD:
await setup(); // Silent failure
```

---

## Safe Development Patterns

### Pattern 1: Defensive Context Initialization

```typescript
export const MySafeProvider: React.FC<{children}> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Timeout protection
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Init timeout')), 5000)
        );

        await Promise.race([initializeFeature(), timeout]);
        setIsReady(true);
      } catch (err) {
        console.error('Feature init failed:', err);
        setError(err as Error);
        // App continues without feature
      }
    };

    init();
  }, []);

  // Provide degraded service if initialization failed
  const value = error
    ? getMockService() // Fallback implementation
    : getRealService();

  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
};
```

### Pattern 2: Lazy Loading with Error Boundaries

```typescript
const FeaturePage = lazy(() =>
  import('./pages/Feature')
    .catch(err => {
      console.error('Failed to load Feature page:', err);
      // Return error component instead of crashing
      return { default: () => <ErrorPage error="Failed to load page" /> };
    })
);

// Usage:
<Suspense fallback={<Loading />}>
  <ErrorBoundary fallback={<ErrorPage />}>
    <FeaturePage />
  </ErrorBoundary>
</Suspense>
```

### Pattern 3: Optional Features

```typescript
// For features that aren't critical:
{isFeatureEnabled && (
  <ErrorBoundary fallback={null}>
    <OptionalFeature />
  </ErrorBoundary>
)}

// If feature crashes, fallback={null} means nothing renders
// App continues working perfectly
```

---

## Testing Before iOS Deploy

### 1. Browser Test
```bash
npm run dev
# Open http://localhost:8080
# Check console for errors
```

### 2. Build Test
```bash
npm run build
# Should complete without TypeScript errors
```

### 3. iOS Sync
```bash
npx cap sync ios
# Should sync without errors
```

### 4. Xcode Console Check
- Build and run on device
- Open Debug Console (Cmd+Shift+C)
- Look for:
  - ❌ Red errors (fatal)
  - ⚠️ Yellow warnings (investigate)
  - ✅ Green success messages

---

## Common Mistakes to Avoid

### ❌ DON'T: Add providers without error handling
```typescript
// BAD:
<NewProvider autoConnect={true}>
  <App />
</NewProvider>
```

### ✅ DO: Wrap and protect
```typescript
// GOOD:
<ErrorBoundary>
  <NewProvider autoConnect={false}>
    <App />
  </NewProvider>
</ErrorBoundary>
```

### ❌ DON'T: Import non-existent modules
```typescript
// BAD:
import { feature } from './does-not-exist';
```

### ✅ DO: Verify imports exist
```bash
# Check file exists before importing:
ls src/features/my-feature.ts
```

### ❌ DON'T: Assume hardware is available
```typescript
// BAD:
await connectToSpectacles(); // Crashes if no hardware
```

### ✅ DO: Check availability first
```typescript
// GOOD:
if (Capacitor.isNativePlatform()) {
  try {
    await connectToSpectacles();
  } catch (err) {
    console.warn('Spectacles not available');
    // App works without it
  }
}
```

---

## File Change Tracking

Keep this list updated when modifying critical files:

### App Initialization Chain:
1. `index.html` - HTML entry, viewport settings
2. `src/main.tsx` - React root, error handlers
3. `src/App.tsx` - Context providers, routing
4. `src/contexts/*.tsx` - All context providers

### Critical Rules:
- **ALWAYS** wrap new providers with ErrorBoundary
- **ALWAYS** test in browser before iOS deploy
- **ALWAYS** check Xcode console after deploy
- **NEVER** enable autoConnect without testing
- **NEVER** commit without running `npm run build`

---

## Recovery Procedures

### If App Shows Blank Screen:

1. **Check Xcode Console** for errors
2. **Verify last changes** with `git diff`
3. **Test in browser** with `npm run dev`
4. **Rebuild** with `npm run build && npx cap sync ios`
5. **Revert if needed**: `git checkout -- src/App.tsx`

### If Build Fails:

1. **Read error message** carefully
2. **Check imports** exist
3. **Verify dependencies**: `npm install`
4. **Clear cache**: `rm -rf dist node_modules && npm install`

---

## Version History

### Nov 8, 2025 - Critical Bulletproofing
- Added top-level ErrorBoundary
- Fixed Spectacles autoConnect
- Added iOS viewport fix
- Isolated Spectacles with nested ErrorBoundary

**Result:** App now resilient to initialization errors and renders on iOS ✅

---

## Checklist Before Every Commit

- [ ] Run `npm run build` - succeeds without errors
- [ ] Check `git status` - know what changed
- [ ] Test in browser - no console errors
- [ ] Review changes - added error handling?
- [ ] Test on iOS device - app launches?
- [ ] Check Xcode console - no fatal errors?
- [ ] Update this doc if adding providers

**Remember:** A few minutes of defensive coding prevents hours of debugging blank screens! 🛡️
