// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Enhanced configuration constants
const CONFIG = {
  TICKETMASTER: {
    BASE_URL: 'https://app.ticketmaster.com/discovery/v2/events.json',
    MAX_EVENTS_PER_REQUEST: 200,
    MAX_PAGES: 5,
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000
  },
  CACHE: {
    TTL_MS: 5 * 60 * 1000, // 5 minutes
    MAX_SIZE: 100
  },
  RATE_LIMITING: {
    MAX_REQUESTS_PER_MINUTE: 200,
    WINDOW_MS: 60 * 1000
  }
};

// Enhanced error types
class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public source: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class RateLimitError extends APIError {
  constructor(source: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${source}`, 429, source, true);
    this.name = 'RateLimitError';
  }
}

// In-memory cache for API responses
const cache = new Map<string, { data: any; timestamp: number; expires: number }>();
const requestTracker = new Map<string, { count: number; resetTime: number }>();

// Ticketmaster Market ID mappings for optimal searches
const MARKET_MAPPINGS: Record<string, { id: string; radius: number }> = {
  'new-york': { id: '35', radius: 60 },
  'los-angeles': { id: '27', radius: 60 },
  'chicago': { id: '8', radius: 50 },
  'houston': { id: '18', radius: 45 },
  'phoenix': { id: '17', radius: 50 },
  'philadelphia': { id: '29', radius: 40 },
  'san-antonio': { id: '59', radius: 35 },
  'san-diego': { id: '37', radius: 35 },
  'dallas': { id: '11', radius: 50 },
  'san-jose': { id: '41', radius: 30 },
  'atlanta': { id: '1', radius: 40 },
  'miami': { id: '21', radius: 40 },
  'denver': { id: '12', radius: 40 },
  'seattle': { id: '49', radius: 45 },
  'las-vegas': { id: '20', radius: 35 }
};

Deno.serve(async (req) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);
  
  console.log(`🚀 [${requestId}] Starting request at ${new Date().toISOString()}`);
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Enhanced request parsing with validation
    const body = await parseAndValidateRequest(req);
    console.log(`🎫 [${requestId}] Events fetch request:`, {
      center: body.center,
      bounds: body.bounds ? 'present' : 'none',
      radius: body.radius,
      timeframe: body.timeframe,
      sources: body.source || ['ticketmaster']
    });

    // Enhanced validation with detailed error messages
    const validationError = validateRequest(body);
    if (validationError) {
      return createErrorResponse(validationError, 400, requestId);
    }

    // Initialize Supabase with enhanced error handling
    const supabase = await initializeSupabase();

    // Enhanced source handling with validation
    const sources = normalizeSourceArray(body.source);
    console.log(`📡 [${requestId}] Processing sources: ${sources.join(', ')}`);

    // Enhanced location processing with city detection
    const locationParams = await computeEnhancedLocationParams(body, requestId);
    const { center, radius, detectedCity, marketInfo } = locationParams;
    const timeframe = body.timeframe || '24h';
    
    console.log(`🗺️ [${requestId}] Location: ${center.lat},${center.lng} • radius: ${radius}mi • timeframe: ${timeframe}`);
    if (detectedCity) {
      console.log(`🏙️ [${requestId}] Detected city: ${detectedCity} • market: ${marketInfo?.id || 'none'}`);
    }

    // Optimized cleanup with batch processing
    await performOptimizedCleanup(supabase, requestId);

    // Enhanced parallel processing with retry logic
    const allEvents = [];
    const processedSources = [];
    const sourcePromises = [];
    
    for (const source of sources) {
      if (source === 'ticketmaster') {
        const tmKey = Deno.env.get('TICKETMASTER_API_KEY');
        if (!tmKey) {
          console.warn(`⚠️ [${requestId}] Missing Ticketmaster API key, skipping Ticketmaster`);
        } else {
          sourcePromises.push(
            fetchTicketmasterEventsEnhanced(tmKey, {
              center,
              radius,
              timeframe,
              marketInfo,
              requestId
            })
          );
        }
      }

      if (source === 'meetup') {
        const meetupToken = Deno.env.get('MEETUP_API_KEY');
        if (!meetupToken) {
          console.warn(`⚠️ [${requestId}] Missing Meetup OAuth token, skipping Meetup`);
        } else {
          sourcePromises.push(
            fetchMeetupEventsEnhanced(meetupToken, {
              center,
              radius,
              timeframe,
              requestId
            })
          );
        }
      }
    }
    
    // Execute all source fetches in parallel with timeout
    const sourceResults = await Promise.allSettled(
      sourcePromises.map(promise => 
        Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new APIError('Source timeout', 408, 'timeout')), CONFIG.TICKETMASTER.TIMEOUT_MS)
          )
        ])
      )
    );
    
    // Process results with enhanced error handling
    for (let i = 0; i < sourceResults.length; i++) {
      const result = sourceResults[i];
      const source = sources[i];
      
      if (result.status === 'fulfilled') {
        allEvents.push(...result.value.events);
        processedSources.push(source);
        console.log(`✅ [${requestId}] ${source} events: ${result.value.events.length}`);
      } else {
        console.error(`❌ [${requestId}] ${source} failed:`, result.reason);
      }
    }

    // Enhanced batch processing with deduplication and validation
    const { createdCount, updatedCount, processedEvents } = await processBatchEvents(
      supabase, 
      allEvents, 
      requestId
    );

    // Enhanced response with performance metrics
    const duration = Date.now() - startTime;
    const summary = {
      success: true,
      requestId,
      timestamp: new Date().toISOString(),
      duration,
      location: {
        center,
        radius,
        detectedCity,
        marketInfo
      },
      sources: {
        requested: sources,
        processed: processedSources,
        failed: sources.filter(s => !processedSources.includes(s))
      },
      timeframe,
      events: {
        total: allEvents.length,
        created: createdCount,
        updated: updatedCount,
        skipped: allEvents.length - (createdCount + updatedCount)
      },
      performance: {
        durationMs: duration,
        eventsPerSecond: duration > 0 ? Math.round((allEvents.length / duration) * 1000) : 0
      },
      processedEvents: processedEvents.slice(0, 10) // Limit for response size
    };
    
    console.log(`🎯 [${requestId}] Sync completed in ${duration}ms:`, {
      events: summary.events,
      performance: summary.performance
    });

    return new Response(JSON.stringify(summary), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Duration-MS': duration.toString()
      },
      status: 200
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 [${requestId}] Error in events function (${duration}ms):`, error);
    
