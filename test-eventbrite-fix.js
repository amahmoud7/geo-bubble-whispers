#!/usr/bin/env node

// Test different Eventbrite API endpoints to find the working one

import fetch from 'node-fetch';

const EVENTBRITE_PRIVATE_TOKEN = process.env.EVENTBRITE_PRIVATE_TOKEN || 'JUBS5AXJEYZKVXVBKM5P';

async function testEventbriteEndpoints() {
  console.log('🎟️ Testing Eventbrite API endpoints...\n');
  
  const headers = {
    'Authorization': `Bearer ${EVENTBRITE_PRIVATE_TOKEN}`,
    'Accept': 'application/json'
  };
  
  // Test 1: User endpoint (we know this works)
  console.log('1️⃣ Testing /users/me/ endpoint...');
  try {
    const userRes = await fetch('https://www.eventbriteapi.com/v3/users/me/', { headers });
    if (userRes.ok) {
      const userData = await userRes.json();
      console.log('✅ User endpoint works:', userData.name || userData.email);
    }
  } catch (e) {
    console.error('❌ User endpoint failed:', e.message);
  }
  
  // Test 2: Organizations endpoint
  console.log('\n2️⃣ Testing /users/me/organizations/ endpoint...');
  try {
    const orgRes = await fetch('https://www.eventbriteapi.com/v3/users/me/organizations/', { headers });
    if (orgRes.ok) {
      const orgData = await orgRes.json();
      console.log('✅ Organizations:', orgData.organizations?.length || 0, 'organizations found');
      
      if (orgData.organizations?.length > 0) {
        const orgId = orgData.organizations[0].id;
        console.log('   Organization ID:', orgId);
        
        // Test 3: Organization events
        console.log('\n3️⃣ Testing /organizations/{id}/events/ endpoint...');
        const orgEventsRes = await fetch(`https://www.eventbriteapi.com/v3/organizations/${orgId}/events/`, { headers });
        if (orgEventsRes.ok) {
          const eventsData = await orgEventsRes.json();
          console.log('✅ Organization events:', eventsData.events?.length || 0, 'events');
        } else {
          console.log('❌ Organization events failed:', orgEventsRes.status, orgEventsRes.statusText);
        }
      }
    } else {
      console.log('❌ Organizations failed:', orgRes.status, orgRes.statusText);
    }
  } catch (e) {
    console.error('❌ Organizations endpoint failed:', e.message);
  }
  
  // Test 4: Direct events endpoint (without search)
  console.log('\n4️⃣ Testing /events/ endpoint...');
  try {
    const eventsRes = await fetch('https://www.eventbriteapi.com/v3/events/', { headers });
    console.log('Response status:', eventsRes.status, eventsRes.statusText);
    if (!eventsRes.ok) {
      const errorText = await eventsRes.text();
      console.log('Error:', errorText);
    }
  } catch (e) {
    console.error('❌ Events endpoint failed:', e.message);
  }
  
  // Test 5: Discovery events (public events)
  console.log('\n5️⃣ Testing discovery endpoints...');
  
  // Try without auth first (public endpoint)
  try {
    const publicRes = await fetch('https://www.eventbriteapi.com/v3/destination/events/', {
      headers: {
        'Accept': 'application/json'
      }
    });
    console.log('Public events response:', publicRes.status, publicRes.statusText);
  } catch (e) {
    console.error('❌ Public events failed:', e.message);
  }
  
  console.log('\n📝 Summary:');
  console.log('The /events/search/ endpoint appears to be deprecated or removed.');
  console.log('Eventbrite may have changed their API structure.');
  console.log('You might need to use a different approach to get public events.');
}

testEventbriteEndpoints().catch(console.error);