import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TicketmasterEventData {
  external_id: string
  source: 'ticketmaster'
  title: string
  description?: string
  event_url?: string
  image_url?: string
  venue_name?: string
  venue_address?: string
  lat?: number
  lng?: number
  start_date: string
  end_date?: string
  price_min?: number
  price_max?: number
  genre?: string
  classification?: string
}

interface RequestBody {
  source: string
  location?: string
  radius?: number
  timeframe?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    console.log('🎫 Real-time events fetch request:', body)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const ticketmasterKey = Deno.env.get('TICKETMASTER_API_KEY')

    if (!ticketmasterKey) {
      console.error('❌ Missing Ticketmaster API key')
      throw new Error('Missing Ticketmaster API key - please set TICKETMASTER_API_KEY environment variable')
    }

    // Fetch current Ticketmaster events
    console.log('📡 Fetching live Ticketmaster events...')
    const events = await fetchTicketmasterEvents(ticketmasterKey, body)
    console.log(`✅ Retrieved ${events.length} events from Ticketmaster API`)
    
    // Clear existing Ticketmaster events to ensure fresh data consistency
    console.log('🧹 Clearing existing Ticketmaster events for fresh data...')
    await supabase
      .from('messages')
      .delete()
      .eq('message_type', 'event')
      .eq('event_source', 'ticketmaster')

    // Process and store all current events as Lo messages
    let createdCount = 0
    const processedEvents = []

