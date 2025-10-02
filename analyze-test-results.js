import { chromium } from 'playwright';
import fs from 'fs';

async function analyzeTestResults() {
  console.log('🔍 Analyzing Event Modal Test Results...\n');
  
  // Check which screenshots were captured
  const testResultsDir = './test-results/';
  const files = fs.readdirSync(testResultsDir);
  
  console.log('📸 Screenshots captured:');
  files.filter(f => f.endsWith('.png')).forEach(file => {
    console.log(`  - ${file}`);
  });
  
  // Re-run a quick test to get the final result
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('\n🔍 Running quick verification...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Enable events
    try {
      const eventsToggle = page.locator('button:has-text("Events")').first();
      const isPressed = await eventsToggle.getAttribute('aria-pressed');
      if (isPressed !== 'true') {
        await eventsToggle.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('Events toggle handling skipped');
    }
    
    // Check for event markers
    const eventMarkers = await page.locator('div[style*="z-index: 40"], [class*="event"], [data-testid*="event"]').count();
    console.log(`📍 Event markers found: ${eventMarkers}`);
    
    if (eventMarkers > 0) {
      console.log('✅ Event markers are visible on the map');
      
      // Try to click first event marker
      const firstMarker = page.locator('div[style*="z-index: 40"]').first();
      
      // Get initial modal state
      const initialModalState = await page.evaluate(() => {
        const modals = document.querySelectorAll('[role="dialog"], .modal');
        return {
          modalCount: modals.length,
          visibleModals: Array.from(modals).filter(m => m.offsetParent !== null).length
        };
      });
      
      console.log(`🏠 Initial modal state: ${initialModalState.modalCount} total, ${initialModalState.visibleModals} visible`);
      
      // Click the event marker
      await firstMarker.click();
      await page.waitForTimeout(2000);
      
      // Check post-click state
      const postClickState = await page.evaluate(() => {
        const modals = document.querySelectorAll('[role="dialog"], .modal');
        const windowObj = window;
        
        return {
          modalCount: modals.length,
          visibleModals: Array.from(modals).filter(m => m.offsetParent !== null).length,
          selectedEvent: windowObj.selectedEvent || null,
          showEventModal: windowObj.showEventModal || null,
          modalContent: modals.length > 0 ? Array.from(modals).map(m => ({
            visible: m.offsetParent !== null,
            content: m.textContent?.substring(0, 100) + '...'
          })) : []
        };
      });
      
      console.log(`📦 Post-click modal state: ${postClickState.modalCount} total, ${postClickState.visibleModals} visible`);
      console.log(`🎯 Selected event exists: ${!!postClickState.selectedEvent}`);
      console.log(`🎯 Show event modal: ${postClickState.showEventModal}`);
      
      if (postClickState.visibleModals > 0) {
        console.log('✅ SUCCESS: Modal appeared after clicking event marker');
        console.log('📝 Modal content preview:');
        postClickState.modalContent.forEach((modal, i) => {
          if (modal.visible) {
            console.log(`  Modal ${i}: ${modal.content}`);
          }
        });
        
        return { 
          success: true, 
          issue: 'RESOLVED',
          details: 'Event click successfully opens modal'
        };
      } else if (postClickState.selectedEvent) {
        console.log('⚠️ PARTIAL SUCCESS: Event data is set but modal not visible');
        console.log('🔍 This suggests a rendering issue with the modal component');
        
        return {
          success: false,
          issue: 'MODAL_RENDERING_ISSUE',
          details: 'Event click sets state but modal does not render visibly'
        };
      } else {
        console.log('❌ FAILURE: Event click did not trigger any state change');
        console.log('🔍 This suggests the handleEventClick function is not working');
        
        return {
          success: false,
          issue: 'EVENT_HANDLER_ISSUE',
          details: 'Event click does not trigger handleEventClick or state update'
        };
      }
    } else {
      console.log('❌ No event markers found');
      
      // Check if events are loaded in the data
      const eventData = await page.evaluate(() => {
        const windowObj = window;
        return {
          events: windowObj.events || null,
          eventMessages: windowObj.eventMessages || null,
          hasEventElements: document.querySelectorAll('[class*="event"], [data-testid*="event"]').length
        };
      });
      
      console.log('📊 Event data check:', eventData);
      
      return {
        success: false,
        issue: 'NO_EVENT_MARKERS',
        details: 'Events may be loading but not rendering as clickable markers'
      };
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    return {
      success: false,
      issue: 'ANALYSIS_ERROR',
      details: error.message
    };
  } finally {
    await browser.close();
  }
}

analyzeTestResults().then(result => {
  console.log('\n' + '='.repeat(60));
  console.log('🏁 FINAL DIAGNOSIS:');
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log('✅ STATUS: Event modal functionality is WORKING');
    console.log('🎉 The blank screen issue appears to be resolved');
  } else {
    console.log('❌ STATUS: Event modal functionality has ISSUES');
    console.log(`🔍 ISSUE TYPE: ${result.issue}`);
    console.log(`📝 DETAILS: ${result.details}`);
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    
    switch (result.issue) {
      case 'NO_EVENT_MARKERS':
        console.log('1. Check event data loading in useEventMessages hook');
        console.log('2. Verify event marker rendering in MapView component');
        console.log('3. Check if events are being filtered out incorrectly');
        break;
        
      case 'EVENT_HANDLER_ISSUE':
        console.log('1. Check handleEventClick function in MapView.tsx');
        console.log('2. Verify event marker onClick handlers are properly bound');
        console.log('3. Check React event propagation and preventDefault calls');
        break;
        
      case 'MODAL_RENDERING_ISSUE':
        console.log('1. Check EventDetailModal component conditional rendering');
        console.log('2. Verify modal visibility CSS and z-index properties');
        console.log('3. Check React state management for selectedEvent and showEventModal');
        break;
        
      default:
        console.log('1. Review browser console errors during event interaction');
        console.log('2. Check React DevTools for component state issues');
        console.log('3. Verify event flow from click to modal display');
    }
  }
  
  console.log('\n📸 Check the screenshots in test-results/ for visual confirmation');
  console.log('='.repeat(60));
}).catch(error => {
  console.error('Failed to analyze results:', error);
});