    return createErrorResponse(
      error instanceof APIError ? error : new APIError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        500,
        'internal'
      ),
      error instanceof APIError ? error.statusCode : 500,
      requestId,
      duration
    );
  }
});

/* ======================== ENHANCED UTILITY FUNCTIONS ======================== */

// Enhanced request parsing and validation
async function parseAndValidateRequest(req: Request): Promise<any> {
  try {
    const text = await req.text();
    if (!text.trim()) {
      return {};
    }
    return JSON.parse(text);
  } catch (error) {
    throw new APIError('Invalid JSON in request body', 400, 'request-parsing');
  }
}

// Comprehensive request validation
function validateRequest(body: any): APIError | null {
  if (!hasCenter(body) && !hasBounds(body)) {
    return new APIError(
      'Missing location data: must provide either center coordinates or map bounds',
      400,
      'validation'
    );
  }
  
  if (body.radius && (typeof body.radius !== 'number' || body.radius < 1 || body.radius > 200)) {
    return new APIError(
      'Invalid radius: must be a number between 1 and 200 miles',
      400,
      'validation'
    );
  }
  
  if (body.timeframe && !['1h', '6h', '12h', '24h', '48h', '7d'].includes(body.timeframe)) {
    return new APIError(
      'Invalid timeframe: must be one of 1h, 6h, 12h, 24h, 48h, 7d',
      400,
      'validation'
    );
  }
  
  return null;
}

// Enhanced Supabase initialization
async function initializeSupabase() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new APIError('Missing Supabase configuration', 500, 'configuration');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Enhanced source array normalization
function normalizeSourceArray(source: any): string[] {
  if (!source) return ['ticketmaster'];
  if (typeof source === 'string') return [source];
  if (Array.isArray(source)) return source.filter(s => typeof s === 'string' && s.trim());
  return ['ticketmaster'];
}

