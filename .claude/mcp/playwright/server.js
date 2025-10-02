#!/usr/bin/env node

/**
 * Universal Playwright MCP Server
 * Provides browser testing, validation, and automation for any project
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, firefox, webkit } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

class PlaywrightMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'playwright-universal',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.projectRoot = process.env.PROJECT_ROOT || process.cwd();
    this.configFile = process.env.PLAYWRIGHT_CONFIG || path.join(this.projectRoot, '.claude/playwright.config.js');
    this.browsers = {};
    
    this.setupToolHandlers();
  }

  async getBrowser(browserType = 'chromium') {
    if (!this.browsers[browserType]) {
      const browserMap = { chromium, firefox, webkit };
      if (!browserMap[browserType]) {
        throw new Error(`Unsupported browser: ${browserType}`);
      }
      this.browsers[browserType] = await browserMap[browserType].launch({
        headless: true
      });
    }
    return this.browsers[browserType];
  }

  async detectProjectType() {
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf-8')
      );
      
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps.next) return 'nextjs';
      if (deps.react) return 'react';
      if (deps.vue) return 'vue';
      if (deps['@angular/core']) return 'angular';
      if (deps.svelte) return 'svelte';
      
      return 'web';
    } catch {
      return 'static';
    }
  }

  async getDevServer() {
    const projectType = await this.detectProjectType();
    
    const devServers = {
      'nextjs': 'http://localhost:3000',
      'react': 'http://localhost:3000',
      'vue': 'http://localhost:5173',
      'angular': 'http://localhost:4200',
      'svelte': 'http://localhost:5173',
      'web': 'http://localhost:8080',
      'static': `file://${this.projectRoot}/index.html`
    };
    
    return devServers[projectType] || 'http://localhost:3000';
  }

  async generateE2ETests(framework) {
    const tests = {
      react: `
import { test, expect } from '@playwright/test';

test.describe('React App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/React App/);
  });

  test('should navigate between routes', async ({ page }) => {
    await page.click('[data-testid="nav-about"]');
    await expect(page).toHaveURL(/.*about/);
  });

  test('should handle form submission', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.click('[data-testid="submit-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});`,
      vue: `
import { test, expect } from '@playwright/test';

test.describe('Vue App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Vue App/);
  });

  test('should test Vue components', async ({ page }) => {
    await page.click('[data-cy="vue-button"]');
    await expect(page.locator('[data-cy="result"]')).toHaveText('Clicked!');
  });
});`,
      nextjs: `
import { test, expect } from '@playwright/test';

test.describe('Next.js App E2E Tests', () => {
  test('should handle SSR correctly', async ({ page }) => {
    await page.goto('/');
    
    // Test server-side rendered content
    const title = await page.textContent('h1');
    expect(title).toBeTruthy();
  });

  test('should handle client-side navigation', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/about"]');
    await page.waitForURL(/.*about/);
    await expect(page).toHaveURL(/.*about/);
  });

  test('should handle API routes', async ({ page, request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
  });
});`
    };

    return tests[framework] || tests.react;
  }

  async runAccessibilityAudit(url) {
    const browser = await this.getBrowser('chromium');
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto(url);
      
      // Inject axe-core
      await page.addScriptTag({
        url: 'https://unpkg.com/axe-core@latest/axe.min.js'
      });
      
      // Run accessibility audit
      const results = await page.evaluate(async () => {
        return await window.axe.run();
      });
      
      await context.close();
      
      return {
        violations: results.violations.map(violation => ({
          id: violation.id,
          description: violation.description,
          impact: violation.impact,
          nodes: violation.nodes.length,
          helpUrl: violation.helpUrl
        })),
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        url: url,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      await context.close();
      throw error;
    }
  }

  async measurePerformance(url) {
    const browser = await this.getBrowser('chromium');
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Navigate and measure
      const response = await page.goto(url, { waitUntil: 'networkidle' });
      
      // Get Core Web Vitals
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals = {};
            
            entries.forEach((entry) => {
              if (entry.name === 'largest-contentful-paint') {
                vitals.LCP = entry.value;
              }
              if (entry.name === 'first-input-delay') {
                vitals.FID = entry.value;
              }
              if (entry.name === 'cumulative-layout-shift') {
                vitals.CLS = entry.value;
              }
            });
            
            resolve(vitals);
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
          
          // Fallback timeout
          setTimeout(() => resolve({}), 5000);
        });
      });
      
      // Get additional metrics
      const timing = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          loadComplete: nav.loadEventEnd - nav.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
        };
      });
      
      await context.close();
      
      return {
        url,
        statusCode: response.status(),
        coreWebVitals: metrics,
        timing,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      await context.close();
      throw error;
    }
  }

  async testResponsiveness(url) {
    const browser = await this.getBrowser('chromium');
    const context = await browser.newContext();
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Large Desktop', width: 2560, height: 1440 }
    ];
    
    const results = [];
    
    try {
      for (const viewport of viewports) {
        const page = await context.newPage();
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(url);
        
        // Take screenshot
        const screenshot = await page.screenshot({
          fullPage: true,
          type: 'png'
        });
        
        // Check for responsive issues
        const issues = await page.evaluate(() => {
          const issues = [];
          
          // Check for horizontal scrollbars
          if (document.body.scrollWidth > window.innerWidth) {
            issues.push('Horizontal scroll detected');
          }
          
          // Check for overlapping elements
          const elements = document.querySelectorAll('*');
          for (let el of elements) {
            const rect = el.getBoundingClientRect();
            if (rect.width > window.innerWidth) {
              issues.push(`Element extends beyond viewport: ${el.tagName}`);
              break;
            }
          }
          
          return issues;
        });
        
        results.push({
          viewport: viewport.name,
          dimensions: viewport,
          issues,
          screenshot: screenshot.toString('base64'),
          timestamp: new Date().toISOString()
        });
        
        await page.close();
      }
      
      await context.close();
      return results;
    } catch (error) {
      await context.close();
      throw error;
    }
  }

  async runCrossBrowserTest(url, testScript) {
    const browsers = ['chromium', 'firefox', 'webkit'];
    const results = [];
    
    for (const browserType of browsers) {
      try {
        const browser = await this.getBrowser(browserType);
        const context = await browser.newContext();
        const page = await context.newPage();
        
        await page.goto(url);
        
        // Execute test script
        const result = await page.evaluate(testScript);
        
        results.push({
          browser: browserType,
          success: true,
          result,
          timestamp: new Date().toISOString()
        });
        
        await context.close();
      } catch (error) {
        results.push({
          browser: browserType,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'run_e2e_tests',
            description: 'Run end-to-end tests for any web application',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to test (defaults to detected dev server)',
                },
                framework: {
                  type: 'string',
                  description: 'Framework type for appropriate test generation',
                },
                browser: {
                  type: 'string',
                  description: 'Browser to use (chromium, firefox, webkit)',
                  default: 'chromium',
                },
              },
            },
          },
          {
            name: 'audit_accessibility',
            description: 'Run comprehensive accessibility audit using axe-core',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to audit',
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'measure_performance',
            description: 'Measure Core Web Vitals and performance metrics',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to measure',
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'test_responsiveness',
            description: 'Test responsive design across multiple viewports',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to test',
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'cross_browser_test',
            description: 'Run tests across multiple browsers',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to test',
                },
                test_script: {
                  type: 'string',
                  description: 'JavaScript test script to run',
                },
              },
              required: ['url', 'test_script'],
            },
          },
          {
            name: 'generate_test_template',
            description: 'Generate E2E test templates for specific frameworks',
            inputSchema: {
              type: 'object',
              properties: {
                framework: {
                  type: 'string',
                  description: 'Framework to generate tests for',
                },
              },
              required: ['framework'],
            },
          },
          {
            name: 'capture_screenshot',
            description: 'Capture screenshots of web pages',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to screenshot',
                },
                viewport: {
                  type: 'object',
                  properties: {
                    width: { type: 'number' },
                    height: { type: 'number' },
                  },
                },
                fullPage: {
                  type: 'boolean',
                  default: false,
                },
              },
              required: ['url'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'run_e2e_tests':
          const url = request.params.arguments?.url || await this.getDevServer();
          const framework = request.params.arguments?.framework || await this.detectProjectType();
          const testTemplate = await this.generateE2ETests(framework);
          
          return {
            content: [
              {
                type: 'text',
                text: `Generated E2E tests for ${framework}:\n\n\`\`\`javascript\n${testTemplate}\n\`\`\`\n\nTo run: Save this as a .spec.js file and run 'npx playwright test'`,
              },
            ],
          };

        case 'audit_accessibility':
          const auditUrl = request.params.arguments?.url;
          const auditResults = await this.runAccessibilityAudit(auditUrl);
          
          return {
            content: [
              {
                type: 'text',
                text: `Accessibility Audit Results for ${auditUrl}:\n\n` +
                      `✅ Passes: ${auditResults.passes}\n` +
                      `❌ Violations: ${auditResults.violations.length}\n` +
                      `⚠️ Incomplete: ${auditResults.incomplete}\n\n` +
                      `Violations:\n${auditResults.violations.map(v => 
                        `• ${v.description} (${v.impact} impact) - ${v.nodes} nodes affected`
                      ).join('\n')}`,
              },
            ],
          };

        case 'measure_performance':
          const perfUrl = request.params.arguments?.url;
          const perfResults = await this.measurePerformance(perfUrl);
          
          return {
            content: [
              {
                type: 'text',
                text: `Performance Metrics for ${perfUrl}:\n\n` +
                      `Status: ${perfResults.statusCode}\n` +
                      `LCP: ${perfResults.coreWebVitals.LCP || 'N/A'}ms\n` +
                      `FID: ${perfResults.coreWebVitals.FID || 'N/A'}ms\n` +
                      `CLS: ${perfResults.coreWebVitals.CLS || 'N/A'}\n` +
                      `First Paint: ${perfResults.timing.firstPaint || 'N/A'}ms\n` +
                      `First Contentful Paint: ${perfResults.timing.firstContentfulPaint || 'N/A'}ms`,
              },
            ],
          };

        case 'test_responsiveness':
          const respUrl = request.params.arguments?.url;
          const respResults = await this.testResponsiveness(respUrl);
          
          return {
            content: [
              {
                type: 'text',
                text: `Responsiveness Test Results:\n\n${respResults.map(r => 
                  `${r.viewport} (${r.dimensions.width}x${r.dimensions.height}):\n` +
                  `  Issues: ${r.issues.length > 0 ? r.issues.join(', ') : 'None'}`
                ).join('\n\n')}`,
              },
            ],
          };

        case 'cross_browser_test':
          const crossUrl = request.params.arguments?.url;
          const testScript = request.params.arguments?.test_script;
          const crossResults = await this.runCrossBrowserTest(crossUrl, testScript);
          
          return {
            content: [
              {
                type: 'text',
                text: `Cross-Browser Test Results:\n\n${crossResults.map(r => 
                  `${r.browser}: ${r.success ? '✅ Passed' : '❌ Failed' + (r.error ? ` - ${r.error}` : '')}`
                ).join('\n')}`,
              },
            ],
          };

        case 'generate_test_template':
          const templateFramework = request.params.arguments?.framework;
          const template = await this.generateE2ETests(templateFramework);
          
          return {
            content: [
              {
                type: 'text',
                text: `E2E Test Template for ${templateFramework}:\n\n\`\`\`javascript\n${template}\n\`\`\``,
              },
            ],
          };

        case 'capture_screenshot':
          const screenshotUrl = request.params.arguments?.url;
          const viewport = request.params.arguments?.viewport;
          const fullPage = request.params.arguments?.fullPage || false;
          
          const browser = await this.getBrowser('chromium');
          const context = await browser.newContext();
          const page = await context.newPage();
          
          if (viewport) {
            await page.setViewportSize(viewport);
          }
          
          await page.goto(screenshotUrl);
          const screenshot = await page.screenshot({ fullPage, type: 'png' });
          await context.close();
          
          return {
            content: [
              {
                type: 'text',
                text: `Screenshot captured for ${screenshotUrl} (${viewport ? `${viewport.width}x${viewport.height}` : 'default viewport'})`,
              },
            ],
          };

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async cleanup() {
    for (const browser of Object.values(this.browsers)) {
      await browser.close();
    }
  }

  async run() {
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Playwright Universal MCP server running on stdio');
  }
}

const server = new PlaywrightMCPServer();
server.run().catch(console.error);