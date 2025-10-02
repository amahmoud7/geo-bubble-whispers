const puppeteer = require('puppeteer');

async function testReliableMapIntegration() {
  console.log('🧪 Testing ReliableMapView Integration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(msg.text());
    console.log(`🖥️  ${msg.text()}`);
  });
  
  // Listen for errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  try {
    console.log('🌐 Navigating to application...');
    await page.goto('http://localhost:8085', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully');
    
    // Wait for any ReliableMapView specific logs
    await page.waitForTimeout(5000);
    
    // Check if diagnostic overlay is present
    console.log('🔍 Checking for diagnostic overlay...');
    const diagnosticExists = await page.$('.absolute.top-4.left-4');
    
    if (diagnosticExists) {
      console.log('✅ Diagnostic overlay found');
      
      // Get diagnostic text
      const diagnosticText = await page.evaluate(() => {
        const diagnostic = document.querySelector('.absolute.top-4.left-4');
        return diagnostic ? diagnostic.textContent : null;
      });
      
      console.log(`📊 Diagnostic Content: ${diagnosticText}`);
    } else {
      console.log('❌ Diagnostic overlay not found');
    }
    
    // Check for Google Maps iframe or canvas
    console.log('🗺️  Checking for Google Maps elements...');
    
    await page.waitForTimeout(3000);
    
    const mapElements = await page.evaluate(() => {
      const iframes = document.querySelectorAll('iframe');
      const canvases = document.querySelectorAll('canvas');
      return {
        iframesCount: iframes.length,
        canvasesCount: canvases.length,
        hasGoogleMapsIframe: Array.from(iframes).some(iframe => 
          iframe.src && iframe.src.includes('maps.googleapis.com')
        )
      };
    });
    
    console.log(`📍 Map Elements: ${JSON.stringify(mapElements)}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'reliable-map-test-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: reliable-map-test-screenshot.png');
    
    // Filter ReliableMapView specific logs
    const reliableMapLogs = consoleMessages.filter(msg => 
      msg.includes('ReliableMapView') || 
      msg.includes('Google Map') ||
      msg.includes('API Key')
    );
    
    console.log('\n📋 ReliableMapView Logs:');
    reliableMapLogs.forEach(log => console.log(`   ${log}`));
    
    console.log('\n✅ Integration test completed successfully');
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Check if puppeteer is available
try {
  testReliableMapIntegration();
} catch (error) {
  console.log('⚠️  Puppeteer not available, skipping browser test');
  console.log('📝 Manual testing recommended');
}