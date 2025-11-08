// Quick test to check if events are in database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ysrpvnmdzgfwwgjtzvma.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzcnB2bm1kemdmd3dnanR6dm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU4MzA5MzksImV4cCI6MjAzMTQwNjkzOX0.BHdz7lXTHdjf60gHFscP7vP1p5P1mXfqUhwJPBjOxOk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEvents() {
  console.log('🔍 Checking for events in database...\n');
  
  const { data, error, count } = await supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('message_type', 'event');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Total events in database: ${count}`);
  
  if (data && data.length > 0) {
    console.log('\n✅ Sample events:');
    data.slice(0, 5).forEach(event => {
      console.log(`  - ${event.event_title} at ${event.event_venue}`);
      console.log(`    Location: ${event.lat}, ${event.lng}`);
      console.log(`    Start: ${event.event_start_date}`);
      console.log(`    Source: ${event.event_source}\n`);
    });
  } else {
    console.log('\n⚠️ No events found in database');
    console.log('\nTo fetch events, the EventsToggle button should trigger:');
    console.log('supabase.functions.invoke("fetch-events-realtime")');
  }
}

testEvents().catch(console.error);
