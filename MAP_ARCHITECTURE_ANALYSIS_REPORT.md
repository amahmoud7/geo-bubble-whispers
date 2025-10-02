# Lo App Map View Architecture Analysis Report

## Executive Summary

The Lo app's map implementation is **fragile and prone to breakage** due to **multiple competing initialization systems**, **unclear state ownership**, **missing error boundaries**, and **tight coupling between components**. The architecture has grown organically with 23+ files directly using the Google Maps API, creating a web of dependencies that break easily when changes are made.

**Severity Assessment:** 🔴 **CRITICAL** - The current architecture is unsustainable and requires immediate refactoring.

---

## Current Architecture Overview

### Component Hierarchy Diagram

```
App.tsx
├── GoogleMapsProvider (Context)
│   └── useJsApiLoader (from @react-google-maps/api)
├── MapProvider (Context)
│   └── Stores map instance reference
│
└── Home.tsx
    └── MapView.tsx (419 lines - TOO LARGE)
        ├── useGoogleMapsLoader() - Gets isLoaded, loadError
        ├── useGoogleMap() - Creates SECOND map state
        ├── useMapContext() - Gets THIRD map reference
        ├── useMessages() - Fetches messages
        ├── usePinPlacement() - Pin placement logic
        ├── useUserLocation() - User location
        ├── useMessageState() - Message UI state
        │
        ├── GoogleMap (from @react-google-maps/api)
        │   ├── onLoad callback (3 different handlers!)
        │   └── onUnmount callback
        │
        ├── ModernMapControls
        │   └── Recreates SearchBox listener
        ├── StreetViewController
        │   └── useGoogleMap() again
        ├── MessageCreationController
        │   └── PlacementIndicator
        │   └── MessageMarkers
        │   └── CreateMessageModal
        ├── MessageDisplayController
        │   └── MessageMarkers
        │   └── MessageDetail
        ├── LiveStreamMarkers
        └── EventMarkers (OverlayView)
```

### Data Flow Diagram

```
Environment Variables (.env)
    ├── VITE_GOOGLE_MAPS_API_KEY
    ├── VITE_GOOGLE_MAPS_API_KEY_IOS
    └── VITE_GOOGLE_MAPS_API_KEY_ANDROID
           ↓
    src/utils/env.ts
    ├── getEnv() - Cached environment
    └── getGoogleMapsApiKey() - Platform-specific key
           ↓
    src/config/environment.ts
    └── Environment singleton (DUPLICATE!)
           ↓
    GoogleMapsContext.tsx
    └── useJsApiLoader() - Loads Google Maps
           ↓
    MapView.tsx
    ├── useGoogleMapsLoader() - Check if loaded
    ├── useGoogleMap() - Create map state (DUPLICATE!)
    └── useMapContext() - Store map reference (DUPLICATE!)
           ↓
    23+ Components using google.maps.*
```

---

## Critical Issues Identified

### 🔴 CRITICAL: Issue #1 - Multiple Competing Map State Systems

**Problem:** There are **THREE separate systems** managing the same Google Maps instance, causing race conditions and state inconsistencies.

**Evidence:**
1. **GoogleMapsContext** (lines 1-141) - Loads Google Maps API via `useJsApiLoader`
2. **useGoogleMap hook** (lines 1-209) - Creates its own map state: `const [map, setMap] = useState<google.maps.Map | null>(null)`
3. **MapContext** (lines 1-29) - ANOTHER map state: `const [map, setMap] = useState<google.maps.Map | null>(null)`

**In MapView.tsx:**
```typescript
// LINE 78: Gets map from MapContext
const { setMap: setMapInContext } = useMapContext();

// LINE 97: Gets map from useGoogleMap
const { map } = useGoogleMap();

// LINE 127-138: onLoad sets the map in BOTH places!
const onLoad = useCallback(
  (mapInstance: google.maps.Map) => {
    originalOnLoad(mapInstance);        // Sets in useGoogleMap
    setMapInContext(mapInstance);        // Sets in MapContext
    updateBoundsFromMap(mapInstance);
  },
  [originalOnLoad, setMapInContext, updateBoundsFromMap]
);
```

**Why This Breaks:**
- Changes to one state don't propagate to others
- Different components read from different sources
- No single source of truth
- Race conditions during initialization

**Severity:** 🔴 **CRITICAL**

---

### 🔴 CRITICAL: Issue #2 - No Proper Error Boundaries

**Problem:** Map errors are caught at the loader level, but there's no error boundary to prevent cascading failures.

**Evidence:**
```typescript
// MapView.tsx lines 233-253
if (loadError) {
  return <MapFallback ... />  // Good!
}

if (!isLoaded) {
  return <Loading ... />       // Good!
}

// BUT: No error boundary wrapping the GoogleMap component!
<GoogleMap ... />  // If this crashes, whole app breaks
```

**Missing Protection:**
- No React Error Boundary around map components
- No try-catch in useEffect hooks
- No fallback for marker rendering errors
- No protection against invalid coordinate data

