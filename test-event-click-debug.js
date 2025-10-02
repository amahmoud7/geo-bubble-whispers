import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  
  // Capture ALL console logs and errors
  page.on('console', msg => {
    console.log(`CONSOLE [${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  
  // Track page navigation/reloads
  page.on('framenavigated', frame => {
    console.log('NAVIGATION:', frame.url());
  });
  
  try {
    console.log('🎯 DEBUGGING EVENT MARKER CLICK ISSUE');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 15000 });
    
    console.log('1. Waiting for app to load...');
    await page.waitForTimeout(15000);
    
    console.log('2. Enabling events...');
    const eventsToggle = await page.$('button:has-text("Show Events"), button:has-text("Events Only"), button:has-text("DB:")');
    if (eventsToggle) {
      await eventsToggle.click();
      console.log('✅ Events toggle clicked');
      await page.waitForTimeout(5000);
    } else {
      console.log('❌ Events toggle not found');
      return;
    }
    
    console.log('3. Looking for event markers...');
    await page.waitForTimeout(3000);
    
    // Try different selectors for event markers
    const markerSelectors = [
      '[data-event-id]',
      '.event-marker',
      '[class*="event"]',
      'div[role="button"]:has-text("TM")',
      'div:has-text("$$")',
      '[title*="event"]'
    ];
    
    let eventMarker = null;
    
    for (const selector of markerSelectors) {
      try {
        eventMarker = await page.$(selector);
        if (eventMarker) {
          console.log(`✅ Found event marker with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!eventMarker) {
      console.log('❌ No event markers found, checking all clickable elements...');
      
      // Get all clickable elements and check their content
      const clickableElements = await page.$$eval('[role="button"], button, div[onclick], .cursor-pointer', elements => {
        return elements.map(el => ({
          tag: el.tagName,
          text: (el.textContent || '').substring(0, 50),
          classes: el.className,
          hasEventContent: (el.textContent || '').includes('TM') || 
                          (el.textContent || '').includes('$$') ||
                          (el.textContent || '').toLowerCase().includes('event')
        }));
      });
      
      console.log('Clickable elements found:');
      clickableElements.forEach((el, i) => {
        if (el.hasEventContent) {
          console.log(`  ${i}: ${el.tag} - "${el.text}" (${el.classes})`);
        }
      });
      
      // Try to click the first element that might be an event
      const eventElements = await page.$$('[role="button"], div[class*="marker"], div[class*="event"]');
      if (eventElements.length > 0) {
        eventMarker = eventElements[0];
        console.log(`🎯 Trying first potential event element...`);
      }
    }
    
    if (eventMarker) {
      console.log('4. Taking screenshot before click...');
      await page.screenshot({ path: 'before-event-click.png' });
      
      console.log('5. Clicking event marker...');
      
      // Monitor for page changes
      let pageContentBefore = await page.content();
      
      try {
        await eventMarker.click({ timeout: 10000 });
        console.log('✅ Event marker clicked successfully');
        
        // Wait a moment for modal or navigation
        await page.waitForTimeout(3000);
        
        // Check what happened to the page
        let pageContentAfter = await page.content();
        
        if (pageContentAfter !== pageContentBefore) {
          console.log('📄 Page content changed after click');
          
          // Check if page went blank
          const bodyText = await page.textContent('body');
          if (!bodyText || bodyText.trim().length < 100) {
            console.log('❌ BLANK SCREEN DETECTED!');
            console.log(`Body text length: ${bodyText ? bodyText.length : 0}`);
          } else {
            console.log('✅ Page still has content');
          }
          
          // Check for modal
          const modal = await page.$('[role="dialog"], .dialog, .modal, [class*="modal"]');
          if (modal) {
            console.log('✅ Modal detected after click');
            
            // Check modal content
            const modalText = await modal.textContent();
            console.log(`Modal content preview: ${modalText.substring(0, 200)}...`);
            
            // Look for Ticketmaster links
            const ticketLink = await page.$('a[href*="ticketmaster"], button:has-text("Ticket"), button:has-text("Get Tickets")');
            if (ticketLink) {
              console.log('✅ Ticketmaster link found in modal');
            } else {
              console.log('❌ No Ticketmaster link found');
            }
          } else {
            console.log('❌ No modal detected after click');
          }
        } else {
          console.log('📄 Page content unchanged');
        }
        
      } catch (clickError) {
        console.log(`❌ Click failed: ${clickError.message}`);
      }
      
      console.log('6. Taking screenshot after click...');
      await page.screenshot({ path: 'after-event-click.png' });
      
    } else {
      console.log('❌ No event markers found to click');
    }
    
    console.log('7. Final page state check...');
    const finalBodyText = await page.textContent('body');
    console.log(`Final body text length: ${finalBodyText ? finalBodyText.length : 0}`);
    
    if (!finalBodyText || finalBodyText.trim().length < 100) {
      console.log('🚨 CONFIRMED: Screen is blank after event interaction');
    } else {
      console.log('✅ Screen has content');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();