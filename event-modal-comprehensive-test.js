// Comprehensive Event Modal and Layout Testing Script
import { chromium, firefox, webkit } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:8083';
const SCREENSHOT_DIR = './test-results';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test Results Storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0, total: 0 }
};

function logResult(testName, status, details, error = null) {
  const result = {
    name: testName,
    status: status, // 'PASS' or 'FAIL'
    details: details,
    error: error,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
    console.log(`✅ ${testName}: ${details}`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${testName}: ${details}`);
    if (error) console.log(`   Error: ${error}`);
  }
}

async function testEventModalFunctionality(browser, browserName) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 } // Mobile viewport (iPhone 14)
  });
  
  const page = await context.newPage();
  
  try {
    console.log(`\n🧪 Testing Event Modal Functionality on ${browserName}...`);
    
    // 1. Navigate to home page
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000); // Wait for map to load
    
    // Check if page loads without errors
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, `${browserName}-home-page.png`),
      fullPage: true 
    });
    
    logResult(
      `${browserName} - Home Page Load`,
      errors.length === 0 ? 'PASS' : 'FAIL',
      errors.length === 0 ? 'Page loaded without console errors' : `${errors.length} console errors found`,
      errors.length > 0 ? errors.join('; ') : null
    );
    
    // 2. Look for Events button/toggle
    const eventsButton = await page.locator('[data-testid="events-toggle"], .events-toggle, button:has-text("Events")').first();
    const eventsButtonVisible = await eventsButton.isVisible().catch(() => false);
    
    if (eventsButtonVisible) {
      await eventsButton.click();
      await page.waitForTimeout(1000);
      
      logResult(
        `${browserName} - Events Button Click`,
        'PASS',
        'Events button clicked successfully'
      );
      
      // 3. Look for event pins/markers on map
      await page.waitForTimeout(2000); // Wait for events to load
      
      const eventMarkers = await page.locator('[data-testid="event-marker"], .event-marker, [class*="event"]').count();
      
      logResult(
        `${browserName} - Event Markers Display`,
        eventMarkers > 0 ? 'PASS' : 'FAIL',
        eventMarkers > 0 ? `Found ${eventMarkers} event markers` : 'No event markers found'
      );
      
      // 4. Try to click on an event marker
      if (eventMarkers > 0) {
        const firstEventMarker = await page.locator('[data-testid="event-marker"], .event-marker, [class*="event"]').first();
        await firstEventMarker.click();
        await page.waitForTimeout(1000);
        
        // 5. Check for modal dialog
        const modal = await page.locator('[role="dialog"], .modal, [data-testid="event-modal"]').first();
        const modalVisible = await modal.isVisible().catch(() => false);
        
        await page.screenshot({ 
          path: path.join(SCREENSHOT_DIR, `${browserName}-event-modal.png`),
          fullPage: true 
        });
        
        logResult(
          `${browserName} - Event Modal Display`,
          modalVisible ? 'PASS' : 'FAIL',
          modalVisible ? 'Event modal opened successfully' : 'Event modal did not open'
        );
        
        if (modalVisible) {
          // 6. Check modal content
          const modalTitle = await modal.locator('h1, h2, h3, [data-testid="event-title"]').first().textContent().catch(() => '');
          const modalContent = await modal.textContent().catch(() => '');
          
          const hasContent = modalTitle.length > 0 || modalContent.length > 50;
          
          logResult(
            `${browserName} - Event Modal Content`,
            hasContent ? 'PASS' : 'FAIL',
            hasContent ? `Modal has content (title: "${modalTitle.substring(0, 50)}...")` : 'Modal appears to be blank'
          );
          
          // 7. Check for Ticketmaster link
          const ticketLink = await modal.locator('a[href*="ticketmaster"], button:has-text("Get Tickets"), button:has-text("Ticketmaster")').first();
          const ticketLinkVisible = await ticketLink.isVisible().catch(() => false);
          
          logResult(
            `${browserName} - Ticketmaster Link`,
            ticketLinkVisible ? 'PASS' : 'FAIL',
            ticketLinkVisible ? 'Ticketmaster link found in modal' : 'No Ticketmaster link found'
          );
          
          // 8. Test modal close functionality
          const closeButton = await modal.locator('button:has-text("Close"), [aria-label*="close"], .close-button, button:has([class*="x"])').first();
          const closeButtonVisible = await closeButton.isVisible().catch(() => false);
          
          if (closeButtonVisible) {
            await closeButton.click();
            await page.waitForTimeout(500);
            
            const modalStillVisible = await modal.isVisible().catch(() => false);
            
            logResult(
              `${browserName} - Modal Close Functionality`,
              !modalStillVisible ? 'PASS' : 'FAIL',
              !modalStillVisible ? 'Modal closed successfully' : 'Modal did not close'
            );
          } else {
            logResult(
              `${browserName} - Modal Close Button`,
              'FAIL',
              'No close button found in modal'
            );
          }
        }
      } else {
        logResult(
          `${browserName} - Event Marker Click`,
          'FAIL',
          'No event markers available to click'
        );
      }
    } else {
      logResult(
        `${browserName} - Events Button`,
        'FAIL',
        'Events button not found or not visible'
      );
    }
    
  } catch (error) {
    logResult(
      `${browserName} - Test Execution`,
      'FAIL',
      'Test execution failed',
      error.message
    );
  }
  
  await context.close();
}

async function testLayoutOverlaps(browser, browserName) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log(`\n🧪 Testing Layout Overlaps on ${browserName}...`);
    
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    // Get all interactive elements and their positions
    const elements = await page.evaluate(() => {
      const interactiveElements = Array.from(document.querySelectorAll('button, input, a, [role="button"]'));
      return interactiveElements.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id,
          class: el.className,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          text: el.textContent?.substring(0, 20) || ''
        };
      }).filter(el => el.width > 0 && el.height > 0); // Only visible elements
    });
    
    // Check for overlaps
    const overlaps = [];
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const el1 = elements[i];
        const el2 = elements[j];
        
        // Check if rectangles overlap
        const overlap = !(el1.x + el1.width <= el2.x || 
                         el2.x + el2.width <= el1.x || 
                         el1.y + el1.height <= el2.y || 
                         el2.y + el2.height <= el1.y);
        
        if (overlap) {
          overlaps.push({
            element1: `${el1.tag}#${el1.id}.${el1.class} ("${el1.text}")`,
            element2: `${el2.tag}#${el2.id}.${el2.class} ("${el2.text}")`
          });
        }
      }
    }
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, `${browserName}-layout-check.png`),
      fullPage: true 
    });
    
    logResult(
      `${browserName} - Layout Overlap Check`,
      overlaps.length === 0 ? 'PASS' : 'FAIL',
      overlaps.length === 0 ? 'No overlapping elements detected' : `${overlaps.length} overlapping element pairs found`,
      overlaps.length > 0 ? JSON.stringify(overlaps.slice(0, 3)) : null
    );
    
  } catch (error) {
    logResult(
      `${browserName} - Layout Test`,
      'FAIL',
      'Layout test failed',
      error.message
    );
  }
  
  await context.close();
}

