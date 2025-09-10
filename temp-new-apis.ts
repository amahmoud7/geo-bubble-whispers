// New Event APIs Implementation for Lo
// Replaces broken Eventbrite with SeatGeek, PredictHQ, and Yelp

/* ======================== SEATGEEK INTEGRATION ======================== */

export async function fetchSeatGeekEventsEnhanced(
  clientId: string,
  params: {
    center: { lat: number; lng: number };
    radius: number;
    timeframe: string;
    requestId: string;
  }
): Promise<{ events: any[]; source: string }> {
  const { center, radius, timeframe, requestId } = params;
  
  console.log(`🎟️ [${requestId}] Fetching SeatGeek events...`);
  
  const now = new Date();
  const endTime = new Date(now.getTime() + getTimeframeMilliseconds(timeframe));
  
  try {
    const searchParams = new URLSearchParams({
      'client_id': clientId,
      'lat': center.lat.toString(),
      'lon': center.lng.toString(),
      'range': `${Math.round(radius)}mi`,
      'datetime_utc.gte': now.toISOString().split('.')[0],
      'datetime_utc.lte': endTime.toISOString().split('.')[0],
      'per_page': '100'
    });
    
    const url = `https://api.seatgeek.com/2/events?${searchParams}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`SeatGeek API error: ${response.status}`);
    }
    
    const data = await response.json();
    const events = (data.events || []).map(normalizeSeatGeekEvent).filter(e => e.lat && e.lng);
    
    console.log(`✅ [${requestId}] SeatGeek: ${events.length} events found`);
    return { events, source: 'seatgeek' };
    
  } catch (error: any) {
    console.error(`❌ [${requestId}] SeatGeek error:`, error.message);
    return { events: [], source: 'seatgeek' };
  }
}

function normalizeSeatGeekEvent(event: any) {
  const venue = event.venue;
  return {
    external_id: event.id?.toString(),
    source: 'seatgeek',
    title: event.title || event.short_title || 'Untitled Event',
    description: event.description || '',
    event_url: event.url,
    image_url: event.performers?.[0]?.image || event.performers?.[0]?.images?.huge,
    venue_name: venue?.name || 'Venue TBA',
    venue_address: [venue?.address, venue?.city, venue?.state, venue?.postal_code].filter(Boolean).join(', '),
    lat: venue?.location?.lat,
    lng: venue?.location?.lon,
    start_date: event.datetime_utc,
    end_date: event.datetime_utc,
    price_min: event.stats?.lowest_price,
    price_max: event.stats?.highest_price,
    genre: event.type,
    classification: event.taxonomies?.[0]?.name
  };
}

/* ======================== PREDICTHQ INTEGRATION ======================== */

export async function fetchPredictHQEventsEnhanced(
  apiToken: string,
  params: {
    center: { lat: number; lng: number };
    radius: number;
    timeframe: string;
    requestId: string;
  }
): Promise<{ events: any[]; source: string }> {
  const { center, radius, timeframe, requestId } = params;
  
  console.log(`📊 [${requestId}] Fetching PredictHQ events...`);
  
  const now = new Date();
  const endTime = new Date(now.getTime() + getTimeframeMilliseconds(timeframe));
  
  try {
    const searchParams = new URLSearchParams({
      'within': `${radius}mi@${center.lat},${center.lng}`,
      'active.gte': now.toISOString(),
      'active.lte': endTime.toISOString(),
      'category': 'concerts,festivals,sports,community,conferences',
      'limit': '100',
      'sort': 'start'
    });
    
    const url = `https://api.predicthq.com/v1/events/?${searchParams}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`PredictHQ API error: ${response.status}`);
    }
    
    const data = await response.json();
    const events = (data.results || []).map(normalizePredictHQEvent).filter(e => e.lat && e.lng);
    
    console.log(`✅ [${requestId}] PredictHQ: ${events.length} events found`);
    return { events, source: 'predicthq' };
    
  } catch (error: any) {
    console.error(`❌ [${requestId}] PredictHQ error:`, error.message);
    return { events: [], source: 'predicthq' };
  }
}

function normalizePredictHQEvent(event: any) {
  const location = event.location || event.geo?.geometry?.coordinates;
  return {
    external_id: event.id,
    source: 'predicthq',
    title: event.title,
    description: event.description || '',
    event_url: event.url || '',
    image_url: null,
    venue_name: event.entities?.[0]?.name || event.location_name || 'Venue TBA',
    venue_address: event.entities?.[0]?.formatted_address || '',
    lat: location?.[1], // PredictHQ uses [lng, lat] format
    lng: location?.[0],
    start_date: event.start,
    end_date: event.end,
    price_min: null,
    price_max: null,
    genre: event.category,
    classification: event.labels?.join(', ')
  };
}

/* ======================== YELP EVENTS INTEGRATION ======================== */

export async function fetchYelpEventsEnhanced(
  apiKey: string,
  params: {
    center: { lat: number; lng: number };
    radius: number;
    timeframe: string;
    requestId: string;
  }
): Promise<{ events: any[]; source: string }> {
  const { center, radius, timeframe, requestId } = params;
  
  console.log(`🍴 [${requestId}] Fetching Yelp events...`);
  
  const now = new Date();
  const endTime = new Date(now.getTime() + getTimeframeMilliseconds(timeframe));
  const radiusMeters = Math.min(40000, Math.round(radius * 1609.34));
  
  try {
    const searchParams = new URLSearchParams({
      'latitude': center.lat.toString(),
      'longitude': center.lng.toString(),
      'radius': radiusMeters.toString(),
      'start_date': Math.floor(now.getTime() / 1000).toString(),
      'end_date': Math.floor(endTime.getTime() / 1000).toString(),
      'limit': '50'
    });
    
    const url = `https://api.yelp.com/v3/events?${searchParams}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Yelp API error: ${response.status}`);
    }
    
    const data = await response.json();
    const events = (data.events || []).map(normalizeYelpEvent).filter(e => e.lat && e.lng);
    
    console.log(`✅ [${requestId}] Yelp: ${events.length} events found`);
    return { events, source: 'yelp' };
    
  } catch (error: any) {
    console.error(`❌ [${requestId}] Yelp error:`, error.message);
    return { events: [], source: 'yelp' };
  }
}

function normalizeYelpEvent(event: any) {
  return {
    external_id: event.id,
    source: 'yelp',
    title: event.name,
    description: event.description || '',
    event_url: event.event_site_url,
    image_url: event.image_url,
    venue_name: event.location?.display_address?.[0] || 'Venue TBA',
    venue_address: event.location?.display_address?.join(', ') || '',
    lat: event.latitude,
    lng: event.longitude,
    start_date: event.time_start,
    end_date: event.time_end,
    price_min: event.cost,
    price_max: event.cost_max,
    genre: event.category,
    classification: 'Local Event'
  };
}

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