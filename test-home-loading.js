// Quick test to verify home page loads without errors
import playwright from 'playwright';

async function testHomePageLoading() {
  const browser = await playwright.chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // Collect JavaScript errors
  const jsErrors = [];
  page.on('pageerror', error => {
    jsErrors.push(error.message);
  });
  
  try {
    console.log('🧪 Testing home page loading at http://localhost:8086');
    
    // Navigate to home page
    const response = await page.goto('http://localhost:8086', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log(`📊 Response status: ${response.status()}`);
    
    // Wait for React to load
    await page.waitForSelector('#root', { timeout: 10000 });
    console.log('✅ React root found');
    
    // Wait a bit for components to mount
    await page.waitForTimeout(3000);
    
    // Check if there's content in the root
    const rootContent = await page.$eval('#root', el => el.innerHTML);
    console.log(`📏 Root content length: ${rootContent.length} characters`);
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: 'home-page-test-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved as home-page-test-screenshot.png');
    
    // Check for specific elements
    const mapExists = await page.$('.google-map') !== null;
    const headerExists = await page.$('header') !== null;
    const bottomNavExists = await page.$('nav') !== null;
    
    console.log('🗺️ Map component found:', mapExists);
    console.log('🎯 Header found:', headerExists);
    console.log('🧭 Bottom navigation found:', bottomNavExists);
    
    // Report console messages
    console.log('\\n📝 Console messages:');
    consoleMessages.slice(-10).forEach(msg => console.log(`  ${msg}`));
    
    // Report JavaScript errors
    if (jsErrors.length > 0) {
      console.log('\\n🚨 JavaScript errors:');
      jsErrors.forEach(error => console.log(`  ERROR: ${error}`));
      return false;
    }
    
    // Basic health check
    if (rootContent.length < 100) {
      console.log('❌ Root content seems empty or too small');
      return false;
    }
    
    console.log('✅ Home page loaded successfully!');
    return true;
    
  } catch (error) {
    console.error('🚨 Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testHomePageLoading().then(success => {
  if (success) {
    console.log('\\n🎉 HOME PAGE LOADING TEST PASSED!');
    process.exit(0);
  } else {
    console.log('\\n💥 HOME PAGE LOADING TEST FAILED!');
    process.exit(1);
  }
});