# Supabase Deployment Guide

## Ticketmaster Events Function Deployment

The Ticketmaster events feature is **fully built and ready** but needs the Supabase Edge Function to be deployed.

### What's Already Built ✅

- **Function Code**: `supabase/functions/fetch-events-24h/index.ts` - Complete Ticketmaster API integration
- **Database Migration**: `supabase/migrations/20250805000001_add_event_message_fields.sql` - Event table structure  
- **Frontend Integration**: `useEventMessages` hook loads and displays events on map
- **Map Display**: `EventMarkerIcon` shows gold ticket markers at venue coordinates
- **Event Modals**: Click markers to see event details and ticket links

### Deployment Steps

1. **Install Supabase CLI** (if not already installed):
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link to Project**:
   ```bash
   supabase link --project-ref siunjhiiaduktoqjxalv
   ```

4. **Deploy the Function**:
   ```bash
   supabase functions deploy fetch-events-24h
   ```

5. **Apply Database Migration** (if needed):
   ```bash
   supabase db push
   ```

### Environment Variables Required

The function needs these environment variables in Supabase:
- `TICKETMASTER_API_KEY` - Your Ticketmaster API key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database writes

### How It Works

Once deployed, clicking "Load Ticketmaster Events" will:

1. **Fetch Events**: Get top 10 events in LA within 24 hours from Ticketmaster API
2. **Geocoding**: Extract venue coordinates from Ticketmaster venue data
3. **Database Storage**: Create event messages with `message_type = 'event'`
4. **Map Display**: Show gold ticket markers at exact venue locations
5. **Interactive**: Click markers to see event details and ticket purchasing links

### Testing

After deployment, the button should show:
- ✅ Success: "🎫 Ticketmaster Events Loaded! Found X events, created Y new event pins"
- 🎫 Gold ticket markers appear on map at venue locations
- 🔴 Events starting within 2 hours show animated red markers
- 🎯 Click markers to see event details

### Troubleshooting

- **404 Error**: Function not deployed yet
- **API Errors**: Check Ticketmaster API key in Supabase environment variables
- **No Events**: May be no events in LA within 24 hours (try different time/location)
- **Permission Errors**: Check database RLS policies allow event message creation