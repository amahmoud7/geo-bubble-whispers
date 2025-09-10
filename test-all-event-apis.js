#!/usr/bin/env node

// Test multiple event APIs to see which ones work
// This will help us identify all available event sources

import fetch from 'node-fetch';

const TEST_LOCATION = {
  lat: 34.0522,  // Los Angeles
  lng: -118.2437,
  radius: 25
};

async function testAPIs() {
  console.log('🔍 Testing Multiple Event APIs\n');
  console.log(`📍 Test Location: Los Angeles (${TEST_LOCATION.lat}, ${TEST_LOCATION.lng})\n`);
  
  const results = [];
  
  // 1. SEATGEEK - Free tier available
  console.log('1️⃣ Testing SeatGeek API...');
  try {
    // SeatGeek has a free tier with client_id authentication
    const seatgeekUrl = `https://api.seatgeek.com/2/events?lat=${TEST_LOCATION.lat}&lon=${TEST_LOCATION.lng}&range=${TEST_LOCATION.radius}mi&per_page=5`;
    const sgRes = await fetch(seatgeekUrl);
    const sgData = await sgRes.json();
    
    if (sgRes.ok && sgData.events) {
      console.log(`✅ SeatGeek: Working! Found ${sgData.events.length} events`);
      console.log('   Note: Requires client_id for production use');
      console.log('   Get free API key at: https://seatgeek.com/account/develop');
      results.push({ api: 'SeatGeek', status: 'Working (needs API key)', events: sgData.events.length });
    } else {
      console.log('❌ SeatGeek: Limited without API key');
      results.push({ api: 'SeatGeek', status: 'Needs API key' });
    }
  } catch (e) {
    console.error('❌ SeatGeek: Failed -', e.message);
    results.push({ api: 'SeatGeek', status: 'Failed' });
  }
  
  // 2. PREDICTHQ - Events intelligence API
  console.log('\n2️⃣ Testing PredictHQ API...');
  try {
    // PredictHQ requires authentication but has free tier
    const predictHqUrl = 'https://api.predicthq.com/v1/events/';
    const phqRes = await fetch(predictHqUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (phqRes.status === 401) {
      console.log('⚠️ PredictHQ: Requires API token (free tier available)');
      console.log('   Get free API key at: https://www.predicthq.com/signup');
      console.log('   Covers: concerts, sports, festivals, conferences, etc.');
      results.push({ api: 'PredictHQ', status: 'Needs API key (free tier)' });
    }
  } catch (e) {
    console.error('❌ PredictHQ: Failed -', e.message);
    results.push({ api: 'PredictHQ', status: 'Failed' });
  }
  
  // 3. STUBHUB - Secondary ticket marketplace
  console.log('\n3️⃣ Testing StubHub API...');
  try {
    const stubhubUrl = 'https://api.stubhub.com/sellers/search/events/v3';
    const shRes = await fetch(stubhubUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (shRes.status === 401) {
      console.log('⚠️ StubHub: Requires OAuth authentication');
      console.log('   Application required at: https://developer.stubhub.com/');
      results.push({ api: 'StubHub', status: 'Needs OAuth' });
    }
  } catch (e) {
    console.error('❌ StubHub: Failed -', e.message);
    results.push({ api: 'StubHub', status: 'Failed' });
  }
  
  // 4. BANDSINTOWN - Concert discovery
  console.log('\n4️⃣ Testing Bandsintown API...');
  try {
    // Bandsintown has a public API
    const bandsUrl = `https://rest.bandsintown.com/artists/Metallica/events?app_id=lo_app`;
    const bitRes = await fetch(bandsUrl);
    
    if (bitRes.ok) {
      const bitData = await bitRes.json();
      console.log('✅ Bandsintown: Working for artist events!');
      console.log('   Note: Requires app_id (can use any string)');
      console.log('   Best for: Concert discovery by artist');
      results.push({ api: 'Bandsintown', status: 'Working (artist-based)' });
    }
  } catch (e) {
    console.error('❌ Bandsintown: Failed -', e.message);
    results.push({ api: 'Bandsintown', status: 'Failed' });
  }
  
  // 5. JAMBASE - Live music API
  console.log('\n5️⃣ Testing JamBase API...');
  try {
    const jambaseUrl = 'https://www.jambase.com/jb-api/v1/events';
    const jbRes = await fetch(jambaseUrl);
    
    if (jbRes.status === 401 || jbRes.status === 403) {
      console.log('⚠️ JamBase: Requires API key');
      console.log('   Apply at: https://www.jambase.com/api');
      console.log('   Focus: Live music events');
      results.push({ api: 'JamBase', status: 'Needs API key' });
    }
  } catch (e) {
    console.error('❌ JamBase: Failed -', e.message);
    results.push({ api: 'JamBase', status: 'Failed' });
  }
  
  // 6. SONGKICK - Concert tracking
  console.log('\n6️⃣ Testing Songkick API...');
  try {
    // Songkick Metro Areas endpoint (no auth needed for basic access)
    const songkickUrl = `https://api.songkick.com/api/3.0/search/locations.json?query=Los Angeles`;
    const skRes = await fetch(songkickUrl);
    
    if (skRes.ok) {
      console.log('⚠️ Songkick: API key required for events');
      console.log('   Apply at: https://www.songkick.com/api_key_requests/new');
      console.log('   Focus: Concerts and music festivals');
      results.push({ api: 'Songkick', status: 'Needs API key' });
    }
  } catch (e) {
    console.error('❌ Songkick: Failed -', e.message);
    results.push({ api: 'Songkick', status: 'Failed' });
  }
  
  // 7. MEETUP - Community events
  console.log('\n7️⃣ Testing Meetup API...');
  try {
    // Meetup GraphQL API
    const meetupUrl = 'https://api.meetup.com/gql';
    const muRes = await fetch(meetupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `{ self { id } }`
      })
    });
    
    if (muRes.status === 401) {
      console.log('⚠️ Meetup: Requires OAuth token');
      console.log('   Get API access at: https://www.meetup.com/api/');
      console.log('   Focus: Community meetups, workshops, networking');
      results.push({ api: 'Meetup', status: 'Needs OAuth' });
    }
  } catch (e) {
    console.error('❌ Meetup: Failed -', e.message);
    results.push({ api: 'Meetup', status: 'Failed' });
  }
  
  // 8. YELP Events
  console.log('\n8️⃣ Testing Yelp Events API...');
  try {
    const yelpUrl = 'https://api.yelp.com/v3/events';
    const yelpRes = await fetch(yelpUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (yelpRes.status === 401) {
      console.log('⚠️ Yelp Events: Requires API key');
      console.log('   Get free API key at: https://www.yelp.com/developers');
      console.log('   Focus: Local events, restaurant events, nightlife');
      results.push({ api: 'Yelp', status: 'Needs API key (free)' });
    }
  } catch (e) {
    console.error('❌ Yelp: Failed -', e.message);
    results.push({ api: 'Yelp', status: 'Failed' });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY OF AVAILABLE EVENT APIS:');
  console.log('='.repeat(60));
  
  const working = results.filter(r => r.status.includes('Working'));
  const needsKey = results.filter(r => r.status.includes('Needs'));
  
  console.log('\n✅ Working/Accessible:');
  working.forEach(r => console.log(`   - ${r.api}: ${r.status}`));
  
  console.log('\n🔑 Requires API Key (but available):');
  needsKey.forEach(r => console.log(`   - ${r.api}: ${r.status}`));
  
  console.log('\n📝 Recommendations for Lo app:');
  console.log('1. SeatGeek - Easy setup, free tier, good coverage');
  console.log('2. PredictHQ - Comprehensive events, free tier');
  console.log('3. Yelp Events - Local events focus, free API');
  console.log('4. Bandsintown - Great for concerts (if music focus)');
  console.log('5. Meetup - Community events (if social focus)');
  
  return results;
}

testAPIs().catch(console.error);