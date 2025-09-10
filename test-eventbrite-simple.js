#!/usr/bin/env node

// Simple Eventbrite API test - checks if token is valid
// Usage: EVENTBRITE_PRIVATE_TOKEN=your_token node test-eventbrite-simple.js

const EVENTBRITE_PRIVATE_TOKEN = process.env.EVENTBRITE_PRIVATE_TOKEN;

if (!EVENTBRITE_PRIVATE_TOKEN) {
  console.error('❌ Please set EVENTBRITE_PRIVATE_TOKEN environment variable');
  process.exit(1);
}

async function testEventbriteAuth() {
  console.log('🎟️ Testing Eventbrite API authentication...\n');
  console.log('Token starts with:', EVENTBRITE_PRIVATE_TOKEN.substring(0, 4) + '...');
  console.log('Token length:', EVENTBRITE_PRIVATE_TOKEN.length, 'characters\n');
  
  // First, try to get user info to verify the token works
  try {
    console.log('1️⃣ Testing token with /users/me/ endpoint...');
    const meResponse = await fetch('https://www.eventbriteapi.com/v3/users/me/', {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_PRIVATE_TOKEN}`
      }
    });
    
    if (meResponse.ok) {
      const userData = await meResponse.json();
      console.log('✅ Token is valid! User:', userData.name || userData.email || 'Unknown');
      console.log('\n');
    } else {
      console.error('❌ Token validation failed:', meResponse.status, meResponse.statusText);
      const errorText = await meResponse.text();
      console.error('Error details:', errorText);
      
      if (meResponse.status === 401) {
        console.error('\n⚠️ Your token appears to be invalid or expired.');
        console.error('Please get a new token from: https://www.eventbrite.com/platform/api-keys');
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to validate token:', error.message);
    return false;
  }
  
  // Now try the events search endpoint
  try {
    console.log('2️⃣ Testing events search endpoint...');
    
    // Simpler query without location first
    const searchUrl = 'https://www.eventbriteapi.com/v3/events/search/?' + new URLSearchParams({
      'location.address': 'New York',
      'location.within': '10mi',
      'expand': 'venue'
    });
    
    console.log('URL:', searchUrl.replace(EVENTBRITE_PRIVATE_TOKEN, '[TOKEN]'));
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_PRIVATE_TOKEN}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Events endpoint works!');
      console.log(`Found ${data.pagination?.object_count || 0} total events`);
      console.log(`Page has ${data.events?.length || 0} events\n`);
      
      if (data.events && data.events.length > 0) {
        const event = data.events[0];
        console.log('Sample event:');
        console.log('- Title:', event.name?.text);
        console.log('- Start:', event.start?.local || event.start?.utc);
        console.log('- URL:', event.url);
      }
      
      return true;
    } else {
      console.error('❌ Events search failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to search events:', error.message);
    return false;
  }
}

testEventbriteAuth().then(success => {
  if (success) {
    console.log('\n✅ All tests passed! Your Eventbrite token is working correctly.');
    console.log('You can now set it in Supabase with:');
    console.log(`supabase secrets set EVENTBRITE_PRIVATE_TOKEN=${EVENTBRITE_PRIVATE_TOKEN}`);
  } else {
    console.log('\n❌ Tests failed. Please check your token and try again.');
    console.log('Get a new token at: https://www.eventbrite.com/platform/api-keys');
  }
});