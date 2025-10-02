// Google Maps Diagnostic Script
// Run this in browser console to debug the maps issue

console.log('🔍 Google Maps Diagnostic Starting...');

// 1. Check if Google Maps API is loaded
console.log('1. Checking Google Maps API availability...');
if (typeof google !== 'undefined' && google.maps) {
  console.log('✅ Google Maps API is loaded');
  console.log('   - Version:', google.maps.version);
  console.log('   - Available libraries:', Object.keys(google.maps));
} else {
  console.log('❌ Google Maps API is NOT loaded');
}

// 2. Check for API key in environment
console.log('2. Checking API key configuration...');
const metaTags = document.querySelectorAll('script[src*="maps.googleapis.com"]');
if (metaTags.length > 0) {
  Array.from(metaTags).forEach((script, index) => {
    console.log(`   Script ${index + 1}:`, script.src);
  });
} else {
  console.log('❌ No Google Maps API script tags found');
}

// 3. Check for map containers
console.log('3. Checking for map containers...');
const mapContainers = document.querySelectorAll('[class*="map"]');
console.log(`   Found ${mapContainers.length} potential map containers`);
mapContainers.forEach((container, index) => {
  console.log(`   Container ${index + 1}:`, {
    className: container.className,
    dimensions: `${container.offsetWidth}x${container.offsetHeight}`,
    visible: container.offsetWidth > 0 && container.offsetHeight > 0
  });
});

// 4. Check React components state
console.log('4. Checking React state (if available)...');
const reactFiber = document.querySelector('#root')?._reactInternalInstance;
if (reactFiber) {
  console.log('   React fiber detected, app is running');
} else {
  console.log('   No React fiber detected');
}

// 5. Check console errors
console.log('5. Previous console errors related to maps:');
// This would show in the console naturally

// 6. Network requests check
console.log('6. Checking network requests...');
if (performance.getEntriesByType) {
  const networkEntries = performance.getEntriesByType('resource');
  const mapsRequests = networkEntries.filter(entry => 
    entry.name.includes('maps.googleapis.com') || 
    entry.name.includes('google') && entry.name.includes('maps')
  );
  
  console.log(`   Found ${mapsRequests.length} Maps-related network requests:`);
  mapsRequests.forEach(request => {
    console.log(`   - ${request.name} (${request.responseEnd - request.responseStart}ms)`);
  });
}

console.log('🔍 Google Maps Diagnostic Complete');
console.log('Run this script in your browser console while on the app page');