// Enhanced location processing with city detection
async function computeEnhancedLocationParams(
  body: any, 
  requestId: string
): Promise<{
  center: { lat: number; lng: number };
  radius: number;
  detectedCity?: string;
  marketInfo?: { id: string; radius: number };
}> {
  const baseParams = computeCenterAndRadius(body);
  
  // Attempt city detection for enhanced market targeting
  let detectedCity: string | undefined;
  let marketInfo: { id: string; radius: number } | undefined;
  
  try {
    detectedCity = detectNearestCityId(baseParams.center.lat, baseParams.center.lng);
    if (detectedCity && MARKET_MAPPINGS[detectedCity]) {
      marketInfo = MARKET_MAPPINGS[detectedCity];
      console.log(`🎯 [${requestId}] Using Ticketmaster market ${marketInfo.id} for ${detectedCity}`);
    }
  } catch (error) {
    console.warn(`⚠️ [${requestId}] City detection failed:`, error);
  }
  
  return {
    ...baseParams,
    radius: marketInfo?.radius || baseParams.radius,
    detectedCity,
    marketInfo
  };
}

// Simple city detection based on major metropolitan areas
function detectNearestCityId(lat: number, lng: number): string | undefined {
  const cities = [
    { id: 'new-york', lat: 40.7128, lng: -74.0060 },
    { id: 'los-angeles', lat: 34.0522, lng: -118.2437 },
    { id: 'chicago', lat: 41.8781, lng: -87.6298 },
    { id: 'houston', lat: 29.7604, lng: -95.3698 },
    { id: 'phoenix', lat: 33.4484, lng: -112.0740 },
    { id: 'philadelphia', lat: 39.9526, lng: -75.1652 },
    { id: 'san-antonio', lat: 29.4241, lng: -98.4936 },
    { id: 'san-diego', lat: 32.7157, lng: -117.1611 },
    { id: 'dallas', lat: 32.7767, lng: -96.7970 },
    { id: 'san-jose', lat: 37.3382, lng: -121.8863 },
    { id: 'atlanta', lat: 33.7490, lng: -84.3880 },
    { id: 'miami', lat: 25.7617, lng: -80.1918 },
    { id: 'denver', lat: 39.7392, lng: -104.9903 },
    { id: 'seattle', lat: 47.6062, lng: -122.3321 },
    { id: 'las-vegas', lat: 36.1699, lng: -115.1398 }
  ];
  
  let nearest = cities[0];
  let minDistance = calculateDistance(lat, lng, nearest.lat, nearest.lng);
  
  for (const city of cities.slice(1)) {
    const distance = calculateDistance(lat, lng, city.lat, city.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = city;
    }
  }
  
  // Only return if reasonably close (within 100 miles)
  return minDistance <= 100 ? nearest.id : undefined;
}

// Optimized cleanup with better performance
async function performOptimizedCleanup(supabase: any, requestId: string): Promise<void> {
  try {
    const cutoffTime = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(); // 12 hours ago
    
    const { error, count } = await supabase
      .from('messages')
      .delete()
      .lt('expires_at', cutoffTime)
      .eq('message_type', 'event');
    
    if (error) {
      console.warn(`⚠️ [${requestId}] Cleanup warning:`, error);
    } else if (count > 0) {
      console.log(`🧹 [${requestId}] Cleaned up ${count} expired events`);
    }
  } catch (error) {
    console.warn(`⚠️ [${requestId}] Cleanup failed:`, error);
  }
}

