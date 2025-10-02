import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  
  // Listen for errors and console messages
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('event') || msg.text().includes('Event')) {
      console.log(`EVENT LOG [${msg.type()}]:`, msg.text());
    }
  });
  
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  try {
    console.log('🎫 Testing event selection functionality');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Wait for page to load and map to render
    await page.waitForTimeout(10000);
    
    // Check if there are any event markers on the map
    const eventMarkers = await page.$$('div[data-event-id], .event-marker, [class*="event"]');
    console.log(`Found ${eventMarkers.length} potential event markers`);
    
    // Look for event toggle button and activate events
    const eventsToggle = await page.$('button:has-text("Events"), .events-toggle, [data-testid*="event"]');
    if (eventsToggle) {
      console.log('Found events toggle, clicking...');
      await eventsToggle.click();
      await page.waitForTimeout(3000);
    }
    
    // Check what happens when clicking on any event-related element
    const eventElements = await page.$$('div[role="button"], button, .marker, [data-event-id]');
    console.log(`Found ${eventElements.length} clickable elements`);
    
    // Try to find and click the first event element
    if (eventElements.length > 0) {
      console.log('Attempting to click first event element...');
      await eventElements[0].click();
      await page.waitForTimeout(5000);
      
      // Check if page went blank
      const bodyContent = await page.textContent('body');
      const contentLength = bodyContent ? bodyContent.trim().length : 0;
      console.log(`Content length after event click: ${contentLength}`);
      
      if (contentLength < 100) {
        console.log('⚠️ Screen appears to have gone blank!');
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'debug-events.png', fullPage: true });
    console.log('Screenshot saved as debug-events.png');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();