**What Happens When It Breaks:**
1. User makes a code change
2. Map component throws error
3. Error bubbles up uncaught
4. Entire app white screens
5. No recovery mechanism

**Severity:** 🔴 **CRITICAL**

---

### 🔴 CRITICAL: Issue #3 - Fragile Initialization Sequence

**Problem:** Map initialization requires a specific sequence of steps that's not enforced or documented.

**Current Flow (Brittle):**
```
1. App mounts → GoogleMapsProvider initializes
2. useJsApiLoader starts loading Google Maps script
3. MapView renders while loading (shows spinner)
4. isLoaded becomes true
5. GoogleMap component mounts
6. onLoad callback fires
7. Map instance created
8. THREE different states updated
9. Bounds listener attached
10. SearchBox created
11. Street View listeners added
12. Event bus listeners attached
```

**Any interruption breaks the entire flow!**

**Evidence of Fragility:**
```typescript
// useGoogleMap.ts lines 14-77: Massive onLoad callback
const onLoad = useCallback((map: google.maps.Map) => {
  setMap(map);  // Step 1

  const streetViewControl = map.getStreetView();  // Step 2
  streetViewPanoramaRef.current = streetViewControl;  // Step 3

  streetViewControl.setOptions({ ... });  // Step 4

  streetViewControl.addListener('visible_changed', () => { ... });  // Step 5
  streetViewControl.addListener('position_changed', () => { ... });  // Step 6
  streetViewControl.addListener('click', (event) => { ... });  // Step 7
  streetViewControl.addListener('pano_changed', () => { ... });  // Step 8
}, []);

// If streetViewControl is null? No error handling!
// If listener fails? No retry logic!
// If event bus isn't ready? Silent failure!
```

**Severity:** 🔴 **CRITICAL**

---

### 🟠 HIGH: Issue #4 - Massive MapView Component (419 lines)

**Problem:** MapView.tsx is a god component doing too much, making it impossible to change safely.

**Responsibilities (Should be 1, has 12+):**
1. Google Maps loader state management
2. Map instance management
3. Street View state management
4. Message fetching and filtering
5. Event message handling
6. Live stream state management
7. Pin placement logic
8. User location tracking
9. Event bus subscriptions
10. Bounds update tracking
11. Ref imperative handles
12. Modal state management

**Evidence:**
```typescript
// MapView.tsx - All these hooks in ONE component!
const { userLocation } = useUserLocation();
const { filters, filteredMessages, addMessage, updateMessage, handleFilterChange, updateBounds } = useMessages();
const { events, eventsStartingSoon } = useEventMessages();
const { user } = useAuth();
const { setMap: setMapInContext } = useMapContext();
const { liveStreams } = useLiveStreams();
const { selectedMessage, setSelectedMessage, isCreating, setIsCreating, handleClose } = useMessageState();
const { map, isInStreetView, onLoad, onUnmount, onSearchBoxLoad } = useGoogleMap();
const { isLoaded, loadError, retry } = useGoogleMapsLoader();
const { newPinPosition, isPlacingPin, handleMapClick, startPinPlacement, endPinPlacement, setNewPinPosition } = usePinPlacement();
```

**Why This Breaks:**
- Any change to one feature affects all features
- Difficult to test in isolation
- Re-renders cascade through all hooks
- Impossible to reason about

**Severity:** 🟠 **HIGH**

---

### 🟠 HIGH: Issue #5 - Environment Variable Confusion

**Problem:** TWO separate systems for managing environment variables with different caching strategies.

**Evidence:**

**System 1: src/utils/env.ts**
```typescript
let cachedEnv: EnvSchema | null = null;

export const getEnv = () => {
  if (!cachedEnv) {
    cachedEnv = buildEnv();
  }
  return cachedEnv;
};

export const getGoogleMapsApiKey = (): string => {
  const env = getEnv();
  const platform = Capacitor.getPlatform();

  if (platform === "ios" && env.VITE_GOOGLE_MAPS_API_KEY_IOS) {
    return env.VITE_GOOGLE_MAPS_API_KEY_IOS;
  }
  // ... platform-specific logic
};
```

**System 2: src/config/environment.ts**
```typescript
class Environment {
  private static instance: Environment;
  private config: EnvironmentConfig;

  // DIFFERENT caching, DIFFERENT API
  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  public get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }
}
```

**Used Inconsistently:**
- GoogleMapsContext uses `getGoogleMapsApiKey()` from utils/env.ts
- Other parts use `environment.get('GOOGLE_MAPS_API_KEY')` from config/environment.ts
- No guarantee they return the same value!

**Severity:** 🟠 **HIGH**

---

### 🟠 HIGH: Issue #6 - SearchBox Listener Memory Leak

**Problem:** SearchBox listeners are created but cleanup is inconsistent.