// Enhanced batch event processing
async function processBatchEvents(
  supabase: any,
  events: any[],
  requestId: string
): Promise<{ createdCount: number; updatedCount: number; processedEvents: any[] }> {
  let createdCount = 0;
  let updatedCount = 0;
  const processedEvents = [];
  const validEvents = [];
  
  // Validation and deduplication phase
  const eventMap = new Map<string, any>();
  
  for (const event of events) {
    // Validate coordinates
    if (!Number.isFinite(event.lat) || !Number.isFinite(event.lng)) {
      console.warn(`⚠️ [${requestId}] Skipping event without valid coordinates: ${event.title}`);
      continue;
    }
    
    // Deduplicate by external ID
    const key = `${event.source}-${event.external_id}`;
    if (eventMap.has(key)) {
      console.log(`🔄 [${requestId}] Deduplicating event: ${event.title}`);
      continue;
    }
    
    eventMap.set(key, event);
    validEvents.push(event);
  }
  
  console.log(`🔍 [${requestId}] Processing ${validEvents.length} valid events (${events.length - validEvents.length} filtered)`);
  
  // Batch processing with concurrency control
  const BATCH_SIZE = 10;
  const batches = [];
  
  for (let i = 0; i < validEvents.length; i += BATCH_SIZE) {
    batches.push(validEvents.slice(i, i + BATCH_SIZE));
  }
  
  for (const batch of batches) {
    const batchPromises = batch.map(async (event) => {
      try {
        const existing = await supabase
          .from('messages')
          .select('id')
          .eq('message_type', 'event')
          .eq('event_source', event.source)
          .eq('external_event_id', event.external_id)
          .limit(1)
          .maybeSingle();
        
        if (existing.data?.id) {
          await updateEventLoMessage(supabase, existing.data.id, event);
          updatedCount++;
          return {
            id: existing.data.id,
            action: 'updated',
            event: event.title
          };
        } else {
          const messageId = await createEventLoMessage(supabase, event);
          createdCount++;
          return {
            id: messageId,
            action: 'created',
            event: event.title
          };
        }
      } catch (error) {
        console.error(`❌ [${requestId}] Error processing event ${event.title}:`, error);
        return null;
      }
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value) {
        processedEvents.push(result.value);
      }
    }
  }
  
  return { createdCount, updatedCount, processedEvents };
}

// Enhanced error response creation
function createErrorResponse(
  error: APIError | Error,
  statusCode: number,
  requestId: string,
  duration?: number
): Response {
  const errorResponse = {
    success: false,
    requestId,
    error: {
      message: error.message,
      type: error.name,
      source: error instanceof APIError ? error.source : 'internal',
      retryable: error instanceof APIError ? error.retryable : false
    },
    timestamp: new Date().toISOString(),
    duration
  };
  
  return new Response(JSON.stringify(errorResponse), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Request-ID': requestId
    },
    status: statusCode
  });
}

// Enhanced cache management
function getCacheKey(center: { lat: number; lng: number }, radius: number, timeframe: string): string {
  const lat = Math.round(center.lat * 100) / 100; // Round to 2 decimal places
  const lng = Math.round(center.lng * 100) / 100;
  return `tm-${lat}-${lng}-${radius}-${timeframe}`;
}

