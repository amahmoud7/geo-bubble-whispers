import { chromium } from '@playwright/test';

async function testEventToggle() {
  console.log('🎫 Testing Event Toggle Functionality...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  try {
    const page = await browser.newPage({ 
      viewport: { width: 390, height: 844 }
    });
    
    await page.goto('http://localhost:8083', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Wait for full load
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'test-results/event-test-01-initial.png',
      fullPage: true 
    });
    
    // Look for events toggle button - try multiple selectors
    const selectors = [
      'button:has-text("Show Events")',
      'button:has-text("Events")',
      'button:has-text("Exit Events")',
      '[class*="events"]',
      '[data-testid*="events"]'
    ];
    
    let eventsButton = null;
    for (const selector of selectors) {
      try {
        eventsButton = page.locator(selector).first();
        if (await eventsButton.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found events button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ Selector "${selector}" not found`);
      }
    }
    
    if (!eventsButton || !(await eventsButton.isVisible())) {
      console.log('❌ Events toggle button not found');
      return false;
    }
    
    // Get button text before clicking
    const buttonText = await eventsButton.textContent();
    console.log(`🎫 Button text: "${buttonText}"`);
    
    // Click the events button
    try {
      await eventsButton.click({ timeout: 10000 });
      console.log('✅ Successfully clicked events button');
      
      // Wait for events to load
      await page.waitForTimeout(8000);
      
      // Take screenshot after clicking
      await page.screenshot({ 
        path: 'test-results/event-test-02-after-click.png',
        fullPage: true 
      });
      
      // Check for event markers or content
      const eventElements = await page.locator('[class*="event"], [data-testid*="event"], [class*="marker"]').count();
      console.log(`🎫 Found ${eventElements} potential event elements`);
      
      // Check if button text changed
      const newButtonText = await eventsButton.textContent();
      console.log(`🎫 Button text after click: "${newButtonText}"`);
      
      if (buttonText !== newButtonText) {
        console.log('✅ Button text changed - toggle appears to work');
        return true;
      } else {
        console.log('⚠️ Button text unchanged - may need investigation');
        return eventElements > 0;
      }
      
    } catch (clickError) {
      console.log(`❌ Failed to click events button: ${clickError.message}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testEventToggle().then(success => {
  console.log(`\n🎯 Event toggle test: ${success ? 'PASS' : 'FAIL'}`);
  process.exit(success ? 0 : 1);
});