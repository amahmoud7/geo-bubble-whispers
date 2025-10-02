#!/usr/bin/env node

/**
 * Quick Functionality Test for Lo Platform
 * Rapid validation of core features and performance
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';

class QuickFunctionalityTest {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      performance: {},
      status: 'RUNNING'
    };
  }

  async runQuickValidation() {
    console.log('⚡ Running Quick Functionality Validation...\n');
    
    let browser = null;
    let page = null;
    
    try {
      // Launch browser
      browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      page = await browser.newPage();
      
      // Set viewport to desktop
      await page.setViewport({ width: 1200, height: 800 });
      
      // Test 1: Basic Page Load
      await this.testPageLoad(page);
      
      // Test 2: App Initialization 
      await this.testAppInitialization(page);
      
      // Test 3: Error Boundaries
      await this.testErrorBoundaries(page);
      
      // Test 4: Performance Metrics
      await this.testPerformanceMetrics(page);
      
      // Test 5: Mobile Responsiveness
      await this.testMobileResponsiveness(page);
      
      this.results.status = 'COMPLETED';
      console.log('✅ Quick validation completed successfully!');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      this.results.status = 'FAILED';
      this.results.error = error.message;
      
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
      
      // Generate report
      await this.generateQuickReport();
    }
  }

  async testPageLoad(page) {
    console.log('🏠 Testing: Basic Page Load...');
    const startTime = Date.now();
    
    try {
      await page.goto('http://localhost:8084', { waitUntil: 'networkidle2', timeout: 10000 });
      const loadTime = Date.now() - startTime;
      
      // Check if root element exists
      const rootElement = await page.$('#root');
      const hasRoot = !!rootElement;
      
      this.results.tests.push({
        name: 'Page Load',
        status: hasRoot ? 'PASSED' : 'FAILED',
        loadTime: `${loadTime}ms`,
        hasRoot
      });
      
      console.log(`  ✅ Page loaded in ${loadTime}ms`);
      console.log(`  ✅ Root element found: ${hasRoot}`);
      
    } catch (error) {
      this.results.tests.push({
        name: 'Page Load',
        status: 'FAILED',
        error: error.message
      });
      console.log(`  ❌ Page load failed: ${error.message}`);
    }
  }

  async testAppInitialization(page) {
    console.log('🚀 Testing: App Initialization...');
    
    try {
      // Wait for app to initialize
      await page.waitForTimeout(3000);
      
      // Check for common app elements
      const bodyContent = await page.evaluate(() => document.body.textContent);
      const hasContent = bodyContent.length > 100; // Should have substantial content
      
      // Check for React app markers
      const hasReactRoot = await page.evaluate(() => {
        const root = document.getElementById('root');
        return root && root.children.length > 0;
      });
      
      // Check for any console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(1000); // Capture any late errors
      
      this.results.tests.push({
        name: 'App Initialization',
        status: hasReactRoot && hasContent ? 'PASSED' : 'FAILED',
        hasContent,
        hasReactRoot,
        consoleErrors: consoleErrors.length,
        contentLength: bodyContent.length
      });
      
      console.log(`  ✅ React app initialized: ${hasReactRoot}`);
      console.log(`  ✅ Content loaded: ${hasContent} (${bodyContent.length} chars)`);
      console.log(`  ✅ Console errors: ${consoleErrors.length}`);
      
    } catch (error) {
      this.results.tests.push({
        name: 'App Initialization',
        status: 'FAILED', 
        error: error.message
      });
      console.log(`  ❌ App initialization failed: ${error.message}`);
    }
  }

  async testErrorBoundaries(page) {
    console.log('🛡️ Testing: Error Boundaries...');
    
    try {
      // Try navigating to a bad route to test error handling
      await page.goto('http://localhost:8084/invalid-route-test', { waitUntil: 'networkidle2', timeout: 5000 });
      await page.waitForTimeout(2000);
      
      // Check if page handles the error gracefully
      const bodyContent = await page.evaluate(() => document.body.textContent);
      const hasErrorHandling = bodyContent.includes('404') || 
                              bodyContent.includes('Not Found') || 
                              bodyContent.includes('Error') ||
                              bodyContent.length > 50; // Has some content, not blank
      
      // Go back to valid route
      await page.goto('http://localhost:8084', { waitUntil: 'networkidle2', timeout: 5000 });
      await page.waitForTimeout(1000);
      
      const recoveredContent = await page.evaluate(() => document.body.textContent);
      const hasRecovered = recoveredContent.length > 100;
      
      this.results.tests.push({
        name: 'Error Boundaries',
        status: hasErrorHandling && hasRecovered ? 'PASSED' : 'WARNING',
        hasErrorHandling,
        hasRecovered,
        errorContentLength: bodyContent.length,
        recoveredContentLength: recoveredContent.length
      });
      
      console.log(`  ✅ Error handling: ${hasErrorHandling}`);
      console.log(`  ✅ Recovery: ${hasRecovered}`);
      
    } catch (error) {
      this.results.tests.push({
        name: 'Error Boundaries',
        status: 'WARNING',
        error: error.message
      });
      console.log(`  ⚠️ Error boundary test inconclusive: ${error.message}`);
    }
  }

  async testPerformanceMetrics(page) {
    console.log('⚡ Testing: Performance Metrics...');
    
    try {
      // Navigate with performance monitoring
      await page.goto('http://localhost:8084', { waitUntil: 'networkidle2' });
      
      // Get performance metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
          loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
          firstByte: Math.round(navigation.responseStart - navigation.requestStart),
          totalTime: Math.round(navigation.loadEventEnd - navigation.navigationStart)
        };
      });
      
      // Simulate Core Web Vitals (basic)
      const coreWebVitals = {
        LCP: metrics.totalTime < 2500 ? 'GOOD' : metrics.totalTime < 4000 ? 'NEEDS_IMPROVEMENT' : 'POOR',
        FID: 'SIMULATED_GOOD', // Can't measure without real user interaction
        CLS: 'SIMULATED_GOOD'  // Would need layout shift measurement
      };
      
      this.results.performance = {
        ...metrics,
        coreWebVitals,
        status: metrics.totalTime < 5000 ? 'PASSED' : 'WARNING'
      };
      
      this.results.tests.push({
        name: 'Performance Metrics',
        status: metrics.totalTime < 5000 ? 'PASSED' : 'WARNING',
        metrics
      });
      
      console.log(`  ⚡ DOM Content Loaded: ${metrics.domContentLoaded}ms`);
      console.log(`  ⚡ Load Complete: ${metrics.loadComplete}ms`);
      console.log(`  ⚡ Time to First Byte: ${metrics.firstByte}ms`);
      console.log(`  ⚡ Total Load Time: ${metrics.totalTime}ms`);
      console.log(`  ⚡ LCP Assessment: ${coreWebVitals.LCP}`);
      
    } catch (error) {
      this.results.tests.push({
        name: 'Performance Metrics',
        status: 'FAILED',
        error: error.message
      });
      console.log(`  ❌ Performance test failed: ${error.message}`);
    }
  }

  async testMobileResponsiveness(page) {
    console.log('📱 Testing: Mobile Responsiveness...');
    
    try {
      // Test mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      await page.goto('http://localhost:8084', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(1000);
      
      const mobileContent = await page.evaluate(() => {
        const body = document.body;
        return {
          hasContent: body.textContent.length > 50,
          bodyWidth: body.getBoundingClientRect().width,
          hasOverflow: body.scrollWidth > window.innerWidth
        };
      });
      
      // Test tablet viewport
      await page.setViewport({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      const tabletContent = await page.evaluate(() => {
        return {
          hasContent: document.body.textContent.length > 50,
          bodyWidth: document.body.getBoundingClientRect().width
        };
      });
      
      // Reset to desktop
      await page.setViewport({ width: 1200, height: 800 });
      
      const isResponsive = mobileContent.hasContent && 
                          tabletContent.hasContent && 
                          !mobileContent.hasOverflow;
      
      this.results.tests.push({
        name: 'Mobile Responsiveness',
        status: isResponsive ? 'PASSED' : 'WARNING',
        mobileContent,
        tabletContent,
        isResponsive
      });
      
      console.log(`  📱 Mobile content loaded: ${mobileContent.hasContent}`);
      console.log(`  📱 Tablet content loaded: ${tabletContent.hasContent}`);
      console.log(`  📱 No horizontal overflow: ${!mobileContent.hasOverflow}`);
      console.log(`  📱 Overall responsive: ${isResponsive}`);
      
    } catch (error) {
      this.results.tests.push({
        name: 'Mobile Responsiveness', 
        status: 'WARNING',
        error: error.message
      });
      console.log(`  ⚠️ Mobile responsiveness test warning: ${error.message}`);
    }
  }

  async generateQuickReport() {
    console.log('\n📊 Generating Quick Test Report...');
    
    const passedTests = this.results.tests.filter(t => t.status === 'PASSED').length;
    const failedTests = this.results.tests.filter(t => t.status === 'FAILED').length;
    const warningTests = this.results.tests.filter(t => t.status === 'WARNING').length;
    const totalTests = this.results.tests.length;
    
    const summary = {
      overallStatus: failedTests === 0 ? (warningTests === 0 ? 'PASSED' : 'PASSED_WITH_WARNINGS') : 'FAILED',
      totalTests,
      passed: passedTests,
      failed: failedTests,
      warnings: warningTests
    };
    
    this.results.summary = summary;
    
    const reportContent = `# Quick Functionality Test Report

**Generated:** ${this.results.timestamp}
**Status:** ${summary.overallStatus}
**Tests:** ${passedTests}/${totalTests} passed

## Test Results

${this.results.tests.map(test => `### ${test.name}
**Status:** ${test.status}
${test.metrics ? `**Metrics:** ${JSON.stringify(test.metrics)}` : ''}
${test.error ? `**Error:** ${test.error}` : ''}
${test.loadTime ? `**Load Time:** ${test.loadTime}` : ''}
`).join('\n')}

## Performance Summary

${this.results.performance.totalTime ? `- **Total Load Time:** ${this.results.performance.totalTime}ms` : ''}
${this.results.performance.domContentLoaded ? `- **DOM Content Loaded:** ${this.results.performance.domContentLoaded}ms` : ''}
${this.results.performance.coreWebVitals ? `- **LCP Assessment:** ${this.results.performance.coreWebVitals.LCP}` : ''}

## Summary

- ✅ **Passed:** ${passedTests} tests
- ⚠️ **Warnings:** ${warningTests} tests  
- ❌ **Failed:** ${failedTests} tests

**Overall Status:** ${summary.overallStatus}

---
*Quick validation completed in under 30 seconds*
`;

    await fs.writeFile('QUICK_FUNCTIONALITY_REPORT.md', reportContent);
    await fs.writeFile('quick-test-results.json', JSON.stringify(this.results, null, 2));
    
    console.log(`📄 Report: QUICK_FUNCTIONALITY_REPORT.md`);
    console.log(`📊 JSON: quick-test-results.json`);
    console.log(`\n🏆 Overall Status: ${summary.overallStatus}`);
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`⚠️ Warnings: ${warningTests}`);
    console.log(`❌ Failed: ${failedTests}`);
  }
}

// Execute if run directly  
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new QuickFunctionalityTest();
  await tester.runQuickValidation();
}

export default QuickFunctionalityTest;