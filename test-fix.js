import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages and errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  try {
    console.log('🔍 Testing fixed Home page at http://localhost:8080');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Wait for the page to load
    await page.waitForTimeout(8000);
    
    // Check if any content is visible
    const bodyText = await page.textContent('body');
    const bodyLength = bodyText ? bodyText.trim().length : 0;
    
    console.log('Body content length:', bodyLength);
    console.log('Page title:', await page.title());
    
    // Look for the search bar
    const searchBar = await page.$('input[placeholder*="Search"]');
    console.log('Search bar found:', searchBar !== null);
    
    // Look for map container
    const mapContainer = await page.$('.map-container');
    console.log('Map container found:', mapContainer !== null);
    
    // Look for the Lo logo
    const logo = await page.$('img[alt="Lo Logo"]');
    console.log('Lo logo found:', logo !== null);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-fixed-screen.png', fullPage: true });
    console.log('Screenshot saved as debug-fixed-screen.png');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();