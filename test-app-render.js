/**
 * Quick test to see what's actually rendering in the browser
 */

import { chromium } from 'playwright';

async function testAppRender() {
  console.log('🧪 Testing Lo app rendering...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Collect console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Collect errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.toString());
  });
  
  try {
    console.log('📱 Navigating to http://localhost:8080...');
    await page.goto('http://localhost:8080', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    // Wait a bit for React to render
    await page.waitForTimeout(3000);
    
    // Check if splash screen is visible
    const splashScreen = await page.$('.fixed.inset-0.z-\\[9999\\]');
    console.log('✨ Splash screen visible:', !!splashScreen);
    
    // Check if the "Lo" text is visible
    const loText = await page.textContent('body');
    console.log('📝 Page contains "Lo":', loText?.includes('L'));
    
    // Get the root element content
    const rootContent = await page.$('#root');
    const rootHTML = rootContent ? await rootContent.innerHTML() : 'EMPTY';
    
    console.log('\n📄 Root element content (first 500 chars):');
    console.log(rootHTML.substring(0, 500));
    console.log('...\n');
    
    // Check for specific elements
    const hasMapProvider = loText?.includes('MapProvider');
    const hasGoogleMaps = loText?.includes('Google');
    const hasSplashAnimation = !!splashScreen;
    
    console.log('🔍 Element checks:');
    console.log('   - Splash screen:', hasSplashAnimation ? '✅' : '❌');
    console.log('   - Content in root:', rootHTML.length > 100 ? '✅' : '❌');
    console.log('   - Page rendered:', rootHTML !== 'EMPTY' ? '✅' : '❌');
    
    // Log console messages
    if (consoleLogs.length > 0) {
      console.log('\n📋 Console logs:');
      consoleLogs.slice(0, 10).forEach(log => console.log('   ', log));
      if (consoleLogs.length > 10) {
        console.log(`   ... and ${consoleLogs.length - 10} more`);
      }
    }
    
    // Log errors
    if (errors.length > 0) {
      console.log('\n❌ Errors found:');
      errors.forEach(err => console.log('   ', err));
    } else {
      console.log('\n✅ No JavaScript errors detected');
    }
    
    // Take a screenshot
    await page.screenshot({ path: '/tmp/lo-app-screenshot.png' });
    console.log('\n📸 Screenshot saved to /tmp/lo-app-screenshot.png');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    
    // Try to get any content
    try {
      const bodyText = await page.textContent('body');
      console.log('\n📄 Body content:', bodyText?.substring(0, 200));
    } catch (e) {
      console.log('Could not retrieve body content');
    }
  } finally {
    await browser.close();
  }
}

testAppRender().catch(console.error);
