import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  
  // Capture ALL errors
  page.on('console', msg => {
    console.log(`CONSOLE [${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
    console.log('STACK:', err.stack);
  });
  
  page.on('framenavigated', frame => {
    console.log('NAVIGATION:', frame.url());
  });
  
  try {
    console.log('🎯 TESTING EVENT MODAL DIRECTLY');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 15000 });
    
    console.log('1. Waiting for app to load...');
    await page.waitForTimeout(10000);
    
    console.log('2. Injecting test event data and opening modal...');
    
    // Inject test event data directly into the React state
    await page.evaluate(() => {
      // Find the MapView component and trigger event modal
      const testEvent = {
        id: 'test-event-123',
        event_title: 'Test Event for Modal',
        event_venue: 'Test Venue',
        event_start_date: new Date().toISOString(),
        event_url: 'https://www.ticketmaster.com/test',
        event_source: 'ticketmaster',
        content: 'Test event content',
        created_at: new Date().toISOString(),
        lat: 34.0522,
        lng: -118.2437
      };
      
      console.log('🎫 DIRECT TEST: Attempting to open event modal with test data');
      
      // Try to trigger the modal through the window object
      if (window.React) {
        console.log('🎫 React is available, attempting to open modal');
        
        // Try to call the event handler directly
        window.testOpenEventModal = testEvent;
        
        // Dispatch a custom event that the app can listen for
        const event = new CustomEvent('testOpenEventModal', { detail: testEvent });
        window.dispatchEvent(event);
      }
    });
    
    console.log('3. Waiting for modal or navigation...');
    await page.waitForTimeout(5000);
    
    // Check page state
    const pageUrl = page.url();
    console.log('Page URL after test:', pageUrl);
    
    if (pageUrl === 'about:blank') {
      console.log('🚨 CONFIRMED: Page navigated to about:blank');
    }
    
    // Check for modal
    const modal = await page.$('[role="dialog"], .dialog, [class*="modal"]');
    if (modal) {
      console.log('✅ Modal found in DOM');
      const modalText = await modal.textContent();
      console.log('Modal preview:', modalText.substring(0, 100));
    } else {
      console.log('❌ No modal found');
    }
    
    // Check body content
    const bodyText = await page.textContent('body');
    const contentLength = bodyText ? bodyText.length : 0;
    console.log(`Body content length: ${contentLength}`);
    
    if (contentLength < 100) {
      console.log('🚨 BLANK SCREEN DETECTED');
    }
    
    await page.screenshot({ path: 'modal-test-direct.png' });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();