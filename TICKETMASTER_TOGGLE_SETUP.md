# 🎫 Simple Ticketmaster Events Toggle

## Overview
A single toggle button that shows/hides all Ticketmaster events happening in Los Angeles in the next 24 hours. Events appear as Lo messages on the map at their exact venue locations.

## 🚀 Key Features
- **Single Toggle**: One button to show/hide all 24-hour events
- **Current Data**: Always fetches the latest events from Ticketmaster
- **Venue Locations**: Events appear at precise venue coordinates
- **Lo Message Format**: Each event becomes a rich Lo message with details
- **Fresh Data**: Clears old events and loads current ones each time

## 🎯 How It Works

### Toggle States
- **Show Events** (Amber Button): Load and display all events for next 24 hours
- **Hide Events** (Green Button): Clear all events from the map

### Event Loading Process
1. **Clear Old Data**: Remove any existing Ticketmaster events
2. **Fetch Current**: Get fresh data from Ticketmaster API for next 24 hours
3. **Process Events**: Convert each event to a Lo message with venue location
4. **Display Map**: Events appear as gold markers at venue locations
5. **Rich Content**: Click markers to see event details and ticket links

## 📋 Setup Instructions

### 1. Deploy Supabase Function
```bash
supabase functions deploy fetch-events-realtime
```

### 2. Environment Variables
Set these in your Supabase dashboard:
```bash
TICKETMASTER_API_KEY=your_ticketmaster_api_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  
SUPABASE_URL=https://siunjhiiaduktoqjxalv.supabase.co
```

### 3. Database Schema
Ensure these columns exist in the `messages` table:
```sql
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS event_source VARCHAR(50),
ADD COLUMN IF NOT EXISTS external_event_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS event_url TEXT,
ADD COLUMN IF NOT EXISTS event_title TEXT,
ADD COLUMN IF NOT EXISTS event_venue TEXT,
ADD COLUMN IF NOT EXISTS event_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS event_price_min DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS event_price_max DECIMAL(10,2);
```

## 🎨 Event Lo Message Format
Each Ticketmaster event becomes a rich Lo message:

```
🎵 Taylor Swift - The Eras Tour

📍 SoFi Stadium
1001 Stadium Dr, Inglewood, CA 90301

🕐 Thu, Aug 8, 8:00 PM

🎵 Pop • Entertainment

Get ready for the biggest concert tour...

💰 From $150 - $500

🎟️ Get tickets now ↗️

#Events #LA #Ticketmaster
```

## 🎛️ User Interface

### Button States
- **"Show Events"** (Amber): Ready to load events
- **"Hide Events"** (Green): Events currently displayed
- **"Loading..."**: Fetching from Ticketmaster

### Visual Indicators
- Event count display when active
- Location indicator (LA Area)
- Time window indicator (Next 24h)
- Loading states and error handling

## 🗺️ Map Integration
- Events appear as **gold ticket markers** 🎫
- Located at exact venue coordinates from Ticketmaster
- Click markers to see full event details
- Events starting within 2 hours get animated markers
- Integrated with draggable list view

## 📊 Data Consistency
- **Fresh Fetch**: Always gets current Ticketmaster data
- **24-Hour Window**: Precisely calculated from current time
- **No Caching**: Ensures events match what's currently on Ticketmaster
- **Clean Slate**: Clears old data before loading new events
- **Venue Coordinates**: Uses Ticketmaster's precise location data

## 🔧 API Configuration
- **Location**: Los Angeles (25-mile radius)
- **Time Window**: Next 24 hours from current time
- **Event Limit**: Up to 100 events
- **Sorting**: By date (earliest first)
- **Source**: Ticketmaster only (no test events)

## 🎪 Event Types
All Ticketmaster event categories:
- 🎵 Music (concerts, festivals)
- 🏟️ Sports (games, matches)  
- 🎭 Theater (shows, musicals)
- 😂 Comedy (stand-up shows)
- 👨‍👩‍👧‍👦 Family events
- 🎫 General entertainment

## ✅ Testing
After deployment, test the toggle:

1. **Show Events**: Click amber button → should load LA events
2. **Check Map**: Gold markers should appear at venue locations  
3. **Click Markers**: Should show event details and ticket links
4. **Hide Events**: Click green button → events should disappear
5. **Toggle Again**: Should fetch fresh current data

## 🚨 Troubleshooting

### "Setup Required" Error
- Function not deployed: `supabase functions deploy fetch-events-realtime`
- Missing API key: Set `TICKETMASTER_API_KEY` in Supabase dashboard

### "Connection Error"
- Check Ticketmaster API key validity
- Verify network connectivity
- Check Supabase function logs

### No Events Displayed
- May be no events in next 24 hours in LA
- Check Ticketmaster.com for comparison
- Verify venue coordinates are valid

The toggle provides a **simple, reliable way** to show current Ticketmaster events as Lo messages on the map! 🎉