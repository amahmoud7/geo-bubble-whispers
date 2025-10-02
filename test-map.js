import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages and errors
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('Google Maps') || msg.text().includes('Map')) {
      console.log('MAP RELATED:', msg.type(), msg.text());
    }
  });
  
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  try {
    console.log('🗺️ Testing map loading at http://localhost:8080');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Wait for Google Maps to potentially load
    await page.waitForTimeout(10000);
    
    // Check for Google Maps elements
    const googleMapElement = await page.$('.gm-style');
    console.log('Google Map element found:', googleMapElement !== null);
    
    // Check for canvas elements (maps render to canvas)
    const canvasElements = await page.$$('canvas');
    console.log('Canvas elements found:', canvasElements.length);
    
    // Check for map container
    const mapContainer = await page.$('.map-container');
    console.log('Map container found:', mapContainer !== null);
    
    // Check if Google Maps API is loaded
    const googleMapsAPI = await page.evaluate(() => {
      return {
        hasGoogle: typeof window.google !== 'undefined',
        hasMaps: typeof window.google?.maps !== 'undefined',
        hasMap: typeof window.google?.maps?.Map !== 'undefined'
      };
    });
    console.log('Google Maps API status:', googleMapsAPI);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-map-loading.png', fullPage: true });
    console.log('Screenshot saved as debug-map-loading.png');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();