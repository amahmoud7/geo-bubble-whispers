#!/usr/bin/env node

// Test script for Eventbrite API integration
// Usage: EVENTBRITE_PRIVATE_TOKEN=your_token node test-eventbrite-api.js

const EVENTBRITE_PRIVATE_TOKEN = process.env.EVENTBRITE_PRIVATE_TOKEN;

if (!EVENTBRITE_PRIVATE_TOKEN) {
  console.error('❌ Please set EVENTBRITE_PRIVATE_TOKEN environment variable');
  console.error('Usage: EVENTBRITE_PRIVATE_TOKEN=your_token node test-eventbrite-api.js');
  process.exit(1);
}

async function testEventbriteAPI() {
  console.log('🎟️ Testing Eventbrite API connection...\n');
  
  // Test location: New York City
  const testLocation = {
    lat: 40.7128,
    lng: -74.0060,
    radius: 25
  };
  
  console.log(`📍 Test location: ${testLocation.lat}, ${testLocation.lng}`);
  console.log(`📏 Search radius: ${testLocation.radius} miles\n`);
  
  const now = new Date();
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
  
  const searchParams = new URLSearchParams({
    'location.latitude': testLocation.lat.toString(),
    'location.longitude': testLocation.lng.toString(),
    'location.within': `${testLocation.radius}mi`,
    'start_date.range_start': now.toISOString(),
    'start_date.range_end': endTime.toISOString(),
    'expand': 'venue,category,subcategory,format',
    'status': 'live',
    'page_size': '10'
  });
  
  const url = `https://www.eventbriteapi.com/v3/events/search/?${searchParams.toString()}`;
  
  try {
    console.log('🌐 Making API request to Eventbrite...');
    console.log('📝 URL:', url.replace(EVENTBRITE_PRIVATE_TOKEN, '[REDACTED]'));
    console.log('🔑 Token format: Bearer token\n');
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_PRIVATE_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      console.error('Response:', errorText);
      
      if (response.status === 401) {
        console.error('\n⚠️ Authentication failed. Please check your EVENTBRITE_PRIVATE_TOKEN.');
      }
      
      process.exit(1);
    }
    
    const data = await response.json();
    
    console.log('✅ API connection successful!\n');
    console.log(`📊 Results:`);
    console.log(`   Total events found: ${data.pagination?.object_count || 0}`);
    console.log(`   Events in this page: ${data.events?.length || 0}`);
    console.log(`   Has more pages: ${data.pagination?.has_more_items || false}\n`);
    
    if (data.events && data.events.length > 0) {
      console.log('🎫 Sample events:');
      console.log('─'.repeat(60));
      
      data.events.slice(0, 3).forEach((event, index) => {
        console.log(`\n${index + 1}. ${event.name?.text || 'Untitled Event'}`);
        console.log(`   📅 ${new Date(event.start?.local || event.start?.utc).toLocaleString()}`);
        console.log(`   📍 ${event.venue?.name || 'Venue TBA'}`);
        
        if (event.venue?.address) {
          const addr = event.venue.address;
          console.log(`   📮 ${[addr.address_1, addr.city, addr.region].filter(Boolean).join(', ')}`);
        }
        
        if (event.ticket_availability) {
          const minPrice = event.ticket_availability.minimum_ticket_price;
          const maxPrice = event.ticket_availability.maximum_ticket_price;
          
          if (minPrice) {
            const min = (parseFloat(minPrice.value) / 100).toFixed(2);
            const max = maxPrice ? (parseFloat(maxPrice.value) / 100).toFixed(2) : min;
            console.log(`   💰 $${min}${max !== min ? ` - $${max}` : ''} ${minPrice.currency}`);
          }
        }
        
        console.log(`   🔗 ${event.url}`);
      });
      
      console.log('\n' + '─'.repeat(60));
    } else {
      console.log('ℹ️ No events found for the specified location and timeframe.');
      console.log('   Try adjusting the location or search radius.');
    }
    
    console.log('\n✅ Eventbrite API test completed successfully!');
    console.log('🎉 Your token is valid and the API is accessible.\n');
    
    // Test data structure for Lo integration
    if (data.events && data.events.length > 0) {
      const testEvent = data.events[0];
      console.log('📦 Sample normalized event for Lo integration:');
      
      const normalized = {
        external_id: testEvent.id,
        source: 'eventbrite',
        title: testEvent.name?.text || 'Untitled Event',
        description: testEvent.description?.text || testEvent.summary || '',
        event_url: testEvent.url,
        image_url: testEvent.logo?.url || testEvent.logo?.original?.url,
        venue_name: testEvent.venue?.name || (testEvent.online_event ? 'Online Event' : 'Venue TBA'),
        lat: testEvent.venue?.latitude ? parseFloat(testEvent.venue.latitude) : undefined,
        lng: testEvent.venue?.longitude ? parseFloat(testEvent.venue.longitude) : undefined,
        start_date: testEvent.start?.utc || testEvent.start?.local,
        end_date: testEvent.end?.utc || testEvent.end?.local,
        price_min: testEvent.ticket_availability?.minimum_ticket_price ? 
          parseFloat(testEvent.ticket_availability.minimum_ticket_price.value) / 100 : undefined,
        price_max: testEvent.ticket_availability?.maximum_ticket_price ? 
          parseFloat(testEvent.ticket_availability.maximum_ticket_price.value) / 100 : undefined,
        genre: testEvent.subcategory?.name || testEvent.category?.name,
        classification: testEvent.format?.name || testEvent.category?.short_name
      };
      
      console.log(JSON.stringify(normalized, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Failed to test Eventbrite API:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Network connectivity problems');
    console.error('2. Invalid API token');
    console.error('3. API service temporarily unavailable');
    process.exit(1);
  }
}

// Run the test
testEventbriteAPI().catch(console.error);