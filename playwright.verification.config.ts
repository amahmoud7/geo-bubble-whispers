import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/verification',
  fullyParallel: false, // Run tests sequentially for better error tracking
  forbidOnly: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'verification-report' }], 
    ['json', { outputFile: 'verification-results.json' }],
    ['line']
  ],
  
  use: {
    baseURL: 'http://localhost:8082',
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'Desktop Chrome - iOS Verification',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      },
    },
    {
      name: 'Mobile Safari - iOS Simulation',
      use: { 
        ...devices['iPhone 12'],
        launchOptions: {
          args: ['--disable-web-security']
        }
      },
    },
  ],

  // Don't start a web server - assume it's already running on 8082
  timeout: 60000,
});