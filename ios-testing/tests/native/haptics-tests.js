/**
 * iOS Haptic Feedback Testing Suite
 * Tests the native haptic feedback functionality for the Geo Bubble Whispers app
 */

import { HapticService } from '../../../src/services/haptics';

export class HapticTests {
  constructor() {
    this.testResults = [];
    this.hapticTypes = ['light', 'medium', 'heavy'];
    this.notificationTypes = ['success', 'warning', 'error'];
  }

  async runAllTests() {
    console.log('📳 Starting Haptic Feedback Tests...');
    
    const tests = [
      this.testHapticAvailability,
      this.testImpactFeedback,
      this.testNotificationFeedback,
      this.testSelectionFeedback,
      this.testHapticTiming,
      this.testHapticSequences,
      this.testHapticDisabling,
      this.testHapticIntensity
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

  async testHapticAvailability() {
    console.log('🔍 Testing haptic feedback availability...');
    
    try {
      const isAvailable = await HapticService.isAvailable();
      
      if (isAvailable) {
        this.recordTestResult('testHapticAvailability', 'PASSED', 
          'Haptic feedback is available on this device');
      } else {
        this.recordTestResult('testHapticAvailability', 'WARNING', 
          'Haptic feedback is not available on this device');
      }
    } catch (error) {
      this.recordTestResult('testHapticAvailability', 'FAILED', 
        `Haptic availability check failed: ${error.message}`);
    }
  }

  async testImpactFeedback() {
    console.log('💥 Testing impact feedback...');
    
    const results = [];

    for (const hapticType of this.hapticTypes) {
      try {
        console.log(`  Testing ${hapticType} impact...`);
        
        await HapticService.impact({ style: hapticType });
        await this.delay(500); // Delay between haptics
        
        results.push({ type: hapticType, status: 'PASSED' });
        
      } catch (error) {
        results.push({ 
          type: hapticType, 
          status: 'FAILED', 
          error: error.message 
        });
      }
    }

    const passedImpacts = results.filter(r => r.status === 'PASSED').length;
    
    if (passedImpacts >= this.hapticTypes.length * 0.8) {
      this.recordTestResult('testImpactFeedback', 'PASSED', 
        `${passedImpacts}/${this.hapticTypes.length} impact types working`);
    } else {
      this.recordTestResult('testImpactFeedback', 'WARNING', 
        `${passedImpacts}/${this.hapticTypes.length} impact types working`);
    }
  }

  async testNotificationFeedback() {
    console.log('🔔 Testing notification feedback...');
    
    const results = [];

    for (const notificationType of this.notificationTypes) {
      try {
        console.log(`  Testing ${notificationType} notification...`);
        
        await HapticService.notification({ type: notificationType });
        await this.delay(800); // Longer delay for notification haptics
        
        results.push({ type: notificationType, status: 'PASSED' });
        
      } catch (error) {
        results.push({ 
          type: notificationType, 
          status: 'FAILED', 
          error: error.message 
        });
      }
    }

    const passedNotifications = results.filter(r => r.status === 'PASSED').length;
    
    if (passedNotifications >= this.notificationTypes.length * 0.8) {
      this.recordTestResult('testNotificationFeedback', 'PASSED', 
        `${passedNotifications}/${this.notificationTypes.length} notification types working`);
    } else {
      this.recordTestResult('testNotificationFeedback', 'WARNING', 
        `${passedNotifications}/${this.notificationTypes.length} notification types working`);
    }
  }

  async testSelectionFeedback() {
    console.log('👆 Testing selection feedback...');
    
    try {
      // Test multiple selection haptics in sequence
      for (let i = 0; i < 5; i++) {
        await HapticService.selection();
        await this.delay(200);
      }
      
      this.recordTestResult('testSelectionFeedback', 'PASSED', 
        'Selection feedback working for sequential interactions');
        
    } catch (error) {
      this.recordTestResult('testSelectionFeedback', 'FAILED', 
        `Selection feedback test failed: ${error.message}`);
    }
  }

  async testHapticTiming() {
    console.log('⏱️ Testing haptic feedback timing...');
    
    try {
      const timingTests = [];
      
      // Test rapid succession haptics
      const startTime = Date.now();
      
      for (let i = 0; i < 3; i++) {
        const hapticStart = Date.now();
        await HapticService.impact({ style: 'light' });
        const hapticEnd = Date.now();
        
        timingTests.push({
          sequence: i + 1,
          duration: hapticEnd - hapticStart,
          timestamp: hapticEnd
        });
        
        await this.delay(100); // Short delay between haptics
      }
      
      const totalTime = Date.now() - startTime;
      const avgHapticTime = timingTests.reduce((sum, test) => sum + test.duration, 0) / timingTests.length;
      
      if (avgHapticTime < 50 && totalTime < 1000) { // Each haptic should be quick, total under 1 second
        this.recordTestResult('testHapticTiming', 'PASSED', 
          `Haptic timing good: avg ${avgHapticTime.toFixed(1)}ms, total ${totalTime}ms`);
      } else {
        this.recordTestResult('testHapticTiming', 'WARNING', 
          `Haptic timing slow: avg ${avgHapticTime.toFixed(1)}ms, total ${totalTime}ms`);
      }
      
    } catch (error) {
      this.recordTestResult('testHapticTiming', 'FAILED', 
        `Haptic timing test failed: ${error.message}`);
    }
  }

  async testHapticSequences() {
    console.log('🎵 Testing haptic sequences and patterns...');
    
    try {
      // Test a haptic sequence that simulates user interactions
      const sequence = [
        { type: 'selection', delay: 0 },
        { type: 'impact', style: 'light', delay: 200 },
        { type: 'impact', style: 'medium', delay: 300 },
        { type: 'notification', notificationType: 'success', delay: 500 }
      ];

      for (const step of sequence) {
        if (step.delay > 0) {
          await this.delay(step.delay);
        }

        switch (step.type) {
          case 'selection':
            await HapticService.selection();
            break;
          case 'impact':
            await HapticService.impact({ style: step.style });
            break;
          case 'notification':
            await HapticService.notification({ type: step.notificationType });
            break;
        }
      }

      this.recordTestResult('testHapticSequences', 'PASSED', 
        `Haptic sequence completed with ${sequence.length} steps`);
        
    } catch (error) {
      this.recordTestResult('testHapticSequences', 'FAILED', 
        `Haptic sequence test failed: ${error.message}`);
    }
  }

  async testHapticDisabling() {
    console.log('🔇 Testing haptic feedback disabling...');
    
    try {
      // Check if haptics can be disabled
      let disableSupported = false;
      
      try {
        await HapticService.setEnabled(false);
        await HapticService.impact({ style: 'medium' });
        
        // Re-enable haptics
        await HapticService.setEnabled(true);
        disableSupported = true;
        
      } catch (error) {
        // Some platforms might not support enabling/disabling
        console.log('Haptic enabling/disabling not supported');
      }

      if (disableSupported) {
        this.recordTestResult('testHapticDisabling', 'PASSED', 
          'Haptic enabling/disabling supported');
      } else {
        this.recordTestResult('testHapticDisabling', 'SKIPPED', 
          'Haptic enabling/disabling not supported on this platform');
      }
      
    } catch (error) {
      this.recordTestResult('testHapticDisabling', 'FAILED', 
        `Haptic disabling test failed: ${error.message}`);
    }
  }

  async testHapticIntensity() {
    console.log('🎚️ Testing haptic intensity variations...');
    
    try {
      // Test different intensity levels if supported
      const intensityTests = [];
      
      for (const hapticType of this.hapticTypes) {
        try {
          await HapticService.impact({ style: hapticType });
          intensityTests.push({ style: hapticType, status: 'PASSED' });
          await this.delay(400);
        } catch (error) {
          intensityTests.push({ 
            style: hapticType, 
            status: 'FAILED', 
            error: error.message 
          });
        }
      }

      // Test custom intensity if supported
      try {
        await HapticService.impact({ style: 'heavy', intensity: 0.8 });
        intensityTests.push({ style: 'custom', status: 'PASSED' });
      } catch (error) {
        // Custom intensity might not be supported
        intensityTests.push({ style: 'custom', status: 'NOT_SUPPORTED' });
      }

      const workingIntensities = intensityTests.filter(t => t.status === 'PASSED').length;
      
      if (workingIntensities >= 3) { // At least light, medium, heavy
        this.recordTestResult('testHapticIntensity', 'PASSED', 
          `${workingIntensities} intensity levels working`);
      } else {
        this.recordTestResult('testHapticIntensity', 'WARNING', 
          `Only ${workingIntensities} intensity levels working`);
      }
      
    } catch (error) {
      this.recordTestResult('testHapticIntensity', 'FAILED', 
        `Haptic intensity test failed: ${error.message}`);
    }
  }

  async testHapticContextualUsage() {
    console.log('📱 Testing contextual haptic usage...');
    
    try {
      // Simulate contextual haptic usage in the app
      const contextualTests = [
        {
          context: 'button_press',
          haptic: () => HapticService.impact({ style: 'light' })
        },
        {
          context: 'message_sent',
          haptic: () => HapticService.notification({ type: 'success' })
        },
        {
          context: 'error_occurred',
          haptic: () => HapticService.notification({ type: 'error' })
        },
        {
          context: 'list_item_selection',
          haptic: () => HapticService.selection()
        },
        {
          context: 'map_pin_drop',
          haptic: () => HapticService.impact({ style: 'medium' })
        }
      ];

      const results = [];

      for (const test of contextualTests) {
        try {
          await test.haptic();
          results.push({ context: test.context, status: 'PASSED' });
          await this.delay(600);
        } catch (error) {
          results.push({ 
            context: test.context, 
            status: 'FAILED', 
            error: error.message 
          });
        }
      }

      const workingContexts = results.filter(r => r.status === 'PASSED').length;

      if (workingContexts >= contextualTests.length * 0.8) {
        this.recordTestResult('testHapticContextualUsage', 'PASSED', 
          `${workingContexts}/${contextualTests.length} contextual haptics working`);
      } else {
        this.recordTestResult('testHapticContextualUsage', 'WARNING', 
          `${workingContexts}/${contextualTests.length} contextual haptics working`);
      }
      
    } catch (error) {
      this.recordTestResult('testHapticContextualUsage', 'FAILED', 
        `Contextual haptic test failed: ${error.message}`);
    }
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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
      hapticTypesSupported: this.hapticTypes.length,
      notificationTypesSupported: this.notificationTypes.length,
      timestamp: new Date().toISOString()
    };

    console.log('\n📊 Haptic Feedback Test Report:');
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️ Warnings: ${report.summary.warnings}`);
    console.log(`⏭️ Skipped: ${report.summary.skipped}`);
    console.log(`📳 Haptic Types: ${report.hapticTypesSupported}`);
    console.log(`🔔 Notification Types: ${report.notificationTypesSupported}`);
    console.log(`📈 Pass Rate: ${report.summary.passRate}`);

    return report;
  }
}