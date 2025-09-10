#!/usr/bin/env node

// Quick check to see what events are in the database

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zvhqdjejaotqlfqtxlxj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2aHFkamVqYW90cWxmcXR4bHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM5NDI3MDYsImV4cCI6MjAzOTUxODcwNn0.F5bHPB0l5o3FPqJvD3ixyTJ1MkZJwKdVnNdxm3kr-kA';

async function checkEvents() {
  console.log('🔍 Checking events in database...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Get all event messages
  const { data: events, error } = await supabase
    .from('messages')
    .select('event_source, event_title, lat, lng, created_at, event_start_date')
    .eq('message_type', 'event')
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('❌ Database query error:', error.message);
    return;
  }
  
  console.log(`📊 Total events found: ${events.length}\n`);
  
  // Count by source
  const ticketmasterEvents = events.filter(e => e.event_source === 'ticketmaster');
  const eventbriteEvents = events.filter(e => e.event_source === 'eventbrite');
  const otherEvents = events.filter(e => e.event_source !== 'ticketmaster' && e.event_source !== 'eventbrite');
  
  console.log('📈 Events by source:');
  console.log(`  🎫 Ticketmaster: ${ticketmasterEvents.length} events`);
  console.log(`  🎟️ Eventbrite: ${eventbriteEvents.length} events`);
  if (otherEvents.length > 0) {
    console.log(`  ❓ Other: ${otherEvents.length} events`);
  }
  console.log('');
  
  // Show sample Ticketmaster events
  if (ticketmasterEvents.length > 0) {
    console.log('🎫 Sample Ticketmaster events:');
    ticketmasterEvents.slice(0, 3).forEach((event, i) => {
      const date = new Date(event.event_start_date);
      console.log(`  ${i + 1}. ${event.event_title}`);
      console.log(`     📅 ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
      console.log(`     📍 ${event.lat?.toFixed(4)}, ${event.lng?.toFixed(4)}`);
    });
    console.log('');
  }
  
  // Show sample Eventbrite events
  if (eventbriteEvents.length > 0) {
    console.log('🎟️ Sample Eventbrite events:');
    eventbriteEvents.slice(0, 3).forEach((event, i) => {
      const date = new Date(event.event_start_date);
      console.log(`  ${i + 1}. ${event.event_title}`);
      console.log(`     📅 ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
      console.log(`     📍 ${event.lat?.toFixed(4)}, ${event.lng?.toFixed(4)}`);
    });
  } else {
    console.log('⚠️ No Eventbrite events found in database!');
    console.log('\nPossible reasons:');
    console.log('1. The function needs to be deployed with: supabase functions deploy fetch-events-realtime');
    console.log('2. EVENTBRITE_PRIVATE_TOKEN is not set in Supabase secrets');
    console.log('3. There are no Eventbrite events in the searched area');
    console.log('4. The Eventbrite API returned an error\n');
    
    console.log('To debug, check the function logs in Supabase dashboard:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Functions → fetch-events-realtime');
    console.log('3. Check the Logs tab for any errors');
  }
  
  // Check for recent events (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentEvents = events.filter(e => new Date(e.created_at) > oneHourAgo);
  
  console.log(`\n⏰ Events added in last hour: ${recentEvents.length}`);
  if (recentEvents.length > 0) {
    const recentTM = recentEvents.filter(e => e.event_source === 'ticketmaster').length;
    const recentEB = recentEvents.filter(e => e.event_source === 'eventbrite').length;
    console.log(`   Ticketmaster: ${recentTM}`);
    console.log(`   Eventbrite: ${recentEB}`);
  }
}

checkEvents().catch(console.error);