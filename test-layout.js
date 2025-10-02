import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 } // iPhone 12 Pro size
  });
  const page = await context.newPage();
  
  try {
    console.log('🔍 Testing layout fixes at http://localhost:8080');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Wait for page to load
    await page.waitForTimeout(8000);
    
    // Check z-index hierarchy
    const layoutCheck = await page.evaluate(() => {
      const searchBar = document.querySelector('.absolute.top-0.inset-x-0');
      const eventsButton = document.querySelector('.absolute.bottom-32');
      const bottomNav = document.querySelector('.fixed.bottom-0');
      
      return {
        searchBarZIndex: searchBar ? window.getComputedStyle(searchBar).zIndex : 'not found',
        eventsButtonZIndex: eventsButton ? window.getComputedStyle(eventsButton).zIndex : 'not found',
        bottomNavZIndex: bottomNav ? window.getComputedStyle(bottomNav).zIndex : 'not found',
        searchBarExists: !!searchBar,
        eventsButtonExists: !!eventsButton,
        bottomNavExists: !!bottomNav
      };
    });
    
    console.log('Layout Check Results:', layoutCheck);
    
    // Take screenshot to verify positioning
    await page.screenshot({ path: 'layout-test-mobile.png', fullPage: true });
    console.log('Screenshot saved as layout-test-mobile.png');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();