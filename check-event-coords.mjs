import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ysrpvnmdzgfwwgjtzvma.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzcnB2bm1kemdmd3dnanR6dm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU4MzA5MzksImV4cCI6MjAzMTQwNjkzOX0.BHdz7lXTHdjf60gHFscP7vP1p5P1mXfqUhwJPBjOxOk'

const supabase = createClient(supabaseUrl, supabaseKey)

const { data, error } = await supabase
  .from('messages')
  .select('event_title, lat, lng')
  .eq('message_type', 'event')
  .limit(5)

if (error) {
  console.error('Error:', error)
} else {
  console.log('\n✅ Event coordinates check:\n')
  data.forEach(e => {
    console.log(`${e.event_title}`)
    console.log(`  lat: ${e.lat}, lng: ${e.lng}`)
    console.log(`  Valid: ${e.lat != null && e.lng != null}\n`)
  })
}
