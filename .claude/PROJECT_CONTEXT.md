# Lo Social Messaging Platform - Project Context

This file provides project-specific context for Claude Code agents working on the Lo social messaging platform.

## Project Overview

**Lo** (formerly Geo-Bubble-Whispers) is a location-based social messaging platform that combines real-time messaging, live streaming, and event discovery in an interactive map-based interface.

### Core Features
- **Interactive Map Interface:** Google Maps with location-based message pins
- **Real-time Messaging:** Live messaging with location filtering
- **Story System:** Ephemeral stories similar to Instagram/Snapchat
- **Live Streaming:** Mobile broadcasting with location sharing
- **Event Discovery:** Ticketmaster/Eventbrite integration for local events
- **Social Features:** Following, profiles, notifications, content creation

### Technical Architecture

#### Frontend Stack
- **Framework:** React 18+ with TypeScript
- **UI Library:** shadcn/ui components + Tailwind CSS
- **Maps:** Google Maps API with @react-google-maps/api
- **State Management:** TanStack Query + React Context
- **Build Tool:** Vite with SWC
- **Mobile:** Capacitor for iOS/Android deployment

#### Backend Stack
- **Database:** Supabase (PostgreSQL with real-time subscriptions)
- **Authentication:** Supabase Auth (email, Google, Apple OAuth)
- **Storage:** Supabase Storage for media files
- **Functions:** Supabase Edge Functions for external API integration
- **Real-time:** Supabase Realtime for live updates

#### External Integrations
- **Events:** Ticketmaster API, Eventbrite API, PredictHQ
- **Maps:** Google Maps Platform (Maps, Places, Geocoding)
- **Media:** Camera integration, image processing
- **Push:** Firebase Cloud Messaging

### Performance Standards

#### Web Performance Targets
- **Core Web Vitals:** LCP ≤ 2.5s, CLS ≤ 0.1, FID ≤ 100ms
- **Bundle Size:** Initial JS ≤ 250KB gzipped
- **Map Performance:** 60fps interactions, smooth pin clustering
- **Real-time:** Message delivery ≤ 500ms, presence updates ≤ 1s

#### Mobile Performance Targets
- **Cold Start:** ≤ 2s on mid-range devices
- **Memory Usage:** ≤ 150MB baseline, ≤ 300MB peak
- **Battery Efficiency:** ≤ 5% drain per hour active use
- **Frame Rate:** ≥ 55fps for map interactions

#### Database Performance
- **Spatial Queries:** ≤ 100ms for nearby messages
- **Real-time Updates:** ≤ 200ms propagation
- **Concurrent Users:** Support 10K+ connections
- **Data Consistency:** 99.99% accuracy for location data

### Key Components & Architecture

#### Core React Components
```
src/
├── components/
│   ├── MapView.tsx (Main map interface)
│   ├── message/ (Message creation & display)
│   ├── stories/ (Story viewer & creation)
│   ├── livestream/ (Live streaming components)
│   ├── events/ (Event discovery & display)
│   └── profile/ (User profiles & settings)
├── hooks/
│   ├── useMessages.ts (Message state management)
│   ├── useAuth.ts (Authentication)
│   ├── useUserLocation.ts (GPS tracking)
│   └── useEventMessages.ts (Event integration)
└── pages/
    ├── Home.tsx (Main map view)
    ├── Feed.tsx (Social feed)
    ├── Profile.tsx (User profile)
    └── Create.tsx (Content creation)
```

#### Database Schema (Supabase)
```sql
-- Core tables
profiles (id, username, avatar_url, location)
messages (id, content, lat, lng, user_id, message_type, is_public)
stories (id, media_url, user_id, expires_at)
events (id, external_id, event_source, event_title, lat, lng)
follows (follower_id, following_id)
likes (user_id, message_id)

-- RLS policies for location-based privacy
-- Spatial indexing for geographic queries
-- Real-time subscriptions for live updates
```

### Development Environment

#### Local Development
- **Dev Server:** `npm run dev` on port 8080
- **Database:** Supabase project with local development
- **Testing:** Jest + React Testing Library + Playwright
- **Mobile:** Capacitor dev with iOS Simulator

#### Deployment Pipeline
- **Web:** Vite build → Supabase hosting
- **Mobile:** Capacitor build → Xcode → App Store
- **Database:** Supabase migrations via CLI
- **Functions:** Supabase functions deploy

### Current Challenges & Focus Areas

#### Performance Optimization Needs
- Map rendering optimization for large datasets
- Bundle size reduction and code splitting
- Mobile app cold start time improvement
- Database query optimization for spatial data

#### Security & Privacy Requirements
- Location data privacy controls
- User-to-user message encryption
- External API rate limiting and abuse prevention
- GDPR/CCPA compliance for location tracking

#### Scalability Concerns
- Real-time message delivery at scale
- Geographic load balancing for global users
- Event data synchronization from multiple sources
- Mobile push notification delivery

#### Integration Complexity
- External event APIs (Ticketmaster, Eventbrite)
- Google Maps API optimization and cost management
- Cross-platform mobile feature parity
- Offline-first data synchronization

### Business Context

#### Target Users
- Social media users aged 18-35
- Event-goers and location-based social discovery
- Content creators and live streamers
- Urban users in major metropolitan areas

#### Key Metrics
- User engagement: Daily active users, session duration
- Content creation: Messages, stories, streams per user
- Location accuracy: GPS precision, update frequency
- Performance: App store ratings, crash rates, load times

#### Compliance Requirements
- App Store guidelines (iOS/Android)
- Location data regulations (GDPR, CCPA)
- Third-party API terms of service
- Content moderation and safety standards

### Development Guidelines

#### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier configuration
- Component composition over inheritance
- Custom hooks for reusable logic
- Semantic HTML and ARIA accessibility

#### Testing Strategy
- Unit tests for utility functions and hooks
- Component tests with React Testing Library
- E2E tests with Playwright for critical paths
- Performance testing with Lighthouse CI
- Mobile testing on real devices

#### Git Workflow
- Feature branches with descriptive names
- Conventional commit messages
- Pull request reviews required
- Automated testing on CI/CD
- Semantic versioning for releases

This context file should be referenced by all agents to understand the Lo platform's specific requirements, architecture, and constraints while maintaining their general-purpose capabilities.