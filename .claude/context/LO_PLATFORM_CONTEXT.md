# Lo Platform - Comprehensive Development Context

*Universal context for all agents working on the Lo social messaging platform*

## Platform Overview

**Lo** (formerly Geo-Bubble-Whispers) is a location-based social messaging platform combining real-time messaging, live streaming, and event discovery in an interactive map-based interface.

### Core Value Proposition
- **Location-Based Social Discovery:** Connect users through proximity and shared experiences
- **Real-Time Interaction:** Instant messaging with location-aware features
- **Event Integration:** Seamless connection to local events and activities
- **Content Creation:** Stories, live streaming, and location-tagged content

## Technical Architecture

### Technology Stack
```yaml
frontend:
  framework: "React 18+ with TypeScript (strict mode)"
  ui_library: "shadcn/ui components + Tailwind CSS"
  maps: "Google Maps API with @react-google-maps/api"
  state: "TanStack Query + React Context"
  build: "Vite with SWC"
  mobile: "Capacitor for iOS/Android deployment"

backend:
  database: "Supabase (PostgreSQL with real-time subscriptions)"
  auth: "Supabase Auth (email, Google, Apple OAuth)"
  storage: "Supabase Storage for media files"
  functions: "Supabase Edge Functions"
  realtime: "Supabase Realtime subscriptions"

external_integrations:
  events: ["Ticketmaster API", "Eventbrite API", "PredictHQ"]
  maps: ["Google Maps Platform", "Places API", "Geocoding API"]
  media: "Camera integration, image processing"
  push: "Firebase Cloud Messaging"
```

### Performance Standards

#### Web Performance Targets
```yaml
core_web_vitals:
  LCP: "≤ 2.5s (map loading critical)"
  CLS: "≤ 0.1 (stable map interactions)"
  FID: "≤ 100ms (responsive pin placement)"
  
bundle_optimization:
  initial_js: "≤ 250KB gzipped"
  map_performance: "60fps interactions, smooth pin clustering"
  realtime: "message delivery ≤ 500ms, presence updates ≤ 1s"
```

#### Mobile Performance Targets  
```yaml
mobile_performance:
  cold_start: "≤ 2s on mid-range devices"
  memory_usage: "≤ 150MB baseline, ≤ 300MB peak"
  battery_efficiency: "≤ 5% drain per hour active use"
  frame_rate: "≥ 55fps for map interactions"
```

#### Database Performance
```yaml
database_performance:
  spatial_queries: "≤ 100ms for nearby messages"
  realtime_updates: "≤ 200ms propagation"
  concurrent_users: "Support 10K+ connections"
  data_consistency: "99.99% accuracy for location data"
```

## Core Features & User Flows

### 1. Map-Based Messaging
```yaml
user_flow:
  - open_app: "Load map with user's current location"
  - view_messages: "Display message pins within visibility radius"
  - create_message: "Tap map location → compose → publish"
  - interact: "Tap message pin → view content → like/comment"
  
technical_requirements:
  - location_precision: "GPS accuracy within 10 meters"
  - visibility_radius: "Configurable 100m-5km radius"
  - pin_clustering: "Dynamic clustering based on zoom level"
  - realtime_updates: "Live message appearance/updates"
```

### 2. Story System
```yaml
user_flow:
  - create_story: "Camera → capture/edit → add location → publish"
  - view_stories: "Location-based story discovery"
  - story_lifecycle: "24-hour expiration, view tracking"
  
technical_requirements:
  - media_processing: "Image/video compression and optimization"
  - location_tagging: "Precise GPS coordinates with stories"
  - expiration_system: "Automated cleanup after 24 hours"
  - view_analytics: "Story view tracking and analytics"
```

### 3. Live Streaming
```yaml
user_flow:
  - start_stream: "Camera → go live → share location → broadcast"
  - discover_streams: "Map-based live stream discovery"
  - interact: "Join stream, chat, react in real-time"
  
technical_requirements:
  - streaming_infrastructure: "Low-latency video streaming"
  - location_broadcast: "Real-time location sharing"
  - viewer_management: "Concurrent viewer handling"
  - chat_system: "Real-time chat during streams"
```

### 4. Event Discovery
```yaml
user_flow:
  - browse_events: "Map view of local events"
  - event_details: "Ticketmaster/Eventbrite integration"
  - social_interaction: "Message/story creation at events"
  
technical_requirements:
  - api_integration: "Real-time event data synchronization"
  - location_matching: "Event venue location accuracy"
  - ticket_integration: "Direct ticket purchase flows"
  - event_messaging: "Event-specific message channels"
```

## Database Schema (Supabase)

