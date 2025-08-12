import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://siunjhiiaduktoqjxalv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpdW5qaGlpYWR1a3RvcWp4YWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MzY3MTUsImV4cCI6MjA2MTMxMjcxNX0._AgD02DDc6E5gY0Hy4NPUZtRL_JVDiSiYcU2mwaWBoE'

const supabase = createClient(supabaseUrl, supabaseKey)

// Test event data for LA venues - using only existing columns
const testEvents = [
  {
    content: "🎫✨ Taylor Swift - The Eras Tour\n\n📍 SoFi Stadium\n1001 Stadium Dr, Inglewood, CA 90301\n\n🕐 Thu, Aug 8, 8:00 PM\n\n🎵 Pop • Entertainment\n\n💰 From $150 - $500\n\n🎟️ Get tickets now at Ticketmaster ↗️\n\n#Events #LA #Ticketmaster #TaylorSwift",
    media_url: null,
    is_public: true,
    location: "SoFi Stadium, Inglewood, CA",
    lat: 33.9535,
    lng: -118.3392,
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
    user_id: null
  },
  {
    content: "🎫✨ Lakers vs Clippers\n\n📍 Crypto.com Arena\n1111 S Figueroa St, Los Angeles, CA 90015\n\n🕐 Thu, Aug 8, 7:30 PM\n\n🏀 Basketball • Sports\n\n💰 From $75 - $300\n\n🎟️ Get tickets now at Ticketmaster ↗️\n\n#Events #LA #Lakers #Clippers #Basketball",
    media_url: null,
    is_public: true,
    location: "Crypto.com Arena, Los Angeles, CA",
    lat: 34.043,
    lng: -118.2673,
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
    user_id: null
  },
  {
    content: "🎫✨ The Lion King Musical\n\n📍 Hollywood Pantages Theatre\n6233 Hollywood Blvd, Hollywood, CA 90028\n\n🕐 Thu, Aug 8, 8:00 PM\n\n🎭 Musical • Theatre\n\n💰 From $50 - $200\n\n🎟️ Get tickets now at Ticketmaster ↗️\n\n#Events #LA #Musical #LionKing #Theatre",
    media_url: null,
    is_public: true,
    location: "Hollywood Pantages Theatre, Hollywood, CA",
    lat: 34.1022,
    lng: -118.3267,
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
    user_id: null
  }
]

console.log('Adding test events to database...')

for (let i = 0; i < testEvents.length; i++) {
  const event = testEvents[i]
  try {
    // Check if event already exists by location and content
    const { data: existing } = await supabase
      .from('messages')
      .select('id')
      .eq('location', event.location)
      .ilike('content', '%' + (i === 0 ? 'Taylor Swift' : i === 1 ? 'Lakers vs Clippers' : 'Lion King') + '%')
      .single()

    if (!existing) {
      const { data, error } = await supabase
        .from('messages')
        .insert(event)
        .select('id')
        .single()

      if (error) {
        console.error(`Error creating event ${i + 1}:`, error)
      } else {
        console.log(`✅ Created event at ${event.location}`)
      }
    } else {
      console.log(`⚠️  Event already exists at ${event.location}`)
    }
  } catch (err) {
    console.error(`Error processing event ${i + 1}:`, err)
  }
}

console.log('🎫 Test events setup complete! You should now see 3 event markers on the map in LA.')