**Evidence:**
```typescript
// useGoogleMap.ts lines 131-195
const onSearchBoxLoad = useCallback((ref: google.maps.places.SearchBox) => {
  setSearchBox(ref);

  const placesChangedListener = ref.addListener('places_changed', () => {
    // ... handler logic
  });

  // Return cleanup function
  return () => {
    if (placesChangedListener) {
      google.maps.event.removeListener(placesChangedListener);
    }
  };
}, [map]);  // ⚠️ Returns cleanup but WHO CALLS IT?
```

**Then in ModernMapControls.tsx:**
```typescript
// lines 31-42
React.useEffect(() => {
  if (!inputRef.current || !window.google?.maps?.places) {
    return;
  }

  const searchBox = new google.maps.places.SearchBox(inputRef.current);
  onSearchBoxLoad(searchBox);  // ⚠️ Cleanup function returned but IGNORED!

  return () => {
    google.maps.event.clearInstanceListeners(searchBox);  // Different cleanup!
  };
}, [onSearchBoxLoad]);
```

**Why This Breaks:**
- Listeners accumulate on re-renders
- Memory leaks grow over time
- Multiple listeners fire for same event
- Cleanup is inconsistent between hook and component

**Severity:** 🟠 **HIGH**

---

### 🟡 MEDIUM: Issue #7 - Duplicate Map Options

**Problem:** Map options are set in multiple places with potential conflicts.

**Evidence:**
```typescript
// config/mapStyles.ts lines 64-79
export const defaultMapOptions = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: false,
  draggable: true,
  scrollwheel: true,
  gestureHandling: 'greedy',
};

// MapView.tsx lines 129-133
const onLoad = useCallback((mapInstance: google.maps.Map) => {
  mapInstance.setOptions({
    gestureHandling: 'greedy',  // ⚠️ DUPLICATE!
    draggable: true,             // ⚠️ DUPLICATE!
    scrollwheel: true,           // ⚠️ DUPLICATE!
  });
  // ...
}, []);

// MapView.tsx line 292
<GoogleMap options={defaultMapOptions} />  // Already set here!
```

**Why This Can Break:**
- Options overwrite each other
- No single source of truth
- Changes in one place don't reflect in others
- Debugging is confusing

**Severity:** 🟡 **MEDIUM**

---

### 🟡 MEDIUM: Issue #8 - Event Bus Lacks Type Safety

**Problem:** Event bus allows any string event type, making refactoring dangerous.

**Evidence:**
```typescript
// eventBus.ts - Good type definitions
type AppEventMap = {
  refreshMessages: void;
  createMessage: void;
  messageCreated: { id: string };
  navigateToMessage: { lat: number; lng: number; messageId?: string };
  streetViewClick: { lat: number; lng: number };
  // ...
};

// But used inconsistently:
eventBus.emit('createMessage', undefined);  // ✅ Typed
eventBus.on('navigateToMessage', (detail) => { ... });  // ✅ Typed

// What if someone does:
eventBus.emit('createMesssage', undefined);  // ⚠️ Typo not caught!
```

**Why This Can Break:**
- Typos in event names cause silent failures
- No compile-time checking
- Hard to find all event usages
- Refactoring is risky

**Severity:** 🟡 **MEDIUM**

---

### 🟡 MEDIUM: Issue #9 - Bounds Update Race Condition

**Problem:** Bounds updates are debounced but can race with message fetches.

**Evidence:**
```typescript
// useMessages.ts lines 27-38
const FETCH_DEBOUNCE_MS = 350;
const boundsChanged = (current: MapBounds | null, next: MapBounds | null) => {
  // ... check if bounds changed enough
};

// MapView.tsx lines 160-165
useEffect(() => {
  if (!map) return;
  const idleListener = map.addListener('idle', () => updateBoundsFromMap(map));
  updateBoundsFromMap(map);  // ⚠️ Immediate call
  return () => idleListener.remove();
}, [map, updateBoundsFromMap]);

// Problem:
// 1. Map loads
// 2. updateBoundsFromMap called immediately (no debounce)
// 3. Messages fetch starts
// 4. User pans map
// 5. 'idle' event fires → updateBoundsFromMap (with debounce)
// 6. Messages fetch starts AGAIN
// 7. First fetch completes, sets messages
// 8. Second fetch completes, OVERWRITES messages
```

**Severity:** 🟡 **MEDIUM**

---

### 🟡 MEDIUM: Issue #10 - No Loading States for Markers

**Problem:** Messages render immediately without checking if coordinates are valid.

**Evidence:**
```typescript
// MessageMarkers.tsx lines 26-76
const MessageMarkers: React.FC<MessageMarkersProps> = ({ messages, onMessageClick }) => {
  return (
    <>
      {messages.map((message) => {
        // ⚠️ No check if google.maps is loaded!
        // ⚠️ No check if position is valid!
        return (
          <Marker
            key={message.id}
            position={{ lat: message.position.lat, lng: message.position.lng }}
            icon={{
              url: markerIcon,
              anchor: new google.maps.Point(anchorPoint, anchorPoint),  // ⚠️ Assumes google.maps exists!
              // ...
            }}
          />
        );
      })}
    </>
  );
};
```

