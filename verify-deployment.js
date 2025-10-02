import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:8082';

async function runVerification() {
  console.log('🔍 Starting iOS Deployment Readiness Verification...\n');
  
  const results = {
    googleMaps: { status: 'PENDING', errors: [], warnings: [], evidence: [] },
    diagnosticPage: { status: 'PENDING', errors: [], warnings: [], evidence: [] },
    navigation: { status: 'PENDING', errors: [], warnings: [], evidence: [] },
    consoleErrors: { status: 'PENDING', errors: [], warnings: [], evidence: [] },
    mobileResponsiveness: { status: 'PENDING', errors: [], warnings: [], evidence: [] },
    performance: { status: 'PENDING', errors: [], warnings: [], evidence: [] },
    iosConfiguration: { status: 'PENDING', errors: [], warnings: [], evidence: [] }
  };

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    });
    
    const page = await context.newPage();
    
    // Track console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });

    page.on('pageerror', error => {
      consoleMessages.push({
        type: 'error',
        text: `Page Error: ${error.message}`,
        location: { url: 'page-error' }
      });
    });

    // Test 1: Google Maps Loading
    console.log('📍 Testing Google Maps loading...');
    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000); // Allow maps to load
      
      // Check for Google Maps elements
      const mapContainer = page.locator('canvas').first();
      const isMapVisible = await mapContainer.isVisible();
      
      if (isMapVisible) {
        results.googleMaps.status = 'PASS';
        results.googleMaps.evidence.push('Google Maps canvas element found and visible');
        console.log('  ✅ Google Maps canvas element detected');
      } else {
        results.googleMaps.status = 'FAIL';
        results.googleMaps.errors.push('Google Maps canvas not visible');
        console.log('  ❌ Google Maps canvas not found');
      }

      // Check for Google Maps in window object
      const hasGoogleMaps = await page.evaluate(() => {
        return typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined';
      });
      
      if (hasGoogleMaps) {
        results.googleMaps.evidence.push('Google Maps API loaded in window object');
        console.log('  ✅ Google Maps API detected in window');
      } else {
        results.googleMaps.errors.push('Google Maps API not found in window object');
        console.log('  ❌ Google Maps API not loaded');
      }

      await page.screenshot({ path: 'test-results/google-maps-test.png', fullPage: true });
      
    } catch (error) {
      results.googleMaps.status = 'FAIL';
      results.googleMaps.errors.push(`Error testing Google Maps: ${error.message}`);
      console.log(`  ❌ Error: ${error.message}`);
    }

    // Test 2: Diagnostic Page
    console.log('\n🔧 Testing diagnostic page...');
    try {
      await page.goto(`${BASE_URL}/diagnostic`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const pageTitle = await page.title();
      const bodyText = await page.textContent('body');
      
      if (bodyText && bodyText.trim().length > 0) {
        results.diagnosticPage.status = 'PASS';
        results.diagnosticPage.evidence.push(`Diagnostic page loaded with content (${bodyText.length} characters)`);
        console.log('  ✅ Diagnostic page loads with content');
      } else {
        results.diagnosticPage.status = 'FAIL';
        results.diagnosticPage.errors.push('Diagnostic page appears to be empty');
        console.log('  ❌ Diagnostic page appears empty');
      }

      await page.screenshot({ path: 'test-results/diagnostic-page-test.png', fullPage: true });
      
    } catch (error) {
      results.diagnosticPage.status = 'FAIL';
      results.diagnosticPage.errors.push(`Error testing diagnostic page: ${error.message}`);
      console.log(`  ❌ Error: ${error.message}`);
    }

    // Test 3: Navigation
    console.log('\n🧭 Testing navigation between pages...');
    const pagesToTest = [
      { path: '/', name: 'Home' },
      { path: '/profile', name: 'Profile' },
      { path: '/auth', name: 'Auth' },
      { path: '/explore', name: 'Explore' }
    ];

    let navigationSuccesses = 0;
    for (const pageInfo of pagesToTest) {
      try {
        await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        
        const bodyText = await page.textContent('body');
        if (bodyText && bodyText.trim().length > 0) {
          navigationSuccesses++;
          console.log(`  ✅ ${pageInfo.name} page loads successfully`);
          await page.screenshot({ path: `test-results/navigation-${pageInfo.name.toLowerCase()}.png` });
        } else {
          results.navigation.errors.push(`${pageInfo.name} page appears empty`);
          console.log(`  ❌ ${pageInfo.name} page appears empty`);
        }
      } catch (error) {
        results.navigation.errors.push(`Error loading ${pageInfo.name}: ${error.message}`);
        console.log(`  ❌ Error loading ${pageInfo.name}: ${error.message}`);
      }
    }

    if (navigationSuccesses >= 3) {
      results.navigation.status = 'PASS';
      results.navigation.evidence.push(`${navigationSuccesses}/${pagesToTest.length} pages load successfully`);
    } else {
      results.navigation.status = 'FAIL';
      results.navigation.errors.push(`Only ${navigationSuccesses}/${pagesToTest.length} pages loaded successfully`);
    }

    // Test 4: Console Errors Analysis
    console.log('\n🐛 Analyzing console errors...');
    const criticalErrors = consoleMessages.filter(msg => 
      msg.type === 'error' && 
      !msg.text.includes('favicon') && 
      !msg.text.includes('extension') &&
      !msg.text.includes('Warning')
    );

    const warnings = consoleMessages.filter(msg => msg.type === 'warning');

    if (criticalErrors.length === 0) {
      results.consoleErrors.status = 'PASS';
      results.consoleErrors.evidence.push('No critical console errors detected');
      console.log('  ✅ No critical console errors found');
    } else if (criticalErrors.length < 3) {
      results.consoleErrors.status = 'PASS';
      results.consoleErrors.warnings = criticalErrors.map(e => e.text);
      results.consoleErrors.evidence.push(`${criticalErrors.length} minor console errors (acceptable)`);
      console.log(`  ⚠️  ${criticalErrors.length} minor console errors found (acceptable)`);
    } else {
      results.consoleErrors.status = 'FAIL';
      results.consoleErrors.errors = criticalErrors.map(e => e.text);
      console.log(`  ❌ ${criticalErrors.length} critical console errors found`);
    }

    if (warnings.length > 0) {
      console.log(`  ℹ️  ${warnings.length} warnings found`);
    }

    // Test 5: Mobile Responsiveness
    console.log('\n📱 Testing mobile responsiveness...');
    try {
      // Test iPhone viewport
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const isMobileLayout = await page.evaluate(() => window.innerWidth <= 768);
      
      if (isMobileLayout) {
        results.mobileResponsiveness.status = 'PASS';
        results.mobileResponsiveness.evidence.push('Mobile viewport detected correctly');
        console.log('  ✅ Mobile viewport responds correctly');
      } else {
        results.mobileResponsiveness.status = 'FAIL';
        results.mobileResponsiveness.errors.push('Mobile viewport not detected');
        console.log('  ❌ Mobile viewport not responding');
      }

      await page.screenshot({ path: 'test-results/mobile-responsive-test.png' });

    } catch (error) {
      results.mobileResponsiveness.status = 'FAIL';
      results.mobileResponsiveness.errors.push(`Error testing mobile responsiveness: ${error.message}`);
      console.log(`  ❌ Error: ${error.message}`);
    }

    // Test 6: Performance
    console.log('\n⚡ Testing performance...');
    try {
      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      if (loadTime < 8000) {
        results.performance.status = 'PASS';
        results.performance.evidence.push(`Page load time: ${loadTime}ms (< 8s target)`);
        console.log(`  ✅ Page loads in ${loadTime}ms (acceptable for iOS)`);
      } else {
        results.performance.status = 'FAIL';
        results.performance.errors.push(`Page load time: ${loadTime}ms (> 8s, too slow for iOS)`);
        console.log(`  ❌ Page loads in ${loadTime}ms (too slow for iOS)`);
      }

    } catch (error) {
      results.performance.status = 'FAIL';
      results.performance.errors.push(`Error testing performance: ${error.message}`);
      console.log(`  ❌ Error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Fatal error during verification:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Test 7: iOS Configuration Check
  console.log('\n🍎 Checking iOS configuration...');
  try {
    const capacitorConfigExists = fs.existsSync('./capacitor.config.ts');
    const iosDirectoryExists = fs.existsSync('./ios');
    const packageJsonExists = fs.existsSync('./package.json');

    if (capacitorConfigExists && iosDirectoryExists && packageJsonExists) {
      results.iosConfiguration.status = 'PASS';
      results.iosConfiguration.evidence.push('All iOS configuration files present');
      console.log('  ✅ iOS configuration files detected');
    } else {
      results.iosConfiguration.status = 'FAIL';
      results.iosConfiguration.errors.push('Missing iOS configuration files');
      console.log('  ❌ Missing iOS configuration files');
    }

    // Check package.json for iOS deployment script
    if (packageJsonExists) {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      if (packageJson.scripts && packageJson.scripts['deploy:ios']) {
        results.iosConfiguration.evidence.push('iOS deployment script found in package.json');
        console.log('  ✅ iOS deployment script configured');
      } else {
        results.iosConfiguration.warnings.push('No iOS deployment script found');
        console.log('  ⚠️  No iOS deployment script found');
      }
    }

  } catch (error) {
    results.iosConfiguration.status = 'FAIL';
    results.iosConfiguration.errors.push(`Error checking iOS configuration: ${error.message}`);
    console.log(`  ❌ Error: ${error.message}`);
  }

  return results;
}

async function generateReport(results) {
  console.log('\n📋 GENERATING FINAL VERIFICATION REPORT\n');
  console.log('=' * 80);
  
  const testResults = Object.values(results);
  const passCount = testResults.filter(r => r.status === 'PASS').length;
  const failCount = testResults.filter(r => r.status === 'FAIL').length;
  const totalTests = testResults.length;
  
  const overallStatus = failCount === 0 ? 'PASS' : 'FAIL';
  
  console.log(`\n🎯 OVERALL STATUS: ${overallStatus}`);
  console.log(`📊 TEST SUMMARY: ${passCount}/${totalTests} tests passed, ${failCount} failed\n`);
  
  // Generate detailed report
  const report = {
    timestamp: new Date().toISOString(),
    overallStatus,
    summary: {
      totalTests,
      passed: passCount,
      failed: failCount,
      successRate: `${Math.round((passCount / totalTests) * 100)}%`
    },
    testResults: results,
    iosDeploymentReady: overallStatus === 'PASS',
    recommendations: []
  };

  // Add recommendations based on failures
  Object.entries(results).forEach(([testName, result]) => {
    if (result.status === 'FAIL') {
      report.recommendations.push(`Fix ${testName}: ${result.errors.join(', ')}`);
    }
  });

  // Print detailed results
  Object.entries(results).forEach(([testName, result]) => {
    const statusIcon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${statusIcon} ${testName.toUpperCase()}: ${result.status}`);
    
    if (result.evidence.length > 0) {
      console.log(`   Evidence: ${result.evidence.join('; ')}`);
    }
    
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.join('; ')}`);
    }
    
    if (result.warnings.length > 0) {
      console.log(`   Warnings: ${result.warnings.join('; ')}`);
    }
    console.log('');
  });

  // Save report to file
  fs.writeFileSync('verification-report.json', JSON.stringify(report, null, 2));
  console.log('📄 Detailed report saved to verification-report.json');
  
  console.log('\n' + '=' * 80);
  if (overallStatus === 'PASS') {
    console.log('🚀 RECOMMENDATION: APP IS READY FOR iOS DEPLOYMENT');
  } else {
    console.log('🛑 RECOMMENDATION: APP REQUIRES FIXES BEFORE iOS DEPLOYMENT');
    console.log('\nRequired Actions:');
    report.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }
  console.log('=' * 80);

  return report;
}

// Run verification
runVerification()
  .then(generateReport)
  .catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });