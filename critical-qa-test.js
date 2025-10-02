import { test, expect, chromium, firefox, webkit } from '@playwright/test';
import fs from 'fs';

/**
 * CRITICAL QA VERIFICATION SUITE
 * 
 * This comprehensive test suite verifies ALL critical fixes implemented:
 * 1. Layout overlap verification
 * 2. Touch target compliance (≥44px)
 * 3. Event functionality testing
 * 4. Navigation and interaction testing
 */

const TEST_CONFIG = {
  viewport: { width: 390, height: 844 }, // iPhone 12/13/14 viewport
  baseURL: 'http://localhost:8083',
  timeout: 30000,
  screenshots: true
};

const ACCESSIBILITY_REQUIREMENTS = {
  minTouchTarget: 44, // WCAG AA minimum
  maxOverlap: 0, // Zero tolerance for overlaps
  requiredZIndex: {
    header: 50,
    searchBar: 30,
    floatingButtons: 25,
    bottomNav: 60
  }
};

class QATestSuite {
  constructor() {
    this.results = {
      layoutOverlap: { passed: false, issues: [] },
      touchTargets: { passed: false, issues: [] },
      eventFunctionality: { passed: false, issues: [] },
      navigation: { passed: false, issues: [] },
      screenshots: []
    };
  }

  async runFullSuite() {
    console.log('🔍 Starting CRITICAL QA VERIFICATION SUITE...');
    
    for (const browserName of ['chromium', 'firefox', 'webkit']) {
      console.log(`\n🌐 Testing on ${browserName.toUpperCase()}...`);
      await this.testBrowser(browserName);
    }
    
    await this.generateReport();
    return this.results;
  }

  async testBrowser(browserName) {
    let browser;
    try {
      browser = await this.launchBrowser(browserName);
      const context = await browser.newContext({ 
        viewport: TEST_CONFIG.viewport,
        deviceScaleFactor: 2 // Simulate Retina display
      });
      const page = await context.newPage();
      
      // Run all critical test phases
      await this.phaseOne_LayoutVerification(page, browserName);
      await this.phaseTwo_TouchTargetTesting(page, browserName);
      await this.phaseThree_EventSystemVerification(page, browserName);
      await this.phaseFour_NavigationTesting(page, browserName);
      
    } catch (error) {
      console.error(`❌ ${browserName} testing failed:`, error.message);
      this.results[browserName] = { error: error.message };
    } finally {
      if (browser) await browser.close();
    }
  }

  async launchBrowser(browserName) {
    const browserConfig = { 
      headless: false, // Show browser for visual verification
      slowMo: 500,     // Slow down for better observation
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    };
    
    switch (browserName) {
      case 'chromium': return await chromium.launch(browserConfig);
      case 'firefox': return await firefox.launch(browserConfig);
      case 'webkit': return await webkit.launch(browserConfig);
      default: throw new Error(`Unknown browser: ${browserName}`);
    }
  }

