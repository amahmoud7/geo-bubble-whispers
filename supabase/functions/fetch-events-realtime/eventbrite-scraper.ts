// deno-lint-ignore-file no-explicit-any
/**
 * Eventbrite Reverse-Engineered API Scraper
 * 
 * This module scrapes Eventbrite using their internal API endpoints that power their website.
 * More reliable than HTML scraping and doesn't require an official API key.
 * 
 * Key endpoints discovered from Eventbrite's web application:
 * - Search API: https://www.eventbrite.com/api/v3/destination/search/
 * - Event Details: https://www.eventbrite.com/api/v3/events/{id}/
 */

interface EventbriteSearchParams {
  center: { lat: number; lng: number };
  radius: number; // in miles
  timeframe: string;
  requestId: string;
}

interface EventbriteEvent {
  external_id: string;
  source: string;
  title: string;
  description: string;
  event_url: string;
  image_url?: string;
  venue_name?: string;
  venue_address?: string;
  lat?: number;
  lng?: number;
  start_date: string;
  end_date?: string;
  price_min?: number;
  price_max?: number;
  genre?: string;
  classification: string;
}

// Eventbrite internal API configuration
const EVENTBRITE_CONFIG = {
  BASE_URL: 'https://www.eventbrite.com',
  SEARCH_API: '/api/v3/destination/search/',
  EVENT_API: '/api/v3/events/',
  MAX_RESULTS: 100,
  TIMEOUT_MS: 15000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY_MS: 1000,
  // User agent to mimic browser requests
  USER_AGENT: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

class EventbriteAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'EventbriteAPIError';
  }
}

/**
 * Main function to fetch Eventbrite events using HTML scraping
 * 
 * The API method no longer works without authentication, so we use HTML scraping
 * with JSON-LD structured data extraction as the primary method.
 */
export async function fetchEventbriteEventsEnhanced(
  params: EventbriteSearchParams
): Promise<{ events: EventbriteEvent[]; source: string }> {
  const { center, radius, timeframe, requestId } = params;
  
  console.log(`🎟️ [${requestId}] Fetching Eventbrite events for ${center.lat},${center.lng} (${radius}mi)`);
  console.log(`🕷️ [${requestId}] Using HTML scraping method (API requires auth)`);
  
  // Try HTML scraping method directly
  return await scrapeEventbriteHTML(params);
}

/**
 * Build Eventbrite search URL with parameters
 * 
 * Eventbrite uses their destination/search API which accepts:
 * - location.latitude & location.longitude
 * - location.within (distance in miles with 'mi' suffix)
 * - date_range.start_date & date_range.end_date (ISO format)
 * - page_size
 */
