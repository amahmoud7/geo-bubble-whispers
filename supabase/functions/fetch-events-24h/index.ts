import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EventData {
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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting 24-hour Ticketmaster event fetch process...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const ticketmasterKey = Deno.env.get('TICKETMASTER_API_KEY')

    if (!ticketmasterKey) {
      throw new Error('Missing Ticketmaster API key')
    }

    // Fetch only 24-hour Ticketmaster events (limited to 10 for performance)
    console.log('Fetching TOP 10 Ticketmaster events for next 24 hours...')
    const events = await fetchTicketmaster24HourEvents(ticketmasterKey)
    console.log(`Found ${events.length} Ticketmaster events within 24 hours (limited to 10)`)
    
    // Log event details for debugging
    events.forEach((event, index) => {
      console.log(`Event ${index + 1}: ${event.title} at ${event.venue_name} - ${new Date(event.start_date).toLocaleString()}`)
    })

    // Process and store events as gold Lo messages
    let createdCount = 0
    for (const event of events) {
      try {
        // Check if event already exists
        const { data: existingEvent } = await supabase
          .from('messages')
          .select('id')
          .eq('external_event_id', event.external_id)
          .eq('message_type', 'event')
          .single()

        if (!existingEvent && event.lat && event.lng) {
          // Create gold Lo message for the event
          const messageId = await createGoldEventMessage(supabase, event)
          createdCount++
          console.log(`Created gold Lo message for event: ${event.title} at ${event.venue_name}`)
        }
      } catch (error) {
        console.error(`Error processing event ${event.title}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalEvents: events.length,
        newEvents: createdCount,
        message: `Found ${events.length} events in next 24 hours (top 10), created ${createdCount} new gold Lo messages`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in fetch-events-24h function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function fetchTicketmaster24HourEvents(apiKey: string): Promise<EventData[]> {
  // Los Angeles coordinates (broader area)
  const lat = 34.0522
  const lng = -118.2437
  const radius = 25 // 25 miles to cover Greater LA area
  
  // Get events for next 24 hours only
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  
  const startDateTime = now.toISOString()
  const endDateTime = tomorrow.toISOString()
  
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?geoPoint=${lat},${lng}&radius=${radius}&unit=miles&startDateTime=${startDateTime}&endDateTime=${endDateTime}&apikey=${apiKey}&size=10&sort=date,asc`

  console.log(`Fetching from: ${url.replace(apiKey, '[API_KEY]')}`)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  if (!data._embedded?.events) {
    console.log('No events found in Ticketmaster response')
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
        `${venue.address.line1}, ${venue.city.name}, ${venue.state.stateCode} ${venue.postalCode}` : 
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
  }).filter((event: EventData) => event.lat && event.lng) // Only include events with valid coordinates
}

async function createGoldEventMessage(supabase: any, event: EventData): Promise<string> {
  // Format event time
  const startTime = new Date(event.start_date)
  const timeString = startTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  // Create enhanced event message content
  const messageContent = `🎫✨ ${event.title}

📍 ${event.venue_name}
${event.venue_address || ''}

🕐 ${timeString}

${event.genre ? `🎵 ${event.genre}` : ''}${event.classification ? ` • ${event.classification}` : ''}

${event.description ? `${event.description.slice(0, 200)}${event.description.length > 200 ? '...' : ''}

` : ''}${event.price_min ? `💰 From $${event.price_min}${event.price_max && event.price_max !== event.price_min ? ` - $${event.price_max}` : ''}

` : ''}🎟️ Get tickets now ↗️

#Events #LA #Ticketmaster #Tonight`

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      content: messageContent,
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
      event_price_min: event.price_min,
      event_price_max: event.price_max,
      expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 48 hours
      user_id: null // System-generated message
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create message: ${error.message}`)
  }

  return message.id
}