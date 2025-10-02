#!/usr/bin/env node
/**
 * Browser-based Google Maps Integration Test
 * Uses Playwright to test the actual maps integration in the browser
 */

import { chromium } from 'playwright';
import path from 'path';

class BrowserMapsIntegrationTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:8084';
    this.timeout = options.timeout || 30000;
    this.headless = options.headless !== false;
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async setup() {
    console.log('🌐 Launching browser for Google Maps integration test...');
    this.browser = await chromium.launch({ 
      headless: this.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set viewport for consistent testing
    await this.page.setViewportSize({ width: 1280, height: 720 });
    
    // Listen for console messages from the page
    this.page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Google Maps')) {
        console.log(`📱 Browser Console: ${text}`);
      }
    });
    
    // Listen for page errors
    this.page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running test: ${testName}`);
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        testFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), this.timeout)
        )
      ]);
      
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration,
        result
      });
      
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });
      
      console.log(`❌ ${testName} - FAILED (${duration}ms): ${error.message}`);
      throw error;
    }
  }

  async testPageLoad() {
    return this.runTest('Page Load and Initial Render', async () => {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle' });
      
      // Wait for the page title
      const title = await this.page.title();
      console.log(`   📄 Page title: ${title}`);
      
      // Check if we're on the right page
      const url = this.page.url();
      if (!url.includes(this.baseUrl)) {
        throw new Error(`Unexpected URL: ${url}`);
      }
      
      return { title, url };
    });
  }

  async testGoogleMapsApiLoad() {
    return this.runTest('Google Maps API Loading', async () => {
      // Wait for Google Maps script to be loaded
      await this.page.waitForFunction(
        () => window.google && window.google.maps,
        { timeout: 15000 }
      );
      
      // Check if the Maps API is properly loaded
      const mapsApiLoaded = await this.page.evaluate(() => {
        return {
          googleExists: typeof window.google !== 'undefined',
          mapsExists: typeof window.google?.maps !== 'undefined',
          mapExists: typeof window.google?.maps?.Map !== 'undefined',
          markerExists: typeof window.google?.maps?.Marker !== 'undefined'
        };
      });
      
      if (!mapsApiLoaded.googleExists) {
        throw new Error('Google API not loaded');
      }
      
      if (!mapsApiLoaded.mapsExists) {
        throw new Error('Google Maps API not loaded');
      }
      
      if (!mapsApiLoaded.mapExists) {
        throw new Error('Google Maps Map class not available');
      }
      
      return mapsApiLoaded;
    });
  }

  async testMapContainerRender() {
    return this.runTest('Map Container Rendering', async () => {
      // Look for map container elements
      const mapContainer = await this.page.locator('[class*="map-container"], [class*="gm-style"]').first();
      
      // Wait for map container to be visible
      await mapContainer.waitFor({ state: 'visible', timeout: 10000 });
      
      // Get container dimensions
      const boundingBox = await mapContainer.boundingBox();
      
      if (!boundingBox || boundingBox.width === 0 || boundingBox.height === 0) {
        throw new Error('Map container has no dimensions');
      }
      
      console.log(`   📐 Map container: ${boundingBox.width}x${boundingBox.height}`);
      
      // Check if map tiles are loaded
      const tilesLoaded = await this.page.evaluate(() => {
        const mapImages = document.querySelectorAll('[src*="maps.googleapis.com"], [src*="maps.google.com"]');
        return mapImages.length > 0;
      });
      
      return {
        containerVisible: true,
        dimensions: boundingBox,
        tilesLoaded
      };
    });
  }

  async testMapInteraction() {
    return this.runTest('Map Interaction', async () => {
      // Find the map element
      const mapElement = await this.page.locator('[class*="gm-style"]').first();
      await mapElement.waitFor({ state: 'visible' });
      
      // Get initial center coordinates
      const initialCenter = await this.page.evaluate(() => {
        const mapElement = document.querySelector('[class*="gm-style"]');
        if (mapElement && mapElement.__reactProps$) {
          // Try to access React props if available
          return null; // We can't easily get the map center without exposing it
        }
        return null;
      });
      
      // Try to click on the map (this should work if the map is interactive)
      await mapElement.click();
      
      // Wait a moment for any potential map updates
      await this.page.waitForTimeout(1000);
      
      return {
        mapClickable: true,
        initialCenter
      };
    });
  }

  async testErrorHandling() {
    return this.runTest('Error Handling and Fallback', async () => {
      // Look for error messages or fallback UI
      const errorElements = await this.page.locator('[class*="error"], [class*="fallback"]');
      const errorCount = await errorElements.count();
      
      // Look for loading indicators
      const loadingElements = await this.page.locator('[class*="loading"], [class*="spinner"]');
      const loadingCount = await loadingElements.count();
      
      // Check for diagnostic button
      const diagnosticButton = await this.page.locator('text=diagnostic', 'text=Diagnose', '[href="/diagnostic"]');
      const diagnosticButtonExists = await diagnosticButton.count() > 0;
      
      return {
        errorElementsFound: errorCount,
        loadingElementsFound: loadingCount,
        diagnosticButtonAvailable: diagnosticButtonExists
      };
    });
  }

  async testDiagnosticPage() {
    return this.runTest('Diagnostic Page Functionality', async () => {
      // Navigate to diagnostic page
      await this.page.goto(`${this.baseUrl}/diagnostic`, { waitUntil: 'networkidle' });
      
      // Check if diagnostic page loads
      const diagnosticTitle = await this.page.locator('h1:has-text("Google Maps Diagnostic")');
      await diagnosticTitle.waitFor({ state: 'visible', timeout: 5000 });
      
      // Look for diagnostic features
      const runDiagnosticsButton = await this.page.locator('button:has-text("Run Diagnostics")');
      const systemInfoCard = await this.page.locator('text=System Information');
      const testResultsSection = await this.page.locator('text=Diagnostic Tests');
      
      const features = {
        diagnosticPageLoaded: await diagnosticTitle.isVisible(),
        runDiagnosticsButton: await runDiagnosticsButton.isVisible(),
        systemInfo: await systemInfoCard.isVisible(),
        testResults: await testResultsSection.isVisible()
      };
      
      // Try to run diagnostics if button is available
      if (features.runDiagnosticsButton) {
        await runDiagnosticsButton.click();
        await this.page.waitForTimeout(2000); // Wait for tests to start
      }
      
      return features;
    });
  }

  async takeScreenshot(name) {
    if (this.page) {
      const screenshotPath = path.join(process.cwd(), `screenshot-${name}-${Date.now()}.png`);
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📷 Screenshot saved: ${screenshotPath}`);
      return screenshotPath;
    }
  }

  generateReport() {
    const passed = this.testResults.filter(t => t.status === 'PASSED').length;
    const failed = this.testResults.filter(t => t.status === 'FAILED').length;
    const total = this.testResults.length;
    
    console.log('\n' + '='.repeat(60));
    console.log('🌐 BROWSER GOOGLE MAPS INTEGRATION TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(t => t.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n📋 DETAILED RESULTS:');
    this.testResults.forEach(test => {
      const icon = test.status === 'PASSED' ? '✅' : '❌';
      console.log(`   ${icon} ${test.name} (${test.duration}ms)`);
    });

    if (passed === total) {
      console.log('\n🎉 All browser tests passed! Your Google Maps integration works in the browser.');
    } else {
      console.log('\n⚠️  Some browser tests failed. Check the detailed results above.');
    }
    
    console.log('='.repeat(60));
    
    return {
      total,
      passed,
      failed,
      successRate: (passed / total) * 100,
      results: this.testResults
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Browser Google Maps Integration Tests...');
    console.log(`🌐 Base URL: ${this.baseUrl}`);
    console.log(`⏱️  Timeout: ${this.timeout}ms`);
    console.log(`👁️  Headless: ${this.headless}`);
    
    await this.setup();
    
    const tests = [
      this.testPageLoad.bind(this),
      this.testGoogleMapsApiLoad.bind(this),
      this.testMapContainerRender.bind(this),
      this.testMapInteraction.bind(this),
      this.testErrorHandling.bind(this),
      this.testDiagnosticPage.bind(this)
    ];
    
    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        // Take screenshot on failure
        await this.takeScreenshot(`failed-${test.name.toLowerCase().replace(/\s+/g, '-')}`);
        // Test failed, continue with next test
        continue;
      }
    }
    
    // Take final screenshot
    await this.takeScreenshot('final-state');
    
    await this.cleanup();
    
    return this.generateReport();
  }
}

// Run the tests if this script is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  args.forEach(arg => {
    if (arg === '--headful') {
      options.headless = false;
    } else if (arg.startsWith('--url=')) {
      options.baseUrl = arg.split('=')[1];
    } else if (arg.startsWith('--timeout=')) {
      options.timeout = parseInt(arg.split('=')[1]);
    }
  });
  
  const tester = new BrowserMapsIntegrationTester(options);
  
  tester.runAllTests()
    .then(report => {
      process.exit(report.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Browser test runner failed:', error);
      process.exit(1);
    });
}

export default BrowserMapsIntegrationTester;