function buildSearchUrl(
  center: { lat: number; lng: number },
  radius: number,
  startDate: Date,
  endDate: Date
): string {
  const baseUrl = `${EVENTBRITE_CONFIG.BASE_URL}${EVENTBRITE_CONFIG.SEARCH_API}`;
  
  const params = new URLSearchParams({
    // Location parameters
    'location.latitude': center.lat.toString(),
    'location.longitude': center.lng.toString(),
    'location.within': `${radius}mi`,
    
    // Date range
    'date_range.start_date': startDate.toISOString(),
    'date_range.end_date': endDate.toISOString(),
    
    // Pagination
    'page_size': EVENTBRITE_CONFIG.MAX_RESULTS.toString(),
    'page': '1',
    
    // Sort by date
    'sort_by': 'date',
    
    // Include only events (not collections)
    'include_promoted': 'true',
    
    // Expand embedded data
    'expand': 'event_sales_status,image,primary_venue,saves,ticket_availability,primary_organizer,public_collections'
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Parse Eventbrite API response and normalize to our event structure
 * 
 * Eventbrite response structure (discovered from API):
 * {
 *   events: {
 *     results: [
 *       {
 *         id: string
 *         name: string
 *         summary: string
 *         description: string
 *         url: string
 *         start: { timezone: string, local: string, utc: string }
 *         end: { timezone: string, local: string, utc: string }
 *         image: { url: string, edge_color: string, ... }
 *         primary_venue: { 
 *           name: string,
 *           address: { address_1: string, city: string, region: string, postal_code: string }
 *           latitude: string,
 *           longitude: string
 *         }
 *         ticket_availability: { has_available_tickets: boolean, ... }
 *         is_free: boolean
 *       }
 *     ]
 *   }
 * }
 */
function parseEventbriteResponse(data: any, requestId: string): EventbriteEvent[] {
  const events: EventbriteEvent[] = [];
  
  try {
    // Eventbrite can return events in different structures depending on the endpoint
    const eventsList = data.events?.results || data.results || data.events || [];
    
    if (!Array.isArray(eventsList)) {
      console.warn(`⚠️ [${requestId}] Eventbrite returned unexpected format:`, typeof eventsList);
      return events;
    }
    
    console.log(`📦 [${requestId}] Processing ${eventsList.length} Eventbrite events`);
    
    for (const event of eventsList) {
      try {
        const normalizedEvent = normalizeEventbriteEvent(event);
        
        // Validate required fields
        if (!normalizedEvent.external_id || !normalizedEvent.title) {
          console.warn(`⚠️ [${requestId}] Skipping event with missing required fields:`, event.name);
          continue;
        }
        
        // Validate coordinates
        if (!Number.isFinite(normalizedEvent.lat) || !Number.isFinite(normalizedEvent.lng)) {
          console.warn(`⚠️ [${requestId}] Skipping event with invalid coordinates: ${normalizedEvent.title}`);
          continue;
        }
        
        events.push(normalizedEvent);
      } catch (error) {
        console.warn(`⚠️ [${requestId}] Failed to parse Eventbrite event:`, error instanceof Error ? error.message : error);
        continue;
      }
    }
    
    console.log(`✅ [${requestId}] Normalized ${events.length} valid Eventbrite events`);
    
  } catch (error) {
    console.error(`❌ [${requestId}] Error parsing Eventbrite response:`, error);
  }
  
  return events;
}

/**
 * Normalize a single Eventbrite event to our standard format
 */
function normalizeEventbriteEvent(event: any): EventbriteEvent {
  // Extract venue information
  const venue = event.primary_venue || event.venue || {};
  const address = venue.address || {};
  
  // Build full address string
  const addressParts = [
    address.address_1,
    address.address_2,
    address.city,
    address.region,
    address.postal_code,
    address.country
  ].filter(Boolean);
  
  // Parse coordinates
  const lat = venue.latitude ? parseFloat(venue.latitude) : undefined;
  const lng = venue.longitude ? parseFloat(venue.longitude) : undefined;
  
  // Extract image URL (Eventbrite uses different image formats)
  let imageUrl: string | undefined;
  if (event.image?.url) {
    imageUrl = event.image.url;
  } else if (event.logo?.url) {
    imageUrl = event.logo.url;
  } else if (event.image_url) {
    imageUrl = event.image_url;
  }
  
  // Extract pricing information
  let priceMin: number | undefined;
  let priceMax: number | undefined;
  
  if (event.is_free) {
    priceMin = 0;
    priceMax = 0;
  } else if (event.ticket_availability) {
    // Try to extract price from ticket availability
    if (event.ticket_availability.minimum_ticket_price) {
      priceMin = parseFloat(event.ticket_availability.minimum_ticket_price.major_value || 0);
    }
    if (event.ticket_availability.maximum_ticket_price) {
      priceMax = parseFloat(event.ticket_availability.maximum_ticket_price.major_value || 0);
    }
  }
  
  // Extract category/genre
  let genre: string | undefined;
  if (event.category) {
    genre = event.category.name || event.category;
  } else if (event.subcategory) {
    genre = event.subcategory.name || event.subcategory;
  }
  
  // Extract dates
  const startDate = event.start?.utc || event.start?.local || event.start_date || new Date().toISOString();
  const endDate = event.end?.utc || event.end?.local || event.end_date;
  
  // Build description from available fields
  const description = event.description?.text || event.summary || event.description || '';
  
  return {
    external_id: event.id,
    source: 'eventbrite',
    title: event.name || 'Untitled Event',
    description: description.slice(0, 500), // Limit description length
    event_url: event.url,
    image_url: imageUrl,
    venue_name: venue.name,
    venue_address: addressParts.join(', ') || undefined,
    lat,
    lng,
    start_date: startDate,
    end_date: endDate,
    price_min: priceMin,
    price_max: priceMax,
    genre,
    classification: 'Eventbrite'
  };
}

/**
 * Get timeframe in milliseconds
 */
function getTimeframeMilliseconds(timeframe: string): number {
  const map: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '48h': 48 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };
  return map[timeframe] || map['24h'];
}

/**
 * Scrape Eventbrite search page HTML and extract events
 * Uses city-based URLs which are more reliable than coordinate-based searches
 */
export async function scrapeEventbriteHTML(
  params: EventbriteSearchParams
): Promise<{ events: EventbriteEvent[]; source: string }> {
  const { center, radius, timeframe, requestId } = params;
  
  console.log(`🕷️ [${requestId}] Scraping Eventbrite HTML`);
  
  // Detect city name from coordinates for better URL construction
  const citySlug = detectCitySlug(center.lat, center.lng);
  
  // Build search page URL - Eventbrite uses city-based URLs
  const searchUrl = citySlug
    ? `https://www.eventbrite.com/d/${citySlug}/all-events/`
    : `https://www.eventbrite.com/d/online/all-events/?loc=${center.lat},${center.lng}`;
  
  console.log(`🌐 [${requestId}] Eventbrite URL: ${searchUrl}`);
  
  let retryCount = 0;
  
  while (retryCount <= EVENTBRITE_CONFIG.RETRY_ATTEMPTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), EVENTBRITE_CONFIG.TIMEOUT_MS);
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': EVENTBRITE_CONFIG.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
          console.warn(`⏳ [${requestId}] Rate limited, retry after ${retryAfter}s`);
          
          if (retryCount < EVENTBRITE_CONFIG.RETRY_ATTEMPTS) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            continue;
          }
          
          throw new Error('Rate limit exceeded');
        }
        
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract events from multiple sources in the HTML
      const events: EventbriteEvent[] = [];
      
      // Method 1: Look for JSON-LD structured data
      const jsonLdEvents = extractJsonLdEvents(html, requestId);
      events.push(...jsonLdEvents);
      
      // Method 2: Look for embedded JSON data (Eventbrite often embeds event data in script tags)
      const embeddedEvents = extractEmbeddedEvents(html, requestId, center, radius);
      events.push(...embeddedEvents);
      
      // Remove duplicates based on external_id
      const uniqueEvents = deduplicateEvents(events);
      
      console.log(`✅ [${requestId}] HTML scraping found ${uniqueEvents.length} unique events`);
      
      return { events: uniqueEvents, source: 'eventbrite' };
      
    } catch (error) {
      if (retryCount < EVENTBRITE_CONFIG.RETRY_ATTEMPTS) {
        retryCount++;
        console.log(`🔄 [${requestId}] Retrying HTML scraping (attempt ${retryCount}):`, error instanceof Error ? error.message : error);
        await new Promise(resolve => setTimeout(resolve, EVENTBRITE_CONFIG.RETRY_DELAY_MS * retryCount));
        continue;
      }
      
      console.error(`❌ [${requestId}] HTML scraping failed:`, error);
      return { events: [], source: 'eventbrite' };
    }
  }
  
  return { events: [], source: 'eventbrite' };
}

