/**
 * Test script for Eventbrite web scraper
 * 
 * This script tests the Eventbrite scraping functionality by:
 * 1. Fetching events from Eventbrite for a specific location
 * 2. Validating the response structure
 * 3. Checking that events are stored in the database
 * 4. Verifying event data quality
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test locations
const TEST_LOCATIONS = [
  {
    name: 'Los Angeles',
    center: { lat: 34.0522, lng: -118.2437 },
    radius: 25
  },
  {
    name: 'New York',
    center: { lat: 40.7128, lng: -74.0060 },
    radius: 30
  },
  {
    name: 'San Francisco',
    center: { lat: 37.7749, lng: -122.4194 },
    radius: 20
  }
];

/**
 * Test Eventbrite scraper functionality
 */
async function testEventbriteScraper() {
  console.log('🧪 Testing Eventbrite Web Scraper\n');
  console.log('═'.repeat(60));
  
  const location = TEST_LOCATIONS[0]; // Test with LA first
  
  console.log(`\n📍 Testing location: ${location.name}`);
  console.log(`   Coordinates: ${location.center.lat}, ${location.center.lng}`);
  console.log(`   Radius: ${location.radius} miles`);
  console.log(`   Timeframe: 24 hours\n`);
  
  try {
    // Step 1: Fetch events from Eventbrite
    console.log('🎟️  Step 1: Fetching Eventbrite events...');
    const startTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke('fetch-events-realtime', {
      body: {
        source: ['eventbrite'],
        center: location.center,
        radius: location.radius,
        timeframe: '24h'
      }
    });
    
    const fetchDuration = Date.now() - startTime;
    
    if (error) {
      console.error('❌ Error invoking function:', error);
      throw error;
    }
    
    console.log(`✅ Function completed in ${fetchDuration}ms\n`);
    
    // Step 2: Validate response structure
    console.log('📋 Step 2: Validating response...');
    console.log('   Response structure:');
    console.log(`   - Success: ${data.success}`);
    console.log(`   - Request ID: ${data.requestId}`);
    console.log(`   - Duration: ${data.duration}ms`);
    console.log(`   - Sources requested: ${data.sources?.requested?.join(', ')}`);
    console.log(`   - Sources processed: ${data.sources?.processed?.join(', ')}`);
    console.log(`   - Sources failed: ${data.sources?.failed?.join(', ') || 'none'}`);
    console.log(`   - Total events: ${data.events?.total || 0}`);
    console.log(`   - Events created: ${data.events?.created || 0}`);
    console.log(`   - Events updated: ${data.events?.updated || 0}`);
    console.log(`   - Events skipped: ${data.events?.skipped || 0}\n`);
    
    if (!data.success) {
      console.error('❌ Function returned success: false');
      return false;
    }
    
    if (!data.sources?.processed?.includes('eventbrite')) {
      console.warn('⚠️  Eventbrite was not processed successfully');
      if (data.sources?.failed?.includes('eventbrite')) {
        console.error('❌ Eventbrite source failed');
        return false;
      }
    }
    
    const totalEvents = data.events?.total || 0;
    console.log(`✅ Found ${totalEvents} Eventbrite events\n`);
    
    // Step 3: Check database for Eventbrite events
    console.log('🗄️  Step 3: Checking database...');
    
    const { data: dbEvents, error: dbError } = await supabase
      .from('messages')
      .select('*')
      .eq('message_type', 'event')
      .eq('event_source', 'eventbrite')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (dbError) {
      console.error('❌ Database query error:', dbError);
      throw dbError;
    }
    
    console.log(`   Found ${dbEvents.length} Eventbrite events in database\n`);
    
    // Step 4: Validate event data quality
    if (dbEvents.length > 0) {
      console.log('🔍 Step 4: Validating event data quality...\n');
      
      let validCount = 0;
      let issuesFound = [];
      
      dbEvents.forEach((event, index) => {
        const issues = [];
        
        console.log(`   Event ${index + 1}: ${event.event_title}`);
        console.log(`   ├─ ID: ${event.external_event_id}`);
        console.log(`   ├─ Venue: ${event.event_venue || 'N/A'}`);
        console.log(`   ├─ Location: ${event.location || 'N/A'}`);
        console.log(`   ├─ Coordinates: ${event.lat}, ${event.lng}`);
        console.log(`   ├─ Start Date: ${new Date(event.event_start_date).toLocaleString()}`);
        console.log(`   ├─ Price: ${event.event_price_min !== null ? `$${event.event_price_min}` : 'N/A'} - ${event.event_price_max !== null ? `$${event.event_price_max}` : 'N/A'}`);
        console.log(`   ├─ URL: ${event.event_url ? '✅' : '❌'}`);
        console.log(`   └─ Image: ${event.media_url ? '✅' : '❌'}\n`);
        
        // Validate required fields
        if (!event.event_title || event.event_title.length < 3) {
          issues.push('Invalid or missing title');
        }
        
        if (!event.external_event_id) {
          issues.push('Missing external event ID');
        }
        
        if (!event.lat || !event.lng || !Number.isFinite(event.lat) || !Number.isFinite(event.lng)) {
          issues.push('Invalid coordinates');
        }
        
        if (!event.event_start_date) {
          issues.push('Missing start date');
        }
        
        if (!event.event_url || !event.event_url.includes('eventbrite.com')) {
          issues.push('Invalid or missing event URL');
        }
        
        if (issues.length === 0) {
          validCount++;
        } else {
          issuesFound.push({ event: event.event_title, issues });
        }
      });
      
      console.log(`📊 Validation Summary:`);
      console.log(`   ├─ Total events checked: ${dbEvents.length}`);
      console.log(`   ├─ Valid events: ${validCount}`);
      console.log(`   └─ Events with issues: ${issuesFound.length}\n`);
      
      if (issuesFound.length > 0) {
        console.log('⚠️  Issues found:');
        issuesFound.forEach(({ event, issues }) => {
          console.log(`   - ${event}:`);
          issues.forEach(issue => console.log(`     • ${issue}`));
        });
        console.log('');
      }
    } else {
      console.log('⚠️  No Eventbrite events found in database');
      console.log('   This could be normal if:');
      console.log('   - No events are happening in the next 24 hours');
      console.log('   - Eventbrite\'s API is not returning results');
      console.log('   - The location has no Eventbrite events\n');
    }
    
    // Final summary
    console.log('═'.repeat(60));
    console.log('\n✅ Test completed successfully!\n');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    return false;
  }
}

