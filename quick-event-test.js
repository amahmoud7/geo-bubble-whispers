import { chromium } from 'playwright';

async function runEventTest() {
  console.log('🔍 Starting Event Modal Debug Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Monitor console logs
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: Date.now()
    });
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  try {
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(5000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/01-initial-page.png', fullPage: true });
    
    console.log('🗺️ Checking for map...');
    const mapExists = await page.locator('.gm-style, [data-testid="google-map"]').count();
    console.log(`Map elements found: ${mapExists}`);
    
    console.log('🔘 Looking for events toggle...');
    const eventsToggle = page.locator('button:has-text("Events"), [data-testid="events-toggle"]').first();
    const toggleExists = await eventsToggle.count();
    console.log(`Events toggle found: ${toggleExists > 0}`);
    
    if (toggleExists > 0) {
      const isPressed = await eventsToggle.getAttribute('aria-pressed');
      console.log(`Events toggle pressed: ${isPressed}`);
      
      if (isPressed !== 'true') {
        console.log('🔄 Enabling events...');
        await eventsToggle.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-results/02-events-enabled.png', fullPage: true });
      }
    }
    
    console.log('🔍 Searching for event markers...');
    await page.waitForTimeout(2000);
    
    // Try different selectors for event markers
    const selectors = [
      '[data-testid*="event-marker"]',
      '.event-marker',
      '[class*="event"]',
      'div[style*="z-index: 40"]',
      'div[style*="position: absolute"][style*="cursor: pointer"]'
    ];
    
    let eventMarker = null;
    let markerSelector = '';
    
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      console.log(`Selector "${selector}": ${count} elements`);
      
      if (count > 0) {
        eventMarker = page.locator(selector).first();
        markerSelector = selector;
        console.log(`✅ Found event marker with selector: ${selector}`);
        break;
      }
    }
    
    if (!eventMarker) {
      console.log('❌ No event markers found. Checking page state...');
      
      // Check for any gold/yellow elements (typical event marker colors)
      const coloredElements = await page.locator('div[style*="gold"], div[style*="yellow"], div[style*="#f59e0b"], div[style*="#fbbf24"]').count();
      console.log(`Gold/yellow colored elements: ${coloredElements}`);
      
      // Check for any clickable elements
      const clickableElements = await page.locator('[onclick], [role="button"], button, div[style*="cursor: pointer"]').count();
      console.log(`Clickable elements: ${clickableElements}`);
      
      // Check React state
      const reactState = await page.evaluate(() => {
        const windowObj = window;
        return {
          hasReact: !!window.React,
          events: windowObj.events || null,
          selectedEvent: windowObj.selectedEvent || null,
          showEventModal: windowObj.showEventModal || null,
          mapLoaded: !!windowObj.google?.maps
        };
      });
      console.log('React state:', reactState);
      
      await page.screenshot({ path: 'test-results/03-no-events-debug.png', fullPage: true });
      
      console.log('⚠️ No event markers found - this may be the issue');
      return { success: false, reason: 'No event markers found' };
    }
    
    console.log('📍 Attempting to click event marker...');
    
    // Get initial modal state
    const initialModalState = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"], .modal');
      return {
        modalExists: !!modal,
        modalVisible: modal ? window.getComputedStyle(modal).display !== 'none' : false
      };
    });
    console.log('Initial modal state:', initialModalState);
    
    // Click the event marker
    await eventMarker.click();
    console.log('✅ Clicked event marker');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check post-click state
    const postClickState = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"], .modal, [data-testid*="event-modal"]');
      const windowObj = window;
      
      return {
        modalExists: !!modal,
        modalVisible: modal ? window.getComputedStyle(modal).display !== 'none' : false,
        modalContent: modal ? modal.textContent?.substring(0, 100) : null,
        selectedEvent: windowObj.selectedEvent || null,
        showEventModal: windowObj.showEventModal || null,
        allModals: document.querySelectorAll('[role="dialog"], .modal').length
      };
    });
    
    console.log('Post-click state:', postClickState);
    
    await page.screenshot({ path: 'test-results/04-after-event-click.png', fullPage: true });
    
    // Check for any errors
    const errors = logs.filter(log => log.type === 'error');
    console.log(`Console errors found: ${errors.length}`);
    errors.forEach(error => console.log(`Error: ${error.text}`));
    
    if (!postClickState.modalVisible && !postClickState.selectedEvent) {
      console.log('🔴 BLANK SCREEN ISSUE CONFIRMED: No modal appeared after click');
      
      // Try to force a modal to test if rendering works at all
      console.log('🧪 Testing if modal rendering works by forcing one...');
      
      const forceModalTest = await page.evaluate(() => {
        const testModal = document.createElement('div');
        testModal.id = 'force-test-modal';
        testModal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        `;
        testModal.innerHTML = `
          <div style="background: white; padding: 30px; border-radius: 8px; max-width: 400px;">
            <h2>FORCE TEST MODAL</h2>
            <p>This modal was created to test if modal rendering works at all.</p>
            <p>If you can see this, modal rendering is functional.</p>
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
          </div>
        `;
        document.body.appendChild(testModal);
        return true;
      });
      
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/05-force-modal-test.png', fullPage: true });
      
      const forceModalVisible = await page.locator('#force-test-modal').isVisible();
      console.log(`Force modal visible: ${forceModalVisible}`);
      
      if (forceModalVisible) {
        console.log('✅ Modal rendering works - issue is in event click handler');
        await page.click('#force-test-modal button');
      } else {
        console.log('❌ Modal rendering broken - deeper issue');
      }
      
      return { 
        success: false, 
        reason: 'Event click does not trigger modal',
        modalRenderingWorks: forceModalVisible,
        errors: errors
      };
    } else {
      console.log('✅ Modal appeared successfully');
      return { success: true, modalState: postClickState };
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: 'test-results/error-screenshot.png', fullPage: true });
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

runEventTest().then(result => {
  console.log('\n🏁 Test Results:');
  console.log(JSON.stringify(result, null, 2));
  
  if (!result.success) {
    console.log('\n🔴 EVENT MODAL ISSUE IDENTIFIED:');
    if (result.reason === 'No event markers found') {
      console.log('- Events are not loading or not visible on the map');
      console.log('- Check event data loading, API calls, and marker rendering');
    } else if (result.reason === 'Event click does not trigger modal') {
      console.log('- Event markers exist but clicks don\'t trigger modal');
      console.log('- Check handleEventClick function and state management');
      if (result.modalRenderingWorks) {
        console.log('- Modal rendering itself works, issue is in click handler');
      } else {
        console.log('- Modal rendering is broken entirely');
      }
    }
  }
}).catch(error => {
  console.error('Failed to run test:', error);
});