### Core Tables
```sql
-- User profiles and authentication
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  location_sharing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location-based messages  
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  location GEOGRAPHY(POINT) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'livestream')),
  is_public BOOLEAN DEFAULT true,
  media_url TEXT,
  livestream_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Stories (24-hour ephemeral content)
CREATE TABLE stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  media_url TEXT NOT NULL,
  location GEOGRAPHY(POINT),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Events integration
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL, -- Ticketmaster/Eventbrite ID
  event_source VARCHAR(20) NOT NULL, -- 'ticketmaster', 'eventbrite'
  event_title TEXT NOT NULL,
  event_description TEXT,
  location GEOGRAPHY(POINT) NOT NULL,
  venue_name TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  ticket_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social interactions
CREATE TABLE follows (
  follower_id UUID REFERENCES profiles(id),
  following_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE likes (
  user_id UUID REFERENCES profiles(id),
  message_id UUID REFERENCES messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, message_id)
);

-- Row Level Security (RLS) Policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY message_visibility_policy ON messages 
  FOR SELECT USING (
    is_public = true AND 
    ST_DWithin(location, get_user_location(auth.uid()), get_user_visibility_radius(auth.uid()))
  );
```

### Spatial Indexing
```sql
-- Performance optimizations for location queries
CREATE INDEX messages_location_idx ON messages USING GIST (location);
CREATE INDEX stories_location_idx ON stories USING GIST (location);  
CREATE INDEX events_location_idx ON events USING GIST (location);

-- Composite indexes for common queries
CREATE INDEX messages_user_location_idx ON messages (user_id, location);
CREATE INDEX messages_created_location_idx ON messages (created_at DESC, location);
```

## Component Architecture

### File Structure
```
src/
├── components/
│   ├── MapView.tsx              # Main Google Maps integration
│   ├── message/
│   │   ├── MessageCreation.tsx  # Message composition flow
│   │   ├── MessageDisplay.tsx   # Message pin rendering
│   │   └── MessageModal.tsx     # Message detail view
│   ├── stories/
│   │   ├── StoryViewer.tsx      # Story viewing interface
│   │   ├── StoryCreation.tsx    # Story camera and editing
│   │   └── StoryFeed.tsx        # Location-based story feed
│   ├── livestream/
│   │   ├── LiveStreamView.tsx   # Live stream viewer
│   │   └── StreamControls.tsx   # Streaming interface
│   ├── events/
│   │   ├── EventDiscovery.tsx   # Event map integration
│   │   └── EventDetails.tsx     # Event information display
│   └── profile/
│       ├── UserProfile.tsx      # User profile management
│       └── FollowSystem.tsx     # Social following features
├── hooks/
│   ├── useMessages.ts           # Message state management
│   ├── useAuth.ts              # Supabase authentication
│   ├── useUserLocation.ts      # GPS location tracking
│   ├── useRealtimeSubscription.ts # Supabase real-time
│   └── useEventMessages.ts     # Event integration
├── pages/
│   ├── Home.tsx                # Main map view
│   ├── Feed.tsx                # Social feed interface
│   ├── Profile.tsx             # User profile page
│   ├── Create.tsx              # Content creation
│   └── Events.tsx              # Event discovery page
└── integrations/
    └── supabase/
        ├── client.ts           # Supabase client setup
        ├── types.ts            # Generated TypeScript types
        └── realtime.ts         # Real-time subscriptions
```

### State Management Patterns
```typescript
// TanStack Query + React Context Pattern
interface LoAppState {
  auth: AuthContext;           // User authentication state
  messages: MessageState;      // Location-based messages
  location: LocationState;     // User GPS and location preferences
  ui: UIState;                // App UI state (modals, navigation)
  events: EventState;         // Event discovery and integration
}

// Real-time subscription pattern
const useRealtimeMessages = (bounds: MapBounds) => {
  return useQuery({
    queryKey: ['messages', bounds],
    queryFn: () => fetchMessagesInBounds(bounds),
    staleTime: 30000,
    onSuccess: (data) => {
      // Setup Supabase real-time subscription
      const channel = supabase
        .channel('lo-messages')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'messages' },
            handleRealtimeUpdate)
        .subscribe();
      
      return () => channel.unsubscribe();
    }
  });
};
```

## Development Patterns & Conventions

