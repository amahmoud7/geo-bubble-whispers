import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for all console messages
  page.on('console', msg => {
    console.log(`CONSOLE [${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  try {
    console.log('🗺️ Testing detailed map loading at http://localhost:8080');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Wait for page to stabilize
    await page.waitForTimeout(8000);
    
    // Check map loading state
    const mapState = await page.evaluate(() => {
      return {
        hasGoogleWindow: typeof window.google !== 'undefined',
        hasGoogleMaps: typeof window.google?.maps !== 'undefined',
        userLocationFromHook: window.userLocationDebug || 'not available',
        mapContainerElements: document.querySelectorAll('.map-container').length,
        googleMapElements: document.querySelectorAll('.gm-style').length,
        canvasElements: document.querySelectorAll('canvas').length,
        allDivs: document.querySelectorAll('div').length,
        bodyHTML: document.body.innerHTML.slice(0, 500) + '...'
      };
    });
    
    console.log('Map State:', JSON.stringify(mapState, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'debug-map-detailed.png', fullPage: true });
    console.log('Screenshot saved');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();