**Why This Breaks:**
- If Google Maps isn't fully loaded, `new google.maps.Point()` throws
- Invalid coordinates cause marker to fail silently
- No loading skeleton for markers
- Users see blank map

**Severity:** 🟡 **MEDIUM**

---

## Root Cause Analysis

### Why Does the Map Break After Code Changes?

**Primary Root Causes:**

1. **No Single Source of Truth** - Three different map state systems compete for authority. A change to one doesn't update others, causing desynchronization.

2. **Tight Coupling** - 23+ files directly import and use `google.maps.*`, meaning any change to the Google Maps integration requires updating many files.

3. **Missing Contracts** - No clear interfaces defining what the map provides and what consumers need. Components reach into map internals directly.

4. **Lack of Defensive Programming** - No null checks, no error boundaries, no graceful degradation. One error cascades to total failure.

5. **Unclear Initialization Order** - No enforced sequence for map loading → instance creation → listener attachment → feature initialization.

6. **State Management Chaos** - Mixing hooks, contexts, event bus, and callbacks creates unpredictable update patterns.

### What Common Code Changes Break the Map?

**These changes WILL break the map:**

1. ✅ **Changing hook dependencies** - Because callbacks depend on stale closures
2. ✅ **Adding new map listeners** - Because cleanup is inconsistent
3. ✅ **Modifying onLoad callback** - Because three systems depend on it
4. ✅ **Changing environment variable names** - Because two systems load them
5. ✅ **Updating map options** - Because they're set in multiple places
6. ✅ **Adding new markers** - Because no check if google.maps is ready
7. ✅ **Changing message data structure** - Because no validation before rendering
8. ✅ **Modifying event bus events** - Because no type safety
9. ✅ **Changing context providers** - Because initialization order matters
10. ✅ **Adding new features to MapView** - Because component is too large

---

## Recommended Architecture Improvements

### 🎯 Priority 1: Single Map State System

**Consolidate into ONE authoritative source:**

```typescript
// src/contexts/MapContext.tsx (ENHANCED)
interface MapContextValue {
  // Core state
  map: google.maps.Map | null;
  isLoaded: boolean;
  error: Error | null;

  // Status
  isInitializing: boolean;

  // Actions
  initialize: () => Promise<void>;
  cleanup: () => void;
  retry: () => void;

  // Features (lazy loaded)
  streetView: StreetViewController | null;
  searchBox: SearchBoxController | null;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

export const MapProvider: React.FC = ({ children }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Google Maps API loading
  const { isLoaded: apiLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: getGoogleMapsApiKey(),
    libraries: ['places'],
  });

  const initialize = useCallback(async () => {
    try {
      setIsLoaded(true);
      // Initialization logic here
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  return (
    <MapContext.Provider value={{ map, isLoaded, error, initialize, ... }}>
      {children}
    </MapContext.Provider>
  );
};

// REMOVE: useGoogleMap hook (duplicate)
// REMOVE: Separate MapContext (duplicate)
```

**Benefits:**
- ✅ One source of truth
- ✅ Clear ownership
- ✅ Predictable updates
- ✅ Easy to debug

---

### 🎯 Priority 2: Add Error Boundaries

**Create map-specific error boundary:**

```typescript
// src/components/map/MapErrorBoundary.tsx
class MapErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Map Error:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <MapFallback
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

// Usage in Home.tsx:
<MapErrorBoundary>
  <MapView />
</MapErrorBoundary>
```

**Benefits:**
- ✅ Prevents app crashes
- ✅ Graceful error recovery
- ✅ Better user experience
- ✅ Error tracking

---

### 🎯 Priority 3: Extract Feature Controllers

**Break MapView into focused components:**

```typescript
// Current: MapView.tsx (419 lines)
// New structure:

// src/components/map/MapContainer.tsx (50 lines)
const MapContainer: React.FC = () => {
  const { map, isLoaded, error } = useMapContext();

  if (error) return <MapFallback error={error} />;
  if (!isLoaded) return <MapLoading />;

  return (
    <MapErrorBoundary>
      <GoogleMap map={map}>
        <MapFeatures />
      </GoogleMap>
    </MapErrorBoundary>
  );
};

// src/components/map/MapFeatures.tsx (100 lines)
const MapFeatures: React.FC = () => {
  return (
    <>
      <MessageLayer />
      <EventLayer />
      <LiveStreamLayer />
      <StreetViewLayer />
      <PinPlacementLayer />
    </>
  );
};

// src/components/map/layers/MessageLayer.tsx (50 lines)
const MessageLayer: React.FC = () => {
  const { filteredMessages } = useMessages();
  const { selectedMessage, onSelect } = useMessageSelection();

  return (
    <>
      <MessageMarkers messages={filteredMessages} onSelect={onSelect} />
      {selectedMessage && <MessageDetail message={selectedMessage} />}
    </>
  );
};

// Repeat for EventLayer, LiveStreamLayer, etc.
```

