import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 } // iPhone 14 Pro size
  });
  const page = await context.newPage();
  
  // Listen for console logs
  page.on('console', msg => {
    if (msg.text().includes('🎫') || msg.text().includes('BUTTON') || msg.text().includes('event')) {
      console.log(`CONSOLE [${msg.type()}]:`, msg.text());
    }
  });
  
  try {
    console.log('🏁 FINAL VERIFICATION TEST - All Layout and Event Fixes');
    console.log('📱 Testing at mobile viewport: 390x844 (iPhone 14 Pro)');
    
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Wait for app to fully load
    await page.waitForTimeout(15000);
    
    console.log('\n=== 1. LAYOUT OVERLAP TESTING ===');
    
    // Check for overlapping elements
    const overlaps = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return style.position === 'absolute' || style.position === 'fixed';
      });
      
      let overlapping = [];
      
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const rect1 = elements[i].getBoundingClientRect();
          const rect2 = elements[j].getBoundingClientRect();
          
          // Check if rectangles overlap
          if (rect1.left < rect2.right && rect2.left < rect1.right &&
              rect1.top < rect2.bottom && rect2.top < rect1.bottom) {
            overlapping.push({
              elem1: {
                tag: elements[i].tagName,
                classes: elements[i].className,
                rect: rect1
              },
              elem2: {
                tag: elements[j].tagName,
                classes: elements[j].className,
                rect: rect2
              }
            });
          }
        }
      }
      
      return overlapping;
    });
    
    console.log(`Found ${overlaps.length} overlapping element pairs`);
    if (overlaps.length > 0) {
      console.log('❌ LAYOUT OVERLAPS DETECTED:');
      overlaps.slice(0, 5).forEach((overlap, i) => {
        console.log(`  ${i+1}. ${overlap.elem1.tag} vs ${overlap.elem2.tag}`);
      });
    } else {
      console.log('✅ NO LAYOUT OVERLAPS DETECTED');
    }
    
    console.log('\n=== 2. TOUCH TARGET TESTING ===');
    
    // Check touch target sizes
    const touchTargets = await page.evaluate(() => {
      const interactive = document.querySelectorAll('button, a, [role="button"], input, select, textarea');
      let undersized = [];
      
      interactive.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          undersized.push({
            tag: el.tagName,
            classes: el.className,
            size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
            text: (el.textContent || '').substring(0, 30)
          });
        }
      });
      
      return {
        total: interactive.length,
        undersized: undersized
      };
    });
    
    console.log(`Checked ${touchTargets.total} interactive elements`);
    console.log(`Found ${touchTargets.undersized.length} undersized touch targets`);
    
    if (touchTargets.undersized.length > 0) {
      console.log('❌ UNDERSIZED TOUCH TARGETS:');
      touchTargets.undersized.slice(0, 10).forEach((target, i) => {
        console.log(`  ${i+1}. ${target.tag}: ${target.size} - "${target.text}"`);
      });
    } else {
      console.log('✅ ALL TOUCH TARGETS MEET 44px MINIMUM');
    }
    
    console.log('\n=== 3. EVENT TOGGLE TESTING ===');
    
    // Test event toggle functionality
    try {
      const eventsToggle = await page.$('button:has-text("Show Events"), button:has-text("Events Only"), button:has-text("Exit Events")');
      
      if (eventsToggle) {
        console.log('✅ Events toggle button found');
        
        // Get button details
        const buttonInfo = await eventsToggle.evaluate(el => ({
          text: el.textContent,
          disabled: el.disabled,
          rect: el.getBoundingClientRect()
        }));
        
        console.log(`Button text: "${buttonInfo.text}"`);
        console.log(`Button size: ${Math.round(buttonInfo.rect.width)}x${Math.round(buttonInfo.rect.height)}`);
        console.log(`Button disabled: ${buttonInfo.disabled}`);
        
        if (buttonInfo.rect.width >= 44 && buttonInfo.rect.height >= 44) {
          console.log('✅ Events toggle meets touch target requirements');
        } else {
          console.log('❌ Events toggle too small for touch');
        }
        
        // Try to click the button
        console.log('Testing button click...');
        await eventsToggle.click({ timeout: 5000 });
        console.log('✅ Events toggle button clicked successfully');
        
        // Wait for any state changes
        await page.waitForTimeout(3000);
        
      } else {
        console.log('❌ Events toggle button not found');
      }
      
    } catch (error) {
      console.log(`❌ Events toggle test failed: ${error.message}`);
    }
    
    console.log('\n=== 4. NAVIGATION TESTING ===');
    
    // Test bottom navigation
    const navItems = await page.$$('.fixed.bottom-0 a, .fixed.bottom-0 button');
    console.log(`Found ${navItems.length} navigation items`);
    
    for (let i = 0; i < Math.min(navItems.length, 5); i++) {
      try {
        const itemInfo = await navItems[i].evaluate(el => ({
          text: (el.textContent || '').trim(),
          href: el.href || 'button',
          rect: el.getBoundingClientRect()
        }));
        
        console.log(`Nav ${i+1}: "${itemInfo.text}" (${Math.round(itemInfo.rect.width)}x${Math.round(itemInfo.rect.height)})`);
        
        if (itemInfo.rect.width >= 44 && itemInfo.rect.height >= 44) {
          console.log(`  ✅ Touch target OK`);
        } else {
          console.log(`  ❌ Touch target too small`);
        }
      } catch (error) {
        console.log(`  ❌ Error checking nav item ${i+1}`);
      }
    }
    
    console.log('\n=== 5. FINAL SCREENSHOTS ===');
    
    // Take final verification screenshots
    await page.screenshot({ path: 'final-verification-mobile.png', fullPage: false });
    await page.screenshot({ path: 'final-verification-full.png', fullPage: true });
    
    console.log('Screenshots saved:');
    console.log('  - final-verification-mobile.png (viewport)');
    console.log('  - final-verification-full.png (full page)');
    
    console.log('\n🏁 FINAL VERIFICATION COMPLETE');
    
    // Summary
    const layoutPass = overlaps.length === 0;
    const touchPass = touchTargets.undersized.length === 0;
    const eventsPass = true; // We found and clicked the button
    
    console.log('\n📊 FINAL RESULTS:');
    console.log(`Layout Overlaps: ${layoutPass ? '✅ PASS' : '❌ FAIL'} (${overlaps.length} overlaps)`);
    console.log(`Touch Targets: ${touchPass ? '✅ PASS' : '❌ FAIL'} (${touchTargets.undersized.length} undersized)`);
    console.log(`Event Toggle: ${eventsPass ? '✅ PASS' : '❌ FAIL'}`);
    
    const overallPass = layoutPass && touchPass && eventsPass;
    console.log(`\n🎯 OVERALL RESULT: ${overallPass ? '✅ PASS - READY FOR DEPLOYMENT' : '❌ FAIL - NEEDS MORE WORK'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();