import { chromium } from 'playwright';

async function manualVerification() {
  console.log('🔍 Starting Manual Verification for iOS Deployment Readiness\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  
  const page = await context.newPage();
  
  // Track console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const message = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    console.log(`Console: ${message}`);
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  page.on('pageerror', error => {
    console.log(`Page Error: ${error.message}`);
    consoleMessages.push({
      type: 'error',
      text: `Page Error: ${error.message}`
    });
  });

  try {
    console.log('📍 Testing Home Page with Google Maps...');
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle' });
    
    // Wait longer for maps to load
    console.log('⏳ Waiting for Google Maps to load...');
    await page.waitForTimeout(8000);
    
    // Check if we can find any map-related elements
    const mapContainer = await page.locator('div[data-testid="map-container"], .map-container, #map, [role="main"] div').first();
    const canvasElements = await page.locator('canvas').count();
    
    console.log(`Found ${canvasElements} canvas elements`);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/manual-home-verification.png', fullPage: true });
    
    // Check for Google Maps in window
    const googleMapsStatus = await page.evaluate(() => {
      return {
        hasGoogle: typeof window.google !== 'undefined',
        hasMaps: typeof window.google?.maps !== 'undefined',
        apiKey: window.location.search.includes('key=') ? 'present in URL' : 'not in URL'
      };
    });
    
    console.log('Google Maps API Status:', googleMapsStatus);
    
    console.log('\n🔧 Testing Diagnostic Page...');
    await page.goto('http://localhost:8082/diagnostic', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const diagnosticContent = await page.textContent('body');
    console.log(`Diagnostic page content length: ${diagnosticContent?.length || 0} characters`);
    
    await page.screenshot({ path: 'test-results/manual-diagnostic-verification.png', fullPage: true });
    
    console.log('\n🧭 Testing Navigation...');
    const pages = [
      { url: 'http://localhost:8082/', name: 'Home' },
      { url: 'http://localhost:8082/profile', name: 'Profile' },
      { url: 'http://localhost:8082/auth', name: 'Auth' },
      { url: 'http://localhost:8082/explore', name: 'Explore' }
    ];
    
    for (const pageInfo of pages) {
      console.log(`Testing ${pageInfo.name} page...`);
      await page.goto(pageInfo.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const content = await page.textContent('body');
      const hasContent = content && content.trim().length > 100;
      
      console.log(`${pageInfo.name}: ${hasContent ? '✅ Has content' : '❌ No content'} (${content?.length || 0} chars)`);
      
      await page.screenshot({ path: `test-results/manual-${pageInfo.name.toLowerCase()}-verification.png` });
    }
    
    console.log('\n📱 Testing Mobile Responsiveness...');
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12 Pro
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/manual-mobile-verification.png' });
    
    console.log('\n📊 Console Messages Summary:');
    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors found:');
      errors.forEach((error, i) => console.log(`${i + 1}. ${error.text}`));
    }
    
    if (warnings.length > 0) {
      console.log('\nWarnings found:');
      warnings.forEach((warning, i) => console.log(`${i + 1}. ${warning.text}`));
    }
    
  } catch (error) {
    console.error('❌ Error during manual verification:', error.message);
  } finally {
    // Keep browser open for manual inspection
    console.log('\n✋ Browser will stay open for manual inspection. Close it when done.');
    
    // Don't close browser automatically - let user inspect
    // await browser.close();
  }
}

manualVerification().catch(console.error);