function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expires) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCachedData(key: string, data: any): void {
  // Implement LRU eviction
  if (cache.size >= CONFIG.CACHE.MAX_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  
  cache.set(key, {
    data,
    timestamp: Date.now(),
    expires: Date.now() + CONFIG.CACHE.TTL_MS
  });
}

// Enhanced rate limiting
function checkRateLimit(source: string): boolean {
  const now = Date.now();
  const key = `rate-${source}`;
  const tracker = requestTracker.get(key);
  
  if (!tracker || now > tracker.resetTime) {
    requestTracker.set(key, {
      count: 1,
      resetTime: now + CONFIG.RATE_LIMITING.WINDOW_MS
    });
    return true;
  }
  
  if (tracker.count >= CONFIG.RATE_LIMITING.MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  tracker.count++;
  return true;
}

/* ======================== ENHANCED TICKETMASTER INTEGRATION ======================== */

// Enhanced Ticketmaster events fetcher with retry logic and optimizations
async function fetchTicketmasterEventsEnhanced(
  apiKey: string,
  params: {
    center: { lat: number; lng: number };
    radius: number;
    timeframe: string;
    marketInfo?: { id: string; radius: number };
    requestId: string;
  }
): Promise<{ events: any[]; source: string }> {
  const { center, radius, timeframe, marketInfo, requestId } = params;
  
  // Check rate limiting
  if (!checkRateLimit('ticketmaster')) {
    throw new RateLimitError('ticketmaster');
  }
  
  // Check cache first
  const cacheKey = getCacheKey(center, radius, timeframe);
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    console.log(`💾 [${requestId}] Using cached Ticketmaster data`);
    return { events: cachedData, source: 'ticketmaster' };
  }
  
  const now = new Date();
  const endTime = new Date(now.getTime() + getTimeframeMilliseconds(timeframe));
  const startDateTime = isoNoMs(now);
  const endDateTime = isoNoMs(endTime);
  
  // Build enhanced request parameters
  const searchParams: Record<string, string> = {
    apikey: apiKey,
    size: CONFIG.TICKETMASTER.MAX_EVENTS_PER_REQUEST.toString(),
    sort: 'date,asc',
    includeTest: 'no',
    startDateTime,
    endDateTime
  };
  
  // Use market ID if available for more targeted results
  if (marketInfo?.id) {
    searchParams.marketId = marketInfo.id;
    console.log(`🎯 [${requestId}] Using market ID ${marketInfo.id} for enhanced targeting`);
  } else {
    // Fallback to geographic search
    searchParams.latlong = `${center.lat},${center.lng}`;
    searchParams.radius = String(Math.max(1, Math.min(100, Math.round(radius))));
    searchParams.unit = 'miles';
  }
  
  const base = new URL(CONFIG.TICKETMASTER.BASE_URL);
  base.search = new URLSearchParams(searchParams).toString();

  let page = 0;
  let totalPages = 1;
  const events = [];
  let retryCount = 0;
  
  while (page < totalPages && page < CONFIG.TICKETMASTER.MAX_PAGES) {
    const url = new URL(base);
    url.searchParams.set('page', String(page));
    
    // Log redacted URL for security
    const redacted = new URL(url);
    redacted.searchParams.set('apikey', '[API_KEY]');
    console.log(`🌐 [${requestId}] TM Request (page ${page + 1}): ${redacted.toString()}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TICKETMASTER.TIMEOUT_MS);
      
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GeoWhispers-Events/2.0',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        if (res.status === 429) {
          throw new RateLimitError('ticketmaster', parseInt(res.headers.get('Retry-After') || '60'));
        }
        
        if (res.status >= 500 && retryCount < CONFIG.TICKETMASTER.RETRY_ATTEMPTS) {
          retryCount++;
          console.log(`🔄 [${requestId}] Retrying Ticketmaster request (attempt ${retryCount})`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.TICKETMASTER.RETRY_DELAY_MS * retryCount));
          continue;
        }
        
        throw new APIError(`Ticketmaster API error: ${res.status} ${res.statusText}`, res.status, 'ticketmaster', res.status < 500);
      }
      
      const data = await res.json();
      
      if (data._embedded?.events) {
        events.push(...data._embedded.events);
        console.log(`📥 [${requestId}] Fetched ${data._embedded.events.length} events from page ${page + 1}`);
      }
      
      totalPages = Math.min(data.page?.totalPages ?? 1, CONFIG.TICKETMASTER.MAX_PAGES);
      page++;
      retryCount = 0; // Reset retry count on successful request
      
    } catch (error) {
      if (error instanceof RateLimitError || error instanceof APIError) {
        throw error;
      }
      
      if (retryCount < CONFIG.TICKETMASTER.RETRY_ATTEMPTS) {
        retryCount++;
        console.log(`🔄 [${requestId}] Retrying after error (attempt ${retryCount}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, CONFIG.TICKETMASTER.RETRY_DELAY_MS * retryCount));
        continue;
      }
      
      throw new APIError(
        `Ticketmaster fetch failed: ${error.message}`,
        500,
        'ticketmaster',
        false
      );
    }
  }

  const normalizedEvents = events
    .map(normalizeTicketmasterEvent)
    .filter(event => {
      // Enhanced validation
      if (!Number.isFinite(event.lat) || !Number.isFinite(event.lng)) {
        console.warn(`⚠️ [${requestId}] Filtering event with invalid coordinates: ${event.title}`);
        return false;
      }
      
      if (!event.external_id || !event.title) {
        console.warn(`⚠️ [${requestId}] Filtering event with missing required fields: ${event.title || 'Unknown'}`);
        return false;
      }
      
      return true;
    });
  
  // Cache the results
  setCachedData(cacheKey, normalizedEvents);
  
  console.log(`✅ [${requestId}] Ticketmaster fetch completed: ${normalizedEvents.length} valid events`);
  
  return { events: normalizedEvents, source: 'ticketmaster' };
}

