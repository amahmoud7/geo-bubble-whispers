// Test Ticketmaster API Key
// Replace 'YOUR_API_KEY' with your actual Ticketmaster Consumer Key

const API_KEY = 'C222OujeuZOAi0pAektQ0OqbgBzIwMRs'; // Your Ticketmaster Consumer Key
const LA_LAT = 34.0522;
const LA_LNG = -118.2437;

async function testTicketmasterAPI() {
  console.log('🎫 Testing Ticketmaster API connection...');
  
  if (API_KEY === 'YOUR_API_KEY') {
    console.error('❌ Please replace YOUR_API_KEY with your actual Ticketmaster Consumer Key');
    return;
  }
  
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const startDateTime = now.toISOString().slice(0, 19) + 'Z';
  const endDateTime = tomorrow.toISOString().slice(0, 19) + 'Z';
  
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?` +
    `geoPoint=${LA_LAT},${LA_LNG}&` +
    `radius=25&unit=miles&` +
    `startDateTime=${startDateTime}&` +
    `endDateTime=${endDateTime}&` +
    `apikey=${API_KEY}&` +
    `size=10`;
    
  try {
    console.log('📡 Making API request...');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data._embedded && data._embedded.events) {
      console.log(`✅ SUCCESS! Found ${data._embedded.events.length} events in LA`);
      
      console.log('\n📋 Sample events:');
      data._embedded.events.slice(0, 3).forEach((event, i) => {
        const venue = event._embedded?.venues?.[0];
        console.log(`${i + 1}. ${event.name}`);
        console.log(`   📍 ${venue?.name || 'Unknown venue'}`);
        console.log(`   🕐 ${event.dates?.start?.dateTime || 'No date'}`);
        console.log('');
      });
      
    } else {
      console.log('ℹ️  API connected but no events found in next 24 hours');
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    
    if (error.message.includes('401')) {
      console.error('🔑 Invalid API key - check your Consumer Key');
    } else if (error.message.includes('429')) {
      console.error('⏰ Rate limit exceeded - wait a moment and try again');
    } else if (error.message.includes('403')) {
      console.error('🚫 API access denied - check your account status');
    }
  }
}

// Run the test
testTicketmasterAPI();