import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for map-related console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Map loaded') || text.includes('onLoad') || text.includes('🗺️')) {
      console.log(`MAP LOAD: ${text}`);
    }
  });
  
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  try {
    console.log('🗺️ Testing map onLoad callback');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Wait for map loading attempts
    await page.waitForTimeout(10000);
    
    // Check if the map loaded callbacks fired
    const mapLoadStatus = await page.evaluate(() => {
      return {
        hasCurrentGoogleMap: typeof window.currentGoogleMap !== 'undefined',
        mapInstanceExists: window.currentGoogleMap ? 'yes' : 'no'
      };
    });
    
    console.log('Map Load Status:', mapLoadStatus);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();