# Eventbrite Web Scraper Setup

## Overview

This document describes the Eventbrite web scraping integration that fetches local events without requiring an official Eventbrite API key. The scraper uses Eventbrite's internal API endpoints (reverse-engineered from their web application) to retrieve event data.

## Architecture

### Components

1. **`supabase/functions/fetch-events-realtime/eventbrite-scraper.ts`**
   - Main scraper module using Eventbrite's internal API
   - Falls back to HTML scraping if API method fails
   - No API key required (scrapes public data)

2. **`supabase/functions/fetch-events-realtime/index.ts`**
   - Main edge function that orchestrates all event sources
   - Includes Eventbrite alongside Ticketmaster, SeatGeek, etc.

3. **`src/components/events/EventsToggle.tsx`**
   - Updated to request both Ticketmaster and Eventbrite events
   - Displays events on the map when toggled

## How It Works

### Reverse-Engineered API Method (Primary)

The scraper uses Eventbrite's internal destination search API:

```
GET https://www.eventbrite.com/api/v3/destination/search/
```

**Parameters:**
- `location.latitude` - Center latitude
- `location.longitude` - Center longitude
- `location.within` - Search radius (e.g., "25mi")
- `date_range.start_date` - Start date (ISO format)
- `date_range.end_date` - End date (ISO format)
- `page_size` - Number of results (max 100)
- `expand` - Additional data to include

**Key Features:**
- ✅ No API key required
- ✅ Returns structured JSON data
- ✅ Includes coordinates, pricing, venue info
- ✅ More reliable than HTML scraping
- ⚠️ Endpoint could change if Eventbrite updates their site

### HTML Scraping Method (Fallback)

If the API method fails, the scraper falls back to parsing JSON-LD structured data from Eventbrite's search pages. This is more fragile but provides a backup method.

## Data Normalization

Events from Eventbrite are normalized to match the Lo platform's event structure:

```typescript
{
  external_id: string;       // Eventbrite event ID
  source: 'eventbrite';      // Always 'eventbrite'
  title: string;             // Event name
  description: string;       // Event description (truncated to 500 chars)
  event_url: string;         // Link to Eventbrite event page
  image_url?: string;        // Event image
  venue_name?: string;       // Venue name
  venue_address?: string;    // Full address
  lat?: number;              // Latitude
  lng?: number;              // Longitude
  start_date: string;        // ISO datetime
  end_date?: string;         // ISO datetime
  price_min?: number;        // Minimum ticket price
  price_max?: number;        // Maximum ticket price
  genre?: string;            // Event category
  classification: string;    // Always 'Eventbrite'
}
```

## Deployment

### 1. Deploy the Edge Function

```bash
# Make sure you're in the project root
cd /Users/akrammahmoud/geo-bubble-whispers/geo-bubble-whispers

# Deploy the updated function
supabase functions deploy fetch-events-realtime

# Verify deployment
supabase functions list
```

### 2. No Environment Variables Required

Unlike other event sources, Eventbrite scraping doesn't require any API keys or tokens since it uses publicly available data.

### 3. Test the Function

```bash
# Test with curl
curl -X POST \
  https://your-project.supabase.co/functions/v1/fetch-events-realtime \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source": ["eventbrite"],
    "center": { "lat": 34.0522, "lng": -118.2437 },
    "radius": 25,
    "timeframe": "24h"
  }'
```

## Usage

### In the Application

1. **Toggle Events On**: Click the "Events" button in the map interface
2. **Automatic Fetching**: Events from both Ticketmaster and Eventbrite are fetched automatically
3. **Map Display**: Events appear as markers on the map with event details

### Programmatic Usage

```typescript
// Fetch events including Eventbrite
const { data, error } = await supabase.functions.invoke('fetch-events-realtime', {
  body: { 
    source: ['ticketmaster', 'eventbrite'],
    center: { lat: 34.0522, lng: -118.2437 },
    radius: 25,
    timeframe: '24h'
  }
});

// Response includes events from both sources
console.log(data.events.total); // Total events found
console.log(data.sources.processed); // ['ticketmaster', 'eventbrite']
```

## Rate Limiting & Best Practices

### Respectful Scraping

1. **Rate Limiting**
   - Built-in retry logic with exponential backoff
   - Respects `Retry-After` headers
   - Maximum 2 retry attempts per request

2. **Caching**
   - Results are cached for 5 minutes in memory
   - Reduces load on Eventbrite's servers
   - Improves response time

3. **User Agent**
   - Uses standard browser user agent
   - Mimics normal web traffic
   - Includes proper referer headers

### Error Handling

The scraper includes comprehensive error handling:
- Network timeouts (15 seconds)
- Rate limit detection (429 status)
- Server errors with retry logic
- Validation of coordinates and required fields

## Limitations

### Known Limitations

1. **API Stability**
   - Eventbrite's internal API is not officially supported
   - Endpoints could change without notice
   - Fallback HTML scraping provides redundancy

2. **Data Completeness**
   - Some events may not have complete pricing data
   - Geographic coordinates depend on venue information quality
   - Images may not always be available

3. **Rate Limits**
   - Eventbrite may rate limit excessive requests
   - Built-in retry logic handles temporary rate limits
   - Consider using longer cache times for high-traffic applications

### Troubleshooting

**No events returned:**
- Check if events exist in the specified location and timeframe
- Try increasing the radius parameter
- Check console logs for API errors

**429 Rate Limit errors:**
- Wait for the retry-after period
- Consider implementing longer cache times
- Reduce request frequency

**Invalid coordinates:**
- Eventbrite filters out events without valid venue coordinates
- Some online events may not have geographic data

## Comparison with Other Sources

| Feature | Ticketmaster | Eventbrite (Scraper) | SeatGeek |
|---------|-------------|---------------------|----------|
| API Key Required | ✅ Yes | ❌ No | ✅ Yes |
| Official API | ✅ Yes | ❌ No (reverse-engineered) | ✅ Yes |
| Data Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Stability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Event Coverage | Large venues | Community & local | Sports & concerts |
| Price Data | Complete | Partial | Complete |
| Setup Complexity | Medium | Low | Medium |

## Future Enhancements

Potential improvements to the Eventbrite scraper:

1. **Pagination Support**: Currently fetches first 100 results, could add pagination for more events
2. **Category Filtering**: Add support for filtering by event category/genre
3. **Advanced Caching**: Implement Redis or similar for distributed caching
4. **Monitoring**: Add metrics tracking for success rates and performance
5. **Alternative APIs**: Research other Eventbrite endpoints for additional data

## Legal Considerations

⚠️ **Important**: This scraper uses publicly available data from Eventbrite's website. While the data is public, web scraping may violate Eventbrite's Terms of Service. Consider:

1. Reviewing Eventbrite's Terms of Service
2. Using their official API if available for your use case
3. Implementing respectful rate limiting
4. Caching results to minimize requests
5. Providing attribution to Eventbrite

**Recommendation**: For production applications with high traffic, consider applying for an official Eventbrite API key or exploring partnership opportunities.

## Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Review the `eventbrite-scraper.ts` source code
3. Test the endpoint manually with curl
4. Check Eventbrite's website to verify data availability

## References

- [Eventbrite Website](https://www.eventbrite.com)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Project Events Setup](./REALTIME_EVENTS_SETUP.md)