function normalizeTicketmasterEvent(event: any) {
  const venue = event._embedded?.venues?.[0];
  const addressParts = [
    venue?.address?.line1,
    venue?.address?.line2,
    venue?.city?.name,
    venue?.state?.stateCode,
    venue?.postalCode,
    venue?.country?.countryCode
  ].filter(Boolean);
  const priceRanges = event.priceRanges?.[0];
  const classification = event.classifications?.[0];
  const lat = venue?.location?.latitude != null ? parseFloat(venue.location.latitude) : undefined;
  const lng = venue?.location?.longitude != null ? parseFloat(venue.location.longitude) : undefined;
  return {
    external_id: event.id,
    source: 'ticketmaster',
    title: event.name ?? 'Untitled Event',
    description: event.info || event.pleaseNote || '',
    event_url: event.url,
    image_url: event.images?.find((img: any) => img.width > 300)?.url || event.images?.[0]?.url,
    venue_name: venue?.name,
    venue_address: addressParts.join(', '),
    lat,
    lng,
    start_date: event.dates?.start?.dateTime,
    end_date: event.dates?.end?.dateTime,
    price_min: priceRanges?.min,
    price_max: priceRanges?.max,
    genre: classification?.genre?.name,
    classification: classification?.segment?.name
  };
}

/* ======================== ENHANCED MEETUP INTEGRATION ======================== */

