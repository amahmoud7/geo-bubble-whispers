// Final Comprehensive QA Test - Event Modal and Layout Issues
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:8083';
const SCREENSHOT_DIR = './test-results';

async function runFinalQATest() {
  console.log('🚀 Final QA Test - Event Modal and Layout Verification\n');
  console.log('=' .repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  
  const page = await context.newPage();
  
  const issues = [];
  const successes = [];
  
  try {
    // Test 1: Home Page Load
    console.log('1️⃣ Testing Home Page Load...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'qa-01-home-page.png'),
      fullPage: true 
    });
    
    const pageTitle = await page.title();
    if (pageTitle.includes('Lo') || pageTitle.includes('Geo')) {
      successes.push('✅ Home page loads successfully');
    } else {
      issues.push('❌ Home page title unexpected: ' + pageTitle);
    }
    
    // Test 2: Events Button Functionality
    console.log('2️⃣ Testing Events Button...');
    
    // Look for events toggle at bottom center
    const eventsToggle = await page.locator('.absolute.bottom-24.left-1\\/2, button:has-text("Show Events")').first();
    const eventsToggleVisible = await eventsToggle.isVisible().catch(() => false);
    
    if (eventsToggleVisible) {
      successes.push('✅ Events toggle button found and visible');
      
      // Click the events button
      await eventsToggle.click();
      await page.waitForTimeout(3000); // Wait for events to load
      
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, 'qa-02-events-enabled.png'),
        fullPage: true 
      });
      
      // Look for event markers on the map
      const eventMarkers = await page.locator('[data-testid="event-marker"], .event-marker, [class*="event-pin"]').count();
      
      if (eventMarkers > 0) {
        successes.push(`✅ Found ${eventMarkers} event markers after enabling events`);
        
        // Test 3: Event Modal Click
        console.log('3️⃣ Testing Event Modal...');
        
        try {
          const firstMarker = await page.locator('[data-testid="event-marker"], .event-marker, [class*="event-pin"]').first();
          await firstMarker.click();
          await page.waitForTimeout(2000);
          
          // Check for modal
          const modal = await page.locator('[role="dialog"], .modal, [data-state="open"]').first();
          const modalVisible = await modal.isVisible().catch(() => false);
          
          if (modalVisible) {
            successes.push('✅ Event modal opens when event marker is clicked');
            
            await page.screenshot({ 
              path: path.join(SCREENSHOT_DIR, 'qa-03-event-modal-open.png'),
              fullPage: true 
            });
            
            // Check modal content
            const modalContent = await modal.textContent().catch(() => '');
            if (modalContent.length > 50) {
              successes.push('✅ Event modal contains content');
              
              // Check for Ticketmaster link
              const ticketLink = await modal.locator('button:has-text("Get Tickets"), a[href*="ticketmaster"], button:has-text("Ticketmaster")').first();
              const ticketLinkVisible = await ticketLink.isVisible().catch(() => false);
              
              if (ticketLinkVisible) {
                successes.push('✅ Ticketmaster/ticket link found in modal');
              } else {
                issues.push('❌ No ticket purchase link found in event modal');
              }
              
              // Test modal close
              const closeButton = await modal.locator('button[aria-label*="close"], .close, button:has([data-testid="close"])', { timeout: 5000 }).first();
              const closeButtonExists = await closeButton.isVisible().catch(() => false);
              
              if (closeButtonExists) {
                await closeButton.click();
                await page.waitForTimeout(500);
                
                const modalStillVisible = await modal.isVisible().catch(() => false);
                if (!modalStillVisible) {
                  successes.push('✅ Event modal closes properly');
                } else {
                  issues.push('❌ Event modal does not close when close button clicked');
                }
              } else {
                issues.push('❌ No close button found in event modal');
              }
              
            } else {
              issues.push('❌ Event modal appears blank or has minimal content');
            }
          } else {
            issues.push('❌ Event modal does not open when event marker is clicked');
          }
        } catch (error) {
          issues.push('❌ Error clicking event marker: ' + error.message.substring(0, 100));
        }
      } else {
        issues.push('❌ No event markers found after enabling events');
      }
    } else {
      issues.push('❌ Events toggle button not found or not visible');
    }
    
    // Test 4: Layout Overlaps
    console.log('4️⃣ Testing Layout Overlaps...');
    
    const overlaps = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, input, a, [role="button"]'))
        .filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .map(el => {
          const rect = el.getBoundingClientRect();
          return { element: el, rect, id: el.id || 'no-id', className: el.className.substring(0, 30) };
        });
      
      const overlapping = [];
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const el1 = elements[i];
          const el2 = elements[j];
          
          const overlap = !(el1.rect.right <= el2.rect.left || 
                           el2.rect.right <= el1.rect.left || 
                           el1.rect.bottom <= el2.rect.top || 
                           el2.rect.bottom <= el1.rect.top);
          
          if (overlap) {
            overlapping.push({
              el1: `${el1.className}`,
              el2: `${el2.className}`,
              overlap: true
            });
          }
        }
      }
      
      return overlapping.length;
    });
    
    if (overlaps === 0) {
      successes.push('✅ No overlapping UI elements detected');
    } else {
      issues.push(`❌ Found ${overlaps} overlapping UI element pairs`);
    }
    
    // Test 5: Glass Effects
    console.log('5️⃣ Testing Glass Effects...');
    
    const glassEffects = await page.evaluate(() => {
      const elementsWithBackdropBlur = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return style.backdropFilter && style.backdropFilter !== 'none';
      }).length;
      
      const elementsWithGlassClasses = Array.from(document.querySelectorAll('[class*="glass"], [class*="backdrop-blur"]')).length;
      
      return { backdropBlur: elementsWithBackdropBlur, glassClasses: elementsWithGlassClasses };
    });
    
    if (glassEffects.backdropBlur > 0 || glassEffects.glassClasses > 0) {
      successes.push(`✅ Glass effects implemented (${glassEffects.backdropBlur} backdrop-blur, ${glassEffects.glassClasses} glass classes)`);
    } else {
      issues.push('❌ No glass effects found (backdrop-blur or glass classes)');
    }
    
    // Test 6: Touch Target Sizes
    console.log('6️⃣ Testing Touch Target Sizes...');
    
    const touchTargets = await page.evaluate(() => {
      const interactive = Array.from(document.querySelectorAll('button, input, a, [role="button"]'));
      const results = interactive.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          meetsMinimum: rect.width >= 44 && rect.height >= 44,
          visible: rect.width > 0 && rect.height > 0
        };
      }).filter(el => el.visible);
      
      return {
        total: results.length,
        belowMinimum: results.filter(el => !el.meetsMinimum).length
      };
    });
    
    if (touchTargets.belowMinimum === 0) {
      successes.push(`✅ All ${touchTargets.total} touch targets meet 44px minimum`);
    } else {
      issues.push(`❌ ${touchTargets.belowMinimum}/${touchTargets.total} touch targets below 44px minimum`);
    }
    
    // Test 7: Navigation
    console.log('7️⃣ Testing Navigation...');
    
    const navPages = ['explore', 'profile', 'inbox'];
    let navSuccesses = 0;
    
    for (const navPage of navPages) {
      try {
        const navLink = await page.locator(`a[href="/${navPage}"], nav a:has-text("${navPage.charAt(0).toUpperCase() + navPage.slice(1)}")`).first();
        const navLinkVisible = await navLink.isVisible().catch(() => false);
        
        if (navLinkVisible) {
          await navLink.click();
          await page.waitForTimeout(1500);
          
          const currentUrl = page.url();
          if (currentUrl.includes(navPage)) {
            navSuccesses++;
            await page.screenshot({ 
              path: path.join(SCREENSHOT_DIR, `qa-nav-${navPage}.png`),
              fullPage: true 
            });
          }
          
          // Go back to home
          await page.goto(BASE_URL);
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Navigation error for this page
      }
    }
    
    if (navSuccesses === navPages.length) {
      successes.push(`✅ Navigation works for all ${navPages.length} main pages`);
    } else {
      issues.push(`❌ Navigation issues: only ${navSuccesses}/${navPages.length} pages accessible`);
    }
    
  } catch (error) {
    issues.push('❌ Critical test failure: ' + error.message);
  }
  
  await context.close();
  await browser.close();
  
  // Generate Final Report
  console.log('\n' + '=' .repeat(80));
  console.log('📊 FINAL QA TEST RESULTS');
  console.log('=' .repeat(80));
  
  console.log('✅ PASSED TESTS:');
  successes.forEach(success => console.log('  ' + success));
  
  console.log('\n❌ FAILED TESTS:');
  issues.forEach(issue => console.log('  ' + issue));
  
  console.log('\n📈 SUMMARY:');
  console.log(`  Total Tests: ${successes.length + issues.length}`);
  console.log(`  Passed: ${successes.length}`);
  console.log(`  Failed: ${issues.length}`);
  console.log(`  Success Rate: ${((successes.length / (successes.length + issues.length)) * 100).toFixed(1)}%`);
  
  // Critical Issues Assessment
  const criticalIssues = issues.filter(issue => 
    issue.includes('Event modal') || 
    issue.includes('overlapping') ||
    issue.includes('Events toggle button not found')
  );
  
  console.log('\n🚨 CRITICAL ISSUES:');
  if (criticalIssues.length === 0) {
    console.log('  None - All critical functionality working');
  } else {
    criticalIssues.forEach(issue => console.log('  ' + issue));
  }
  
  // Pass/Fail Determination
  const criticalFailure = criticalIssues.length > 0;
  const overallSuccess = issues.length <= successes.length && !criticalFailure;
  
  console.log('\n🏆 OVERALL RESULT:');
  if (overallSuccess) {
    console.log('  ✅ PASS - Frontend layout fixes verified successfully');
  } else {
    console.log('  ❌ FAIL - Critical issues found requiring immediate attention');
  }
  
  // Save detailed results
  const detailedResults = {
    timestamp: new Date().toISOString(),
    overallResult: overallSuccess ? 'PASS' : 'FAIL',
    successes,
    issues,
    criticalIssues,
    summary: {
      total: successes.length + issues.length,
      passed: successes.length,
      failed: issues.length,
      successRate: ((successes.length / (successes.length + issues.length)) * 100).toFixed(1)
    }
  };
  
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'final-qa-results.json'),
    JSON.stringify(detailedResults, null, 2)
  );
  
  console.log(`\n📋 Detailed results saved to: ${path.join(SCREENSHOT_DIR, 'final-qa-results.json')}`);
  console.log(`🖼️  Screenshots saved to: ${SCREENSHOT_DIR}`);
  
  return overallSuccess;
}

// Run the final QA test
runFinalQATest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ QA Test execution failed:', error);
  process.exit(1);
});