async function testGlassEffects(browser, browserName) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log(`\n🧪 Testing Glass Effects on ${browserName}...`);
    
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    
    // Check for backdrop-blur usage
    const backdropBlurElements = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      return allElements.filter(el => {
        const style = window.getComputedStyle(el);
        return style.backdropFilter && style.backdropFilter !== 'none';
      }).length;
    });
    
    // Check for glass classes
    const glassElements = await page.locator('[class*="glass"], [class*="backdrop-blur"]').count();
    
    logResult(
      `${browserName} - Glass Effects Implementation`,
      (backdropBlurElements > 0 || glassElements > 0) ? 'PASS' : 'FAIL',
      `Found ${backdropBlurElements} backdrop-blur elements and ${glassElements} glass-styled elements`
    );
    
  } catch (error) {
    logResult(
      `${browserName} - Glass Effects Test`,
      'FAIL',
      'Glass effects test failed',
      error.message
    );
  }
  
  await context.close();
}

async function testMobileAccessibility(browser, browserName) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log(`\n🧪 Testing Mobile Accessibility on ${browserName}...`);
    
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    
    // Check touch target sizes
    const touchTargets = await page.evaluate(() => {
      const interactiveElements = Array.from(document.querySelectorAll('button, input, a, [role="button"]'));
      return interactiveElements.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          element: el.tagName.toLowerCase(),
          width: rect.width,
          height: rect.height,
          meetsMinimum: rect.width >= 44 && rect.height >= 44
        };
      }).filter(el => el.width > 0 && el.height > 0);
    });
    
    const touchTargetFailures = touchTargets.filter(target => !target.meetsMinimum);
    
    logResult(
      `${browserName} - Touch Target Sizes`,
      touchTargetFailures.length === 0 ? 'PASS' : 'FAIL',
      touchTargetFailures.length === 0 ? 
        `All ${touchTargets.length} interactive elements meet 44px minimum` : 
        `${touchTargetFailures.length}/${touchTargets.length} elements below 44px minimum`
    );
    
  } catch (error) {
    logResult(
      `${browserName} - Accessibility Test`,
      'FAIL',
      'Accessibility test failed',
      error.message
    );
  }
  
  await context.close();
}

