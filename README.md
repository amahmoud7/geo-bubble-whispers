# Lo - Location-Based Social Platform

## About Lo

Lo is a modern location-based social platform that allows users to share moments, discover events, and connect with their community through geo-located posts and live streams.

## Features

- 📍 **Location-Based Posts**: Share "Los" at specific locations on the map
- 🗺️ **Interactive Map**: Explore posts and events on a dynamic Google Maps interface
- 📹 **Live Streaming**: Broadcast live from any location
- 🎫 **Event Discovery**: Find nearby events via Ticketmaster integration
- 💬 **Direct Messaging**: Connect with other users through real-time chat
- 👤 **Modern Profile**: Instagram/TikTok-inspired profile with post grid
- 🎨 **Beautiful UI**: Clean, modern interface optimized for mobile

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Database, Auth, Real-time)
- **Maps**: Google Maps API
- **Mobile**: Capacitor for iOS/Android
- **State**: TanStack Query + React Context

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google Maps API key

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run on iOS
npx cap sync ios
npx cap open ios
```

## Project Structure

```
src/
├── components/     # React components
├── pages/         # Route pages
├── hooks/         # Custom React hooks
├── services/      # API services
├── contexts/      # React contexts
├── integrations/  # Third-party integrations
└── types/         # TypeScript types
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm test` - Run tests

## iOS Deployment

1. Build the web app: `npm run build`
2. Sync with iOS: `npx cap sync ios`
3. Open in Xcode: `npx cap open ios`
4. Build and run on device

## Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

This is a private project. Please contact the maintainers for contribution guidelines.

## License

Proprietary - All rights reserved

## Support

For support, please contact the development team.

---

**Lo** - Share your world, one location at a time 🌍