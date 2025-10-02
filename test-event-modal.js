import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  
  // Listen for console logs
  page.on('console', msg => {
    if (msg.text().includes('🎫') || msg.text().includes('Opening') || msg.text().includes('modal')) {
      console.log(`CONSOLE [${msg.type()}]:`, msg.text());
    }
  });
  
  try {
    console.log('🎫 Testing event modal and Ticketmaster functionality');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Wait for events to load
    await page.waitForTimeout(15000);
    
    console.log('Looking for clickable event markers...');
    
    // Try clicking on the first visible marker/button that might be an event
    const clickableElements = await page.$$('[role="button"], button, .marker, [data-testid], [class*="marker"]');
    console.log(`Found ${clickableElements.length} clickable elements`);
    
    // Try clicking on elements one by one until we find an event
    for (let i = 0; i < Math.min(clickableElements.length, 10); i++) {
      try {
        console.log(`Trying to click element ${i+1}...`);
        
        // Get element info
        const elementInfo = await clickableElements[i].evaluate(el => ({
          tagName: el.tagName,
          className: el.className,
          textContent: (el.textContent || '').substring(0, 50),
          id: el.id
        }));
        
        console.log(`Element ${i+1}: ${elementInfo.tagName} - "${elementInfo.textContent}" (${elementInfo.className})`);
        
        // Click the element
        await clickableElements[i].click({ timeout: 5000 });
        await page.waitForTimeout(2000);
        
        // Check if a modal opened
        const modal = await page.$('[role="dialog"], .dialog-content, [class*="modal"], [class*="dialog"]');
        if (modal) {
          console.log('✅ Modal detected! Checking for event content...');
          
          // Look for event-specific content in the modal
          const modalContent = await modal.textContent();
          console.log('Modal content preview:', modalContent.substring(0, 200) + '...');
          
          // Look for Ticketmaster/ticket links
          const ticketButton = await page.$('text=/.*get tickets.*/i, text=/.*ticketmaster.*/i, text=/.*buy tickets.*/i, button:has-text("Get Tickets")');
          if (ticketButton) {
            console.log('✅ Found ticket button!');
            
            // Check if button has proper URL
            const buttonText = await ticketButton.textContent();
            console.log('Ticket button text:', buttonText);
            
            // Try clicking the ticket button (but don't actually navigate away)
            console.log('Testing ticket button click...');
            
            // Listen for window.open calls
            await page.evaluate(() => {
              window.originalOpen = window.open;
              window.open = (url, target) => {
                console.log('🔗 Window.open called with URL:', url);
                return null; // Prevent actual navigation
              };
            });
            
            await ticketButton.click();
            await page.waitForTimeout(1000);
            
          } else {
            console.log('❌ No ticket button found in modal');
          }
          
          // Close modal and break
          const closeButton = await page.$('[aria-label="Close"], button:has-text("×"), button:has-text("Close")');
          if (closeButton) {
            await closeButton.click();
          }
          break;
        }
      } catch (clickError) {
        console.log(`Could not click element ${i+1}:`, clickError.message);
      }
    }
    
    await page.screenshot({ path: 'event-modal-test.png' });
    console.log('Screenshot saved: event-modal-test.png');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();