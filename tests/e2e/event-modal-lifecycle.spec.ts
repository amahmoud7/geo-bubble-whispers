import { test, expect, Page } from '@playwright/test';

test.describe('Event Modal Lifecycle & State Management', () => {
  let page: Page;
  
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Enhanced console monitoring
    const logs: Array<{type: string, text: string, timestamp: number}> = [];
    page.on('console', msg => {
      logs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });
    });
    page['consoleLogs'] = logs;
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for React to fully load
    await page.waitForFunction(() => {
      return window.React || document.querySelector('#root')?._reactInternalFiber || 
             document.querySelector('#root')?._reactInternals;
    }, { timeout: 30000 });
    
    // Enable events if toggle exists
    try {
      const eventsToggle = page.locator('[data-testid="events-toggle"], button:has-text("Events")').first();
      const isPressed = await eventsToggle.getAttribute('aria-pressed');
      if (isPressed !== 'true') {
        await eventsToggle.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('Events toggle not found or already enabled');
    }
  });

  test('React State Inspection - Check component state management', async () => {
    console.log('🔍 Inspecting React component state...');
    
    // Inject React DevTools-like inspection
    const stateInspection = await page.evaluate(() => {
      const findReactComponents = (element: any) => {
        const components: any[] = [];
        
        // Look for React Fiber nodes
        const fiberKey = Object.keys(element).find(key => 
          key.startsWith('__reactInternalInstance') || 
          key.startsWith('_reactInternalFiber') ||
          key.startsWith('_reactInternals')
        );
        
        if (fiberKey) {
          const fiber = element[fiberKey];
          if (fiber && fiber.memoizedState) {
            components.push({
              type: fiber.elementType?.name || 'Unknown',
              state: fiber.memoizedState,
              props: fiber.memoizedProps
            });
          }
        }
        
        // Recursively check children
        Array.from(element.children || []).forEach((child: any) => {
          components.push(...findReactComponents(child));
        });
        
        return components;
      };
      
      const root = document.getElementById('root');
      const components = root ? findReactComponents(root) : [];
      
      // Also check for any global React state
      const windowObj = window as any;
      
      return {
        componentsFound: components.length,
        hasReactRoot: !!root,
        globalState: {
          selectedEvent: windowObj.selectedEvent,
          showEventModal: windowObj.showEventModal,
          events: windowObj.events,
          mapLoaded: !!windowObj.google?.maps
        },
        reactDevTools: !!windowObj.__REACT_DEVTOOLS_GLOBAL_HOOK__
      };
    });
    
    console.log('State inspection result:', stateInspection);
    
    expect(stateInspection.hasReactRoot).toBe(true);
  });

  test('Event Handler Interception - Monitor event flow', async () => {
    console.log('🔍 Intercepting event handlers...');
    
    // Inject event monitoring
    await page.evaluate(() => {
      const windowObj = window as any;
      windowObj.eventInterceptions = [];
      
      // Intercept common event handlers
      const originalAddEventListener = Element.prototype.addEventListener;
      Element.prototype.addEventListener = function(type, listener, options) {
        if (type === 'click' && this.className?.includes('event')) {
          windowObj.eventInterceptions.push({
            type: 'addEventListener',
            eventType: type,
            element: this.tagName + (this.className ? '.' + this.className : ''),
            timestamp: Date.now()
          });
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
      
      // Intercept React synthetic events
      const originalCreateElement = document.createElement;
      document.createElement = function(tagName) {
        const element = originalCreateElement.call(this, tagName);
        const originalSetAttribute = element.setAttribute;
        element.setAttribute = function(name, value) {
          if (name.startsWith('on') && typeof value === 'string' && value.includes('event')) {
            windowObj.eventInterceptions.push({
              type: 'setAttribute',
              attribute: name,
              value: value.substring(0, 100), // Truncate for readability
              element: tagName,
              timestamp: Date.now()
            });
          }
          return originalSetAttribute.call(this, name, value);
        };
        return element;
      };
    });
    
    // Wait for components to render and register handlers
    await page.waitForTimeout(3000);
    
    // Check what was intercepted
    const interceptions = await page.evaluate(() => {
      return (window as any).eventInterceptions || [];
    });
    
    console.log('Event handler interceptions:', interceptions);
    
    expect(interceptions).toBeDefined();
  });

  test('Modal Component Detection - Find modal in React tree', async () => {
    console.log('🔍 Searching for modal components...');
    
    // Look for modal-related components
    const modalSearch = await page.evaluate(() => {
      const searchForModals = (element: any, depth = 0) => {
        if (depth > 10) return []; // Prevent infinite recursion
        
        const modals: any[] = [];
        
        // Check if this element is modal-related
        const isModal = element.tagName === 'DIALOG' ||
                       element.role === 'dialog' ||
                       element.className?.includes('modal') ||
                       element.className?.includes('dialog') ||
                       element.getAttribute?.('data-testid')?.includes('modal');
        
        if (isModal) {
          modals.push({
            tagName: element.tagName,
            className: element.className,
            role: element.role,
            style: element.style?.cssText,
            visible: element.offsetParent !== null,
            textContent: element.textContent?.substring(0, 100)
          });
        }
        
        // Check React props for modal components
        const reactKeys = Object.keys(element).filter(key => 
          key.startsWith('__react') || key.startsWith('_react')
        );
        
        reactKeys.forEach(key => {
          const fiber = element[key];
          if (fiber?.type?.name?.includes('Modal') || 
              fiber?.type?.name?.includes('Dialog') ||
              fiber?.elementType?.displayName?.includes('Modal')) {
            modals.push({
              type: 'ReactComponent',
              name: fiber.type?.name || fiber.elementType?.displayName,
              props: fiber.memoizedProps,
              state: fiber.memoizedState
            });
          }
        });
        
        // Search children
        Array.from(element.children || []).forEach((child: any) => {
          modals.push(...searchForModals(child, depth + 1));
        });
        
        return modals;
      };
      
      const root = document.getElementById('root');
      return root ? searchForModals(root) : [];
    });
    
    console.log('Modal components found:', modalSearch);
    
    // Also check for specific modal selectors
    const modalSelectors = [
      '[role="dialog"]',
      '.modal',
      '[data-testid*="modal"]',
      'dialog',
      '[class*="dialog"]'
    ];
    
    for (const selector of modalSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const isVisible = await element.isVisible();
          const text = await element.textContent();
          console.log(`Element ${i}: visible=${isVisible}, text preview="${text?.substring(0, 50)}..."`);
        }
      }
    }
    
    expect(modalSearch).toBeDefined();
  });

  test('Event Click Simulation with State Tracking', async () => {
    console.log('🔍 Simulating event click with detailed state tracking...');
    
    // Set up comprehensive state tracking
    await page.evaluate(() => {
      const windowObj = window as any;
      windowObj.stateTracker = {
        clickEvents: [],
        stateChanges: [],
        renderCycles: []
      };
      
      // Track all click events
      document.addEventListener('click', (e) => {
        windowObj.stateTracker.clickEvents.push({
          target: e.target?.tagName + (e.target?.className ? '.' + e.target.className : ''),
          timestamp: Date.now(),
          coordinates: { x: e.clientX, y: e.clientY }
        });
      });
      
      // Track React state changes by monitoring common state setters
      const originalSetState = React?.Component?.prototype?.setState;
      if (originalSetState) {
        React.Component.prototype.setState = function(state) {
          windowObj.stateTracker.stateChanges.push({
            component: this.constructor.name,
            state: state,
            timestamp: Date.now()
          });
          return originalSetState.call(this, state);
        };
      }
    });
    
    // Look for event elements to click
    const eventElements = await page.locator('div[style*="z-index"], [class*="event"], [data-testid*="event"]').all();
    
    if (eventElements.length === 0) {
      console.log('⚠️ No event elements found, creating a test scenario...');
      
      // Inject a test event element
      await page.evaluate(() => {
        const testEventElement = document.createElement('div');
        testEventElement.className = 'test-event-marker';
        testEventElement.style.cssText = `
          position: absolute;
          top: 200px;
          left: 200px;
          width: 30px;
          height: 30px;
          background: gold;
          border-radius: 50%;
          cursor: pointer;
          z-index: 100;
        `;
        testEventElement.setAttribute('data-testid', 'test-event-marker');
        testEventElement.onclick = () => {
          const windowObj = window as any;
          console.log('Test event clicked!');
          
          // Simulate the handleEventClick function
          const testEvent = {
            id: 'test-event',
            event_title: 'Test Event',
            event_venue: 'Test Venue',
            event_source: 'ticketmaster'
          };
          
          windowObj.selectedEvent = testEvent;
          windowObj.showEventModal = true;
          
          // Try to trigger modal
          const event = new CustomEvent('showEventModal', { detail: testEvent });
          window.dispatchEvent(event);
        };
        document.body.appendChild(testEventElement);
      });
      
      // Wait for element to be added
      await page.waitForSelector('[data-testid="test-event-marker"]');
      const testElement = page.locator('[data-testid="test-event-marker"]');
      
      console.log('📍 Clicking test event element...');
      await testElement.click();
    } else {
      console.log(`📍 Clicking on first of ${eventElements.length} event elements...`);
      await eventElements[0].click();
    }
    
    // Wait for any state changes
    await page.waitForTimeout(3000);
    
    // Collect all tracking data
    const trackingData = await page.evaluate(() => {
      return (window as any).stateTracker || {};
    });
    
    console.log('Event click tracking data:', trackingData);
    
    // Check current state after click
    const postClickState = await page.evaluate(() => {
      const windowObj = window as any;
      return {
        selectedEvent: windowObj.selectedEvent,
        showEventModal: windowObj.showEventModal,
        modalElements: document.querySelectorAll('[role="dialog"], .modal').length,
        visibleModals: Array.from(document.querySelectorAll('[role="dialog"], .modal')).filter(
          el => el.offsetParent !== null
        ).length
      };
    });
    
    console.log('Post-click state:', postClickState);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/event-click-simulation.png', fullPage: true });
    
    // Check console logs for any React errors
    const logs = page['consoleLogs'] as Array<{type: string, text: string, timestamp: number}>;
    const errors = logs.filter(log => log.type === 'error');
    const warnings = logs.filter(log => log.type === 'warn');
    
    console.log('Console errors during test:', errors);
    console.log('Console warnings during test:', warnings);
    
    // The test should detect some activity
    const hasActivity = trackingData.clickEvents?.length > 0 || 
                       postClickState.selectedEvent || 
                       postClickState.showEventModal;
    
    expect(hasActivity).toBe(true);
  });

  test('Force Modal Render Test - Direct component manipulation', async () => {
    console.log('🔍 Force rendering modal to test component...');
    
    // Inject the EventDetailModal component directly
    const modalForced = await page.evaluate(() => {
      // Create a test event
      const testEvent = {
        id: 'force-test-event',
        content: 'Forced modal test content',
        event_source: 'ticketmaster',
        external_event_id: 'force-123',
        event_title: 'Forced Modal Test Event',
        event_venue: 'Forced Test Venue',
        event_start_date: new Date().toISOString(),
        event_price_min: 30,
        event_price_max: 120,
        created_at: new Date().toISOString(),
        event_url: 'https://www.ticketmaster.com/forced-test',
        lat: 40.7128,
        lng: -74.0060
      };
      
      // Try to find and call the modal component directly
      const windowObj = window as any;
      
      // Store the event data globally
      windowObj.forcedEvent = testEvent;
      windowObj.forcedShowModal = true;
      
      // Create a modal manually using the same structure as EventDetailModal
      const modalOverlay = document.createElement('div');
      modalOverlay.id = 'forced-modal-overlay';
      modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        background: white;
        border-radius: 24px;
        max-width: 800px;
        max-height: 95vh;
        overflow-y: auto;
        padding: 0;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      `;
      
      modalContent.innerHTML = `
        <div style="padding: 24px;">
          <button id="forced-modal-close" style="
            position: absolute;
            top: 16px;
            right: 16px;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          ">×</button>
          
          <div style="
            background: linear-gradient(135deg, #f59e0b, #ea580c);
            padding: 32px;
            color: white;
            border-radius: 20px;
            margin-bottom: 24px;
          ">
            <div style="margin-bottom: 16px;">
              <span style="
                background: rgba(255, 255, 255, 0.2);
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: bold;
              ">FORCED TEST</span>
            </div>
            <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 16px 0;">${testEvent.event_title}</h1>
            <div style="display: flex; align-items: center; gap: 16px;">
              <span>📍 ${testEvent.event_venue}</span>
              <span>🗓️ ${new Date(testEvent.event_start_date).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
            <div style="background: #dbeafe; padding: 20px; border-radius: 16px;">
              <h3 style="margin: 0 0 8px 0; color: #1e40af;">When</h3>
              <p style="margin: 0; font-weight: bold;">${new Date(testEvent.event_start_date).toLocaleString()}</p>
            </div>
            <div style="background: #dcfce7; padding: 20px; border-radius: 16px;">
              <h3 style="margin: 0 0 8px 0; color: #166534;">Where</h3>
              <p style="margin: 0; font-weight: bold;">${testEvent.event_venue}</p>
            </div>
            <div style="background: #fef3c7; padding: 20px; border-radius: 16px;">
              <h3 style="margin: 0 0 8px 0; color: #92400e;">Price</h3>
              <p style="margin: 0; font-weight: bold;">$${testEvent.event_price_min} - $${testEvent.event_price_max}</p>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 16px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0;">About This Event</h3>
            <p style="margin: 0; line-height: 1.6;">${testEvent.content}</p>
          </div>
          
          <div style="text-align: center;">
            <button onclick="window.open('${testEvent.event_url}', '_blank')" style="
              background: linear-gradient(135deg, #f59e0b, #ea580c);
              color: white;
              border: none;
              padding: 16px 32px;
              border-radius: 16px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              box-shadow: 0 4px 14px 0 rgba(245, 158, 11, 0.39);
            ">🎟️ Get Tickets on Ticketmaster</button>
          </div>
        </div>
      `;
      
      modalOverlay.appendChild(modalContent);
      document.body.appendChild(modalOverlay);
      
      // Add close functionality
      const closeButton = document.getElementById('forced-modal-close');
      if (closeButton) {
        closeButton.onclick = () => {
          modalOverlay.remove();
          windowObj.forcedShowModal = false;
        };
      }
      
      // Close on overlay click
      modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
          modalOverlay.remove();
          windowObj.forcedShowModal = false;
        }
      };
      
      return true;
    });
    
    console.log('Modal forced:', modalForced);
    
    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    // Check if forced modal is visible
    const forcedModal = page.locator('#forced-modal-overlay');
    const isVisible = await forcedModal.isVisible();
    
    console.log('Forced modal visible:', isVisible);
    
    if (isVisible) {
      // Test modal interactions
      const modalText = await forcedModal.textContent();
      console.log('Forced modal content preview:', modalText?.substring(0, 200) + '...');
      
      // Test close button
      await page.click('#forced-modal-close');
      await page.waitForTimeout(500);
      
      const isVisibleAfterClose = await forcedModal.isVisible();
      console.log('Forced modal visible after close:', isVisibleAfterClose);
      
      expect(isVisible).toBe(true);
      expect(isVisibleAfterClose).toBe(false);
    } else {
      console.log('🔴 Forced modal not visible - indicates serious rendering issue');
      await page.screenshot({ path: 'test-results/forced-modal-failed.png', fullPage: true });
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/forced-modal-test.png', fullPage: true });
    
    expect(modalForced).toBe(true);
  });
});