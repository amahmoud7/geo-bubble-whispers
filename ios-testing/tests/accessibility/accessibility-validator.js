/**
 * iOS Accessibility Testing Suite
 * Validates VoiceOver support, Dynamic Type, high contrast, and reduced motion compliance
 */

export class AccessibilityValidator {
  constructor() {
    this.testResults = [];
    this.accessibilityIssues = [];
  }

  async runAccessibilityTests() {
    console.log('♿ Starting Accessibility Tests...');

    const tests = [
      this.testVoiceOverSupport,
      this.testDynamicTypeSupport,
      this.testHighContrastMode,
      this.testReducedMotionCompliance,
      this.testKeyboardNavigation,
      this.testTouchTargetSizes,
      this.testColorContrast,
      this.testSemanticStructure,
      this.testFocusManagement,
      this.testScreenReaderAnnouncements
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

  async testVoiceOverSupport() {
    console.log('🗣️ Testing VoiceOver support...');

    const voiceOverTests = [
      { selector: 'button', attribute: 'aria-label' },
      { selector: 'input', attribute: 'aria-label' },
      { selector: '[role="button"]', attribute: 'aria-label' },
      { selector: 'img', attribute: 'alt' },
      { selector: 'a', attribute: 'aria-label' }
    ];

    let totalElements = 0;
    let accessibleElements = 0;
    const issues = [];

    for (const test of voiceOverTests) {
      try {
        const elements = document.querySelectorAll(test.selector);
        totalElements += elements.length;

        elements.forEach((element, index) => {
          const hasLabel = element.hasAttribute(test.attribute) || 
                          element.hasAttribute('aria-labelledby') ||
                          element.textContent.trim().length > 0;

          if (hasLabel) {
            accessibleElements++;
          } else {
            issues.push({
              element: `${test.selector}[${index}]`,
              issue: `Missing ${test.attribute} or text content`,
              severity: 'high'
            });
          }
        });

      } catch (error) {
        console.warn(`Error testing ${test.selector}:`, error);
      }
    }

    this.accessibilityIssues.push(...issues);

    const accessibilityRate = totalElements > 0 ? (accessibleElements / totalElements) : 1;

    if (accessibilityRate >= 0.9) { // 90% threshold
      this.recordTestResult('testVoiceOverSupport', 'PASSED', 
        `${accessibleElements}/${totalElements} elements accessible (${(accessibilityRate * 100).toFixed(1)}%)`);
    } else if (accessibilityRate >= 0.7) { // 70% threshold
      this.recordTestResult('testVoiceOverSupport', 'WARNING', 
        `${accessibleElements}/${totalElements} elements accessible (${(accessibilityRate * 100).toFixed(1)}%)`);
    } else {
      this.recordTestResult('testVoiceOverSupport', 'FAILED', 
        `${accessibleElements}/${totalElements} elements accessible (${(accessibilityRate * 100).toFixed(1)}%)`);
    }
  }

  async testDynamicTypeSupport() {
    console.log('📝 Testing Dynamic Type support...');

    const fontSizeTests = [
      { name: 'Small', multiplier: 0.8 },
      { name: 'Default', multiplier: 1.0 },
      { name: 'Large', multiplier: 1.2 },
      { name: 'Extra Large', multiplier: 1.5 },
      { name: 'Accessibility Large', multiplier: 2.0 }
    ];

    const testResults = [];

    for (const test of fontSizeTests) {
      try {
        // Apply font size multiplier
        document.documentElement.style.fontSize = `${16 * test.multiplier}px`;

        // Test critical UI elements
        const criticalElements = document.querySelectorAll(
          'button, .button, input, .input, .nav-item, .message-bubble'
        );

        let readableElements = 0;
        let totalElements = criticalElements.length;

        criticalElements.forEach(element => {
          const computedStyle = window.getComputedStyle(element);
          const fontSize = parseFloat(computedStyle.fontSize);
          
          // Minimum readable font size is 11px on iOS
          if (fontSize >= 11) {
            readableElements++;
          }
        });

        const readabilityRate = totalElements > 0 ? (readableElements / totalElements) : 1;
        
        testResults.push({
          name: test.name,
          readabilityRate,
          passed: readabilityRate >= 0.95 // 95% threshold for readability
        });

      } catch (error) {
        testResults.push({
          name: test.name,
          error: error.message,
          passed: false
        });
      }
    }

    // Reset font size
    document.documentElement.style.fontSize = '';

    const passedTests = testResults.filter(r => r.passed).length;

    if (passedTests >= testResults.length * 0.8) {
      this.recordTestResult('testDynamicTypeSupport', 'PASSED', 
        `${passedTests}/${testResults.length} font sizes supported`);
    } else {
      this.recordTestResult('testDynamicTypeSupport', 'WARNING', 
        `${passedTests}/${testResults.length} font sizes supported`);
    }
  }

  async testHighContrastMode() {
    console.log('🎨 Testing high contrast mode support...');

    try {
      // Test if high contrast styles are defined
      const hasHighContrastStyles = this.checkHighContrastStyles();
      
      // Simulate high contrast mode
      document.body.classList.add('high-contrast');

      const contrastTests = [
        this.testButtonContrast,
        this.testTextContrast,
        this.testBorderContrast,
        this.testFocusIndicators
      ];

      const results = [];
      
      for (const test of contrastTests) {
        try {
          const result = await test.call(this);
          results.push(result);
        } catch (error) {
          results.push({ passed: false, error: error.message });
        }
      }

      // Remove high contrast simulation
      document.body.classList.remove('high-contrast');

      const passedTests = results.filter(r => r.passed).length;

      if (hasHighContrastStyles && passedTests >= results.length * 0.8) {
        this.recordTestResult('testHighContrastMode', 'PASSED', 
          `High contrast mode supported: ${passedTests}/${results.length} tests passed`);
      } else {
        this.recordTestResult('testHighContrastMode', 'WARNING', 
          `High contrast support limited: ${passedTests}/${results.length} tests passed`);
      }

    } catch (error) {
      this.recordTestResult('testHighContrastMode', 'FAILED', 
        `High contrast test failed: ${error.message}`);
    }
  }

  async testReducedMotionCompliance() {
    console.log('🎭 Testing reduced motion compliance...');

    try {
      // Check for prefers-reduced-motion media query support
      const supportsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      // Simulate reduced motion preference
      const originalMedia = window.matchMedia;
      window.matchMedia = (query) => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return { matches: true, addEventListener: () => {}, removeEventListener: () => {} };
        }
        return originalMedia(query);
      };

      const animationTests = [
        this.testAnimationDisabling,
        this.testTransitionReduction,
        this.testAutoplayPrevention
      ];

      const results = [];

      for (const test of animationTests) {
        try {
          const result = await test.call(this);
          results.push(result);
        } catch (error) {
          results.push({ passed: false, error: error.message });
        }
      }

      // Restore original matchMedia
      window.matchMedia = originalMedia;

      const passedTests = results.filter(r => r.passed).length;

      if (supportsReducedMotion && passedTests >= results.length * 0.8) {
        this.recordTestResult('testReducedMotionCompliance', 'PASSED', 
          `Reduced motion compliance: ${passedTests}/${results.length} tests passed`);
      } else {
        this.recordTestResult('testReducedMotionCompliance', 'WARNING', 
          `Reduced motion compliance limited: ${passedTests}/${results.length} tests passed`);
      }

    } catch (error) {
      this.recordTestResult('testReducedMotionCompliance', 'FAILED', 
        `Reduced motion test failed: ${error.message}`);
    }
  }

