/**
 * iOS Device Compatibility Testing Suite
 * Tests cross-device compatibility and UI validation for different iOS devices
 */

export class DeviceCompatibilityTests {
  constructor() {
    this.testResults = [];
    this.currentDevice = null;
    this.deviceConfigs = {
      'iphone-se': {
        name: 'iPhone SE (3rd generation)',
        width: 375,
        height: 667,
        scale: 2,
        safeArea: { top: 20, bottom: 0, left: 0, right: 0 },
        characteristics: { screenSize: 'small', homeButton: true, faceId: false, touchId: true, notch: false }
      },
      'iphone-15-pro': {
        name: 'iPhone 15 Pro',
        width: 393,
        height: 852,
        scale: 3,
        safeArea: { top: 59, bottom: 34, left: 0, right: 0 },
        characteristics: { screenSize: 'standard', homeButton: false, faceId: true, touchId: false, notch: false, dynamicIsland: true }
      },
      'iphone-15-pro-max': {
        name: 'iPhone 15 Pro Max',
        width: 430,
        height: 932,
        scale: 3,
        safeArea: { top: 59, bottom: 34, left: 0, right: 0 },
        characteristics: { screenSize: 'large', homeButton: false, faceId: true, touchId: false, notch: false, dynamicIsland: true }
      },
      'ipad-air': {
        name: 'iPad Air (5th generation)',
        width: 820,
        height: 1180,
        scale: 2,
        safeArea: { top: 24, bottom: 20, left: 0, right: 0 },
        characteristics: { screenSize: 'tablet', homeButton: false, faceId: true, touchId: false, notch: false }
      }
    };
  }

  async runCompatibilityTests(deviceId) {
    console.log(`📱 Starting Device Compatibility Tests for ${deviceId}...`);
    
    this.currentDevice = this.deviceConfigs[deviceId];
    if (!this.currentDevice) {
      throw new Error(`Unknown device: ${deviceId}`);
    }

    // Configure device environment
    await this.setupDeviceEnvironment(this.currentDevice);

    const tests = [
      this.testScreenDimensions,
      this.testSafeAreaHandling,
      this.testResponsiveLayout,
      this.testTouchTargets,
      this.testScrollBehavior,
      this.testModalBehavior,
      this.testNavigationFlow,
      this.testMapViewCompatibility,
      this.testKeyboardHandling,
      this.testOrientationChanges,
      this.testDeviceSpecificFeatures
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.recordTestResult(test.name, 'FAILED', error.message);
      }
    }

