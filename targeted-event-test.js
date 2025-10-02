// Targeted Event Modal and Layout Issue Investigation
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:8083';
const SCREENSHOT_DIR = './test-results';

async function investigateEventModal() {
  console.log('🔍 Investigating Event Modal Functionality...\n');
  
  const browser = await chromium.launch({ headless: false }); // Show browser for debugging
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to home page
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    console.log('✅ Page loaded, taking screenshot...');
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'debug-homepage.png'),
      fullPage: true 
    });
    
    // Log all available buttons on the page
    const buttons = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button, [role="button"]'));
      return allButtons.map((btn, index) => ({
        index,
        text: btn.textContent?.trim().substring(0, 50) || '',
        className: btn.className,
        id: btn.id,
        dataTestId: btn.getAttribute('data-testid'),
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
      })).filter(btn => btn.visible);
    });
    
    console.log('📋 Found buttons on page:');
    buttons.forEach(btn => {
      console.log(`  ${btn.index}: "${btn.text}" | class: "${btn.className.substring(0, 50)}..." | testId: ${btn.dataTestId}`);
    });
    
    // Look specifically for events-related buttons
    const eventsButtons = buttons.filter(btn => 
      btn.text.toLowerCase().includes('event') ||
      btn.className.toLowerCase().includes('event') ||
      btn.dataTestId?.toLowerCase().includes('event')
    );
    
    console.log('\n🎯 Events-related buttons found:');
    eventsButtons.forEach(btn => {
      console.log(`  "${btn.text}" | class: "${btn.className}"`);
    });
    
    // Try different selectors for events toggle
    const eventSelectors = [
      '[data-testid="events-toggle"]',
      '.events-toggle',
      'button:has-text("Events")',
      'button:has-text("Show Events")',
      '[class*="event"]',
      '.real-time-events-button',
      '.ticketmaster-toggle'
    ];
    
    console.log('\n🔎 Testing event selectors...');
    for (const selector of eventSelectors) {
      try {
        const element = await page.locator(selector).first();
        const count = await page.locator(selector).count();
        const visible = await element.isVisible().catch(() => false);
        console.log(`  ${selector}: found ${count}, visible: ${visible}`);
        
        if (visible) {
          const text = await element.textContent().catch(() => '');
          console.log(`    Text: "${text}"`);
          
          // Try clicking it
          await element.click();
          await page.waitForTimeout(2000);
          console.log(`    ✅ Clicked successfully!`);
          
          // Look for event markers after clicking
          const eventMarkers = await page.evaluate(() => {
            const markers = Array.from(document.querySelectorAll('[class*="marker"], [class*="pin"], [class*="event"]'));
            return markers.filter(m => m.offsetWidth > 0 && m.offsetHeight > 0).length;
          });
          
          console.log(`    Found ${eventMarkers} potential event markers`);
          
          await page.screenshot({ 
            path: path.join(SCREENSHOT_DIR, `debug-after-events-click.png`),
            fullPage: true 
          });
          
          break;
        }
      } catch (error) {
        console.log(`  ${selector}: error - ${error.message.substring(0, 50)}...`);
      }
    }
    
    // Check for overlapping elements specifically
    console.log('\n📐 Checking for layout overlaps...');
    const overlaps = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, input, a, [role="button"]'))
        .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0)
        .map(el => {
          const rect = el.getBoundingClientRect();
          return {
            element: el,
            rect: rect,
            tag: el.tagName.toLowerCase(),
            text: el.textContent?.substring(0, 20) || '',
            className: el.className.substring(0, 30) + '...'
          };
        });
      
      const overlapping = [];
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const el1 = elements[i];
          const el2 = elements[j];
          
          // Check if rectangles overlap
          const overlap = !(el1.rect.right <= el2.rect.left || 
                           el2.rect.right <= el1.rect.left || 
                           el1.rect.bottom <= el2.rect.top || 
                           el2.rect.bottom <= el1.rect.top);
          
          if (overlap) {
            overlapping.push({
              el1: `${el1.tag} "${el1.text}" (${el1.className})`,
              el2: `${el2.tag} "${el2.text}" (${el2.className})`,
              el1Rect: `${Math.round(el1.rect.x)},${Math.round(el1.rect.y)} ${Math.round(el1.rect.width)}x${Math.round(el1.rect.height)}`,
              el2Rect: `${Math.round(el2.rect.x)},${Math.round(el2.rect.y)} ${Math.round(el2.rect.width)}x${Math.round(el2.rect.height)}`
            });
          }
        }
      }
      
      return overlapping.slice(0, 5); // Limit to first 5 overlaps
    });
    
    if (overlaps.length > 0) {
      console.log('⚠️  Found overlapping elements:');
      overlaps.forEach((overlap, i) => {
        console.log(`  ${i + 1}. ${overlap.el1} [${overlap.el1Rect}]`);
        console.log(`     OVERLAPS ${overlap.el2} [${overlap.el2Rect}]`);
      });
    } else {
      console.log('✅ No overlapping elements found');
    }
    
    // Check for glass effects
    console.log('\n🔮 Checking glass effects...');
    const glassInfo = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      let backdropBlurCount = 0;
      let glassClassCount = 0;
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.backdropFilter && style.backdropFilter !== 'none') {
          backdropBlurCount++;
        }
        if (el.className && (el.className.includes('glass') || el.className.includes('backdrop-blur'))) {
          glassClassCount++;
        }
      });
      
      return { backdropBlurCount, glassClassCount };
    });
    
    console.log(`  Elements with backdrop-filter: ${glassInfo.backdropBlurCount}`);
    console.log(`  Elements with glass classes: ${glassInfo.glassClassCount}`);
    
    // Test navigation
    console.log('\n🧭 Testing navigation...');
    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, [role="button"]'));
      return links.map(link => ({
        href: link.getAttribute('href'),
        text: link.textContent?.trim().substring(0, 20) || '',
        visible: link.offsetWidth > 0 && link.offsetHeight > 0
      })).filter(link => link.visible && link.href);
    });
    
    console.log('  Available navigation links:');
    navLinks.forEach(link => {
      console.log(`    "${link.text}" -> ${link.href}`);
    });
    
  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  }
  
  await context.close();
  await browser.close();
}

// Run the investigation
investigateEventModal().catch(console.error);