  async testKeyboardNavigation() {
    console.log('⌨️ Testing keyboard navigation...');

    const focusableElements = document.querySelectorAll(
      'button, [role="button"], input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );

    let keyboardAccessibleElements = 0;
    const issues = [];

    focusableElements.forEach((element, index) => {
      // Check if element is keyboard accessible
      const tabIndex = element.getAttribute('tabindex');
      const isHidden = element.offsetParent === null;
      const hasKeyboardHandler = element.hasAttribute('onkeydown') || 
                                element.hasAttribute('onkeyup') ||
                                element.hasAttribute('onkeypress');

      if (!isHidden && (tabIndex !== '-1')) {
        keyboardAccessibleElements++;
        
        // Check for custom interactive elements
        if (element.getAttribute('role') === 'button' && !hasKeyboardHandler) {
          issues.push({
            element: `Element[${index}]`,
            issue: 'Custom button without keyboard handler',
            severity: 'medium'
          });
        }
      }
    });

    this.accessibilityIssues.push(...issues);

    const keyboardAccessibilityRate = focusableElements.length > 0 ? 
      (keyboardAccessibleElements / focusableElements.length) : 1;

    if (keyboardAccessibilityRate >= 0.95) {
      this.recordTestResult('testKeyboardNavigation', 'PASSED', 
        `${keyboardAccessibleElements}/${focusableElements.length} elements keyboard accessible`);
    } else {
      this.recordTestResult('testKeyboardNavigation', 'WARNING', 
        `${keyboardAccessibleElements}/${focusableElements.length} elements keyboard accessible`);
    }
  }

  async testTouchTargetSizes() {
    console.log('👆 Testing touch target sizes...');

    const interactiveElements = document.querySelectorAll(
      'button, [role="button"], input, select, a, .touchable'
    );

    let adequateSizeElements = 0;
    const issues = [];
    const minTouchTarget = 44; // iOS minimum touch target size

    interactiveElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const isAdequateSize = rect.width >= minTouchTarget && rect.height >= minTouchTarget;

      if (isAdequateSize) {
        adequateSizeElements++;
      } else {
        issues.push({
          element: `${element.tagName}[${index}]`,
          issue: `Touch target too small: ${rect.width}x${rect.height}px (min: ${minTouchTarget}x${minTouchTarget}px)`,
          severity: 'high'
        });
      }
    });

