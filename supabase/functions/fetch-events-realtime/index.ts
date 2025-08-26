// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const body = await req.json().catch(()=>({}));
    console.log('🎫 Events fetch request:', body);
    // 🔴 Hard requirement: must send center or bounds from the map
    if (!hasCenter(body) && !hasBounds(body)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing center/bounds: send map center or bounds after pan/zoom.',
        example: {
          center: {
            lat: 40.7128,
            lng: -74.0060
          },
          bounds: {
            north: 40.92,
            south: 40.53,
            east: -73.68,
            west: -74.26
          }
        }
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Default to Ticketmaster if none provided
    const sources = Array.isArray(body.source) && body.source.length ? body.source : body.source ? [
      body.source
    ] : [
      'ticketmaster'
    ];
    // Compute center & radius strictly from client’s map payload
    const { center, radius } = computeCenterAndRadius(body);
    const timeframe = body.timeframe || '24h';
    console.log(`🗺️ Center ${center.lat},${center.lng} • radius ${radius}mi • timeframe ${timeframe}`);
    console.log(`🎫 Sources: ${sources.join(', ')}`);
    // Optional cleanup of expired events (keeps table tidy)
    await supabase.from('messages').delete().lt('expires_at', new Date().toISOString()).eq('message_type', 'event');
    const allEvents = [];
    const processedSources = [];
    for (const source of sources){
      if (source === 'ticketmaster') {
        const tmKey = Deno.env.get('TICKETMASTER_API_KEY');
        if (!tmKey) {
          console.warn('⚠️ Missing Ticketmaster API key, skipping Ticketmaster');
        } else {
          console.log('📡 Fetching Ticketmaster events…');
          const tmEvents = await fetchTicketmasterEvents(tmKey, {
            center,
            radius,
            timeframe
          });
          allEvents.push(...tmEvents);
          processedSources.push('ticketmaster');
          console.log(`✅ Ticketmaster events: ${tmEvents.length}`);
        }
      }
      if (source === 'meetup') {
        const meetupToken = Deno.env.get('MEETUP_API_KEY'); // OAuth bearer token
        if (!meetupToken) {
          console.warn('⚠️ Missing Meetup OAuth token, skipping Meetup');
        } else {
          console.log('📡 Fetching Meetup events…');
          const muEvents = await fetchMeetupEvents(meetupToken, {
            center,
            radius,
            timeframe
          });
          allEvents.push(...muEvents);
          processedSources.push('meetup');
          console.log(`✅ Meetup events: ${muEvents.length}`);
        }
      }
    }
    // Create or update messages (no global deletes)
    let createdCount = 0;
    let updatedCount = 0;
    const processedEvents = [];
    for (const event of allEvents){
      try {
        if (!Number.isFinite(event.lat) || !Number.isFinite(event.lng)) {
          console.warn(`⚠️ Skipping event without valid coordinates: ${event.title}`);
          continue;
        }
        const existing = await supabase.from('messages').select('id').eq('message_type', 'event').eq('event_source', event.source).eq('external_event_id', event.external_id).limit(1).maybeSingle();
        if (existing.data?.id) {
          await updateEventLoMessage(supabase, existing.data.id, event);
          updatedCount++;
          processedEvents.push({
            id: existing.data.id,
            action: 'updated',
            event: event.title
          });
        } else {
          const messageId = await createEventLoMessage(supabase, event);
          createdCount++;
          processedEvents.push({
            id: messageId,
            action: 'created',
            event: event.title
          });
        }
      } catch (e) {
        console.error(`❌ Error processing event ${event.title}:`, e);
      }
    }
    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      sources: processedSources,
      center,
      radius,
      timeframe,
      totalEvents: allEvents.length,
      newEvents: createdCount,
      updatedEvents: updatedCount,
      processedEvents
    };
    console.log('🎯 Sync summary:', summary);
    return new Response(JSON.stringify(summary), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('💥 Error in events function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
/* ---------------------------- Ticketmaster fetch --------------------------- */ async function fetchTicketmasterEvents(apiKey, params) {
  const { center, radius, timeframe } = params;
  const now = new Date();
  const endTime = new Date(now.getTime() + getTimeframeMilliseconds(timeframe));
  const startDateTime = isoNoMs(now);
  const endDateTime = isoNoMs(endTime);
  const base = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
  // ✅ Use latlong; ❌ do not pass a restrictive "source" filter (allows TM + Universe + Frontgate)
  base.search = new URLSearchParams({
    latlong: `${center.lat},${center.lng}`,
    radius: String(Math.max(1, Math.min(100, Math.round(radius)))),
    unit: 'miles',
    startDateTime,
    endDateTime,
    apikey: apiKey,
    size: '200',
    sort: 'date,asc',
    includeTest: 'no'
  }).toString();
  let page = 0;
  let totalPages = 1;
  const events = [];
  while(page < totalPages){
    const url = new URL(base);
    url.searchParams.set('page', String(page));
    const redacted = new URL(url);
    redacted.searchParams.set('apikey', '[API_KEY]');
    console.log(`🌐 TM URL: ${redacted.toString()}`);
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GeoWhispers-Events/1.0',
        'Cache-Control': 'no-cache'
      }
    });
    if (!res.ok) throw new Error(`Ticketmaster API error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    events.push(...data._embedded?.events ?? []);
    totalPages = data.page?.totalPages ?? 1;
    page++;
  }
  return events.map(normalizeTicketmasterEvent).filter((e)=>Number.isFinite(e.lat) && Number.isFinite(e.lng));
}
function normalizeTicketmasterEvent(event) {
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
    image_url: event.images?.find((img)=>img.width > 300)?.url || event.images?.[0]?.url,
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
/* ------------------------------- Meetup fetch ------------------------------ */ async function fetchMeetupEvents(oauthToken, params) {
  const { center, radius, timeframe } = params;
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
      radius: radius,
      startDateRange: now.toISOString(),
      endDateRange: endTime.toISOString(),
      eventType: "PHYSICAL",
      sortField: "DATETIME"
    }
  };
  const res = await fetch('https://api.meetup.com/gql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${oauthToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'GeoWhispers-Events/1.0'
    },
    body: JSON.stringify({
      query,
      variables
    })
  });
  if (!res.ok) throw new Error(`Meetup API error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  if (data.errors) throw new Error(`Meetup API GraphQL error: ${data.errors[0]?.message || 'Unknown error'}`);
  const edges = data.data?.keywordSearch?.edges ?? [];
  return edges.map((edge)=>{
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
  }).filter((e)=>e && Number.isFinite(e.lat) && Number.isFinite(e.lng));
}
/* ------------------------- Create/Update Lo messages ----------------------- */ async function createEventLoMessage(supabase, event) {
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
async function updateEventLoMessage(supabase, messageId, event) {
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
/* -------------------------------- Utilities -------------------------------- */ function hasCenter(p) {
  return p?.center && Number.isFinite(p.center.lat) && Number.isFinite(p.center.lng);
}
function hasBounds(p) {
  const b = p?.bounds;
  return b && [
    b.north,
    b.south,
    b.east,
    b.west
  ].every((v)=>typeof v === 'number' && isFinite(v));
}
function computeCenterAndRadius(p) {
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
function generateEventContent(event) {
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
function deriveCityTag(event) {
  const m = event.venue_address?.match(/,\s*([^,]+)\s*,\s*([A-Z]{2}|\w{2,})\b/);
  const city = m?.[1]?.trim() || (event.venue_name ? String(event.venue_name).split(',').pop() : 'Local');
  return String(city).replace(/\s+/g, '');
}
function getEventEmoji(category, source) {
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
function getTimeframeMilliseconds(timeframe) {
  const map = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '48h': 48 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };
  return map[timeframe] ?? map['24h'];
}
function capFirst(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function isoNoMs(d) {
  return d.toISOString().split('.')[0] + 'Z';
}