// Enhanced Meetup events fetcher
async function fetchMeetupEventsEnhanced(
  oauthToken: string,
  params: {
    center: { lat: number; lng: number };
    radius: number;
    timeframe: string;
    requestId: string;
  }
): Promise<{ events: any[]; source: string }> {
  const { center, radius, timeframe, requestId } = params;
  
  // Check rate limiting
  if (!checkRateLimit('meetup')) {
    throw new RateLimitError('meetup');
  }
  
  // Check cache
  const cacheKey = getCacheKey(center, radius, timeframe).replace('tm-', 'meetup-');
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    console.log(`💾 [${requestId}] Using cached Meetup data`);
    return { events: cachedData, source: 'meetup' };
  }
  
  const now = new Date();
  const endTime = new Date(now.getTime() + getTimeframeMilliseconds(timeframe));
  
  const query = `
    query($filter: SearchConnectionFilter!) {
      keywordSearch(filter: $filter) {
        count
        edges {
          node {
            id
            result {
              ... on Event {
                id
                title
                eventUrl
                description
                dateTime
                endTime
                going
                maxTickets
                venue { name address lat lng }
                group { name urlname }
                featuredEventPhoto { baseUrl }
              }
            }
          }
        }
      }
    }
  `;
  
  const variables = {
    filter: {
      query: "",
      lat: center.lat,
      lng: center.lng,
      radius: Math.min(radius, 100), // Meetup has radius limits
      startDateRange: now.toISOString(),
      endDateRange: endTime.toISOString(),
      eventType: "PHYSICAL",
      sortField: "DATETIME"
    }
  };
  
  let retryCount = 0;
  let edges = [];
  
  while (retryCount <= CONFIG.TICKETMASTER.RETRY_ATTEMPTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TICKETMASTER.TIMEOUT_MS);
      
      const res = await fetch('https://api.meetup.com/gql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${oauthToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'GeoWhispers-Events/2.0'
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        if (res.status === 429) {
          throw new RateLimitError('meetup');
        }
        
        if (res.status >= 500 && retryCount < CONFIG.TICKETMASTER.RETRY_ATTEMPTS) {
          retryCount++;
          console.log(`🔄 [${requestId}] Retrying Meetup request (attempt ${retryCount})`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.TICKETMASTER.RETRY_DELAY_MS * retryCount));
          continue;
        }
        
        throw new APIError(`Meetup API error: ${res.status} ${res.statusText}`, res.status, 'meetup', res.status < 500);
      }
      
      const data = await res.json();
      
      if (data.errors) {
        throw new APIError(
          `Meetup GraphQL error: ${data.errors[0]?.message || 'Unknown error'}`,
          400,
          'meetup'
        );
      }
      
      edges = data.data?.keywordSearch?.edges ?? [];
      break; // Success, exit retry loop
      
    } catch (error) {
      if (error instanceof RateLimitError || error instanceof APIError) {
        throw error;
      }
      
      if (retryCount < CONFIG.TICKETMASTER.RETRY_ATTEMPTS) {
        retryCount++;
        console.log(`🔄 [${requestId}] Retrying Meetup after error (attempt ${retryCount}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, CONFIG.TICKETMASTER.RETRY_DELAY_MS * retryCount));
        continue;
      }
      
      throw new APIError(
        `Meetup fetch failed: ${error.message}`,
        500,
        'meetup',
        false
      );
    }
  }

  const normalizedEvents = edges
    .map((edge: any) => {
      const ev = edge.node?.result;
      if (!ev || ev.__typename !== 'Event') return null;
      
      const lat = ev.venue?.lat;
      const lng = ev.venue?.lng;
      
      return {
        external_id: ev.id,
        source: 'meetup',
        title: ev.title || 'Untitled Meetup',
        description: ev.description || '',
        event_url: ev.eventUrl,
        image_url: ev.featuredEventPhoto?.baseUrl,
        venue_name: ev.venue?.name || ev.group?.name,
        venue_address: ev.venue?.address || undefined,
        lat: Number.isFinite(lat) ? lat : undefined,
        lng: Number.isFinite(lng) ? lng : undefined,
        start_date: ev.dateTime,
        end_date: ev.endTime,
        price_min: 0,
        price_max: 0,
        genre: 'Community',
        classification: 'Meetup',
        attendee_count: ev.going
      };
    })
    .filter((event: any) => {
      if (!event) return false;
      
      if (!Number.isFinite(event.lat) || !Number.isFinite(event.lng)) {
        console.warn(`⚠️ [${requestId}] Filtering Meetup event with invalid coordinates: ${event.title}`);
        return false;
      }
      
      return true;
    });
  
  // Cache the results
  setCachedData(cacheKey, normalizedEvents);
  
  console.log(`✅ [${requestId}] Meetup fetch completed: ${normalizedEvents.length} valid events`);
  
  return { events: normalizedEvents, source: 'meetup' };
}

/* ======================== DATABASE OPERATIONS ======================== */

// Enhanced event message creation with better error handling
async function createEventLoMessage(supabase: any, event: any): Promise<string> {
  const content = generateEventContent(event);
  const { data, error } = await supabase.from('messages').insert({
    content,
    media_url: event.image_url,
    is_public: true,
    location: event.venue_address || event.venue_name,
    lat: event.lat,
    lng: event.lng,
    message_type: 'event',
    event_source: event.source,
    external_event_id: event.external_id,
    event_url: event.event_url,
    event_title: event.title,
    event_venue: event.venue_name,
    event_start_date: event.start_date,
    event_end_date: event.end_date,
    event_price_min: event.price_min,
    event_price_max: event.price_max,
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    user_id: null
  }).select('id').single();
  if (error) throw new Error(`Failed to create Lo message: ${error.message}`);
  return data.id;
}

// Enhanced event message updating
async function updateEventLoMessage(supabase: any, messageId: string, event: any): Promise<void> {
  const content = generateEventContent(event);
  const { error } = await supabase.from('messages').update({
    content,
    media_url: event.image_url,
    event_url: event.event_url,
    event_title: event.title,
    event_venue: event.venue_name,
    event_start_date: event.start_date,
    event_end_date: event.end_date,
    event_price_min: event.price_min,
    event_price_max: event.price_max,
    updated_at: new Date().toISOString()
  }).eq('id', messageId);
  if (error) throw new Error(`Failed to update Lo message: ${error.message}`);
}

/* ======================== UTILITY FUNCTIONS ======================== */

// Calculate distance between coordinates (Haversine formula)
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

// Validation functions
function hasCenter(p: any): boolean {
  return p?.center && Number.isFinite(p.center.lat) && Number.isFinite(p.center.lng);
}

function hasBounds(p: any): boolean {
  const b = p?.bounds;
  return b && [
    b.north,
    b.south,
    b.east,
    b.west
  ].every((v: any) => typeof v === 'number' && isFinite(v));
}

function computeCenterAndRadius(p: any): { center: { lat: number; lng: number }; radius: number } {
  if (!hasCenter(p) && !hasBounds(p)) {
    throw new Error('Missing center/bounds');
  }
  let center = hasCenter(p) ? p.center : {
    lat: (p.bounds.north + p.bounds.south) / 2,
    lng: (p.bounds.east + p.bounds.west) / 2
  };
  let radius = typeof p.radius === 'number' ? p.radius : 25;
  if (hasBounds(p)) {
    const milesPerLat = 69;
    const milesPerLng = 69 * Math.cos(center.lat * Math.PI / 180);
    const dy = (p.bounds.north - p.bounds.south) * milesPerLat / 2;
    const dx = (p.bounds.east - p.bounds.west) * milesPerLng / 2;
    radius = Math.max(1, Math.min(100, Math.ceil(Math.max(dx, dy) * 1.1)));
  }
  return {
    center,
    radius
  };
}

function generateEventContent(event: any): string {
  const emoji = getEventEmoji(event.classification || event.genre, event.source);
  const startTime = event.start_date ? new Date(event.start_date) : new Date();
  const timeString = startTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const cityTag = deriveCityTag(event);
  let content = `${emoji} ${event.title}\n\n`;
  content += `📍 ${event.venue_name ?? 'Venue TBA'}\n`;
  if (event.venue_address) content += `${event.venue_address}\n\n`;
  else content += `\n`;
  content += `🕐 ${timeString}\n\n`;
  if (event.genre || event.classification) {
    content += `🎵 ${[
      event.genre,
      event.classification
    ].filter(Boolean).join(' • ')}\n\n`;
  }
  if (event.description) {
    const desc = String(event.description).slice(0, 200);
    content += `${desc}${event.description.length > 200 ? '...' : ''}\n\n`;
  }
  if (Number.isFinite(event.price_min)) {
    content += `💰 From $${event.price_min}${Number.isFinite(event.price_max) && event.price_max !== event.price_min ? ` - $${event.price_max}` : ''}\n\n`;
  }
  content += `🎟️ ${event.source === 'meetup' ? 'Join event' : 'Get tickets'} now ↗️\n\n`;
  content += `#Events #${cityTag} #${capFirst(event.source)} #RealTime`;
  return content;
}

function deriveCityTag(event: any): string {
  const m = event.venue_address?.match(/,\s*([^,]+)\s*,\s*([A-Z]{2}|\w{2,})\b/);
  const city = m?.[1]?.trim() || (event.venue_name ? String(event.venue_name).split(',').pop() : 'Local');
  return String(city).replace(/\s+/g, '');
}

function getEventEmoji(category: string | undefined, source: string): string {
  if (source === 'meetup') return '🤝';
  if (!category) return '🎫';
  const lower = category.toLowerCase();
  if (lower.includes('music') || lower.includes('concert')) return '🎵';
  if (lower.includes('sport')) return '🏟️';
  if (lower.includes('theater') || lower.includes('arts')) return '🎭';
  if (lower.includes('comedy')) return '😂';
  if (lower.includes('family')) return '👨‍👩‍👧‍👦';
  if (lower.includes('community') || lower.includes('meetup')) return '🤝';
  return '🎫';
}

function getTimeframeMilliseconds(timeframe: string): number {
  const map = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '48h': 48 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };
  return map[timeframe as keyof typeof map] ?? map['24h'];
}

function capFirst(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function isoNoMs(d: Date): string {
  return d.toISOString().split('.')[0] + 'Z';
}