    for (const event of events) {
      try {
        if (!event.lat || !event.lng) {
          console.warn(`⚠️ Skipping event without coordinates: ${event.title}`)
          continue
        }

        // Create new Lo message for each event (fresh data)
        const messageId = await createEventLoMessage(supabase, event)
        createdCount++
        processedEvents.push({ id: messageId, action: 'created', event: event.title })
        console.log(`✨ Created Lo message: ${event.title} at ${event.venue_name}`)
        
      } catch (eventError) {
        console.error(`❌ Error processing event ${event.title}:`, eventError)
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'ticketmaster',
      location: body.location || 'los-angeles',
      timeframe: body.timeframe || '24h',
      totalEvents: events.length,
      newEvents: createdCount,
      processedEvents,
      message: `✅ Loaded ${createdCount} current Ticketmaster events for the next 24 hours`
    }

    console.log('🎯 Sync summary:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('💥 Error in real-time events function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function fetchTicketmasterEvents(apiKey: string, params: RequestBody): Promise<TicketmasterEventData[]> {
  // Los Angeles coordinates (configurable)
  const coordinates = getLocationCoordinates(params.location || 'los-angeles')
  const radius = params.radius || 25
  const timeframe = params.timeframe || '24h'
  
  // Calculate precise 24-hour window from current time
  const now = new Date()
  const endTime = new Date(now.getTime() + getTimeframeMilliseconds(timeframe))
  
  // Format for Ticketmaster API (they expect specific format)
  const startDateTime = now.toISOString().slice(0, 19) + 'Z'
  const endDateTime = endTime.toISOString().slice(0, 19) + 'Z'
  
  console.log(`⏰ Time window: ${startDateTime} to ${endDateTime}`)
  
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?` +
    `geoPoint=${coordinates.lat},${coordinates.lng}&` +
    `radius=${radius}&unit=miles&` +
    `startDateTime=${startDateTime}&` +
    `endDateTime=${endDateTime}&` +
    `apikey=${apiKey}&` +
    `size=100&` +  // Get more events for complete coverage
    `sort=date,asc&` +
    `includeTest=no&` +  // Exclude test events
    `source=ticketmaster`  // Only Ticketmaster events

  console.log(`🌐 Ticketmaster API URL: ${url.replace(apiKey, '[API_KEY]')}`)

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'GeoWhispers-Events/1.0',
      'Cache-Control': 'no-cache'  // Always get fresh data
    }
  })

  if (!response.ok) {
    throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  if (!data._embedded?.events) {
    console.log('ℹ️ No events found in Ticketmaster response')
    return []
  }

  return data._embedded.events.map((event: any) => {
    const venue = event._embedded?.venues?.[0]
    const priceRanges = event.priceRanges?.[0]
    const classification = event.classifications?.[0]
    
    return {
      external_id: event.id,
      source: 'ticketmaster' as const,
      title: event.name || 'Untitled Event',
      description: event.info || event.pleaseNote || '',
      event_url: event.url,
      image_url: event.images?.find((img: any) => img.width > 300)?.url || event.images?.[0]?.url,
      venue_name: venue?.name,
      venue_address: venue?.address ? 
        `${venue.address.line1}${venue.address.line2 ? ', ' + venue.address.line2 : ''}, ${venue.city.name}, ${venue.state.stateCode} ${venue.postalCode}` : 
        undefined,
      lat: venue?.location?.latitude ? parseFloat(venue.location.latitude) : undefined,
      lng: venue?.location?.longitude ? parseFloat(venue.location.longitude) : undefined,
      start_date: event.dates?.start?.dateTime,
      end_date: event.dates?.end?.dateTime,
      price_min: priceRanges?.min,
      price_max: priceRanges?.max,
      genre: classification?.genre?.name,
      classification: classification?.segment?.name
    }
  }).filter((event: TicketmasterEventData) => event.lat && event.lng)
}

async function createEventLoMessage(supabase: any, event: TicketmasterEventData): Promise<string> {
  // Generate rich content for the Lo message
  const content = generateEventContent(event)

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      content,
      media_url: event.image_url,
      is_public: true,
      location: event.venue_address || event.venue_name,
      lat: event.lat,
      lng: event.lng,
      message_type: 'event',
      event_source: 'ticketmaster',
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
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create Lo message: ${error.message}`)
  }

  return message.id
}

async function updateEventLoMessage(supabase: any, messageId: string, event: TicketmasterEventData): Promise<void> {
  const content = generateEventContent(event)

  const { error } = await supabase
    .from('messages')
    .update({
      content,
      media_url: event.image_url,
      event_url: event.event_url,
      event_start_date: event.start_date,
      event_end_date: event.end_date,
      event_price_min: event.price_min,
      event_price_max: event.price_max,
      updated_at: new Date().toISOString()
    })
    .eq('id', messageId)

  if (error) {
    throw new Error(`Failed to update Lo message: ${error.message}`)
  }
}

function generateEventContent(event: TicketmasterEventData): string {
  const emoji = getEventEmoji(event.classification || event.genre)
  const startTime = event.start_date ? new Date(event.start_date) : new Date()
  const timeString = startTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  let content = `${emoji} ${event.title}\n\n`
  
  // Venue
  content += `📍 ${event.venue_name}\n`
  if (event.venue_address) {
    content += `${event.venue_address}\n\n`
  } else {
    content += '\n'
  }
  
  // Time
  content += `🕐 ${timeString}\n\n`
  
  // Genre/Classification
  if (event.genre || event.classification) {
    content += `🎵 ${event.genre || ''}${event.genre && event.classification ? ' • ' : ''}${event.classification || ''}\n\n`
  }
  
  // Description
  if (event.description) {
    const desc = event.description.slice(0, 200)
    content += `${desc}${event.description.length > 200 ? '...' : ''}\n\n`
  }
  
  // Pricing
  if (event.price_min) {
    content += `💰 From $${event.price_min}${event.price_max && event.price_max !== event.price_min ? ` - $${event.price_max}` : ''}\n\n`
  }
  
  content += `🎟️ Get tickets now ↗️\n\n`
  content += `#Events #LA #Ticketmaster #RealTime`
  
  return content
}

function getEventEmoji(category?: string): string {
  if (!category) return '🎫'
  
  const lower = category.toLowerCase()
  if (lower.includes('music') || lower.includes('concert')) return '🎵'
  if (lower.includes('sport')) return '🏟️'
  if (lower.includes('theater') || lower.includes('arts')) return '🎭'
  if (lower.includes('comedy')) return '😂'
  if (lower.includes('family')) return '👨‍👩‍👧‍👦'
  
  return '🎫'
}

function getLocationCoordinates(location: string): { lat: number; lng: number } {
  const locations: Record<string, { lat: number; lng: number }> = {
    'los-angeles': { lat: 34.0522, lng: -118.2437 },
    'new-york': { lat: 40.7128, lng: -74.0060 },
    'chicago': { lat: 41.8781, lng: -87.6298 },
    'san-francisco': { lat: 37.7749, lng: -122.4194 }
  }
  
  return locations[location] || locations['los-angeles']
}

function getTimeframeMilliseconds(timeframe: string): number {
  const timeframes: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '48h': 48 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  }
  
  return timeframes[timeframe] || timeframes['24h']
}