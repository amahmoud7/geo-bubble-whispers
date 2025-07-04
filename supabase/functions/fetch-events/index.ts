import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EventData {
  external_id: string
  source: 'eventbrite' | 'ticketmaster'
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
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting event fetch process...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body to check for testing mode
    const body = await req.json().catch(() => ({}))
    const isTestMode = body.testMode || body.limit === 1

    const eventbriteToken = Deno.env.get('EVENTBRITE_OAUTH_TOKEN')
    const ticketmasterKey = Deno.env.get('TICKETMASTER_API_KEY')

    if (!eventbriteToken || !ticketmasterKey) {
      throw new Error('Missing required API credentials')
    }

    const events: EventData[] = []

    // Fetch Eventbrite events
    console.log('Fetching Eventbrite events...')
    try {
      const eventbriteEvents = await fetchEventbriteEvents(eventbriteToken)
      events.push(...eventbriteEvents)
      console.log(`Found ${eventbriteEvents.length} Eventbrite events`)
    } catch (error) {
      console.error('Error fetching Eventbrite events:', error)
    }

    // Fetch Ticketmaster events
    console.log('Fetching Ticketmaster events...')
    try {
      const ticketmasterEvents = await fetchTicketmasterEvents(ticketmasterKey)
      events.push(...ticketmasterEvents)
      console.log(`Found ${ticketmasterEvents.length} Ticketmaster events`)
    } catch (error) {
      console.error('Error fetching Ticketmaster events:', error)
    }

    console.log(`Total events found: ${events.length}`)

    // Group events by venue + title to consolidate time slots
    const groupedEvents = new Map<string, EventData>()
    
    for (const event of events) {
      const key = `${event.venue_name}-${event.title}`.toLowerCase()
      
      if (!groupedEvents.has(key)) {
        groupedEvents.set(key, event)
      } else {
        // Keep the earliest start time for the grouped event
        const existing = groupedEvents.get(key)!
        if (new Date(event.start_date) < new Date(existing.start_date)) {
          groupedEvents.set(key, { ...existing, start_date: event.start_date })
        }
      }
    }

    let consolidatedEvents = Array.from(groupedEvents.values())
    
    // Limit to 1 event for testing if requested
    if (isTestMode) {
      consolidatedEvents = consolidatedEvents.slice(0, 1)
      console.log(`Test mode: Limited to 1 event for testing`)
    }
    
    console.log(`Consolidated ${events.length} events into ${consolidatedEvents.length} unique events`)

    // Process and store consolidated events
    let createdCount = 0
    for (const event of consolidatedEvents) {
      try {
        // Check if event already exists by venue + title combination
        const { data: existingEvent } = await supabase
          .from('events')
          .select('id')
          .eq('venue_name', event.venue_name)
          .eq('title', event.title)
          .single()

        if (!existingEvent) {
          // Create Lo message for the event
          const messageId = await createLoMessage(supabase, event)
          
          // Store event record
          const { error: insertError } = await supabase
            .from('events')
            .insert({
              ...event,
              message_id: messageId
            })

          if (insertError) {
            console.error('Error storing event:', insertError)
          } else {
            createdCount++
            console.log(`Created Lo message for event: ${event.title} at ${event.venue_name}`)
          }
        }
      } catch (error) {
        console.error(`Error processing event ${event.title}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalEvents: events.length,
        consolidatedEvents: consolidatedEvents.length,
        newEvents: createdCount,
        message: `Processed ${events.length} events, consolidated to ${consolidatedEvents.length} unique events, created ${createdCount} new Lo messages`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in fetch-events function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function fetchEventbriteEvents(token: string): Promise<EventData[]> {
  // Culver City coordinates
  const lat = 34.0261
  const lng = -118.3959
  const radius = '5mi' // 5 mile radius around Culver City

  const url = `https://www.eventbriteapi.com/v3/events/search/?location.latitude=${lat}&location.longitude=${lng}&location.within=${radius}&start_date.range_start=${new Date().toISOString()}&expand=venue,category&sort_by=distance`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Eventbrite API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  return data.events?.map((event: any) => ({
    external_id: event.id,
    source: 'eventbrite' as const,
    title: event.name?.text || 'Untitled Event',
    description: event.description?.text,
    event_url: event.url,
    image_url: event.logo?.url,
    venue_name: event.venue?.name,
    venue_address: event.venue?.address ? 
      `${event.venue.address.address_1}, ${event.venue.address.city}, ${event.venue.address.region} ${event.venue.address.postal_code}` : 
      undefined,
    lat: event.venue?.latitude ? parseFloat(event.venue.latitude) : undefined,
    lng: event.venue?.longitude ? parseFloat(event.venue.longitude) : undefined,
    start_date: event.start?.utc,
    end_date: event.end?.utc,
    price_min: event.ticket_availability?.minimum_ticket_price?.major_value,
    price_max: event.ticket_availability?.maximum_ticket_price?.major_value
  })) || []
}

async function fetchTicketmasterEvents(apiKey: string): Promise<EventData[]> {
  // Culver City coordinates and 5 mile radius
  const lat = 34.0261
  const lng = -118.3959
  const radius = 5 // 5 miles
  const today = new Date().toISOString().split('T')[0]
  
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?geoPoint=${lat},${lng}&radius=${radius}&unit=miles&startDateTime=${today}T00:00:00Z&apikey=${apiKey}&size=200`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  return data._embedded?.events?.map((event: any) => {
    const venue = event._embedded?.venues?.[0]
    const priceRanges = event.priceRanges?.[0]
    
    return {
      external_id: event.id,
      source: 'ticketmaster' as const,
      title: event.name || 'Untitled Event',
      description: event.info || event.pleaseNote,
      event_url: event.url,
      image_url: event.images?.[0]?.url,
      venue_name: venue?.name,
      venue_address: venue?.address ? 
        `${venue.address.line1}, ${venue.city.name}, ${venue.state.stateCode} ${venue.postalCode}` : 
        undefined,
      lat: venue?.location?.latitude ? parseFloat(venue.location.latitude) : undefined,
      lng: venue?.location?.longitude ? parseFloat(venue.location.longitude) : undefined,
      start_date: event.dates?.start?.dateTime,
      end_date: event.dates?.end?.dateTime,
      price_min: priceRanges?.min,
      price_max: priceRanges?.max
    }
  }) || []
}

async function createLoMessage(supabase: any, event: EventData): Promise<string> {
  // Create a Lo message for the event
  const messageContent = `🎫 ${event.title}
  
📍 ${event.venue_name}${event.venue_address ? `\n${event.venue_address}` : ''}

📅 Starting ${new Date(event.start_date).toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})} - Multiple time slots available

${event.description ? `\n${event.description.slice(0, 200)}${event.description.length > 200 ? '...' : ''}` : ''}

${event.price_min ? `💰 From $${event.price_min}` : ''}

🔗 Get tickets: ${event.event_url}

#Events #LA #${event.source === 'eventbrite' ? 'Eventbrite' : 'Ticketmaster'}`

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      content: messageContent,
      media_url: event.image_url,
      is_public: true,
      location: event.venue_address || event.venue_name,
      lat: event.lat,
      lng: event.lng,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      user_id: null // System-generated message
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create message: ${error.message}`)
  }

  return message.id
}