**Benefits:**
- ✅ Single responsibility per component
- ✅ Easy to test in isolation
- ✅ Clear dependencies
- ✅ Safe to modify

---

### 🎯 Priority 4: Standardize Environment Config

**Choose ONE system, enhance it:**

```typescript
// src/config/environment.ts (ENHANCED)
import { z } from 'zod';
import { Capacitor } from '@capacitor/core';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_GOOGLE_MAPS_API_KEY: z.string().min(1),
  VITE_GOOGLE_MAPS_API_KEY_IOS: z.string().optional(),
  VITE_GOOGLE_MAPS_API_KEY_ANDROID: z.string().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

class EnvironmentService {
  private static instance: EnvironmentService;
  private config: EnvConfig;

  private constructor() {
    const raw = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      VITE_GOOGLE_MAPS_API_KEY_IOS: import.meta.env.VITE_GOOGLE_MAPS_API_KEY_IOS,
      VITE_GOOGLE_MAPS_API_KEY_ANDROID: import.meta.env.VITE_GOOGLE_MAPS_API_KEY_ANDROID,
    };

    this.config = envSchema.parse(raw); // Throws on invalid env
  }

  static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService();
    }
    return EnvironmentService.instance;
  }

  getGoogleMapsApiKey(): string {
    const platform = Capacitor.getPlatform();

    if (platform === 'ios' && this.config.VITE_GOOGLE_MAPS_API_KEY_IOS) {
      return this.config.VITE_GOOGLE_MAPS_API_KEY_IOS;
    }

    if (platform === 'android' && this.config.VITE_GOOGLE_MAPS_API_KEY_ANDROID) {
      return this.config.VITE_GOOGLE_MAPS_API_KEY_ANDROID;
    }

    return this.config.VITE_GOOGLE_MAPS_API_KEY;
  }

  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config[key];
  }
}

export const env = EnvironmentService.getInstance();

// REMOVE: src/utils/env.ts (duplicate)
```

**Benefits:**
- ✅ One source of truth
- ✅ Runtime validation
- ✅ Type safety
- ✅ Clear API

---

### 🎯 Priority 5: Enforce Initialization Contract

**Define clear initialization sequence:**

```typescript
// src/hooks/useMapInitialization.ts
interface MapInitConfig {
  apiKey: string;
  libraries: string[];
  container: HTMLDivElement;
  center: google.maps.LatLngLiteral;
  zoom: number;
  options: google.maps.MapOptions;
}

interface MapInitResult {
  map: google.maps.Map;
  cleanup: () => void;
}

export const useMapInitialization = (config: MapInitConfig): MapInitResult | null => {
  const [result, setResult] = useState<MapInitResult | null>(null);

  useEffect(() => {
    const init = async () => {
      // Step 1: Ensure Google Maps is loaded
      if (!window.google?.maps) {
        throw new Error('Google Maps not loaded');
      }

      // Step 2: Create map instance
      const map = new google.maps.Map(config.container, {
        center: config.center,
        zoom: config.zoom,
        ...config.options,
      });

      // Step 3: Attach core listeners
      const listeners: google.maps.MapsEventListener[] = [];

      listeners.push(
        map.addListener('idle', () => {
          // Bounds update
        })
      );

      // Step 4: Initialize features
      const streetView = initializeStreetView(map);
      const searchBox = initializeSearchBox(map);

      // Step 5: Return result with cleanup
      const cleanup = () => {
        listeners.forEach(l => google.maps.event.removeListener(l));
        streetView?.cleanup();
        searchBox?.cleanup();
        google.maps.event.clearInstanceListeners(map);
      };

      setResult({ map, cleanup });
    };

    init().catch(error => {
      console.error('Map initialization failed:', error);
      setResult(null);
    });

    return () => result?.cleanup();
  }, [config]);

  return result;
};
```

**Benefits:**
- ✅ Clear initialization order
- ✅ Guaranteed cleanup
- ✅ Error handling
- ✅ Testable

---

### 🎯 Priority 6: Create Map Service Layer

**Abstract Google Maps behind service:**

```typescript
// src/services/mapService.ts
export interface MapService {
  // Core
  getInstance(): google.maps.Map | null;
  isReady(): boolean;

  // Navigation
  panTo(location: google.maps.LatLngLiteral): void;
  setZoom(level: number): void;
  getBounds(): google.maps.LatLngBounds | null;

  // Markers
  addMarker(options: MarkerOptions): Marker;
  removeMarker(markerId: string): void;

  // Street View
  activateStreetView(position: google.maps.LatLngLiteral): Promise<void>;
  deactivateStreetView(): void;

  // Search
  searchPlaces(query: string): Promise<google.maps.places.PlaceResult[]>;

  // Listeners
  onBoundsChanged(callback: (bounds: google.maps.LatLngBounds) => void): () => void;
  onIdle(callback: () => void): () => void;
}

class GoogleMapService implements MapService {
  private map: google.maps.Map | null = null;
  private listeners: Map<string, google.maps.MapsEventListener> = new Map();

  getInstance(): google.maps.Map | null {
    return this.map;
  }

  isReady(): boolean {
    return this.map !== null && window.google?.maps !== undefined;
  }

  panTo(location: google.maps.LatLngLiteral): void {
    if (!this.isReady()) throw new Error('Map not ready');
    this.map!.panTo(location);
  }

  // ... implement all methods with proper error handling
}

export const mapService = new GoogleMapService();

// Usage in components:
const MyComponent = () => {
  const { isReady, panTo } = useMapService(); // Wrapper hook

  const handleClick = () => {
    if (isReady()) {
      panTo({ lat: 34.0522, lng: -118.2437 });
    }
  };
};
```

