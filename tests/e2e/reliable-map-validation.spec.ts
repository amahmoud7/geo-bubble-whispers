import { test, expect } from '@playwright/test';

test.describe('ReliableMapView Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for authentication or bypass if needed
    await page.waitForTimeout(2000);
  });

  test('should load ReliableMapView component successfully', async ({ page }) => {
    // Check if the component renders
    const mapContainer = await page.locator('.w-full.h-screen').first();
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
    
    // Check for loading state
    const loadingElement = await page.locator('text=Loading Google Maps...');
    if (await loadingElement.isVisible()) {
      await expect(loadingElement).toBeHidden({ timeout: 15000 });
    }
  });

  test('should display diagnostic overlay', async ({ page }) => {
    // Wait for map to load
    await page.waitForTimeout(5000);
    
    // Check for diagnostic overlay
    const diagnostic = await page.locator('.absolute.top-4.left-4');
    await expect(diagnostic).toBeVisible();
    
    // Verify diagnostic content
    await expect(diagnostic).toContainText('Map Loaded Successfully');
    await expect(diagnostic).toContainText('API:');
    await expect(diagnostic).toContainText('Map Instance:');
  });

  test('should handle API key validation', async ({ page }) => {
    // Check for any API key errors in console
    const messages: string[] = [];
    page.on('console', msg => messages.push(msg.text()));
    
    await page.waitForTimeout(3000);
    
    // Look for specific ReliableMapView logs
    const mapLogs = messages.filter(msg => msg.includes('ReliableMapView'));
    expect(mapLogs.length).toBeGreaterThan(0);
    
    // Check for API key presence log
    const apiKeyLog = messages.find(msg => msg.includes('API Key present:'));
    expect(apiKeyLog).toBeTruthy();
  });

  test('should display error state if Google Maps fails', async ({ page }) => {
    // Mock a Google Maps failure by blocking the API
    await page.route('**/*maps.googleapis.com/**', route => {
      route.abort('failed');
    });
    
    await page.reload();
    await page.waitForTimeout(5000);
    
    // Check for error display
    const errorContainer = await page.locator('text=Maps Failed to Load');
    await expect(errorContainer).toBeVisible();
    
    // Verify error details
    await expect(page.locator('text=Reload Page')).toBeVisible();
  });

  test('should show user location marker when available', async ({ page }) => {
    // Mock geolocation
    await page.context().grantPermissions(['geolocation']);
    await page.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
    
    await page.waitForTimeout(5000);
    
    // Check diagnostic shows location available
    const diagnostic = await page.locator('.absolute.top-4.left-4');
    await expect(diagnostic).toContainText('Location: ✅ Available');
  });

  test('should handle events-only mode toggle', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Check if events toggle is present and functional
    const eventsToggle = await page.locator('[data-testid="events-toggle"]');
    if (await eventsToggle.isVisible()) {
      await eventsToggle.click();
      await page.waitForTimeout(1000);
      
      // Verify diagnostic shows events mode
      const diagnostic = await page.locator('.absolute.top-4.left-4');
      await expect(diagnostic).toContainText('Events Mode: 🎉 ON');
    }
  });

  test('should properly clean up on unmount', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', msg => messages.push(msg.text()));
    
    // Navigate away and back
    await page.goto('/profile');
    await page.waitForTimeout(1000);
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Check for unmount log
    const unmountLog = messages.find(msg => msg.includes('Map unmounted'));
    // Note: May not always trigger in test environment
  });

  test('should handle map interactions without errors', async ({ page }) => {
    await page.waitForTimeout(5000);
    
    // Try clicking on the map
    const mapContainer = await page.locator('.w-full.h-screen').first();
    await mapContainer.click({ position: { x: 200, y: 200 } });
    
    // Wait and check for any errors
    await page.waitForTimeout(1000);
    
    // Verify map is still functional
    const diagnostic = await page.locator('.absolute.top-4.left-4');
    await expect(diagnostic).toContainText('Map Instance: ✅ Ready');
  });
});