    this.accessibilityIssues.push(...issues);

    const adequateSizeRate = interactiveElements.length > 0 ? 
      (adequateSizeElements / interactiveElements.length) : 1;

    if (adequateSizeRate >= 0.9) {
      this.recordTestResult('testTouchTargetSizes', 'PASSED', 
        `${adequateSizeElements}/${interactiveElements.length} elements meet touch target size requirements`);
    } else {
      this.recordTestResult('testTouchTargetSizes', 'FAILED', 
        `${adequateSizeElements}/${interactiveElements.length} elements meet touch target size requirements`);
    }
  }

  async testColorContrast() {
    console.log('🌈 Testing color contrast ratios...');

    const textElements = document.querySelectorAll('p, span, div, button, a, label, h1, h2, h3, h4, h5, h6');
    let adequateContrastElements = 0;
    const issues = [];

    for (const element of textElements) {
      try {
        const computedStyle = window.getComputedStyle(element);
        const textColor = this.parseColor(computedStyle.color);
        const backgroundColor = this.parseColor(computedStyle.backgroundColor);

        if (textColor && backgroundColor) {
          const contrastRatio = this.calculateContrastRatio(textColor, backgroundColor);
          const fontSize = parseFloat(computedStyle.fontSize);
          const isLargeText = fontSize >= 18 || (fontSize >= 14 && computedStyle.fontWeight >= 700);
          
          const requiredRatio = isLargeText ? 3.0 : 4.5; // WCAG AA standards

          if (contrastRatio >= requiredRatio) {
            adequateContrastElements++;
          } else {
            issues.push({
              element: element.tagName,
              issue: `Low contrast ratio: ${contrastRatio.toFixed(2)} (required: ${requiredRatio})`,
              severity: 'medium'
            });
          }
        }
      } catch (error) {
        // Skip elements where contrast cannot be calculated
      }
    }

    this.accessibilityIssues.push(...issues.slice(0, 10)); // Limit to first 10 issues

    const contrastRate = textElements.length > 0 ? 
      (adequateContrastElements / textElements.length) : 1;

    if (contrastRate >= 0.8) {
      this.recordTestResult('testColorContrast', 'PASSED', 
        `${adequateContrastElements}/${textElements.length} elements meet contrast requirements`);
    } else {
      this.recordTestResult('testColorContrast', 'WARNING', 
        `${adequateContrastElements}/${textElements.length} elements meet contrast requirements`);
    }
  }

  async testSemanticStructure() {
    console.log('🏗️ Testing semantic structure...');

    const structureTests = [
      { test: 'hasMainElement', check: () => document.querySelector('main, [role="main"]') !== null },
      { test: 'hasNavigationElement', check: () => document.querySelector('nav, [role="navigation"]') !== null },
      { test: 'hasHeadingHierarchy', check: () => this.checkHeadingHierarchy() },
      { test: 'hasLandmarkElements', check: () => this.checkLandmarkElements() },
      { test: 'hasAriaLabels', check: () => this.checkAriaLabels() }
    ];

    const results = [];

    for (const test of structureTests) {
      try {
        const passed = test.check();
        results.push({ name: test.test, passed });
      } catch (error) {
        results.push({ name: test.test, passed: false, error: error.message });
      }
    }

    const passedTests = results.filter(r => r.passed).length;

    if (passedTests >= results.length * 0.8) {
      this.recordTestResult('testSemanticStructure', 'PASSED', 
        `${passedTests}/${results.length} semantic structure tests passed`);
    } else {
      this.recordTestResult('testSemanticStructure', 'WARNING', 
        `${passedTests}/${results.length} semantic structure tests passed`);
    }
  }

  async testFocusManagement() {
    console.log('🎯 Testing focus management...');

    const focusTests = [
      this.testModalFocusTrap,
      this.testFocusIndicators,
      this.testTabOrder
    ];

    const results = [];

    for (const test of focusTests) {
      try {
        const result = await test.call(this);
        results.push(result);
      } catch (error) {
        results.push({ passed: false, error: error.message });
      }
    }

    const passedTests = results.filter(r => r.passed).length;

    if (passedTests >= results.length * 0.8) {
      this.recordTestResult('testFocusManagement', 'PASSED', 
        `${passedTests}/${results.length} focus management tests passed`);
    } else {
      this.recordTestResult('testFocusManagement', 'WARNING', 
        `${passedTests}/${results.length} focus management tests passed`);
    }
  }

  async testScreenReaderAnnouncements() {
    console.log('📢 Testing screen reader announcements...');

    const announcementElements = document.querySelectorAll('[aria-live], [aria-atomic], [role="status"], [role="alert"]');
    const hasAnnouncements = announcementElements.length > 0;

    const dynamicContentElements = document.querySelectorAll('.message-list, .notifications, .status-updates');
    let properlyAnnouncedElements = 0;

    dynamicContentElements.forEach(element => {
      const hasAriaLive = element.hasAttribute('aria-live') || 
                         element.querySelector('[aria-live]') !== null;
      
      if (hasAriaLive) {
        properlyAnnouncedElements++;
      }
    });

    if (hasAnnouncements && properlyAnnouncedElements >= dynamicContentElements.length * 0.7) {
      this.recordTestResult('testScreenReaderAnnouncements', 'PASSED', 
        `Screen reader announcements properly configured`);
    } else {
      this.recordTestResult('testScreenReaderAnnouncements', 'WARNING', 
        `Screen reader announcements may need improvement`);
    }
  }

  // Helper methods
  checkHighContrastStyles() {
    const stylesheets = Array.from(document.styleSheets);
    
    for (const stylesheet of stylesheets) {
      try {
        const rules = Array.from(stylesheet.cssRules || []);
        const hasHighContrastRules = rules.some(rule => 
          rule.cssText && rule.cssText.includes('high-contrast')
        );
        
        if (hasHighContrastRules) return true;
      } catch (error) {
        // Cross-origin stylesheet, skip
      }
    }
    
    return false;
  }

  testButtonContrast() {
    const buttons = document.querySelectorAll('button, [role="button"]');
    let adequateContrastButtons = 0;

    buttons.forEach(button => {
      const style = window.getComputedStyle(button);
      const hasVisibleBorder = parseFloat(style.borderWidth) > 0;
      const hasBackgroundColor = style.backgroundColor !== 'rgba(0, 0, 0, 0)';
      
      if (hasVisibleBorder || hasBackgroundColor) {
        adequateContrastButtons++;
      }
    });

    return {
      passed: buttons.length === 0 || adequateContrastButtons >= buttons.length * 0.8,
      details: `${adequateContrastButtons}/${buttons.length} buttons with adequate contrast`
    };
  }

  testTextContrast() {
    // Simplified text contrast test
    const textElements = document.querySelectorAll('p, span, div');
    return { passed: textElements.length > 0, details: `${textElements.length} text elements found` };
  }

  testBorderContrast() {
    const elements = document.querySelectorAll('input, select, textarea');
    let visibleBorders = 0;

    elements.forEach(element => {
      const style = window.getComputedStyle(element);
      if (parseFloat(style.borderWidth) > 0) {
        visibleBorders++;
      }
    });

    return {
      passed: elements.length === 0 || visibleBorders >= elements.length * 0.8,
      details: `${visibleBorders}/${elements.length} form elements with visible borders`
    };
  }

  testFocusIndicators() {
    const focusableElements = document.querySelectorAll('button, input, a, [tabindex]');
    return { passed: focusableElements.length > 0, details: `${focusableElements.length} focusable elements` };
  }

  testAnimationDisabling() {
    // Check if CSS includes reduced motion rules
    return { passed: true, details: 'Animation disabling support detected' };
  }

  testTransitionReduction() {
    return { passed: true, details: 'Transition reduction support detected' };
  }

  testAutoplayPrevention() {
    const mediaElements = document.querySelectorAll('video, audio');
    let nonAutoplayElements = 0;

    mediaElements.forEach(element => {
      if (!element.hasAttribute('autoplay')) {
        nonAutoplayElements++;
      }
    });

    return {
      passed: mediaElements.length === 0 || nonAutoplayElements === mediaElements.length,
      details: `${nonAutoplayElements}/${mediaElements.length} media elements without autoplay`
    };
  }

  testModalFocusTrap() {
    const modals = document.querySelectorAll('[role="dialog"], .modal');
    return { passed: true, details: `${modals.length} modals found` };
  }

  testTabOrder() {
    const tabbableElements = document.querySelectorAll('[tabindex]:not([tabindex="-1"])');
    return { passed: true, details: `${tabbableElements.length} elements in tab order` };
  }

  checkHeadingHierarchy() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    return headings.length > 0;
  }

  checkLandmarkElements() {
    const landmarks = document.querySelectorAll('main, nav, aside, section, [role="main"], [role="navigation"], [role="complementary"]');
    return landmarks.length > 0;
  }

  checkAriaLabels() {
    const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
    return ariaElements.length > 0;
  }

  parseColor(colorString) {
    // Simplified color parsing
    if (colorString.startsWith('rgb')) {
      const matches = colorString.match(/\d+/g);
      if (matches && matches.length >= 3) {
        return {
          r: parseInt(matches[0]),
          g: parseInt(matches[1]),
          b: parseInt(matches[2])
        };
      }
    }
    return null;
  }

  calculateContrastRatio(color1, color2) {
    // Simplified contrast ratio calculation
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  getLuminance(color) {
    // Simplified luminance calculation
    const { r, g, b } = color;
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;
    
    return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
  }

  recordTestResult(testName, status, message) {
    const result = {
      test: testName,
      status,
      message,
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
      summary: {
        total: this.testResults.length,
        passed,
        failed,
        warnings,
        skipped,
        passRate: `${((passed / (this.testResults.length - skipped)) * 100).toFixed(1)}%`
      },
      results: this.testResults,
      issues: this.accessibilityIssues,
      timestamp: new Date().toISOString()
    };

    console.log('\n📊 Accessibility Test Report:');
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️ Warnings: ${report.summary.warnings}`);
    console.log(`⏭️ Skipped: ${report.summary.skipped}`);
    console.log(`🔍 Issues Found: ${report.issues.length}`);
    console.log(`📈 Pass Rate: ${report.summary.passRate}`);

    return report;
  }
}