**Benefits:**
- ✅ Decoupled from Google Maps
- ✅ Easy to mock for testing
- ✅ Consistent error handling
- ✅ Can swap map providers

---

## File-by-File Refactoring Plan

### Phase 1: Foundation (Week 1)

**1.1 Consolidate Environment Config**
- [ ] Enhance `src/config/environment.ts` with validation
- [ ] Remove `src/utils/env.ts`
- [ ] Update all imports to use `env.getGoogleMapsApiKey()`
- [ ] Add tests for environment loading

**1.2 Create Single Map Context**
- [ ] Enhance `src/contexts/MapContext.tsx` with full state
- [ ] Merge functionality from `useGoogleMap` hook
- [ ] Add error state and retry logic
- [ ] Remove duplicate `useGoogleMap` hook

**1.3 Add Error Boundaries**
- [ ] Create `src/components/map/MapErrorBoundary.tsx`
- [ ] Add to Home.tsx wrapping MapView
- [ ] Create fallback components
- [ ] Add error logging

---

### Phase 2: Component Refactoring (Week 2)

**2.1 Extract MapView Features**
- [ ] Create `src/components/map/MapContainer.tsx` (core)
- [ ] Create `src/components/map/MapFeatures.tsx` (orchestrator)
- [ ] Create `src/components/map/layers/MessageLayer.tsx`
- [ ] Create `src/components/map/layers/EventLayer.tsx`
- [ ] Create `src/components/map/layers/LiveStreamLayer.tsx`
- [ ] Create `src/components/map/layers/PinPlacementLayer.tsx`
- [ ] Create `src/components/map/layers/StreetViewLayer.tsx`

**2.2 Reduce MapView.tsx**
- [ ] Move message logic to MessageLayer
- [ ] Move event logic to EventLayer
- [ ] Move livestream logic to LiveStreamLayer
- [ ] Move pin placement to PinPlacementLayer
- [ ] Move street view to StreetViewLayer
- [ ] Reduce to ~100 lines (orchestrator only)

**2.3 Fix Listener Management**
- [ ] Create `src/hooks/useMapListener.ts` (cleanup helper)
- [ ] Refactor SearchBox in ModernMapControls
- [ ] Refactor Street View listeners
- [ ] Add cleanup tests

---

### Phase 3: Service Layer (Week 3)

**3.1 Create Map Service**
- [ ] Create `src/services/mapService.ts`
- [ ] Implement core methods
- [ ] Add error handling
- [ ] Create `useMapService` hook wrapper

**3.2 Create Feature Services**
- [ ] Create `src/services/streetViewService.ts`
- [ ] Create `src/services/searchService.ts`
- [ ] Create `src/services/markerService.ts`
- [ ] Integrate with MapService

**3.3 Update Components**
- [ ] Refactor MessageMarkers to use markerService
- [ ] Refactor ModernMapControls to use searchService
- [ ] Refactor StreetViewController to use streetViewService
- [ ] Remove direct google.maps.* usage

---

### Phase 4: Validation & Testing (Week 4)

**4.1 Add Coordinate Validation**
- [ ] Create `src/utils/coordinateValidation.ts`
- [ ] Add validation to marker rendering
- [ ] Add validation to message creation
- [ ] Add validation to bounds updates

**4.2 Add Initialization Guards**
- [ ] Check google.maps before usage
- [ ] Add loading skeletons
- [ ] Add retry mechanisms
- [ ] Add timeout handling

**4.3 Testing**
- [ ] Unit tests for mapService
- [ ] Integration tests for MapContainer
- [ ] E2E tests for map initialization
- [ ] E2E tests for marker rendering

---

## Key Code Snippets for Implementation

### Snippet 1: Enhanced MapContext

```typescript
// src/contexts/MapContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { env } from '@/config/environment';

const LIBRARIES: ('places' | 'geometry')[] = ['places'];

interface MapContextValue {
  // State
  map: google.maps.Map | null;
  isLoaded: boolean;
  isInitializing: boolean;
  error: Error | null;

  // Actions
  setMap: (map: google.maps.Map | null) => void;
  retry: () => void;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: env.getGoogleMapsApiKey(),
    libraries: LIBRARIES,
    version: 'weekly',
    preventGoogleFontsLoading: true,
  });

  useEffect(() => {
    if (loadError) {
      setError(loadError);
    }
  }, [loadError]);

  const retry = useCallback(() => {
    setError(null);
    setMap(null);
    setRetryCount(prev => prev + 1);
    window.location.reload(); // Simple retry
  }, []);

  const value: MapContextValue = {
    map,
    isLoaded: isLoaded && !error,
    isInitializing: !isLoaded && !error,
    error,
    setMap,
    retry,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within MapProvider');
  }
  return context;
};
```

