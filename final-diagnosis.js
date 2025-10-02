import { chromium } from 'playwright';

async function finalDiagnosis() {
  console.log('🔍 FINAL COMPREHENSIVE EVENT MODAL DIAGNOSIS');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  const page = await context.newPage();
  
  // Enhanced console monitoring
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: Date.now()
    });
  });
  
  try {
    // Step 1: Navigate and wait for full load
    console.log('1️⃣ Loading application...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Step 2: Enable events
    console.log('2️⃣ Enabling events...');
    try {
      const eventsToggle = page.locator('button:has-text("Events")').first();
      const isPressed = await eventsToggle.getAttribute('aria-pressed');
      if (isPressed !== 'true') {
        await eventsToggle.click();
        await page.waitForTimeout(3000); // Wait longer for events to load
      }
    } catch (e) {
      console.log('   Events toggle not found or already enabled');
    }
    
    await page.screenshot({ path: 'test-results/final-01-events-enabled.png', fullPage: true });
    
    // Step 3: Analyze event markers in detail
    console.log('3️⃣ Analyzing event markers...');
    
    const markerAnalysis = await page.evaluate(() => {
      // Find all potential event markers
      const markerSelectors = [
        'div[style*="z-index: 40"]',
        'div[style*="zIndex: 40"]',
        '[data-testid*="event"]',
        '.event-marker'
      ];
      
      const results = [];
      
      markerSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);
          
          results.push({
            selector,
            index,
            bounds: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left,
              right: rect.right,
              bottom: rect.bottom
            },
            computed: {
              position: styles.position,
              zIndex: styles.zIndex,
              transform: styles.transform,
              display: styles.display,
              visibility: styles.visibility,
              opacity: styles.opacity
            },
            viewport: {
              windowWidth: window.innerWidth,
              windowHeight: window.innerHeight,
              isInViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth
            },
            element: {
              tagName: element.tagName,
              className: element.className,
              textContent: element.textContent?.substring(0, 50),
              hasOnClick: !!element.onclick,
              attributes: Array.from(element.attributes).map(attr => ({ name: attr.name, value: attr.value }))
            }
          });
        });
      });
      
      return results;
    });
    
    console.log(`Found ${markerAnalysis.length} potential event markers:`);
    
    let clickableMarkers = 0;
    markerAnalysis.forEach((marker, i) => {
      console.log(`\nMarker ${i + 1}:`);
      console.log(`  Selector: ${marker.selector}`);
      console.log(`  Position: (${marker.bounds.x.toFixed(1)}, ${marker.bounds.y.toFixed(1)})`);
      console.log(`  Size: ${marker.bounds.width.toFixed(1)} x ${marker.bounds.height.toFixed(1)}`);
      console.log(`  In viewport: ${marker.viewport.isInViewport}`);
      console.log(`  Z-index: ${marker.computed.zIndex}`);
      console.log(`  Display: ${marker.computed.display}`);
      console.log(`  Visibility: ${marker.computed.visibility}`);
      console.log(`  Opacity: ${marker.computed.opacity}`);
      console.log(`  Has onClick: ${marker.element.hasOnClick}`);
      
      if (marker.viewport.isInViewport && marker.computed.display !== 'none' && marker.computed.visibility !== 'hidden' && parseFloat(marker.computed.opacity) > 0) {
        clickableMarkers++;
      }
    });
    
    console.log(`\n📊 Summary: ${clickableMarkers} clickable markers out of ${markerAnalysis.length} total`);
    
    // Step 4: Test clicking on a visible marker
    if (clickableMarkers > 0) {
      console.log('4️⃣ Testing click on visible marker...');
      
      // Find the first clickable marker
      const visibleMarker = markerAnalysis.find(marker => 
        marker.viewport.isInViewport && 
        marker.computed.display !== 'none' && 
        marker.computed.visibility !== 'hidden' && 
        parseFloat(marker.computed.opacity) > 0
      );
      
      if (visibleMarker) {
        console.log(`   Attempting click on marker at (${visibleMarker.bounds.x}, ${visibleMarker.bounds.y})`);
        
        // Get initial modal state
        const initialState = await page.evaluate(() => {
          const windowObj = window;
          return {
            selectedEvent: windowObj.selectedEvent,
            showEventModal: windowObj.showEventModal,
            modalElements: document.querySelectorAll('[role="dialog"], .modal').length
          };
        });
        
        console.log('   Initial state:', initialState);
        
        // Click using coordinates to avoid viewport issues
        await page.mouse.click(
          visibleMarker.bounds.x + visibleMarker.bounds.width / 2,
          visibleMarker.bounds.y + visibleMarker.bounds.height / 2
        );
        
        await page.waitForTimeout(2000);
        
        // Check post-click state
        const postClickState = await page.evaluate(() => {
          const windowObj = window;
          const modals = document.querySelectorAll('[role="dialog"], .modal');
          
          return {
            selectedEvent: !!windowObj.selectedEvent,
            showEventModal: windowObj.showEventModal,
            modalElements: modals.length,
            visibleModals: Array.from(modals).filter(m => {
              const styles = window.getComputedStyle(m);
              return styles.display !== 'none' && styles.visibility !== 'hidden' && parseFloat(styles.opacity) > 0;
            }).length,
            modalDetails: Array.from(modals).map(m => ({
              display: window.getComputedStyle(m).display,
              visibility: window.getComputedStyle(m).visibility,
              opacity: window.getComputedStyle(m).opacity,
              content: m.textContent?.substring(0, 100)
            }))
          };
        });
        
        console.log('   Post-click state:', postClickState);
        
        await page.screenshot({ path: 'test-results/final-02-after-click.png', fullPage: true });
        
        // Final diagnosis
        if (postClickState.visibleModals > 0) {
          console.log('\n✅ SUCCESS: Event click works - modal is visible!');
          console.log('   The blank screen issue is RESOLVED');
          return {
            success: true,
            diagnosis: 'Event modal functionality is working correctly',
            details: {
              markersFound: markerAnalysis.length,
              clickableMarkers,
              modalTriggered: true,
              visibleModals: postClickState.visibleModals
            }
          };
        } else if (postClickState.selectedEvent) {
          console.log('\n⚠️ PARTIAL SUCCESS: Event state is set but modal not visible');
          console.log('   Issue: Modal component rendering problem');
          return {
            success: false,
            diagnosis: 'Modal state management works but rendering fails',
            details: {
              markersFound: markerAnalysis.length,
              clickableMarkers,
              stateTriggered: true,
              renderingIssue: true,
              modalDetails: postClickState.modalDetails
            }
          };
        } else {
          console.log('\n❌ FAILURE: Click did not trigger any state change');
          console.log('   Issue: Event handler not working');
          return {
            success: false,
            diagnosis: 'Event click handler is not functioning',
            details: {
              markersFound: markerAnalysis.length,
              clickableMarkers,
              handlerIssue: true
            }
          };
        }
      }
    } else {
      console.log('4️⃣ No clickable markers found');
      console.log('   Issue: Event markers are positioned outside viewport or invisible');
      
      return {
        success: false,
        diagnosis: 'Event markers are not properly positioned for interaction',
        details: {
          markersFound: markerAnalysis.length,
          clickableMarkers: 0,
          positioningIssue: true,
          markerDetails: markerAnalysis
        }
      };
    }
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    await page.screenshot({ path: 'test-results/final-error.png', fullPage: true });
    
    return {
      success: false,
      diagnosis: 'Test execution failed',
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

finalDiagnosis().then(result => {
  console.log('\n' + '='.repeat(60));
  console.log('🏁 FINAL DIAGNOSIS COMPLETE');
  console.log('='.repeat(60));
  
  console.log(`Status: ${result.success ? '✅ WORKING' : '❌ BROKEN'}`);
  console.log(`Issue: ${result.diagnosis}`);
  
  if (result.details) {
    console.log('\nDetails:');
    Object.entries(result.details).forEach(([key, value]) => {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    });
  }
  
  if (!result.success) {
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    
    if (result.details?.positioningIssue) {
      console.log('1. Fix OverlayView positioning in MapView.tsx');
      console.log('2. Ensure event coordinates are valid');
      console.log('3. Check Google Maps viewport and bounds');
      console.log('4. Verify OverlayView mapPaneName is correct');
    }
    
    if (result.details?.handlerIssue) {
      console.log('1. Check handleEventClick function implementation');
      console.log('2. Verify EventMarkerIcon onClick prop passing');
      console.log('3. Test event propagation and preventDefault');
    }
    
    if (result.details?.renderingIssue) {
      console.log('1. Check EventDetailModal conditional rendering logic');
      console.log('2. Verify modal CSS z-index and display properties');
      console.log('3. Check React state updates for selectedEvent and showEventModal');
    }
  }
  
  console.log('\n📸 Screenshots saved to test-results/ directory');
  console.log('='.repeat(60));
}).catch(error => {
  console.error('Diagnosis script failed:', error);
});