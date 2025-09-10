#!/usr/bin/env node

// Test the Supabase fetch-events-realtime function
// This tests both Ticketmaster and Eventbrite integration

const SUPABASE_URL = 'https://zvhqdjejaotqlfqtxlxj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2aHFkamVqYW90cWxmcXR4bHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM5NDI3MDYsImV4cCI6MjAzOTUxODcwNn0.F5bHPB0l5o3FPqJvD3ixyTJ1MkZJwKdVnNdxm3kr-kA';

async function testSupabaseFunction() {
  console.log('🧪 Testing Supabase fetch-events-realtime function\n');
  
  // Test location: New York City
  const testLocation = {
    lat: 40.7128,
    lng: -74.0060
  };
  
  console.log(`📍 Test location: New York City (${testLocation.lat}, ${testLocation.lng})\n`);
  
  // Test 1: Ticketmaster only
  console.log('1️⃣ Testing Ticketmaster only...');
  try {
    const tmResponse = await fetch(`${SUPABASE_URL}/functions/v1/fetch-events-realtime`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: ['ticketmaster'],
        center: testLocation,
        radius: 25,
        timeframe: '24h'
      })
    });
    
    const tmData = await tmResponse.json();
    console.log('Ticketmaster response:', tmResponse.status);
    if (tmData.success) {
      console.log(`✅ Found ${tmData.events?.total || 0} Ticketmaster events\n`);
    } else {
      console.log('❌ Ticketmaster error:', tmData.error || 'Unknown error\n');
    }
  } catch (error) {
    console.error('❌ Ticketmaster test failed:', error.message, '\n');
  }
  
  // Test 2: Eventbrite only
  console.log('2️⃣ Testing Eventbrite only...');
  try {
    const ebResponse = await fetch(`${SUPABASE_URL}/functions/v1/fetch-events-realtime`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: ['eventbrite'],
        center: testLocation,
        radius: 25,
        timeframe: '24h'
      })
    });
    
    const ebData = await ebResponse.json();
    console.log('Eventbrite response:', ebResponse.status);
    
    if (ebData.success) {
      console.log(`✅ Found ${ebData.events?.total || 0} Eventbrite events`);
      if (ebData.sources?.processed?.includes('eventbrite')) {
        console.log('✅ Eventbrite was processed successfully');
      } else {
        console.log('⚠️ Eventbrite was not processed');
        console.log('Failed sources:', ebData.sources?.failed);
      }
    } else {
      console.log('❌ Eventbrite error:', ebData.error || 'Unknown error');
      console.log('Full response:', JSON.stringify(ebData, null, 2));
    }
    console.log('\n');
  } catch (error) {
    console.error('❌ Eventbrite test failed:', error.message, '\n');
  }
  
  // Test 3: Both sources
  console.log('3️⃣ Testing both Ticketmaster and Eventbrite...');
  try {
    const bothResponse = await fetch(`${SUPABASE_URL}/functions/v1/fetch-events-realtime`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: ['ticketmaster', 'eventbrite'],
        center: testLocation,
        radius: 25,
        timeframe: '24h'
      })
    });
    
    const bothData = await bothResponse.json();
    console.log('Combined response:', bothResponse.status);
    
    if (bothData.success) {
      console.log(`✅ Total events found: ${bothData.events?.total || 0}`);
      console.log('Sources processed:', bothData.sources?.processed || []);
      console.log('Sources failed:', bothData.sources?.failed || []);
      
      if (bothData.events?.created > 0) {
        console.log(`📝 Created ${bothData.events.created} new events in database`);
      }
      if (bothData.events?.updated > 0) {
        console.log(`🔄 Updated ${bothData.events.updated} existing events`);
      }
    } else {
      console.log('❌ Combined test error:', bothData.error || 'Unknown error');
      console.log('Full response:', JSON.stringify(bothData, null, 2));
    }
  } catch (error) {
    console.error('❌ Combined test failed:', error.message);
  }
  
  console.log('\n📊 Summary:');
  console.log('- If Ticketmaster works but Eventbrite doesn\'t, check:');
  console.log('  1. EVENTBRITE_PRIVATE_TOKEN is set in Supabase secrets');
  console.log('  2. The function was redeployed after adding Eventbrite code');
  console.log('  3. The token has proper permissions\n');
  
  // Test 4: Check what's in the database
  console.log('4️⃣ Checking events in database...');
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: events, error } = await supabase
      .from('messages')
      .select('event_source, event_title, created_at')
      .eq('message_type', 'event')
      .in('event_source', ['ticketmaster', 'eventbrite'])
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Database query error:', error.message);
    } else {
      console.log(`\n📦 Recent events in database:`);
      const tmCount = events.filter(e => e.event_source === 'ticketmaster').length;
      const ebCount = events.filter(e => e.event_source === 'eventbrite').length;
      
      console.log(`- Ticketmaster: ${tmCount} events`);
      console.log(`- Eventbrite: ${ebCount} events`);
      
      if (ebCount === 0) {
        console.log('\n⚠️ No Eventbrite events in database!');
        console.log('This confirms Eventbrite integration is not working.');
      } else {
        console.log('\n✅ Eventbrite events found in database!');
        events.filter(e => e.event_source === 'eventbrite').slice(0, 3).forEach(e => {
          console.log(`  - ${e.event_title}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

testSupabaseFunction().catch(console.error);