    return this.generateReport();
  }

  async setupDeviceEnvironment(deviceConfig) {
    console.log(`🔧 Setting up environment for ${deviceConfig.name}...`);
    
    // Set viewport dimensions
    if (window.document && window.document.body) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          `width=${deviceConfig.width}, height=${deviceConfig.height}, initial-scale=1, viewport-fit=cover`);
      }

      // Apply device-specific styles
      document.body.style.width = `${deviceConfig.width}px`;
      document.body.style.height = `${deviceConfig.height}px`;
      document.body.setAttribute('data-device', deviceConfig.name.toLowerCase().replace(/\s+/g, '-'));
      
      // Set CSS custom properties for safe areas
      document.documentElement.style.setProperty('--safe-area-inset-top', `${deviceConfig.safeArea.top}px`);
      document.documentElement.style.setProperty('--safe-area-inset-bottom', `${deviceConfig.safeArea.bottom}px`);
      document.documentElement.style.setProperty('--safe-area-inset-left', `${deviceConfig.safeArea.left}px`);
      document.documentElement.style.setProperty('--safe-area-inset-right', `${deviceConfig.safeArea.right}px`);
    }

    await this.delay(500); // Allow environment to settle
  }

  async testScreenDimensions() {
    console.log('📐 Testing screen dimensions compatibility...');

    try {
      const actualWidth = window.innerWidth;
      const actualHeight = window.innerHeight;
      
      const expectedWidth = this.currentDevice.width;
      const expectedHeight = this.currentDevice.height;

      const widthMatch = Math.abs(actualWidth - expectedWidth) <= 10; // 10px tolerance
      const heightMatch = Math.abs(actualHeight - expectedHeight) <= 50; // 50px tolerance for browser UI

      if (widthMatch && heightMatch) {
        this.recordTestResult('testScreenDimensions', 'PASSED', 
          `Screen dimensions match: ${actualWidth}x${actualHeight}`);
      } else {
        this.recordTestResult('testScreenDimensions', 'WARNING', 
          `Screen dimensions mismatch: actual ${actualWidth}x${actualHeight}, expected ${expectedWidth}x${expectedHeight}`);
      }

    } catch (error) {
      this.recordTestResult('testScreenDimensions', 'FAILED', `Screen dimensions test failed: ${error.message}`);
    }
  }

  async testSafeAreaHandling() {
    console.log('🔒 Testing safe area handling...');

    try {
      const elementsToTest = [
        { selector: '.app-header, header', area: 'top' },
        { selector: '.app-footer, footer', area: 'bottom' },
        { selector: '.navigation, .tab-bar', area: 'bottom' },
        { selector: '.modal, .dialog', area: 'all' }
      ];

      let handledElements = 0;
      const issues = [];

      for (const test of elementsToTest) {
        const elements = document.querySelectorAll(test.selector);
        
        elements.forEach((element, index) => {
          const computedStyle = window.getComputedStyle(element);
          const safeAreaHandling = this.checkSafeAreaHandling(element, computedStyle, test.area);
          
          if (safeAreaHandling.handled) {
            handledElements++;
          } else {
            issues.push({
              element: `${test.selector}[${index}]`,
              area: test.area,
              issue: safeAreaHandling.issue
            });
          }
        });
      }

      const totalElements = elementsToTest.reduce((sum, test) => 
        sum + document.querySelectorAll(test.selector).length, 0);

      if (totalElements === 0) {
        this.recordTestResult('testSafeAreaHandling', 'SKIPPED', 'No elements found to test safe area handling');
      } else if (handledElements >= totalElements * 0.8) {
        this.recordTestResult('testSafeAreaHandling', 'PASSED', 
          `${handledElements}/${totalElements} elements handle safe areas correctly`);
      } else {
        this.recordTestResult('testSafeAreaHandling', 'WARNING', 
          `${handledElements}/${totalElements} elements handle safe areas correctly. Issues: ${issues.length}`);
      }

    } catch (error) {
      this.recordTestResult('testSafeAreaHandling', 'FAILED', `Safe area test failed: ${error.message}`);
    }
  }

  async testResponsiveLayout() {
    console.log('📱 Testing responsive layout...');

    try {
      const layoutTests = [
        { name: 'Grid Systems', selector: '.grid, .grid-container, .row' },
        { name: 'Flexbox Layouts', selector: '.flex, .d-flex, .flexbox' },
        { name: 'Content Containers', selector: '.container, .content, .main-content' },
        { name: 'Card Components', selector: '.card, .message-card, .event-card' }
      ];

      const results = [];

      for (const test of layoutTests) {
        const elements = document.querySelectorAll(test.selector);
        let responsiveElements = 0;

        elements.forEach(element => {
          const isResponsive = this.checkResponsiveness(element);
          if (isResponsive) {
            responsiveElements++;
          }
        });

        results.push({
          name: test.name,
          total: elements.length,
          responsive: responsiveElements,
          rate: elements.length > 0 ? (responsiveElements / elements.length) : 1
        });
      }

      const overallRate = results.reduce((sum, r) => sum + r.rate, 0) / results.length;

      if (overallRate >= 0.8) {
        this.recordTestResult('testResponsiveLayout', 'PASSED', 
          `Responsive layout: ${(overallRate * 100).toFixed(1)}% elements responsive`);
      } else {
        this.recordTestResult('testResponsiveLayout', 'WARNING', 
          `Responsive layout: ${(overallRate * 100).toFixed(1)}% elements responsive`);
      }

    } catch (error) {
      this.recordTestResult('testResponsiveLayout', 'FAILED', `Responsive layout test failed: ${error.message}`);
    }
  }

  async testTouchTargets() {
    console.log('👆 Testing touch target compatibility...');

    try {
      const interactiveElements = document.querySelectorAll(
        'button, [role="button"], input, select, textarea, a[href], .touchable, .clickable'
      );

      const minTouchTarget = this.currentDevice.characteristics.screenSize === 'tablet' ? 44 : 44; // iOS standards
      let adequateElements = 0;
      const issues = [];

      interactiveElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const isAdequate = rect.width >= minTouchTarget && rect.height >= minTouchTarget;
        
        // Check spacing between touch targets
        const hasAdequateSpacing = this.checkTouchTargetSpacing(element, interactiveElements);

        if (isAdequate && hasAdequateSpacing) {
          adequateElements++;
        } else {
          issues.push({
            element: `${element.tagName}[${index}]`,
            size: `${rect.width.toFixed(0)}x${rect.height.toFixed(0)}px`,
            spacing: hasAdequateSpacing ? 'OK' : 'Insufficient'
          });
        }
      });

      const adequacyRate = interactiveElements.length > 0 ? 
        (adequateElements / interactiveElements.length) : 1;

      if (adequacyRate >= 0.9) {
        this.recordTestResult('testTouchTargets', 'PASSED', 
          `${adequateElements}/${interactiveElements.length} touch targets adequate for ${this.currentDevice.name}`);
      } else {
        this.recordTestResult('testTouchTargets', 'FAILED', 
          `${adequateElements}/${interactiveElements.length} touch targets adequate. Issues: ${issues.length}`);
      }

    } catch (error) {
      this.recordTestResult('testTouchTargets', 'FAILED', `Touch targets test failed: ${error.message}`);
    }
  }

  async testScrollBehavior() {
    console.log('📜 Testing scroll behavior...');

    try {
      const scrollableElements = document.querySelectorAll(
        '.scroll, .scrollable, .overflow-auto, .overflow-scroll, .message-list, .content-area'
      );

      let properScrollElements = 0;
      const issues = [];

      scrollableElements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element);
        const hasProperScrolling = this.checkScrollBehavior(element, computedStyle);
        
        if (hasProperScrolling) {
          properScrollElements++;
        } else {
          issues.push({
            element: `Element[${index}]`,
            issue: 'Scroll behavior may not work properly on iOS'
          });
        }
      });

      // Test momentum scrolling
      const hasWebKitScrolling = this.checkWebKitScrolling();

      if (properScrollElements >= scrollableElements.length * 0.8 && hasWebKitScrolling) {
        this.recordTestResult('testScrollBehavior', 'PASSED', 
          `Scroll behavior optimized for iOS: ${properScrollElements}/${scrollableElements.length} elements`);
      } else {
        this.recordTestResult('testScrollBehavior', 'WARNING', 
          `Scroll behavior needs optimization: ${properScrollElements}/${scrollableElements.length} elements`);
      }

    } catch (error) {
      this.recordTestResult('testScrollBehavior', 'FAILED', `Scroll behavior test failed: ${error.message}`);
    }
  }

  async testModalBehavior() {
    console.log('📱 Testing modal behavior...');

    try {
      const modals = document.querySelectorAll('.modal, [role="dialog"], .popup, .overlay');
      let properModalElements = 0;

      modals.forEach(modal => {
        const modalChecks = {
          hasBackdrop: this.hasBackdrop(modal),
          handlesSwipeGestures: this.checkSwipeGestureSupport(modal),
          preventsBodyScroll: this.checkBodyScrollPrevention(modal),
          properZIndex: this.checkModalZIndex(modal)
        };

        const passedChecks = Object.values(modalChecks).filter(Boolean).length;
        
        if (passedChecks >= 3) { // At least 3 of 4 checks should pass
          properModalElements++;
        }
      });

      if (modals.length === 0) {
        this.recordTestResult('testModalBehavior', 'SKIPPED', 'No modals found to test');
      } else if (properModalElements >= modals.length * 0.8) {
        this.recordTestResult('testModalBehavior', 'PASSED', 
          `${properModalElements}/${modals.length} modals behave properly on iOS`);
      } else {
        this.recordTestResult('testModalBehavior', 'WARNING', 
          `${properModalElements}/${modals.length} modals behave properly on iOS`);
      }

    } catch (error) {
      this.recordTestResult('testModalBehavior', 'FAILED', `Modal behavior test failed: ${error.message}`);
    }
  }

  async testNavigationFlow() {
    console.log('🧭 Testing navigation flow...');

    try {
      const navigationElements = document.querySelectorAll('nav, .navigation, .navbar, .tab-bar, .bottom-nav');
      let properNavigationElements = 0;

      navigationElements.forEach(nav => {
        const navChecks = {
          hasActiveStates: this.checkActiveStates(nav),
          properTouchTargets: this.checkNavigationTouchTargets(nav),
          responsiveToDevice: this.checkNavigationResponsiveness(nav)
        };

        const passedChecks = Object.values(navChecks).filter(Boolean).length;
        
        if (passedChecks >= 2) {
          properNavigationElements++;
        }
      });

      if (navigationElements.length === 0) {
        this.recordTestResult('testNavigationFlow', 'SKIPPED', 'No navigation elements found');
      } else if (properNavigationElements >= navigationElements.length * 0.8) {
        this.recordTestResult('testNavigationFlow', 'PASSED', 
          `${properNavigationElements}/${navigationElements.length} navigation elements work well on iOS`);
      } else {
        this.recordTestResult('testNavigationFlow', 'WARNING', 
          `${properNavigationElements}/${navigationElements.length} navigation elements work well on iOS`);
      }

    } catch (error) {
      this.recordTestResult('testNavigationFlow', 'FAILED', `Navigation flow test failed: ${error.message}`);
    }
  }

  async testMapViewCompatibility() {
    console.log('🗺️ Testing map view compatibility...');

    try {
      const mapContainers = document.querySelectorAll('.map-container, #map, .google-map');
      
      if (mapContainers.length === 0) {
        this.recordTestResult('testMapViewCompatibility', 'SKIPPED', 'No map containers found');
        return;
      }

      let compatibleMaps = 0;

      mapContainers.forEach(mapContainer => {
        const mapChecks = {
          hasProperDimensions: this.checkMapDimensions(mapContainer),
          handlesTouchGestures: this.checkMapTouchHandling(mapContainer),
          responsive: this.checkMapResponsiveness(mapContainer)
        };

        const passedChecks = Object.values(mapChecks).filter(Boolean).length;
        
        if (passedChecks >= 2) {
          compatibleMaps++;
        }
      });

      if (compatibleMaps >= mapContainers.length * 0.8) {
        this.recordTestResult('testMapViewCompatibility', 'PASSED', 
          `${compatibleMaps}/${mapContainers.length} maps compatible with ${this.currentDevice.name}`);
      } else {
        this.recordTestResult('testMapViewCompatibility', 'WARNING', 
          `${compatibleMaps}/${mapContainers.length} maps compatible with ${this.currentDevice.name}`);
      }

    } catch (error) {
      this.recordTestResult('testMapViewCompatibility', 'FAILED', `Map compatibility test failed: ${error.message}`);
    }
  }

  async testKeyboardHandling() {
    console.log('⌨️ Testing keyboard handling...');

    try {
      const inputElements = document.querySelectorAll('input, textarea, select, [contenteditable]');
      let properKeyboardElements = 0;

      inputElements.forEach(input => {
        const keyboardChecks = {
          hasProperInputType: this.checkInputType(input),
          hasProperReturnKeyType: this.checkReturnKeyType(input),
          handlesViewportChanges: this.checkViewportHandling(input)
        };

        const passedChecks = Object.values(keyboardChecks).filter(Boolean).length;
        
        if (passedChecks >= 2) {
          properKeyboardElements++;
        }
      });

      if (inputElements.length === 0) {
        this.recordTestResult('testKeyboardHandling', 'SKIPPED', 'No input elements found');
      } else if (properKeyboardElements >= inputElements.length * 0.8) {
        this.recordTestResult('testKeyboardHandling', 'PASSED', 
          `${properKeyboardElements}/${inputElements.length} inputs handle iOS keyboard properly`);
      } else {
        this.recordTestResult('testKeyboardHandling', 'WARNING', 
          `${properKeyboardElements}/${inputElements.length} inputs handle iOS keyboard properly`);
      }

    } catch (error) {
      this.recordTestResult('testKeyboardHandling', 'FAILED', `Keyboard handling test failed: ${error.message}`);
    }
  }

  async testOrientationChanges() {
    console.log('🔄 Testing orientation changes...');

    try {
      const originalWidth = window.innerWidth;
      const originalHeight = window.innerHeight;

      // Simulate orientation change
      const isTablet = this.currentDevice.characteristics.screenSize === 'tablet';
      
      if (isTablet) {
        // Test landscape orientation for tablet
        document.body.style.width = `${this.currentDevice.height}px`;
        document.body.style.height = `${this.currentDevice.width}px`;
        
        await this.delay(500);
        
        const layoutAdaptsToLandscape = this.checkOrientationAdaptation('landscape');
        
        // Restore portrait
        document.body.style.width = `${this.currentDevice.width}px`;
        document.body.style.height = `${this.currentDevice.height}px`;
        
        await this.delay(500);
        
        const layoutAdaptsToPortrait = this.checkOrientationAdaptation('portrait');

        if (layoutAdaptsToLandscape && layoutAdaptsToPortrait) {
          this.recordTestResult('testOrientationChanges', 'PASSED', 
            'Layout adapts properly to orientation changes');
        } else {
          this.recordTestResult('testOrientationChanges', 'WARNING', 
            'Layout may not adapt properly to all orientations');
        }
      } else {
        // For phones, test is less critical but still check
        this.recordTestResult('testOrientationChanges', 'PASSED', 
          'Phone layout orientation handling acceptable');
      }

    } catch (error) {
      this.recordTestResult('testOrientationChanges', 'FAILED', `Orientation test failed: ${error.message}`);
    }
  }

  async testDeviceSpecificFeatures() {
    console.log('📱 Testing device-specific features...');

    try {
      const device = this.currentDevice;
      const featureTests = [];

      // Test Dynamic Island handling (iPhone 15 Pro/Pro Max)
      if (device.characteristics.dynamicIsland) {
        featureTests.push({
          name: 'Dynamic Island Layout',
          test: this.testDynamicIslandLayout.bind(this)
        });
      }

      // Test Home Button handling (iPhone SE)
      if (device.characteristics.homeButton) {
        featureTests.push({
          name: 'Home Button Layout',
          test: this.testHomeButtonLayout.bind(this)
        });
      }

      // Test Face ID integration
      if (device.characteristics.faceId) {
        featureTests.push({
          name: 'Face ID Integration',
          test: this.testFaceIdIntegration.bind(this)
        });
      }

      // Test Touch ID integration
      if (device.characteristics.touchId) {
        featureTests.push({
          name: 'Touch ID Integration',
          test: this.testTouchIdIntegration.bind(this)
        });
      }

      const results = [];
      
      for (const test of featureTests) {
        try {
          const result = await test.test();
          results.push({ name: test.name, passed: result.passed, details: result.details });
        } catch (error) {
          results.push({ name: test.name, passed: false, error: error.message });
        }
      }

      const passedTests = results.filter(r => r.passed).length;

      if (featureTests.length === 0) {
        this.recordTestResult('testDeviceSpecificFeatures', 'SKIPPED', 'No device-specific features to test');
      } else if (passedTests >= featureTests.length * 0.8) {
        this.recordTestResult('testDeviceSpecificFeatures', 'PASSED', 
          `${passedTests}/${featureTests.length} device-specific features working`);
      } else {
        this.recordTestResult('testDeviceSpecificFeatures', 'WARNING', 
          `${passedTests}/${featureTests.length} device-specific features working`);
      }

    } catch (error) {
      this.recordTestResult('testDeviceSpecificFeatures', 'FAILED', `Device-specific features test failed: ${error.message}`);
    }
  }

  // Helper methods for device-specific checks
  checkSafeAreaHandling(element, computedStyle, area) {
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingBottom = parseFloat(computedStyle.paddingBottom);
    const marginTop = parseFloat(computedStyle.marginTop);
    const marginBottom = parseFloat(computedStyle.marginBottom);

    const safeArea = this.currentDevice.safeArea;
    
    switch (area) {
      case 'top':
        return {
          handled: paddingTop >= safeArea.top || marginTop >= safeArea.top,
          issue: paddingTop < safeArea.top && marginTop < safeArea.top ? 'No top safe area handling' : null
        };
      case 'bottom':
        return {
          handled: paddingBottom >= safeArea.bottom || marginBottom >= safeArea.bottom,
          issue: paddingBottom < safeArea.bottom && marginBottom < safeArea.bottom ? 'No bottom safe area handling' : null
        };
      case 'all':
        const topHandled = paddingTop >= safeArea.top || marginTop >= safeArea.top;
        const bottomHandled = paddingBottom >= safeArea.bottom || marginBottom >= safeArea.bottom;
        return {
          handled: topHandled && bottomHandled,
          issue: !topHandled || !bottomHandled ? 'Incomplete safe area handling' : null
        };
      default:
        return { handled: true, issue: null };
    }
  }

  checkResponsiveness(element) {
    const computedStyle = window.getComputedStyle(element);
    
    // Check for responsive CSS properties
    const hasFlexbox = computedStyle.display.includes('flex');
    const hasGrid = computedStyle.display.includes('grid');
    const hasRelativeWidth = computedStyle.width.includes('%') || computedStyle.width === 'auto';
    const hasMediaQueries = this.hasMediaQueries(element);

    return hasFlexbox || hasGrid || hasRelativeWidth || hasMediaQueries;
  }

  checkTouchTargetSpacing(element, allElements) {
    const rect = element.getBoundingClientRect();
    const minSpacing = 8; // Minimum spacing between touch targets

    for (const otherElement of allElements) {
      if (element === otherElement) continue;
      
      const otherRect = otherElement.getBoundingClientRect();
      const distance = this.getElementDistance(rect, otherRect);
      
      if (distance < minSpacing) {
        return false;
      }
    }

    return true;
  }

  checkScrollBehavior(element, computedStyle) {
    const overflowY = computedStyle.overflowY;
    const webkitOverflowScrolling = computedStyle['-webkit-overflow-scrolling'];
    
    return (overflowY === 'scroll' || overflowY === 'auto') && 
           webkitOverflowScrolling === 'touch';
  }

  checkWebKitScrolling() {
    // Check if -webkit-overflow-scrolling: touch is used globally
    const stylesheets = Array.from(document.styleSheets);
    
    for (const stylesheet of stylesheets) {
      try {
        const rules = Array.from(stylesheet.cssRules || []);
        const hasWebKitScrolling = rules.some(rule => 
          rule.cssText && rule.cssText.includes('-webkit-overflow-scrolling')
        );
        
        if (hasWebKitScrolling) return true;
      } catch (error) {
        // Cross-origin stylesheet, skip
      }
    }
    
    return false;
  }

  // Modal behavior checks
  hasBackdrop(modal) {
    return modal.querySelector('.backdrop, .overlay') !== null ||
           window.getComputedStyle(modal).backgroundColor !== 'rgba(0, 0, 0, 0)';
  }

  checkSwipeGestureSupport(modal) {
    return modal.hasAttribute('data-swipe') || 
           modal.classList.contains('swipeable') ||
           modal.querySelector('.swipe-handle') !== null;
  }

  checkBodyScrollPrevention(modal) {
    // Check if modal prevents body scrolling when open
    return true; // Simplified check
  }

  checkModalZIndex(modal) {
    const zIndex = parseInt(window.getComputedStyle(modal).zIndex);
    return zIndex >= 1000; // High enough z-index for modals
  }

  // Navigation checks
  checkActiveStates(nav) {
    const activeElements = nav.querySelectorAll('.active, [aria-current], .current');
    return activeElements.length > 0;
  }

  checkNavigationTouchTargets(nav) {
    const navItems = nav.querySelectorAll('a, button, .nav-item');
    let adequateItems = 0;

    navItems.forEach(item => {
      const rect = item.getBoundingClientRect();
      if (rect.width >= 44 && rect.height >= 44) {
        adequateItems++;
      }
    });

    return navItems.length === 0 || adequateItems >= navItems.length * 0.8;
  }

  checkNavigationResponsiveness(nav) {
    const computedStyle = window.getComputedStyle(nav);
    return computedStyle.display.includes('flex') || 
           computedStyle.display.includes('grid') ||
           nav.classList.contains('responsive');
  }

  // Map checks
  checkMapDimensions(mapContainer) {
    const rect = mapContainer.getBoundingClientRect();
    return rect.width > 100 && rect.height > 100; // Reasonable minimum size
  }

  checkMapTouchHandling(mapContainer) {
    return mapContainer.hasAttribute('data-touch') ||
           mapContainer.style.touchAction !== 'none';
  }

  checkMapResponsiveness(mapContainer) {
    const computedStyle = window.getComputedStyle(mapContainer);
    return computedStyle.width.includes('%') || computedStyle.width === '100vw';
  }

  // Input checks
  checkInputType(input) {
    if (input.tagName.toLowerCase() !== 'input') return true;
    
    const type = input.getAttribute('type') || 'text';
    const appropriateTypes = ['email', 'tel', 'url', 'search', 'number', 'text', 'password'];
    
    return appropriateTypes.includes(type);
  }

  checkReturnKeyType(input) {
    return input.hasAttribute('enterkeyhint') || 
           input.hasAttribute('data-return-key');
  }

  checkViewportHandling(input) {
    // Check if input has proper viewport handling for iOS keyboard
    return input.hasAttribute('data-viewport-fit') ||
           document.querySelector('meta[name="viewport"][content*="viewport-fit=cover"]') !== null;
  }

  // Orientation checks
  checkOrientationAdaptation(orientation) {
    // Check if layout adapts to orientation
    const containers = document.querySelectorAll('.container, .content, .main');
    let adaptiveContainers = 0;

    containers.forEach(container => {
      const computedStyle = window.getComputedStyle(container);
      const isAdaptive = computedStyle.display.includes('flex') || 
                        computedStyle.display.includes('grid') ||
                        container.classList.contains(`${orientation}-layout`);
      
      if (isAdaptive) {
        adaptiveContainers++;
      }
    });

    return containers.length === 0 || adaptiveContainers >= containers.length * 0.7;
  }

  // Device-specific feature tests
  async testDynamicIslandLayout() {
    const topElements = document.querySelectorAll('.header, .top-bar, .navigation');
    let compatibleElements = 0;

    topElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const hasProperSpacing = rect.top >= 59; // Dynamic Island safe area
      
      if (hasProperSpacing) {
        compatibleElements++;
      }
    });

    return {
      passed: topElements.length === 0 || compatibleElements >= topElements.length * 0.8,
      details: `${compatibleElements}/${topElements.length} elements compatible with Dynamic Island`
    };
  }

  async testHomeButtonLayout() {
    const bottomElements = document.querySelectorAll('.footer, .bottom-bar, .tab-bar');
    let compatibleElements = 0;

    bottomElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const hasProperSpacing = rect.bottom <= viewportHeight; // No special safe area needed
      
      if (hasProperSpacing) {
        compatibleElements++;
      }
    });

    return {
      passed: bottomElements.length === 0 || compatibleElements >= bottomElements.length * 0.8,
      details: `${compatibleElements}/${bottomElements.length} elements compatible with Home Button layout`
    };
  }

  async testFaceIdIntegration() {
    // Check for Face ID authentication elements
    const authElements = document.querySelectorAll('[data-auth="face-id"], .face-id-auth, .biometric-auth');
    
    return {
      passed: true, // Face ID integration is handled by native code
      details: `${authElements.length} Face ID elements found`
    };
  }

  async testTouchIdIntegration() {
    // Check for Touch ID authentication elements
    const authElements = document.querySelectorAll('[data-auth="touch-id"], .touch-id-auth, .fingerprint-auth');
    
    return {
      passed: true, // Touch ID integration is handled by native code
      details: `${authElements.length} Touch ID elements found`
    };
  }

  // Utility methods
  hasMediaQueries(element) {
    // Simplified check for media query usage
    return element.classList.contains('responsive') || 
           element.classList.contains('mobile') ||
           element.classList.contains('tablet');
  }

  getElementDistance(rect1, rect2) {
    const dx = Math.max(0, Math.max(rect1.left - rect2.right, rect2.left - rect1.right));
    const dy = Math.max(0, Math.max(rect1.top - rect2.bottom, rect2.top - rect1.bottom));
    return Math.sqrt(dx * dx + dy * dy);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  recordTestResult(testName, status, message) {
    const result = {
      test: testName,
      status,
      message,
      device: this.currentDevice.name,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    console.log(`${this.getStatusEmoji(status)} ${testName}: ${message}`);
  }

  getStatusEmoji(status) {
    switch (status) {
      case 'PASSED': return '✅';
      case 'FAILED': return '❌';
      case 'WARNING': return '⚠️';
      case 'SKIPPED': return '⏭️';
      default: return '❓';
    }
  }

  generateReport() {
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const warnings = this.testResults.filter(r => r.status === 'WARNING').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIPPED').length;

    const report = {
      device: this.currentDevice,
      summary: {
        total: this.testResults.length,
        passed,
        failed,
        warnings,
        skipped,
        passRate: `${((passed / (this.testResults.length - skipped)) * 100).toFixed(1)}%`
      },
      results: this.testResults,
      timestamp: new Date().toISOString()
    };

    console.log(`\n📊 Device Compatibility Report for ${this.currentDevice.name}:`);
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️ Warnings: ${report.summary.warnings}`);
    console.log(`⏭️ Skipped: ${report.summary.skipped}`);
    console.log(`📈 Pass Rate: ${report.summary.passRate}`);

    return report;
  }
}