### Snippet 2: MapContainer with Error Boundary

```typescript
// src/components/map/MapContainer.tsx
import React from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { useMapContext } from '@/contexts/MapContext';
import { defaultMapOptions } from '@/config/mapStyles';
import MapErrorBoundary from './MapErrorBoundary';
import MapFeatures from './MapFeatures';

interface MapContainerProps {
  center: google.maps.LatLngLiteral;
  zoom?: number;
  onLoad?: (map: google.maps.Map) => void;
  onUnmount?: () => void;
}

const MapContainer: React.FC<MapContainerProps> = ({
  center,
  zoom = 13,
  onLoad,
  onUnmount
}) => {
  const { map, isLoaded, isInitializing, error, setMap, retry } = useMapContext();

  if (error) {
    return (
      <MapFallback
        title="Map Loading Failed"
        description={error.message}
        onRetry={retry}
      />
    );
  }

  if (isInitializing) {
    return <MapLoading />;
  }

  if (!isLoaded) {
    return <MapLoading />;
  }

  const handleLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    onLoad?.(mapInstance);
  };

  const handleUnmount = () => {
    setMap(null);
    onUnmount?.();
  };

  return (
    <MapErrorBoundary>
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={center}
        zoom={zoom}
        onLoad={handleLoad}
        onUnmount={handleUnmount}
        options={defaultMapOptions}
      >
        <MapFeatures />
      </GoogleMap>
    </MapErrorBoundary>
  );
};

export default MapContainer;
```

### Snippet 3: MessageLayer with Validation

```typescript
// src/components/map/layers/MessageLayer.tsx
import React from 'react';
import { useMapContext } from '@/contexts/MapContext';
import { useMessages } from '@/hooks/useMessages';
import MessageMarkers from '../MessageMarkers';
import MessageDetail from '../../MessageDetail';

const MessageLayer: React.FC = () => {
  const { map, isLoaded } = useMapContext();
  const { filteredMessages } = useMessages();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Don't render until map is ready
  if (!isLoaded || !map) {
    return null;
  }

  // Validate messages have coordinates
  const validMessages = filteredMessages.filter(msg =>
    msg.position?.lat != null &&
    msg.position?.lng != null &&
    !isNaN(msg.position.lat) &&
    !isNaN(msg.position.lng)
  );

  const selectedMessage = validMessages.find(m => m.id === selectedId);

  return (
    <>
      <MessageMarkers
        messages={validMessages}
        onMessageClick={setSelectedId}
      />

      {selectedMessage && (
        <MessageDetail
          message={selectedMessage}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
};

export default MessageLayer;
```

### Snippet 4: Map Service with Error Handling

```typescript
// src/services/mapService.ts
export interface Coordinates {
  lat: number;
  lng: number;
}

export class MapService {
  private map: google.maps.Map | null = null;

  setInstance(map: google.maps.Map | null): void {
    this.map = map;
  }

  getInstance(): google.maps.Map | null {
    return this.map;
  }

  isReady(): boolean {
    return this.map !== null && typeof window !== 'undefined' && window.google?.maps !== undefined;
  }

  panTo(location: Coordinates): void {
    if (!this.isReady()) {
      console.warn('Map not ready, cannot panTo');
      return;
    }
    this.map!.panTo(location);
  }

  setZoom(level: number): void {
    if (!this.isReady()) {
      console.warn('Map not ready, cannot setZoom');
      return;
    }
    if (level < 0 || level > 21) {
      console.warn(`Invalid zoom level: ${level}`);
      return;
    }
    this.map!.setZoom(level);
  }

  getBounds(): google.maps.LatLngBounds | null {
    if (!this.isReady()) {
      return null;
    }
    return this.map!.getBounds() || null;
  }

  addListener<E extends keyof google.maps.MapHandlerMap>(
    event: E,
    handler: google.maps.MapHandlerMap[E]
  ): (() => void) | null {
    if (!this.isReady()) {
      return null;
    }

    const listener = this.map!.addListener(event, handler);

    return () => {
      google.maps.event.removeListener(listener);
    };
  }
}

export const mapService = new MapService();

// Hook wrapper
export const useMapService = () => {
  const { map } = useMapContext();

  React.useEffect(() => {
    mapService.setInstance(map);
  }, [map]);

  return mapService;
};
```

---

## Testing Strategy

### Unit Tests

