# Eventbrite Integration Setup

This guide explains how to set up Eventbrite API integration to display events on the Lo map alongside Ticketmaster events.

## Prerequisites

- Eventbrite Private Token (OAuth token)
- Supabase project with functions deployed
- Node.js for testing

## Step 1: Get Your Eventbrite Private Token

1. Log in to your Eventbrite account
2. Go to: https://www.eventbrite.com/platform/api-keys
3. Create a new Private token (not OAuth application)
4. Copy the token - you'll need this for the environment variable

## Step 2: Test the API Connection

Before deploying, test that your token works:

```bash
# Test the Eventbrite API
EVENTBRITE_PRIVATE_TOKEN=your_token_here node test-eventbrite-api.js
```

This will:
- Verify your token is valid
- Test the API connection
- Show sample events from New York City
- Display the data structure used for Lo integration

## Step 3: Set Up Supabase Environment Variables

### Using Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to Settings > Edge Functions
3. Add the following secrets:
   - `EVENTBRITE_PRIVATE_TOKEN`: Your Eventbrite private token
   - `TICKETMASTER_API_KEY`: Your existing Ticketmaster API key (if not already set)

### Using Supabase CLI:
```bash
# Set the Eventbrite token
supabase secrets set EVENTBRITE_PRIVATE_TOKEN=your_token_here

# Verify it was set
supabase secrets list
```

## Step 4: Deploy the Updated Function

Deploy the fetch-events-realtime function with Eventbrite support:

```bash
# Deploy the function
supabase functions deploy fetch-events-realtime

# Test the function locally first (optional)
supabase functions serve fetch-events-realtime
```

## Step 5: Test the Integration

### Via the UI:
1. Open your Lo app
2. Click the "Show Events" button
3. Events from both Ticketmaster and Eventbrite should appear on the map

### Via Direct API Call:
```bash
# Test with curl (replace with your project URL)
curl -X POST https://your-project.supabase.co/functions/v1/fetch-events-realtime \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source": ["ticketmaster", "eventbrite"],
    "center": {"lat": 40.7128, "lng": -74.0060},
    "radius": 25,
    "timeframe": "24h"
  }'
```

## Features

### What's Included:
- ✅ Eventbrite events displayed with custom emoji (🎟️)
- ✅ Location-based search (latitude/longitude + radius)
- ✅ Time-based filtering (next 24 hours by default)
- ✅ Venue information and pricing
- ✅ Event categories and classifications
- ✅ Automatic deduplication
- ✅ Rate limiting and caching
- ✅ Retry logic for failed requests

### Event Sources:
The app now supports multiple event sources:
- **Ticketmaster**: Concerts, sports, theater, comedy shows
- **Eventbrite**: Community events, workshops, conferences, meetups

### Data Displayed:
Each event shows:
- Event title and description
- Venue name and address
- Date and time
- Price range (if available)
- Category/genre
- Direct link to ticket purchase

## Troubleshooting

### No Eventbrite Events Showing:
1. Check that your token is set correctly:
   ```bash
   supabase secrets list
   ```
2. Verify the token works:
   ```bash
   EVENTBRITE_PRIVATE_TOKEN=your_token node test-eventbrite-api.js
   ```
3. Check function logs:
   ```bash
   supabase functions logs fetch-events-realtime
   ```

### Authentication Errors:
- Ensure your token is a Private Token, not an OAuth app token
- Check that the token hasn't expired
- Verify the token has the correct permissions

### Rate Limiting:
- Eventbrite has rate limits (varies by account type)
- The integration includes automatic retry logic
- Caching is implemented to reduce API calls

## API Limits

### Eventbrite:
- Default: 1000 requests per hour
- Premium accounts may have higher limits
- Results are cached for 5 minutes

### Ticketmaster:
- Default: 5000 requests per day
- Rate limit: 5 requests per second
- Results are cached for 5 minutes

## Environment Variables Summary

Required variables for full functionality:
```
EVENTBRITE_PRIVATE_TOKEN=your_eventbrite_token
TICKETMASTER_API_KEY=your_ticketmaster_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## Next Steps

- Consider adding more event sources (Meetup, Facebook Events, etc.)
- Implement event filtering by category
- Add user preferences for event types
- Set up automated event refresh (cron job)

## Support

For issues or questions:
- Check the function logs: `supabase functions logs`
- Review the test output: `node test-eventbrite-api.js`
- Ensure all environment variables are set correctly