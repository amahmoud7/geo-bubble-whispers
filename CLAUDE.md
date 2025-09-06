# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint on all files
- `npm run preview` - Preview production build

### Supabase
- Database management is handled through Supabase
- Functions are located in `supabase/functions/`
- Migrations are in `supabase/migrations/`

## Architecture Overview

This is a location-based social messaging application called "Lo" (formerly Geo Bubble Whispers) built with React, TypeScript, and Supabase.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (database, auth, real-time subscriptions)
- **Maps**: Google Maps API with @react-google-maps/api
- **Mobile**: Capacitor for iOS app builds
- **State Management**: TanStack Query for server state, React Context for auth
- **Build Tool**: Vite with SWC

### Key Features
- Interactive Google Maps with message placement
- Real-time messaging with location-based filtering
- Live streaming capabilities
- User authentication (email/password, Google, Apple OAuth)
- Stories feature (similar to social media stories)
- Profile management
- Street View integration

### Core Architecture

#### Authentication Flow
- `useAuth` hook provides authentication context
- Supabase handles OAuth and email/password auth
- User profiles stored in `profiles` table
- New user detection for onboarding flow

#### Map System
- Main map component: `MapView.tsx`
- Multiple specialized controllers:
  - `MessageCreationController` - Handle new message placement
  - `MessageDisplayController` - Show existing messages
  - `StreetViewController` - Street View integration
- Custom hooks for map state management:
  - `useGoogleMap` - Map instance management
  - `usePinPlacement` - Message pin placement logic
  - `useUserLocation` - Geolocation handling

#### Message System
- Messages stored in Supabase with location coordinates
- Real-time updates via Supabase subscriptions
- Filtering by type, privacy, and location
- Support for text, media, and live streams
- Comments and interactions system

#### Component Structure
- `src/components/` - Organized by feature (auth, map, message, profile, etc.)
- `src/components/ui/` - shadcn/ui base components
- `src/hooks/` - Custom React hooks for state management
- `src/pages/` - Route components
- `src/integrations/supabase/` - Database client and types

#### State Management
- Authentication: React Context (`AuthProvider`)
- Server state: TanStack Query
- Local state: React hooks with custom hook abstractions
- Real-time: Supabase real-time subscriptions

### Configuration Notes
- Google Maps API key is hardcoded in `MapView.tsx` (line 65)
- Supabase credentials in `src/integrations/supabase/client.ts`
- TypeScript config has relaxed strictness settings
- ESLint configured with React and TypeScript rules
- Capacitor configured for iOS builds

### Development Patterns
- Components use `.tsx` extension
- Hooks prefixed with `use`
- Supabase types auto-generated in `src/integrations/supabase/types.ts`
- Path aliases: `@/` maps to `src/`
- Component organization follows feature-based structure