/**
 * Detect city slug from coordinates for better URL construction
 */
function detectCitySlug(lat: number, lng: number): string | null {
  const cities = [
    { slug: 'ca--los-angeles', lat: 34.0522, lng: -118.2437, threshold: 0.5 },
    { slug: 'ny--new-york', lat: 40.7128, lng: -74.0060, threshold: 0.5 },
    { slug: 'ca--san-francisco', lat: 37.7749, lng: -122.4194, threshold: 0.3 },
    { slug: 'il--chicago', lat: 41.8781, lng: -87.6298, threshold: 0.5 },
    { slug: 'tx--houston', lat: 29.7604, lng: -95.3698, threshold: 0.5 },
    { slug: 'az--phoenix', lat: 33.4484, lng: -112.0740, threshold: 0.5 },
    { slug: 'tx--san-antonio', lat: 29.4241, lng: -98.4936, threshold: 0.4 },
    { slug: 'ca--san-diego', lat: 32.7157, lng: -117.1611, threshold: 0.4 },
    { slug: 'tx--dallas', lat: 32.7767, lng: -96.7970, threshold: 0.5 },
    { slug: 'ca--san-jose', lat: 37.3382, lng: -121.8863, threshold: 0.3 },
    { slug: 'fl--miami', lat: 25.7617, lng: -80.1918, threshold: 0.4 },
    { slug: 'wa--seattle', lat: 47.6062, lng: -122.3321, threshold: 0.5 }
  ];
  
  for (const city of cities) {
    const latDiff = Math.abs(lat - city.lat);
    const lngDiff = Math.abs(lng - city.lng);
    
    if (latDiff < city.threshold && lngDiff < city.threshold) {
      return city.slug;
    }
  }
  
  return null;
}

/**
 * Extract events from JSON-LD structured data
 */
