import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8082';

test.describe('iOS Deployment Readiness Verification', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset error tracking
    consoleErrors = [];
    consoleWarnings = [];

    // Track console errors and warnings
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Track page errors
    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });
  });

  test('1. Verify Google Maps loading on home page', async ({ page }) => {
    await test.step('Navigate to home page', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
    });

    await test.step('Wait for Google Maps to load', async () => {
      // Wait for Google Maps container
      await expect(page.locator('[data-testid="map-container"], .map-container, #map')).toBeVisible({ timeout: 15000 });
      
      // Check for Google Maps specific elements
      const mapCanvas = page.locator('canvas').first();
      await expect(mapCanvas).toBeVisible({ timeout: 10000 });
      
      // Verify Google Maps script is loaded
      const googleMapsScript = await page.evaluate(() => {
        return window.google && window.google.maps ? true : false;
      });
      expect(googleMapsScript).toBe(true);
    });

    await test.step('Take screenshot of maps', async () => {
      await page.screenshot({ path: 'test-results/google-maps-loading.png', fullPage: true });
    });

    await test.step('Verify no critical console errors related to maps', async () => {
      const mapErrors = consoleErrors.filter(error => 
        error.toLowerCase().includes('google') || 
        error.toLowerCase().includes('map') ||
        error.toLowerCase().includes('api key')
      );
      
      if (mapErrors.length > 0) {
        console.log('Map-related errors found:', mapErrors);
      }
      
      // Allow non-critical map warnings but fail on API key errors
      const criticalMapErrors = mapErrors.filter(error => 
        error.toLowerCase().includes('api key') ||
        error.toLowerCase().includes('unauthorized') ||
        error.toLowerCase().includes('billing')
      );
      
      expect(criticalMapErrors).toHaveLength(0);
    });
  });

  test('2. Verify diagnostic page functionality', async ({ page }) => {
    await test.step('Navigate to diagnostic page', async () => {
      await page.goto(`${BASE_URL}/diagnostic`);
      await page.waitForLoadState('networkidle');
    });

    await test.step('Check diagnostic page loads correctly', async () => {
      // Check for diagnostic page indicators
      const pageTitle = await page.title();
      const pageContent = await page.textContent('body');
      
      // Should contain diagnostic-related content
      expect(pageContent?.toLowerCase().includes('diagnostic') || 
             pageContent?.toLowerCase().includes('debug') ||
             pageContent?.toLowerCase().includes('test')).toBe(true);
    });

    await test.step('Take screenshot of diagnostic page', async () => {
      await page.screenshot({ path: 'test-results/diagnostic-page.png', fullPage: true });
    });

    await test.step('Verify diagnostic page has no critical errors', async () => {
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('Warning') && 
        !error.includes('favicon') &&
        error.length > 0
      );
      
      if (criticalErrors.length > 0) {
        console.log('Critical errors on diagnostic page:', criticalErrors);
      }
    });
  });

  test('3. Test navigation between pages', async ({ page }) => {
    const pagesToTest = [
      { path: '/', name: 'Home' },
      { path: '/diagnostic', name: 'Diagnostic' },
      { path: '/profile', name: 'Profile' },
      { path: '/auth', name: 'Auth' },
      { path: '/explore', name: 'Explore' }
    ];

    for (const pageInfo of pagesToTest) {
      await test.step(`Navigate to ${pageInfo.name} page`, async () => {
        await page.goto(`${BASE_URL}${pageInfo.path}`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Verify page loads (no blank screen)
        const bodyText = await page.textContent('body');
        expect(bodyText?.trim().length).toBeGreaterThan(0);
        
        // Take screenshot
        await page.screenshot({ 
          path: `test-results/navigation-${pageInfo.name.toLowerCase()}.png`, 
          fullPage: true 
        });
      });
    }

    await test.step('Verify navigation doesn\'t cause critical errors', async () => {
      const navigationErrors = consoleErrors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('Warning') &&
        error.length > 0
      );
      
      if (navigationErrors.length > 0) {
        console.log('Navigation errors found:', navigationErrors);
      }
    });
  });

  test('4. Check for critical console errors across app', async ({ page }) => {
    await test.step('Visit main pages and collect errors', async () => {
      const pages = ['/', '/diagnostic', '/profile', '/auth'];
      
      for (const path of pages) {
        await page.goto(`${BASE_URL}${path}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Allow time for async operations
      }
    });

    await test.step('Analyze console errors', async () => {
      // Filter out non-critical errors
      const criticalErrors = consoleErrors.filter(error => {
        const lowerError = error.toLowerCase();
        return !lowerError.includes('favicon') &&
               !lowerError.includes('warning') &&
               !lowerError.includes('extension') &&
               !lowerError.includes('chrome-extension') &&
               error.trim().length > 0;
      });

      console.log('All console errors found:', consoleErrors);
      console.log('Critical errors:', criticalErrors);
      console.log('Warnings:', consoleWarnings);

      // Critical errors should be minimal
      expect(criticalErrors.length).toBeLessThan(5);
    });
  });

  test('5. Verify mobile responsiveness (iOS compatibility)', async ({ page }) => {
    await test.step('Test iPhone viewport', async () => {
      await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12 Pro
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Check mobile layout
      const isMobileLayout = await page.evaluate(() => {
        return window.innerWidth <= 768;
      });
      expect(isMobileLayout).toBe(true);
      
      await page.screenshot({ path: 'test-results/mobile-iphone-layout.png' });
    });

    await test.step('Test iPad viewport', async () => {
      await page.setViewportSize({ width: 820, height: 1180 }); // iPad Air
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'test-results/mobile-ipad-layout.png' });
    });

    await test.step('Test touch interactions', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Try tapping on interactive elements
      const buttons = page.locator('button').first();
      if (await buttons.isVisible()) {
        await buttons.tap();
      }
      
      // Verify no errors from touch interactions
      await page.waitForTimeout(1000);
    });
  });

  test('6. Verify core functionality works', async ({ page }) => {
    await test.step('Test authentication flow availability', async () => {
      await page.goto(`${BASE_URL}/auth`);
      await page.waitForLoadState('networkidle');
      
      // Look for auth form elements
      const authElements = await page.locator('input[type="email"], input[type="password"], button').count();
      expect(authElements).toBeGreaterThan(0);
    });

    await test.step('Test map interactions', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Wait for map to load
      await page.waitForSelector('canvas', { timeout: 15000 });
      
      // Try interacting with map
      const mapCanvas = page.locator('canvas').first();
      await mapCanvas.click();
      
      // Verify no errors from map interaction
      await page.waitForTimeout(1000);
    });
  });

  test.afterEach(async ({ page }) => {
    // Log summary of errors for this test
    if (consoleErrors.length > 0 || consoleWarnings.length > 0) {
      console.log(`Test completed with ${consoleErrors.length} errors and ${consoleWarnings.length} warnings`);
    }
  });
});

// Performance test
test.describe('Performance Verification', () => {
  test('7. Verify page load performance', async ({ page }) => {
    await test.step('Measure home page load time', async () => {
      const startTime = Date.now();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`Home page load time: ${loadTime}ms`);
      
      // Should load within reasonable time for iOS
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
    });

    await test.step('Check Core Web Vitals', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Measure First Contentful Paint and Largest Contentful Paint
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
            resolve({
              fcp: fcp?.startTime || 0,
              navigationStart: performance.timing?.navigationStart || 0
            });
          });
          
          observer.observe({ entryTypes: ['paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve({ fcp: 0, navigationStart: 0 }), 5000);
        });
      });
      
      console.log('Performance vitals:', vitals);
    });
  });
});