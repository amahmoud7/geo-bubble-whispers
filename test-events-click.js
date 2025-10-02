import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  
  // Listen for errors and console messages
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('event') || msg.text().includes('Event') || msg.text().includes('🎫') || msg.text().includes('Opening')) {
      console.log(`EVENT LOG [${msg.type()}]:`, msg.text());
    }
  });
  
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  try {
    console.log('🎫 Testing event clicking functionality');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Wait for page to load and events to be fetched
    await page.waitForTimeout(12000);
    
    // Take a screenshot to see current state
    await page.screenshot({ path: 'before-click.png' });
    
    console.log('Looking for event markers specifically...');
    
    // Look for event-specific selectors in the DOM
    const eventMarkers = await page.$$eval('*', elements => {
      return elements
        .filter(el => {
          const text = el.textContent || '';
          const classes = String(el.className || '');
          const id = String(el.id || '');
          return text.includes('🎫') || 
                 text.includes('Taco Tuesday') || 
                 text.includes('America\'s Got Talent') ||
                 classes.includes('event') ||
                 id.includes('event');
        })
        .map(el => ({
          tagName: el.tagName,
          text: (el.textContent || '').substring(0, 100),
          classes: String(el.className || ''),
          id: String(el.id || ''),
          clickable: el.onclick !== null || el.role === 'button' || el.tagName === 'BUTTON'
        }));
    });
    
    console.log('Found event-related elements:', eventMarkers.length);
    eventMarkers.forEach((marker, i) => {
      console.log(`${i+1}. ${marker.tagName}: "${marker.text}" (clickable: ${marker.clickable})`);
    });
    
    // Try clicking on event posts more specifically
    try {
      // Look for elements with event titles
      const eventTitle = await page.$('text=Taco Tuesday');
      if (eventTitle) {
        console.log('Found "Taco Tuesday" event, clicking...');
        await eventTitle.click();
        await page.waitForTimeout(3000);
        
        // Check if modal opened
        const modal = await page.$('[role="dialog"], .dialog, .modal');
        if (modal) {
          console.log('✅ Event modal opened successfully!');
          
          // Look for Ticketmaster link
          const ticketLink = await page.$('text=/.*ticketmaster.*/i, text=/.*get tickets.*/i, text=/.*buy tickets.*/i');
          if (ticketLink) {
            console.log('✅ Found ticket link!');
          } else {
            console.log('❌ No ticket link found');
          }
        } else {
          console.log('❌ No modal opened');
        }
      } else {
        console.log('❌ Could not find "Taco Tuesday" event');
      }
    } catch (clickError) {
      console.log('❌ Error clicking event:', clickError.message);
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'after-click.png', fullPage: true });
    console.log('Screenshots saved: before-click.png, after-click.png');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();