async function testPageNavigation(browser, browserName) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log(`\n🧪 Testing Page Navigation on ${browserName}...`);
    
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    
    // Test navigation to different pages
    const pages = [
      { name: 'Explore', selector: 'a[href="/explore"], nav a:has-text("Explore")' },
      { name: 'Profile', selector: 'a[href="/profile"], nav a:has-text("Profile")' },
      { name: 'Inbox', selector: 'a[href="/inbox"], nav a:has-text("Inbox")' }
    ];
    
    for (const pageTest of pages) {
      try {
        const navLink = await page.locator(pageTest.selector).first();
        const navLinkVisible = await navLink.isVisible().catch(() => false);
        
        if (navLinkVisible) {
          await navLink.click();
          await page.waitForTimeout(1500);
          
          const currentUrl = page.url();
          const navigationSuccess = currentUrl.includes(pageTest.name.toLowerCase());
          
          await page.screenshot({ 
            path: path.join(SCREENSHOT_DIR, `${browserName}-${pageTest.name.toLowerCase()}-page.png`),
            fullPage: true 
          });
          
          logResult(
            `${browserName} - ${pageTest.name} Page Navigation`,
            navigationSuccess ? 'PASS' : 'FAIL',
            navigationSuccess ? `Successfully navigated to ${pageTest.name}` : `Failed to navigate to ${pageTest.name}`
          );
          
          // Go back to home
          await page.goto(BASE_URL);
          await page.waitForTimeout(1000);
        } else {
          logResult(
            `${browserName} - ${pageTest.name} Navigation Link`,
            'FAIL',
            `Navigation link for ${pageTest.name} not found`
          );
        }
      } catch (error) {
        logResult(
          `${browserName} - ${pageTest.name} Navigation Test`,
          'FAIL',
          `Navigation test failed for ${pageTest.name}`,
          error.message
        );
      }
    }
    
  } catch (error) {
    logResult(
      `${browserName} - Navigation Test`,
      'FAIL',
      'Navigation test failed',
      error.message
    );
  }
  
  await context.close();
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Frontend Layout & Event Modal Tests\n');
  console.log('=' .repeat(80));
  
  const browsers = [
    { name: 'Chromium', launcher: chromium },
    { name: 'Firefox', launcher: firefox }
  ];
  
  for (const { name, launcher } of browsers) {
    console.log(`\n🌐 Testing with ${name}...`);
    
    const browser = await launcher.launch({ headless: true });
    
    await testEventModalFunctionality(browser, name);
    await testLayoutOverlaps(browser, name);
    await testGlassEffects(browser, name);
    await testMobileAccessibility(browser, name);
    await testPageNavigation(browser, name);
    
    await browser.close();
  }
  
  // Generate final report
  console.log('\n' + '=' .repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(80));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed} ✅`);
  console.log(`Failed: ${testResults.summary.failed} ❌`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
  
  // Save detailed results
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'comprehensive-test-results.json'),
    JSON.stringify(testResults, null, 2)
  );
  
  console.log(`\n📋 Detailed results saved to: ${path.join(SCREENSHOT_DIR, 'comprehensive-test-results.json')}`);
  console.log(`🖼️  Screenshots saved to: ${SCREENSHOT_DIR}`);
  
  const criticalFailures = testResults.tests.filter(test => 
    test.status === 'FAIL' && 
    (test.name.includes('Event Modal') || test.name.includes('Layout Overlap'))
  );
  
  if (criticalFailures.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES DETECTED:');
    criticalFailures.forEach(failure => {
      console.log(`   • ${failure.name}: ${failure.details}`);
    });
  }
  
  return testResults.summary.failed === 0;
}

// Run tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});