function extractJsonLdEvents(html: string, requestId: string): EventbriteEvent[] {
  const events: EventbriteEvent[] = [];
  
  try {
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
    
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonText = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          const jsonData = JSON.parse(jsonText);
          
          if (jsonData['@type'] === 'Event' || jsonData['@type'] === 'EventSeries') {
            const event = parseJsonLdEvent(jsonData);
            if (event) {
              events.push(event);
            }
          }
        } catch (e) {
          // Skip invalid JSON-LD
          continue;
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ [${requestId}] Failed to extract JSON-LD events:`, error);
  }
  
  return events;
}

/**
 * Extract events from embedded JavaScript data
 * Eventbrite often includes event data in window.__SERVER_DATA__ or similar variables
 */
function extractEmbeddedEvents(html: string, requestId: string, center: { lat: number; lng: number }, radius: number): EventbriteEvent[] {
  const events: EventbriteEvent[] = [];
  
  try {
    // Look for patterns like: window.__SERVER_DATA__ = {...}
    const serverDataMatch = html.match(/window\.__SERVER_DATA__\s*=\s*({.*?});/s);
    
    if (serverDataMatch) {
      try {
        const serverData = JSON.parse(serverDataMatch[1]);
        
        // Navigate the data structure to find events (structure may vary)
        const extractedEvents = findEventsInObject(serverData);
        
        for (const eventData of extractedEvents) {
          try {
            const event = normalizeEventbriteEvent(eventData);
            
            // Validate location is within radius
            if (event.lat && event.lng && Number.isFinite(event.lat) && Number.isFinite(event.lng)) {
              const distance = calculateDistance(center.lat, center.lng, event.lat, event.lng);
              if (distance <= radius) {
                events.push(event);
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        console.log(`📦 [${requestId}] Extracted ${events.length} events from embedded data`);
      } catch (e) {
        console.warn(`⚠️ [${requestId}] Failed to parse embedded data:`, e);
      }
    }
  } catch (error) {
    console.warn(`⚠️ [${requestId}] Failed to extract embedded events:`, error);
  }
  
  return events;
}

/**
 * Recursively search an object for event-like data
 */
function findEventsInObject(obj: any, maxDepth = 10, currentDepth = 0): any[] {
  if (currentDepth >= maxDepth || !obj || typeof obj !== 'object') {
    return [];
  }
  
  const events: any[] = [];
  
  // Check if this object looks like an event
  if (obj.id && obj.name && (obj.url || obj.start)) {
    events.push(obj);
  }
  
  // Recursively search nested objects and arrays
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (Array.isArray(value)) {
        for (const item of value) {
          events.push(...findEventsInObject(item, maxDepth, currentDepth + 1));
        }
      } else if (typeof value === 'object' && value !== null) {
        events.push(...findEventsInObject(value, maxDepth, currentDepth + 1));
      }
    }
  }
  
  return events;
}

/**
 * Remove duplicate events based on external_id
 */
function deduplicateEvents(events: EventbriteEvent[]): EventbriteEvent[] {
  const seen = new Set<string>();
  const unique: EventbriteEvent[] = [];
  
  for (const event of events) {
    if (!seen.has(event.external_id)) {
      seen.add(event.external_id);
      unique.push(event);
    }
  }
  
  return unique;
}

/**
 * Calculate distance between two coordinates in miles (Haversine formula)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Parse JSON-LD event data from HTML
 */
function parseJsonLdEvent(jsonLd: any): EventbriteEvent | null {
  try {
    const location = jsonLd.location;
    const lat = location?.geo?.latitude ? parseFloat(location.geo.latitude) : undefined;
    const lng = location?.geo?.longitude ? parseFloat(location.geo.longitude) : undefined;
    
    if (!lat || !lng || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    
    return {
      external_id: jsonLd.url?.split('/').pop() || crypto.randomUUID(),
      source: 'eventbrite',
      title: jsonLd.name || 'Untitled Event',
      description: jsonLd.description || '',
      event_url: jsonLd.url,
      image_url: jsonLd.image,
      venue_name: location?.name,
      venue_address: location?.address?.streetAddress,
      lat,
      lng,
      start_date: jsonLd.startDate,
      end_date: jsonLd.endDate,
      price_min: jsonLd.offers?.lowPrice ? parseFloat(jsonLd.offers.lowPrice) : undefined,
      price_max: jsonLd.offers?.highPrice ? parseFloat(jsonLd.offers.highPrice) : undefined,
      genre: undefined,
      classification: 'Eventbrite'
    };
  } catch (error) {
    return null;
  }
}
