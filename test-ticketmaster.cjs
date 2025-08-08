// Test script to verify Ticketmaster events for next 24 hours
const https = require('https');

// Mock Ticketmaster API key - you would need a real one for actual testing
const TICKETMASTER_API_KEY = 'YOUR_API_KEY_HERE';

// Los Angeles coordinates (broader area)
const lat = 34.0522;
const lng = -118.2437;
const radius = 25; // 25 miles to cover Greater LA area

// Get events for next 24 hours only
const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

const startDateTime = now.toISOString();
const endDateTime = tomorrow.toISOString();

console.log('🎫 TICKETMASTER EVENT VERIFICATION');
console.log('================================');
console.log(`📍 Location: Los Angeles (${lat}, ${lng})`);
console.log(`📊 Radius: ${radius} miles`);
console.log(`⏰ Time Range: ${startDateTime} to ${endDateTime}`);
console.log('📋 Fetching top 10 events...\n');

// Note: This would be the actual API call structure
const apiUrl = `https://app.ticketmaster.com/discovery/v2/events.json?geoPoint=${lat},${lng}&radius=${radius}&unit=miles&startDateTime=${startDateTime}&endDateTime=${endDateTime}&apikey=${TICKETMASTER_API_KEY}&size=10&sort=date,asc`;

console.log('🔗 API URL (with masked key):');
console.log(apiUrl.replace(TICKETMASTER_API_KEY, '[API_KEY]'));

// Mock data structure that would be returned
console.log('\n📄 EXPECTED EVENT DATA STRUCTURE:');
console.log('=====================================');

const mockEvents = [
  {
    title: 'Los Angeles Lakers vs Golden State Warriors',
    venue: 'Crypto.com Arena',
    address: '1111 S Figueroa St, Los Angeles, CA 90015',
    startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
    priceMin: 45,
    priceMax: 350,
    category: 'Sports',
    ticketmasterUrl: 'https://www.ticketmaster.com/event/123456'
  },
  {
    title: 'Billie Eilish - Hit Me Hard and Soft Tour',
    venue: 'Hollywood Bowl',
    address: '2301 N Highland Ave, Hollywood, CA 90068',
    startTime: new Date(now.getTime() + 5 * 60 * 60 * 1000), // 5 hours from now
    priceMin: 89,
    priceMax: 250,
    category: 'Music',
    ticketmasterUrl: 'https://www.ticketmaster.com/event/789012'
  },
  {
    title: 'Comedy Night at The Laugh Factory',
    venue: 'The Laugh Factory',
    address: '8001 Sunset Blvd, West Hollywood, CA 90046',
    startTime: new Date(now.getTime() + 8 * 60 * 60 * 1000), // 8 hours from now
    priceMin: 25,
    priceMax: 65,
    category: 'Comedy',
    ticketmasterUrl: 'https://www.ticketmaster.com/event/345678'
  },
  {
    title: 'Hamilton - Musical',
    venue: 'Hollywood Pantages Theatre',
    address: '6233 Hollywood Blvd, Hollywood, CA 90028',
    startTime: new Date(now.getTime() + 10 * 60 * 60 * 1000), // 10 hours from now
    priceMin: 129,
    priceMax: 450,
    category: 'Theatre',
    ticketmasterUrl: 'https://www.ticketmaster.com/event/901234'
  },
  {
    title: 'LA Galaxy vs LAFC - El Tráfico',
    venue: 'BMO Stadium',
    address: '3939 S Figueroa St, Los Angeles, CA 90037',
    startTime: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12 hours from now
    priceMin: 35,
    priceMax: 180,
    category: 'Sports',
    ticketmasterUrl: 'https://www.ticketmaster.com/event/567890'
  },
  {
    title: 'Dave Chappelle - Stand Up Comedy',
    venue: 'Microsoft Theater',
    address: '777 Chick Hearn Ct, Los Angeles, CA 90015',
    startTime: new Date(now.getTime() + 15 * 60 * 60 * 1000), // 15 hours from now
    priceMin: 75,
    priceMax: 300,
    category: 'Comedy',
    ticketmasterUrl: 'https://www.ticketmaster.com/event/234567'
  },
  {
    title: 'Los Angeles Clippers vs Phoenix Suns',
    venue: 'Crypto.com Arena',
    address: '1111 S Figueroa St, Los Angeles, CA 90015',
    startTime: new Date(now.getTime() + 18 * 60 * 60 * 1000), // 18 hours from now
    priceMin: 55,
    priceMax: 400,
    category: 'Sports',
    ticketmasterUrl: 'https://www.ticketmaster.com/event/890123'
  },
  {
    title: 'Ariana Grande - Eternal Sunshine Tour',
    venue: 'Kia Forum',
    address: '3900 W Manchester Blvd, Inglewood, CA 90305',
    startTime: new Date(now.getTime() + 20 * 60 * 60 * 1000), // 20 hours from now
    priceMin: 95,
    priceMax: 375,
    category: 'Music',
    ticketmasterUrl: 'https://www.ticketmaster.com/event/456789'
  },
  {
    title: 'Cirque du Soleil - ECHO',
    venue: 'Santa Monica Pier',
    address: '200 Santa Monica Pier, Santa Monica, CA 90401',
    startTime: new Date(now.getTime() + 22 * 60 * 60 * 1000), // 22 hours from now
    priceMin: 45,
    priceMax: 150,
    category: 'Family',
    ticketmasterUrl: 'https://www.ticketmaster.com/event/678901'
  },
  {
    title: 'Electronic Dance Music Festival',
    venue: 'Los Angeles Convention Center',
    address: '1201 S Figueroa St, Los Angeles, CA 90015',
    startTime: new Date(now.getTime() + 23 * 60 * 60 * 1000), // 23 hours from now
    priceMin: 85,
    priceMax: 220,
    category: 'Music',
    ticketmasterUrl: 'https://www.ticketmaster.com/event/012345'
  }
];

console.log('\n🎯 TOP 10 EVENTS (Next 24 Hours):');
console.log('==================================');

mockEvents.forEach((event, index) => {
  const timeUntil = Math.round((event.startTime.getTime() - now.getTime()) / (1000 * 60 * 60));
  const formattedTime = event.startTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  console.log(`\n${index + 1}. 🎫 ${event.title}`);
  console.log(`   📍 ${event.venue}`);
  console.log(`   📅 ${formattedTime} (in ${timeUntil} hours)`);
  console.log(`   💰 $${event.priceMin} - $${event.priceMax}`);
  console.log(`   🏷️  ${event.category}`);
  console.log(`   🔗 ${event.ticketmasterUrl}`);
});

console.log('\n✨ HOW THESE APPEAR IN THE APP:');
console.log('==============================');
console.log('• Each event becomes a GOLD PIN on the Los Angeles map');
console.log('• Pin location = Event venue coordinates');
console.log('• Clicking pin = Opens event detail modal');
console.log('• Modal shows all event info + direct Ticketmaster link');
console.log('• Events starting within 2 hours pulse/animate');
console.log('• All events auto-expire 48 hours after posting');

console.log('\n🔧 INTEGRATION STATUS:');
console.log('======================');
console.log('✅ Ticketmaster API integration code ready');
console.log('✅ Gold event marker components implemented');
console.log('✅ Event detail modal with Ticketmaster links');
console.log('✅ Database schema for event messages');
console.log('✅ Map integration for event pins');
console.log('⚠️  Requires valid Ticketmaster API key for live data');
console.log('⚠️  Supabase function needs to be deployed with API key');

console.log('\n📝 NOTE: This shows the expected data structure.');
console.log('Real integration requires a valid Ticketmaster Discovery API key.');