### Code Style Guidelines
```typescript
// TypeScript strict mode enabled
// Component naming: PascalCase
// Hook naming: camelCase starting with 'use'
// Constants: UPPER_SNAKE_CASE
// File naming: PascalCase for components, camelCase for utilities

// Example component structure
interface MessagePinProps {
  message: Message;
  position: LatLng;
  isSelected: boolean;
  onSelect: (message: Message) => void;
}

const MessagePin: React.FC<MessagePinProps> = React.memo(({
  message,
  position,
  isSelected,
  onSelect
}) => {
  const { user } = useAuth();
  const distance = useDistance(user.location, position);
  
  return (
    <div 
      className="lo-message-pin"
      onClick={() => onSelect(message)}
      aria-label={`Message from ${message.author.username} - ${distance}m away`}
    >
      <MessageContent message={message} />
    </div>
  );
});
```

### Testing Strategy
```yaml
testing_approach:
  unit_tests: 
    - "All utility functions and custom hooks"
    - "Component logic and state management"
    - "API integration layers"
  
  integration_tests:
    - "Component interaction flows"
    - "Real-time subscription handling"
    - "Location-based feature integration"
  
  e2e_tests:
    - "Complete user journeys (map → message → interaction)"
    - "Story creation and viewing flows"
    - "Event discovery and interaction"
    - "Cross-platform mobile compatibility"

testing_tools:
  - "Jest + React Testing Library (unit/integration)"
  - "Playwright (E2E and mobile testing)" 
  - "Storybook (component development and visual testing)"
```

## API Integration Patterns

### External API Integration
```typescript
// Event API integration pattern
interface EventAPIClient {
  ticketmaster: TicketmasterClient;
  eventbrite: EventbriteClient;
  predictHQ: PredictHQClient;
}

// Supabase Edge Function for event sync
const syncEvents = async (location: LatLng, radius: number) => {
  const { data, error } = await supabase.functions.invoke('sync-events', {
    body: { location, radius, sources: ['ticketmaster', 'eventbrite'] }
  });
  
  return data;
};
```

### Google Maps Integration
```typescript
// Google Maps service pattern
interface GoogleMapsService {
  loadMap(container: HTMLElement, options: MapOptions): GoogleMap;
  addMessagePins(messages: Message[]): void;
  setupLocationTracking(): void;
  handlePinPlacement(callback: (location: LatLng) => void): void;
}
```

## Security & Privacy

### Location Privacy
```yaml
privacy_controls:
  - location_sharing_toggle: "User can disable location sharing"
  - visibility_radius: "Configurable message visibility radius"
  - location_history: "Optional location history storage"
  - data_retention: "Configurable data retention policies"

security_measures:
  - rls_policies: "Row Level Security for all data access"
  - input_validation: "Comprehensive input sanitization"
  - rate_limiting: "API rate limiting per user"
  - content_moderation: "Automated and manual content moderation"
```

## Business Context & Metrics

### Key Performance Indicators (KPIs)
```yaml
user_engagement:
  - daily_active_users: "Target: 10K+ DAU"
  - session_duration: "Target: 15+ minutes average"
  - messages_per_user: "Target: 5+ messages/day"
  - story_creation_rate: "Target: 30% users create stories weekly"

technical_performance:
  - app_store_rating: "Target: 4.5+ stars"
  - crash_rate: "Target: <0.5%"
  - load_time: "Target: <2s cold start"
  - real_time_delivery: "Target: <500ms message delivery"

business_metrics:
  - user_retention: "Target: 60% 30-day retention"
  - location_accuracy: "Target: 95% accuracy within 10m"
  - event_engagement: "Target: 20% event interaction rate"
```

### Scalability Targets
```yaml
platform_scale:
  - concurrent_users: "Support 100K+ concurrent users"
  - message_throughput: "Handle 1M+ messages/day"
  - geographic_coverage: "Major metropolitan areas globally"
  - event_integration: "Real-time sync with 10+ event APIs"
```

## Deployment & DevOps

### Environment Configuration
```yaml
environments:
  development:
    - supabase_project: "lo-dev"
    - google_maps_key: "development API key"
    - feature_flags: "All features enabled"
  
  staging:
    - supabase_project: "lo-staging"
    - google_maps_key: "staging API key"
    - feature_flags: "Production feature set"
  
  production:
    - supabase_project: "lo-production"
    - google_maps_key: "production API key"
    - feature_flags: "Stable features only"
```

### Mobile Deployment
```yaml
mobile_platforms:
  ios:
    - build_tool: "Capacitor + Xcode"
    - deployment: "App Store Connect"
    - testing: "TestFlight distribution"
  
  android:
    - build_tool: "Capacitor + Android Studio"
    - deployment: "Google Play Console"
    - testing: "Internal testing tracks"
```

This comprehensive context provides all agents with the deep Lo platform knowledge needed for expert-level development while maintaining project-agnostic agent definitions.