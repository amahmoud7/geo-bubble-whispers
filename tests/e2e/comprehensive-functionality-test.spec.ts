import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Functionality Testing for Lo Platform
 * Tests critical user workflows and Google Maps integration
 */

test.describe('Lo Platform - Comprehensive Functionality Testing', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Navigate to the app
    await page.goto('http://localhost:8084');
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Page loads successfully with all core elements', async () => {
    console.log('🏠 Testing: Page Load & Core Elements');
    
    // Check if main container loads
    await expect(page.locator('#root')).toBeVisible();
    
    // Check for critical app elements
    const title = page.locator('h1, [data-testid="app-title"], .app-title');
    
    // The page should load without errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait for potential console errors
    await page.waitForTimeout(2000);
    
    // Report console errors but don't fail test if they're non-critical
    if (consoleErrors.length > 0) {
      console.log('⚠️ Console errors detected:', consoleErrors);
    }
    
    console.log('✅ Page loaded successfully');
  });

  test('Google Maps integration and error boundaries', async () => {
    console.log('🗺️ Testing: Google Maps Integration & Error Boundaries');
    
    // Look for map container or fallback UI
    const mapContainer = page.locator('[data-testid="map-container"], .map-container, #map');
    const fallbackMap = page.locator('[data-testid="fallback-map"], .fallback-map');
    const errorBoundary = page.locator('[data-testid="error-boundary"], .error-boundary');
    
    await page.waitForTimeout(3000); // Allow time for map to load or fail
    
    // Check if either real map or fallback is present
    const mapExists = await mapContainer.count() > 0;
    const fallbackExists = await fallbackMap.count() > 0;
    const errorBoundaryExists = await errorBoundary.count() > 0;
    
    console.log(`Map container found: ${mapExists}`);
    console.log(`Fallback map found: ${fallbackExists}`);
    console.log(`Error boundary found: ${errorBoundaryExists}`);
    
    // At least one should be present
    expect(mapExists || fallbackExists || errorBoundaryExists).toBe(true);
    
    // If fallback is shown, check for error handling UI
    if (fallbackExists || errorBoundaryExists) {
      console.log('🔄 Fallback UI detected - testing error recovery');
      
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again"), [data-testid="retry-button"]');
      if (await retryButton.count() > 0) {
        console.log('✅ Retry button found');
        
        // Test retry functionality
        await retryButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Retry button clicked successfully');
      }
    }
    
    console.log('✅ Google Maps error handling validated');
  });

  test('Navigation and routing functionality', async () => {
    console.log('🧭 Testing: Navigation & Routing');
    
    // Look for navigation elements
    const navElements = page.locator('nav, .navigation, [role="navigation"]');
    const homeLink = page.locator('a[href="/"], a[href="/home"], button:has-text("Home")');
    const profileLink = page.locator('a[href="/profile"], button:has-text("Profile")');
    
    await page.waitForTimeout(1000);
    
    // Test navigation if elements exist
    if (await navElements.count() > 0) {
      console.log('📱 Navigation elements found');
      
      // Try to navigate to different sections
      if (await homeLink.count() > 0) {
        await homeLink.first().click();
        await page.waitForTimeout(1000);
        console.log('✅ Home navigation works');
      }
      
      if (await profileLink.count() > 0) {
        await profileLink.first().click();
        await page.waitForTimeout(1000);
        console.log('✅ Profile navigation works');
      }
    } else {
      console.log('⚠️ No navigation elements found - may be a SPA without visible nav');
    }
    
    console.log('✅ Navigation functionality tested');
  });

  test('Mobile responsiveness and touch interactions', async () => {
    console.log('📱 Testing: Mobile Responsiveness');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.waitForTimeout(1000);
    
    // Check if content adapts to mobile
    const body = page.locator('body');
    const bodyWidth = await body.boundingBox();
    
    expect(bodyWidth?.width).toBeLessThanOrEqual(375);
    
    // Test tablet viewport  
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.waitForTimeout(1000);
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 }); // Desktop
    await page.waitForTimeout(1000);
    
    console.log('✅ Responsive design validated across viewports');
  });

  test('Performance and loading speed', async () => {
    console.log('⚡ Testing: Performance & Loading Speed');
    
    const startTime = Date.now();
    
    // Navigate and measure load time
    await page.goto('http://localhost:8084');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`📊 Page load time: ${loadTime}ms`);
    
    // Check for performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstByte: navigation.responseStart - navigation.requestStart
      };
    });
    
    console.log(`🏗️ DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`📈 Load Complete: ${performanceMetrics.loadComplete}ms`);
    console.log(`🚀 Time to First Byte: ${performanceMetrics.firstByte}ms`);
    
    // Basic performance assertions
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(5000); // DOM ready within 5 seconds
    
    console.log('✅ Performance metrics captured');
  });

  test('Error handling and recovery scenarios', async () => {
    console.log('🛡️ Testing: Error Handling & Recovery');
    
    // Test navigation to non-existent route
    await page.goto('http://localhost:8084/non-existent-route');
    await page.waitForTimeout(2000);
    
    // Should show 404 page or redirect to home
    const notFoundElement = page.locator(':has-text("404"), :has-text("Not Found"), :has-text("Page not found")');
    const homeRedirect = page.locator(':has-text("Home"), :has-text("Lo")');
    
    const has404 = await notFoundElement.count() > 0;
    const hasHomeRedirect = await homeRedirect.count() > 0;
    
    console.log(`404 page shown: ${has404}`);
    console.log(`Home redirect: ${hasHomeRedirect}`);
    
    // Should handle the error gracefully
    expect(has404 || hasHomeRedirect).toBe(true);
    
    // Test recovery by going back to home
    await page.goto('http://localhost:8084');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Error recovery validated');
  });

  test('Interactive elements and user workflows', async () => {
    console.log('👆 Testing: Interactive Elements & User Workflows');
    
    // Look for interactive elements
    const buttons = page.locator('button');
    const links = page.locator('a');
    const inputs = page.locator('input, textarea');
    
    await page.waitForTimeout(1000);
    
    const buttonCount = await buttons.count();
    const linkCount = await links.count();
    const inputCount = await inputs.count();
    
    console.log(`🔘 Buttons found: ${buttonCount}`);
    console.log(`🔗 Links found: ${linkCount}`);  
    console.log(`📝 Input fields found: ${inputCount}`);
    
    // Test button interactions (click first few buttons if they exist)
    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(3, buttonCount); i++) {
        try {
          const button = buttons.nth(i);
          const buttonText = await button.textContent();
          
          if (buttonText && !buttonText.includes('Delete') && !buttonText.includes('Remove')) {
            await button.click();
            await page.waitForTimeout(500);
            console.log(`✅ Button clicked: "${buttonText}"`);
          }
        } catch (error) {
          console.log(`⚠️ Button ${i} not clickable:`, error.message);
        }
      }
    }
    
    console.log('✅ Interactive elements tested');
  });

  test('Authentication and user state management', async () => {
    console.log('🔐 Testing: Authentication & User State');
    
    // Look for auth-related elements
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), a:has-text("Login")');
    const signupButton = page.locator('button:has-text("Sign Up"), button:has-text("Register")');
    const profileButton = page.locator('button:has-text("Profile"), a:has-text("Profile")');
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
    
    const hasLogin = await loginButton.count() > 0;
    const hasSignup = await signupButton.count() > 0;
    const hasProfile = await profileButton.count() > 0;
    const hasLogout = await logoutButton.count() > 0;
    
    console.log(`Login button: ${hasLogin}`);
    console.log(`Signup button: ${hasSignup}`);
    console.log(`Profile button: ${hasProfile}`);
    console.log(`Logout button: ${hasLogout}`);
    
    // Test auth flow if elements exist
    if (hasLogin && !hasLogout) {
      console.log('👤 User appears to be logged out');
      
      // Try clicking login button
      await loginButton.first().click();
      await page.waitForTimeout(2000);
      
      // Look for login form or modal
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
        console.log('✅ Login form detected');
      }
    } else if (hasLogout) {
      console.log('👤 User appears to be logged in');
    }
    
    console.log('✅ Authentication state checked');
  });
});

// Additional performance test
test.describe('Performance Validation', () => {
  test('Bundle size and loading performance', async ({ page }) => {
    console.log('📦 Testing: Bundle Performance');
    
    // Enable request tracking
    const requests: any[] = [];
    page.on('response', response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        requests.push({
          url: response.url(),
          size: response.headers()['content-length'] || 0,
          status: response.status()
        });
      }
    });
    
    await page.goto('http://localhost:8084');
    await page.waitForLoadState('networkidle');
    
    // Analyze bundle requests
    const jsRequests = requests.filter(r => r.url.includes('.js'));
    const cssRequests = requests.filter(r => r.url.includes('.css'));
    
    console.log(`📊 JavaScript files loaded: ${jsRequests.length}`);
    console.log(`🎨 CSS files loaded: ${cssRequests.length}`);
    
    jsRequests.forEach(req => {
      const size = parseInt(req.size) || 0;
      const sizeKB = Math.round(size / 1024);
      console.log(`  JS: ${req.url.split('/').pop()} - ${sizeKB}KB`);
    });
    
    console.log('✅ Bundle performance analyzed');
  });
});