/**
 * Test multiple locations
 */
async function testMultipleLocations() {
  console.log('\n🌍 Testing Multiple Locations\n');
  console.log('═'.repeat(60));
  
  const results = [];
  
  for (const location of TEST_LOCATIONS) {
    console.log(`\n📍 Testing: ${location.name}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-events-realtime', {
        body: {
          source: ['eventbrite'],
          center: location.center,
          radius: location.radius,
          timeframe: '24h'
        }
      });
      
      if (error) {
        throw error;
      }
      
      const eventCount = data.events?.total || 0;
      results.push({
        location: location.name,
        success: data.success,
        eventCount,
        duration: data.duration
      });
      
      console.log(`   ✅ Found ${eventCount} events (${data.duration}ms)`);
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({
        location: location.name,
        success: false,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n═'.repeat(60));
  console.log('\n📊 Multi-Location Test Results:\n');
  
  results.forEach(result => {
    if (result.success) {
      console.log(`   ${result.location}: ${result.eventCount} events (${result.duration}ms)`);
    } else {
      console.log(`   ${result.location}: ❌ Failed - ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n   Success rate: ${successCount}/${results.length}`);
  console.log('');
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n🎟️  Eventbrite Scraper Test Suite\n');
  console.log('This will test the Eventbrite web scraping functionality');
  console.log('and verify that events are correctly fetched and stored.\n');
  
  const runMultiLocation = process.argv.includes('--multi');
  
  if (runMultiLocation) {
    await testMultipleLocations();
  } else {
    const success = await testEventbriteScraper();
    
    if (success) {
      console.log('💡 Tip: Run with --multi flag to test multiple locations');
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

// Run tests
runTests().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
