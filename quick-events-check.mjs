import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ysrpvnmdzgfwwgjtzvma.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzcnB2bm1kemdmd3dnanR6dm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU4MzA5MzksImV4cCI6MjAzMTQwNjkzOX0.BHdz7lXTHdjf60gHFscP7vP1p5P1mXfqUhwJPBjOxOk'

const supabase = createClient(supabaseUrl, supabaseKey)

const { data, error, count } = await supabase
  .from('messages')
  .select('*', { count: 'exact' })
  .eq('message_type', 'event')

if (error) {
  console.error('❌ Error:', error)
} else {
  console.log(`📊 Total events: ${count}`)
  if (data && data.length > 0) {
    console.log('\nSample events:')
    data.slice(0, 3).forEach(e => {
      console.log(`  - ${e.event_title} at ${e.event_venue}`)
      console.log(`    Coords: ${e.lat}, ${e.lng}`)
    })
  } else {
    console.log('\n⚠️ No events in database')
  }
}