  async phaseOne_LayoutVerification(page, browserName) {
    console.log('📐 Phase 1: Layout Overlap Verification');
    
    try {
      await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000); // Wait for full render
      
      // Take screenshot before interaction
      const screenshotPath = `qa-${browserName}-01-home-page.png`;
      await page.screenshot({ 
        path: `test-results/${screenshotPath}`,
        fullPage: true 
      });
      this.results.screenshots.push(screenshotPath);
      
      // Check for layout overlaps
      const overlaps = await this.detectLayoutOverlaps(page);
      
      if (overlaps.length === 0) {
        console.log('✅ Layout: No overlapping elements detected');
        this.results.layoutOverlap.passed = true;
      } else {
        console.log('❌ Layout: Overlapping elements found:', overlaps);
        this.results.layoutOverlap.issues.push(...overlaps);
      }
      
    } catch (error) {
      console.error('❌ Phase 1 failed:', error.message);
      this.results.layoutOverlap.issues.push(`Phase 1 error: ${error.message}`);
    }
  }

  async phaseTwo_TouchTargetTesting(page, browserName) {
    console.log('👆 Phase 2: Touch Target Compliance Testing');
    
    try {
      // Test all interactive elements
      const interactiveElements = await page.locator('button, a, input, [role="button"], [tabindex]').all();
      const touchTargetIssues = [];
      
      for (const element of interactiveElements) {
        const box = await element.boundingBox();
        if (box) {
          const minDimension = Math.min(box.width, box.height);
          
          if (minDimension < ACCESSIBILITY_REQUIREMENTS.minTouchTarget) {
            const elementText = await element.textContent() || 'unnamed';
            touchTargetIssues.push({
              element: elementText,
              size: `${box.width}x${box.height}`,
              minDimension,
              required: ACCESSIBILITY_REQUIREMENTS.minTouchTarget
            });
          }
        }
      }
      
      if (touchTargetIssues.length === 0) {
        console.log('✅ Touch Targets: All elements meet ≥44px requirement');
        this.results.touchTargets.passed = true;
      } else {
        console.log('❌ Touch Targets: Issues found:', touchTargetIssues);
        this.results.touchTargets.issues.push(...touchTargetIssues);
      }
      
    } catch (error) {
      console.error('❌ Phase 2 failed:', error.message);
      this.results.touchTargets.issues.push(`Phase 2 error: ${error.message}`);
    }
  }

  async phaseThree_EventSystemVerification(page, browserName) {
    console.log('🎫 Phase 3: Event System Verification');
    
    try {
      // Look for events toggle button
      const eventsToggle = page.locator('button:has-text("Show Events"), button:has-text("Events"), button:has-text("Exit Events")').first();
      
      if (!(await eventsToggle.isVisible())) {
        throw new Error('Events toggle button not found');
      }
      
      console.log('🎫 Found events toggle button');
      
      // Take screenshot before clicking
      const beforeScreenshot = `qa-${browserName}-02-before-events.png`;
      await page.screenshot({ 
        path: `test-results/${beforeScreenshot}`,
        fullPage: true 
      });
      this.results.screenshots.push(beforeScreenshot);
      
      // Click events toggle
      await eventsToggle.click();
      await page.waitForTimeout(5000); // Wait for events to load
      
      // Take screenshot after clicking
      const afterScreenshot = `qa-${browserName}-03-events-enabled.png`;
      await page.screenshot({ 
        path: `test-results/${afterScreenshot}`,
        fullPage: true 
      });
      this.results.screenshots.push(afterScreenshot);
      
      // Check if event markers are visible
      const eventMarkers = page.locator('[class*="event"], [data-testid*="event"]');
      const markerCount = await eventMarkers.count();
      
      if (markerCount > 0) {
        console.log(`✅ Events: ${markerCount} event markers found on map`);
        
        // Test clicking an event marker
        try {
          await eventMarkers.first().click({ timeout: 5000 });
          await page.waitForTimeout(2000);
          
          // Check if modal opened
          const modal = page.locator('[role="dialog"], .modal, [class*="modal"]');
          const modalVisible = await modal.isVisible();
          
          if (modalVisible) {
            console.log('✅ Events: Event modal opens successfully');
            this.results.eventFunctionality.passed = true;
          } else {
            console.log('⚠️ Events: Modal not detected, but markers are visible');
            this.results.eventFunctionality.issues.push('Event modal not opening');
          }
          
        } catch (clickError) {
          console.log('⚠️ Events: Could not click event marker:', clickError.message);
          this.results.eventFunctionality.issues.push('Event marker click failed');
        }
        
      } else {
        console.log('❌ Events: No event markers found after toggle');
        this.results.eventFunctionality.issues.push('No event markers visible after toggle');
      }
      
    } catch (error) {
      console.error('❌ Phase 3 failed:', error.message);
      this.results.eventFunctionality.issues.push(`Phase 3 error: ${error.message}`);
    }
  }

  async phaseFour_NavigationTesting(page, browserName) {
    console.log('🧭 Phase 4: Navigation and Interaction Testing');
    
    try {
      // Test bottom navigation links
      const navLinks = [
        { text: 'Home', expected: '/home' },
        { text: 'Explore', expected: '/explore' },
        { text: 'Profile', expected: '/profile' },
        { text: 'Inbox', expected: '/inbox' }
      ];
      
      const navigationIssues = [];
      
      for (const link of navLinks) {
        try {
          // Find and click navigation link
          const navItem = page.locator(`a:has-text("${link.text}"), [aria-label*="${link.text}"]`).first();
          
          if (await navItem.isVisible()) {
            await navItem.click();
            await page.waitForTimeout(2000);
            
            // Check if navigation worked
            const currentURL = page.url();
            if (currentURL.includes(link.expected)) {
              console.log(`✅ Navigation: ${link.text} → ${link.expected} works`);
            } else {
              navigationIssues.push(`${link.text} navigation failed: expected ${link.expected}, got ${currentURL}`);
            }
          } else {
            navigationIssues.push(`${link.text} navigation link not visible`);
          }
          
        } catch (navError) {
          navigationIssues.push(`${link.text} navigation error: ${navError.message}`);
        }
      }
      
      if (navigationIssues.length === 0) {
        console.log('✅ Navigation: All links functional');
        this.results.navigation.passed = true;
      } else {
        console.log('❌ Navigation: Issues found:', navigationIssues);
        this.results.navigation.issues.push(...navigationIssues);
      }
      
    } catch (error) {
      console.error('❌ Phase 4 failed:', error.message);
      this.results.navigation.issues.push(`Phase 4 error: ${error.message}`);
    }
  }

  async detectLayoutOverlaps(page) {
    // Custom overlap detection using element positioning
    return await page.evaluate(() => {
      const overlaps = [];
      const elements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return style.position === 'absolute' || style.position === 'fixed';
      });
      
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const rect1 = elements[i].getBoundingClientRect();
          const rect2 = elements[j].getBoundingClientRect();
          
          // Check for overlap
          if (rect1.left < rect2.right && 
              rect2.left < rect1.right && 
              rect1.top < rect2.bottom && 
              rect2.top < rect1.bottom) {
            
            overlaps.push({
              element1: elements[i].className || elements[i].tagName,
              element2: elements[j].className || elements[j].tagName,
              rect1: { x: rect1.x, y: rect1.y, width: rect1.width, height: rect1.height },
              rect2: { x: rect2.x, y: rect2.y, width: rect2.width, height: rect2.height }
            });
          }
        }
      }
      
      return overlaps;
    });
  }

  async generateReport() {
    const overallPassed = this.results.layoutOverlap.passed && 
                          this.results.touchTargets.passed && 
                          this.results.eventFunctionality.passed && 
                          this.results.navigation.passed;
    
    const report = {
      timestamp: new Date().toISOString(),
      status: overallPassed ? 'PASS' : 'FAIL',
      summary: {
        layoutOverlap: this.results.layoutOverlap.passed ? 'PASS' : 'FAIL',
        touchTargets: this.results.touchTargets.passed ? 'PASS' : 'FAIL',
        eventFunctionality: this.results.eventFunctionality.passed ? 'PASS' : 'FAIL',
        navigation: this.results.navigation.passed ? 'PASS' : 'FAIL'
      },
      details: this.results,
      recommendations: this.generateRecommendations()
    };
    
    // Write detailed report
    fs.writeFileSync(
      'test-results/critical-qa-results.json',
      JSON.stringify(report, null, 2)
    );
    
    // Console summary
    console.log('\n' + '='.repeat(60));
    console.log('🏆 CRITICAL QA VERIFICATION RESULTS');
    console.log('='.repeat(60));
    console.log(`📊 Overall Status: ${overallPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📐 Layout Overlap: ${this.results.layoutOverlap.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`👆 Touch Targets: ${this.results.touchTargets.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🎫 Event System: ${this.results.eventFunctionality.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🧭 Navigation: ${this.results.navigation.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('='.repeat(60));
    
    if (!overallPassed) {
      console.log('\n❌ ISSUES FOUND:');
      Object.entries(this.results).forEach(([category, data]) => {
        if (data.issues && data.issues.length > 0) {
          console.log(`\n${category.toUpperCase()}:`);
          data.issues.forEach(issue => console.log(`  - ${JSON.stringify(issue)}`));
        }
      });
    }
    
    console.log(`\n📸 Screenshots saved: ${this.results.screenshots.length}`);
    console.log('📄 Full report: test-results/critical-qa-results.json');
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (!this.results.layoutOverlap.passed) {
      recommendations.push('Fix overlapping UI elements by adjusting z-index values and positioning');
    }
    
    if (!this.results.touchTargets.passed) {
      recommendations.push('Increase touch target sizes to minimum 44x44px for accessibility compliance');
    }
    
    if (!this.results.eventFunctionality.passed) {
      recommendations.push('Debug event toggle and marker functionality');
    }
    
    if (!this.results.navigation.passed) {
      recommendations.push('Fix navigation routing and ensure all links work correctly');
    }
    
    return recommendations;
  }
}

// Create test results directory
if (!fs.existsSync('test-results')) {
  fs.mkdirSync('test-results');
}

// Run the comprehensive test suite
const qaTest = new QATestSuite();
qaTest.runFullSuite().then(results => {
  console.log('\n🎯 Critical QA verification complete!');
  process.exit(results.layoutOverlap.passed && 
               results.touchTargets.passed && 
               results.eventFunctionality.passed && 
               results.navigation.passed ? 0 : 1);
}).catch(error => {
  console.error('💥 QA test suite failed:', error);
  process.exit(1);
});