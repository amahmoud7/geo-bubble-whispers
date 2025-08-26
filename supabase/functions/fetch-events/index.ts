// deno-lint-ignore-file no-explicit-any
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
  genre?: string
  classification?: string
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    console.log('🎯 Fetch events request:', body)

    // Require map center or bounds (prevents silent LA fallback)
    if (!hasCenter(body) && !hasBounds(body)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing center/bounds: send map center or bounds after pan/zoom.',
          example: {
            center: { lat: 40.7128, lng: -74.0060 },
            bounds: { north: 40.92, south: 40.53, east: -73.68, west: -74.26 },
            timeframe: '48h'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const ticketmasterKey = Deno.env.get('TICKETMASTER_API_KEY')
    const eventbriteToken = Deno.env.get('EVENTBRITE_OAUTH_TOKEN') // optional

    if (!ticketmasterKey) {
      throw new Error('Missing TICKETMASTER_API_KEY')
    }

    const timeframe = body.timeframe || '48h' // wider default improves smaller markets
    const { center, radius } = computeCenterAndRadius(body) // radius floor applied inside
    console.log(`🗺️ Center ${center.lat},${center.lng} • radius ${radius}mi • timeframe ${timeframe}`)

    // Optional: cleanup expired messages
    await supabase
      .from('messages')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .eq('message_type', 'event')

    const all: EventData[] = []

    // ---- Ticketmaster (primary) ----
    console.log('📡 Ticketmaster fetch…')
    let tmEvents = await fetchTicketmasterEvents(ticketmasterKey, { center, radius, timeframe })
    // resilience: widen search if 24h window is too tight
    if (tmEvents.length === 0 && timeframe === '24h') {
      tmEvents = await fetchTicketmasterEvents(ticketmasterKey, {
        center,
        radius: Math.max(radius, 15),
        timeframe: '48h'
      })
    }
    console.log(`✅ Ticketmaster events: ${tmEvents.length}`)
    all.push(...tmEvents)

    // ---- Eventbrite (optional) ----
    if (eventbriteToken) {
      try {
        console.log('📡 Eventbrite fetch…')
        const ebEvents = await fetchEventbriteEvents(eventbriteToken, { center, radius, timeframe })
        console.log(`✅ Eventbrite events: ${ebEvents.length}`)
        all.push(...(ebEvents as EventData[]))
      } catch (e) {
        console.warn('⚠️ Eventbrite fetch warning:', e)
      }
    }

    console.log(`📦 Total fetched: ${all.length}`)

    // De-dup by (source, external_id)
    const byId = new Map<string, EventData>()
    for (const ev of all) {
      const key = `${ev.source}:${ev.external_id}`
      const existing = byId.get(key)
      if (!existing) byId.set(key, ev)
      else if (dateOrInfinity(ev.start_date) < dateOrInfinity(existing.start_date)) {
        byId.set(key, { ...existing, start_date: ev.start_date })
      }
    }
    const unique = Array.from(byId.values())
    console.log(`🧮 Unique events: ${unique.length}`)

    // Store messages and event rows
    let created = 0
    for (const ev of unique) {
      try {
        const { data: existing } = await supabase
          .from('events')
          .select('id, message_id')
          .eq('source', ev.source)
          .eq('external_id', ev.external_id)
          .maybeSingle()

        if (!existing) {
          const messageId = await createLoMessage(supabase, ev)
          const { error } = await supabase.from('events').insert({ ...ev, message_id: messageId })
          if (error) console.error('❌ Error storing event:', error)
          else created++
        } else {
          // Optional update for freshness
          await supabase
            .from('events')
            .update({
              title: ev.title,
              description: ev.description,
              event_url: ev.event_url,
              image_url: ev.image_url,
              venue_name: ev.venue_name,
              venue_address: ev.venue_address,
              lat: ev.lat,
              lng: ev.lng,
              start_date: ev.start_date,
              end_date: ev.end_date,
              price_min: ev.price_min,
              price_max: ev.price_max,
              genre: ev.genre,
              classification: ev.classification
            })
            .eq('id', existing.id)
            .select('id')
        }
      } catch (err) {
        console.error(`❌ Persist error for ${ev.title}:`, err)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        center,
        radius,
        timeframe,
        fetched: all.length,
        unique: unique.length,
        created
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('💥 Handler error:', error)
    return new Response(
      JSON.stringify({