```typescript
// src/services/__tests__/mapService.test.ts
import { mapService } from '../mapService';

describe('MapService', () => {
  beforeEach(() => {
    mapService.setInstance(null);
  });

  it('should return false when map not ready', () => {
    expect(mapService.isReady()).toBe(false);
  });

  it('should safely handle panTo when map not ready', () => {
    const spy = jest.spyOn(console, 'warn');
    mapService.panTo({ lat: 0, lng: 0 });
    expect(spy).toHaveBeenCalledWith('Map not ready, cannot panTo');
  });

  it('should validate zoom levels', () => {
    const mockMap = { setZoom: jest.fn() } as any;
    mapService.setInstance(mockMap);

    mapService.setZoom(25); // Invalid
    expect(mockMap.setZoom).not.toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
// src/components/map/__tests__/MapContainer.test.tsx
import { render, waitFor } from '@testing-library/react';
import { MapProvider } from '@/contexts/MapContext';
import MapContainer from '../MapContainer';

describe('MapContainer', () => {
  it('should show loading state initially', () => {
    const { getByText } = render(
      <MapProvider>
        <MapContainer center={{ lat: 0, lng: 0 }} />
      </MapProvider>
    );

    expect(getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle load errors gracefully', async () => {
    // Mock useJsApiLoader to return error
    jest.mock('@react-google-maps/api', () => ({
      useJsApiLoader: () => ({ isLoaded: false, loadError: new Error('API Error') })
    }));

    const { getByText } = render(
      <MapProvider>
        <MapContainer center={{ lat: 0, lng: 0 }} />
      </MapProvider>
    );

    await waitFor(() => {
      expect(getByText(/map loading failed/i)).toBeInTheDocument();
    });
  });
});
```

---

## Success Metrics

**After refactoring, the map should be:**

✅ **Resilient** - No breaking changes from adding features
✅ **Maintainable** - Clear separation of concerns
✅ **Testable** - >80% test coverage
✅ **Performant** - No memory leaks, efficient re-renders
✅ **Debuggable** - Clear error messages, logging
✅ **Documented** - Inline comments, architecture docs

**Specific Targets:**

- [ ] Reduce MapView.tsx from 419 lines to <100 lines
- [ ] Consolidate 3 map state systems to 1
- [ ] Add error boundaries to prevent crashes
- [ ] 100% of map interactions have null checks
- [ ] 100% of listeners have cleanup
- [ ] 0 memory leaks in development
- [ ] <2s map initialization time
- [ ] Clear initialization sequence documented

---

## Timeline Estimate

**Total: 4 weeks (1 developer)**

- Week 1: Foundation (environment, context, error boundaries)
- Week 2: Component refactoring (extract layers, reduce MapView)
- Week 3: Service layer (mapService, feature services)
- Week 4: Validation, testing, documentation

**Can be parallelized with 2 developers:**
- Developer 1: Foundation + Service layer (Weeks 1 + 3)
- Developer 2: Component refactoring + Testing (Weeks 2 + 4)
- **Total: 2 weeks**

---

## Conclusion

The Lo app's map implementation suffers from **architectural fragmentation** caused by multiple competing state systems, lack of error boundaries, and a monolithic MapView component. These issues make the map extremely fragile and prone to breaking after code changes.

The recommended refactoring focuses on:

1. **Single source of truth** for map state
2. **Error boundaries** to prevent cascading failures
3. **Component extraction** to reduce complexity
4. **Service layer** to abstract Google Maps
5. **Defensive programming** with validation and null checks

Following this plan will create a **robust, maintainable, and testable** map implementation that can evolve without breaking.

---

## Appendix: Files Analyzed

**Core Map Files:**
- ✅ `/src/components/MapView.tsx` (419 lines)
- ✅ `/src/hooks/useGoogleMap.ts` (209 lines)
- ✅ `/src/contexts/GoogleMapsContext.tsx` (141 lines)
- ✅ `/src/contexts/MapContext.tsx` (29 lines)
- ✅ `/src/config/environment.ts` (99 lines)
- ✅ `/src/utils/env.ts` (79 lines)
- ✅ `/src/config/mapStyles.ts` (80 lines)

**Supporting Files:**
- ✅ `/src/hooks/useMessages.ts` (240 lines)
- ✅ `/src/hooks/usePinPlacement.ts` (68 lines)
- ✅ `/src/hooks/useUserLocation.ts` (44 lines)
- ✅ `/src/components/map/MessageCreationController.tsx` (74 lines)
- ✅ `/src/components/map/MessageDisplayController.tsx` (40 lines)
- ✅ `/src/components/map/MessageMarkers.tsx` (77 lines)
- ✅ `/src/components/map/ModernMapControls.tsx` (161 lines)
- ✅ `/src/components/map/StreetViewController.tsx` (72 lines)
- ✅ `/src/utils/eventBus.ts` (32 lines)
- ✅ `/src/types/messages.ts` (204 lines)
- ✅ `/src/App.tsx` (127 lines)
- ✅ `/src/pages/Home.tsx` (185 lines)

**Total files analyzed:** 20
**Total lines of code analyzed:** ~2,500 lines

---

*Report generated: 2025-10-02*
*Analyst: Frontend Experience Agent (Lo Platform Specialist)*
