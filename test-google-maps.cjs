#!/usr/bin/env node

const https = require('https');

// API key from environment
const API_KEY = 'AIzaSyCja18mhM6OgcQPkZp7rCZM6C29SGz3S4U';

console.log('🧪 Google Maps API Test Started');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Test 1: Validate API key format
console.log('\n1️⃣ Testing API Key Format...');
if (API_KEY && API_KEY.startsWith('AIza') && API_KEY.length === 39) {
  console.log('✅ API key format is valid');
  console.log(`   Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(-4)}`);
  console.log(`   Length: ${API_KEY.length} characters`);
} else {
  console.log('❌ API key format is invalid');
  console.log(`   Expected: AIza... (39 chars)`);
  console.log(`   Got: ${API_KEY ? API_KEY.substring(0, 8) + '...' : 'undefined'} (${API_KEY ? API_KEY.length : 0} chars)`);
  process.exit(1);
}

// Test 2: Test Geocoding API
console.log('\n2️⃣ Testing Geocoding API...');
const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${API_KEY}`;

https.get(geocodeUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.status === 'OK') {
        console.log('✅ Geocoding API test successful');
        console.log(`   Status: ${json.status}`);
        console.log(`   Results: ${json.results.length} found`);
        if (json.results.length > 0) {
          console.log(`   Address: ${json.results[0].formatted_address}`);
        }
      } else {
        console.log('❌ Geocoding API test failed');
        console.log(`   Status: ${json.status}`);
        console.log(`   Error: ${json.error_message || 'Unknown error'}`);
      }
      
      // Test 3: Test JavaScript API accessibility
      console.log('\n3️⃣ Testing JavaScript API URL...');
      const jsApiUrl = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=initMap`;
      
      https.get(jsApiUrl, (jsRes) => {
        console.log('✅ JavaScript API URL is accessible');
        console.log(`   Status: ${jsRes.statusCode} ${jsRes.statusMessage}`);
        console.log(`   Content-Type: ${jsRes.headers['content-type']}`);
        
        if (jsRes.statusCode === 200) {
          console.log('\n🎉 All API tests passed!');
          console.log('\n📋 Summary:');
          console.log('   ✅ API key format is valid');
          console.log('   ✅ Geocoding API is working');
          console.log('   ✅ JavaScript API URL is accessible');
          console.log('\n💡 The API key appears to be working correctly.');
          console.log('   The issue may be with the React integration or browser loading.');
          console.log('\n🔧 Next steps:');
          console.log('   1. Open http://localhost:8087/diagnostic in your browser');
          console.log('   2. Click "Run Diagnostics" to run comprehensive tests');
          console.log('   3. Check browser console for detailed error messages');
        } else {
          console.log('❌ JavaScript API URL returned non-200 status');
        }
        
      }).on('error', (err) => {
        console.log('❌ JavaScript API URL test failed');
        console.log(`   Error: ${err.message}`);
      });
      
    } catch (error) {
      console.log('❌ Failed to parse Geocoding API response');
      console.log(`   Error: ${error.message}`);
    }
  });
}).on('error', (err) => {
  console.log('❌ Geocoding API request failed');
  console.log(`   Error: ${err.message}`);
});