/**
 * Automated test to verify map loads correctly
 * Tests the complete map initialization flow
 */

const puppeteer = require('puppeteer');

async function testMapLoading() {
  console.log('🧪 Starting map loading test...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Listen for console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);

      // Log important messages
      if (text.includes('🗺️') || text.includes('✅') || text.includes('❌')) {
        console.log(`  ${text}`);
      }
    });

    // Listen for errors
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
      console.error(`  ❌ Page Error: ${error.message}`);
    });

    page.on('requestfailed', request => {
      const failure = request.failure();
      console.warn(`  ⚠️  Request Failed: ${request.url()} - ${failure?.errorText || 'Unknown'}`);
    });

    console.log('📍 Navigating to http://localhost:8080...');
    await page.goto('http://localhost:8080', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('✅ Page loaded\n');

    // Wait for either map to load or error to show
    console.log('⏳ Waiting for map initialization...');

    try {
      await page.waitForFunction(
        () => {
          // Check if Google Maps API loaded
          const hasGoogleMaps = window.google && window.google.maps;

          // Check if map loaded successfully (look for map container)
          const hasMapContainer = document.querySelector('.map-container');

          // Check for error fallback
          const hasError = document.body.textContent.includes('Unable to load Google Maps') ||
                          document.body.textContent.includes('Map Failed to Load');

          return hasGoogleMaps || hasMapContainer || hasError;
        },
        { timeout: 15000 }
      );

      console.log('✅ Map initialization completed\n');
    } catch (waitError) {
      console.error('❌ Timeout waiting for map initialization');
      throw waitError;
    }

    // Check final state
    const mapState = await page.evaluate(() => {
      return {
        hasGoogleMaps: !!(window.google && window.google.maps),
        hasMapContainer: !!document.querySelector('.map-container'),
        hasMapCanvas: !!document.querySelector('canvas'),
        hasErrorMessage: document.body.textContent.includes('Unable to load') ||
                        document.body.textContent.includes('Map Failed'),
        bodyText: document.body.textContent.substring(0, 500)
      };
    });

    console.log('📊 Final Map State:');
    console.log(`  Google Maps API Loaded: ${mapState.hasGoogleMaps ? '✅' : '❌'}`);
    console.log(`  Map Container Present: ${mapState.hasMapContainer ? '✅' : '❌'}`);
    console.log(`  Map Canvas Present: ${mapState.hasMapCanvas ? '✅' : '❌'}`);
    console.log(`  Error Message Shown: ${mapState.hasErrorMessage ? '⚠️  YES' : '✅ NO'}\n`);

    // Take screenshot
    await page.screenshot({ path: 'map-test-result.png', fullPage: false });
    console.log('📸 Screenshot saved to map-test-result.png\n');

    // Check console for specific messages
    const hasAPIKeyLog = consoleMessages.some(m => m.includes('API key'));
    const hasLoadedLog = consoleMessages.some(m => m.includes('Google Maps API loaded'));
    const hasErrorLog = consoleMessages.some(m => m.includes('load error') || m.includes('Maps load error'));

    console.log('📋 Console Log Analysis:');
    console.log(`  API Key Messages: ${hasAPIKeyLog ? '✅' : '⚠️  None found'}`);
    console.log(`  Loaded Messages: ${hasLoadedLog ? '✅' : '⚠️  None found'}`);
    console.log(`  Error Messages: ${hasErrorLog ? '⚠️  Found errors' : '✅ Clean'}\n`);

    // Final verdict
    const success = mapState.hasGoogleMaps &&
                   mapState.hasMapContainer &&
                   !mapState.hasErrorMessage &&
                   errors.length === 0;

    if (success) {
      console.log('🎉 TEST PASSED: Map loaded successfully!');
      console.log('✅ All checks passed\n');
      return true;
    } else {
      console.log('❌ TEST FAILED: Map did not load correctly');
      if (!mapState.hasGoogleMaps) {
        console.log('  - Google Maps API failed to load');
      }
      if (!mapState.hasMapContainer) {
        console.log('  - Map container not found in DOM');
      }
      if (mapState.hasErrorMessage) {
        console.log('  - Error message displayed to user');
      }
      if (errors.length > 0) {
        console.log(`  - ${errors.length} JavaScript errors occurred`);
        errors.forEach(err => console.log(`    • ${err}`));
      }
      console.log('');
      return false;
    }

  } catch (error) {
    console.error('❌ TEST ERROR:', error.message);
    console.error('');
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testMapLoading()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
