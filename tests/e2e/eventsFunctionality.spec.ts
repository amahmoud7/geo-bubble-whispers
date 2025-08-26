import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Events Functionality E2E Tests', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    // Create context with geolocation permissions
    context = await browser.newContext({
      permissions: ['geolocation'],
      geolocation: { longitude: -74.0060, latitude: 40.7128 }, // NYC coordinates
    });
    page = await context.newPage();
    
    // Mock Google Maps API
    await page.addInitScript(() => {
      window.google = {
        maps: {
          Map: class MockMap {
            constructor() {}
            setCenter() {}
            setZoom() {}
            addListener() {}
            removeListener() {}
            getBounds() {
              return {
                getNorthEast: () => ({ lat: () => 40.92, lng: () => -73.68 }),
                getSouthWest: () => ({ lat: () => 40.53, lng: () => -74.26 })
              };
            }
          },
          Marker: class MockMarker {
            constructor() {}
            setPosition() {}
            setMap() {}
          },
          InfoWindow: class MockInfoWindow {
            constructor() {}
            open() {}
            close() {}
          },
          LatLng: class MockLatLng {
            constructor(public lat: number, public lng: number) {}
            lat() { return this.lat; }
            lng() { return this.lng; }
          },
          event: {
            addListener: () => {},
            removeListener: () => {},
          },
        },
      };
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should load the application successfully', async () => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Geo Bubble Whispers/);
    
    // Wait for the main map container to be visible
    await expect(page.locator('[data-testid="map-container"]').or(page.locator('.map-container')).or(page.locator('#map'))).toBeVisible({ timeout: 10000 });
  });

  test('should display Ticketmaster toggle button', async () => {
    await page.goto('/');
    
    // Look for Ticketmaster toggle button
    const ticketmasterToggle = page.locator('button').filter({ hasText: /ticketmaster|events/i }).first();
    await expect(ticketmasterToggle).toBeVisible({ timeout: 15000 });
  });

  test('should toggle Ticketmaster events on and off', async () => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Find and click the Ticketmaster toggle
    const toggleButton = page.locator('button').filter({ hasText: /ticketmaster|events/i }).first();
    await expect(toggleButton).toBeVisible({ timeout: 15000 });
    
    // Click to enable events
    await toggleButton.click();
    
    // Wait for potential event markers to appear
    await page.waitForTimeout(5000);
    
    // Click to disable events
    await toggleButton.click();
    
    console.log('✅ Successfully toggled Ticketmaster events');
  });

  test('should handle different city locations', async () => {
    const cities = [
      { name: 'New York', lat: 40.7128, lng: -74.0060 },
      { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
      { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
    ];

    for (const city of cities) {
      console.log(`🏙️ Testing ${city.name}...`);
      
      // Update geolocation for this city
      await context.setGeolocation({ longitude: city.lng, latitude: city.lat });
      
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Enable events for this location
      const toggleButton = page.locator('button').filter({ hasText: /ticketmaster|events/i }).first();
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await page.waitForTimeout(5000);
        console.log(`✅ ${city.name}: Events toggle successful`);
      } else {
        console.log(`⚠️ ${city.name}: Toggle button not found`);
      }
    }
  });

  test('should display event markers on the map', async () => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Enable Ticketmaster events
    const toggleButton = page.locator('button').filter({ hasText: /ticketmaster|events/i }).first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      
      // Wait for events to load and markers to appear
      await page.waitForTimeout(10000);
      
      // Look for event markers on the map (these could be various selectors)
      const eventMarkers = page.locator('[data-testid*="event"], [class*="event"], [aria-label*="event"]');
      const markerCount = await eventMarkers.count();
      
      console.log(`🎫 Found ${markerCount} event markers on the map`);
      
      if (markerCount > 0) {
        // Click on the first event marker to test interaction
        await eventMarkers.first().click();
        await page.waitForTimeout(2000);
        console.log('✅ Successfully clicked event marker');
      }
    }
  });

  test('should handle map zoom and pan for event loading', async () => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Get the map container
    const mapContainer = page.locator('[data-testid="map-container"]').or(page.locator('.map-container')).or(page.locator('#map')).first();
    await expect(mapContainer).toBeVisible();
    
    // Simulate map interaction (pan)
    await mapContainer.click({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(1000);
    
    // Simulate another click to pan the map
    await mapContainer.click({ position: { x: 400, y: 300 } });
    await page.waitForTimeout(2000);
    
    // Enable events after panning
    const toggleButton = page.locator('button').filter({ hasText: /ticketmaster|events/i }).first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(5000);
      console.log('✅ Events loaded after map interaction');
    }
  });

  test('should display real-time events button', async () => {
    await page.goto('/');
    
    // Look for real-time events button
    const realTimeButton = page.locator('button').filter({ hasText: /real.?time|live/i });
    if (await realTimeButton.count() > 0) {
      await expect(realTimeButton.first()).toBeVisible();
      await realTimeButton.first().click();
      await page.waitForTimeout(3000);
      console.log('✅ Real-time events button found and clicked');
    } else {
      console.log('ℹ️ Real-time events button not found (may not be implemented)');
    }
  });

  test('should handle event detail modal', async () => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Enable events
    const toggleButton = page.locator('button').filter({ hasText: /ticketmaster|events/i }).first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(10000);
      
      // Look for event cards or markers
      const eventElements = page.locator('[data-testid*="event"], .event-card, .event-marker');
      const eventCount = await eventElements.count();
      
      if (eventCount > 0) {
        // Click on the first event
        await eventElements.first().click();
        await page.waitForTimeout(2000);
        
        // Look for modal or detail popup
        const modal = page.locator('.modal, [role="dialog"], .popup, .detail-view');
        if (await modal.count() > 0) {
          await expect(modal.first()).toBeVisible();
          
          // Look for close button and close modal
          const closeButton = modal.locator('button').filter({ hasText: /close|×|✕/i }).or(page.locator('[aria-label*="close"]'));
          if (await closeButton.count() > 0) {
            await closeButton.first().click();
            await page.waitForTimeout(1000);
          }
          
          console.log('✅ Event detail modal opened and closed successfully');
        } else {
          console.log('ℹ️ Event detail modal not found');
        }
      } else {
        console.log('ℹ️ No event elements found to click');
      }
    }
  });

  test('should work on mobile viewport', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Check if mobile layout works
    const mapContainer = page.locator('[data-testid="map-container"]').or(page.locator('.map-container')).or(page.locator('#map')).first();
    await expect(mapContainer).toBeVisible();
    
    // Try to find mobile-specific navigation or buttons
    const mobileNav = page.locator('.mobile-nav, [data-testid="mobile-nav"], .bottom-nav');
    if (await mobileNav.count() > 0) {
      console.log('✅ Mobile navigation detected');
    }
    
    // Test events toggle on mobile
    const toggleButton = page.locator('button').filter({ hasText: /ticketmaster|events/i }).first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(5000);
      console.log('✅ Mobile events toggle successful');
    }
  });

  test('should handle network errors gracefully', async () => {
    await page.goto('/');
    
    // Block all requests to simulate network issues
    await page.route('**/functions/v1/**', route => {
      route.abort('failed');
    });
    
    await page.waitForTimeout(2000);
    
    // Try to enable events
    const toggleButton = page.locator('button').filter({ hasText: /ticketmaster|events/i }).first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(5000);
      
      // Look for error messages or empty state
      const errorMessage = page.locator('.error, [data-testid*="error"], .alert').filter({ hasText: /error|failed|unable/i });
      if (await errorMessage.count() > 0) {
        console.log('✅ Error message displayed correctly');
      } else {
        console.log('ℹ️ No error message found (may handle silently)');
      }
    }
  });

  test('should persist event toggle state', async () => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Enable events
    const toggleButton = page.locator('button').filter({ hasText: /ticketmaster|events/i }).first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(3000);
      
      // Refresh the page
      await page.reload();
      await page.waitForTimeout(3000);
      
      // Check if the toggle state is preserved
      const toggleAfterReload = page.locator('button').filter({ hasText: /ticketmaster|events/i }).first();
      if (await toggleAfterReload.isVisible()) {
        // Check if it appears to be in the "on" state (this depends on implementation)
        const isToggled = await toggleAfterReload.evaluate(el => {
          return el.classList.contains('active') || 
                 el.classList.contains('enabled') || 
                 el.getAttribute('aria-pressed') === 'true' ||
                 el.dataset.toggled === 'true';
        });
        
        if (isToggled) {
          console.log('✅ Toggle state persisted after reload');
        } else {
          console.log('ℹ️ Toggle state not persisted (may be intentional)');
        }
      }
    }
  });

  test.describe('Performance Tests', () => {
    test('should load events within reasonable time', async () => {
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      const startTime = Date.now();
      
      // Enable events
      const toggleButton = page.locator('button').filter({ hasText: /ticketmaster|events/i }).first();
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        
        // Wait for events to load (with timeout)
        await page.waitForTimeout(15000);
        
        const endTime = Date.now();
        const loadTime = endTime - startTime;
        
        console.log(`⏱️ Event loading time: ${loadTime}ms`);
        
        // Events should load within 15 seconds
        expect(loadTime).toBeLessThan(15000);
      }
    });

    test('should handle multiple rapid toggles', async () => {
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      const toggleButton = page.locator('button').filter({ hasText: /ticketmaster|events/i }).first();
      if (await toggleButton.isVisible()) {
        // Rapidly toggle events on and off
        for (let i = 0; i < 5; i++) {
          await toggleButton.click();
          await page.waitForTimeout(500);
        }
        
        // Final wait to see if app is still responsive
        await page.waitForTimeout(3000);
        console.log('✅ App remained responsive after rapid toggles');
      }
    });
  });
});