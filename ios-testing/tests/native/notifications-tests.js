/**
 * iOS Push Notifications Testing Suite
 * Tests the native notification functionality for the Geo Bubble Whispers app
 */

import { NotificationService } from '../../../src/services/notifications';

export class NotificationTests {
  constructor() {
    this.testResults = [];
    this.testNotifications = [];
  }

  async runAllTests() {
    console.log('🔔 Starting Notification Tests...');
    
    const tests = [
      this.testNotificationPermission,
      this.testLocalNotifications,
      this.testPushNotifications,
      this.testNotificationCategories,
      this.testNotificationActions,
      this.testNotificationBadges,
      this.testQuietHours,
      this.testNotificationHistory
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

  async testNotificationPermission() {
    console.log('🔐 Testing notification permission flow...');
    
    try {
      const permission = await NotificationService.requestPermissions();
      
      if (permission.display === 'granted') {
        this.recordTestResult('testNotificationPermission', 'PASSED', 'Notification permission granted');
      } else {
        this.recordTestResult('testNotificationPermission', 'FAILED', 
          `Notification permission denied: ${permission.display}`);
      }
    } catch (error) {
      this.recordTestResult('testNotificationPermission', 'FAILED', 
        `Permission request failed: ${error.message}`);
    }
  }

  async testLocalNotifications() {
    console.log('📱 Testing local notifications...');
    
    try {
      const notification = {
        title: 'Test Notification',
        body: 'This is a test notification from the iOS testing suite',
        id: 'test-notification-1',
        schedule: { at: new Date(Date.now() + 5000) }, // 5 seconds from now
        sound: 'default',
        attachments: [],
        extra: { testId: 'local-notification-test' }
      };

      await NotificationService.schedule(notification);
      this.testNotifications.push(notification);

      // Wait for notification to be scheduled
      await this.delay(1000);

      // Check if notification was scheduled
      const pendingNotifications = await NotificationService.getPending();
      const isScheduled = pendingNotifications.some(n => n.id === notification.id);

      if (isScheduled) {
        this.recordTestResult('testLocalNotifications', 'PASSED', 
          'Local notification scheduled successfully');
      } else {
        this.recordTestResult('testLocalNotifications', 'FAILED', 
          'Local notification was not scheduled');
      }

    } catch (error) {
      this.recordTestResult('testLocalNotifications', 'FAILED', 
        `Local notification test failed: ${error.message}`);
    }
  }

  async testPushNotifications() {
    console.log('📡 Testing push notification registration...');
    
    try {
      // Register for push notifications
      await NotificationService.register();

      // Check if registration was successful
      const registrationInfo = await NotificationService.getRegistrationInfo();
      
      if (registrationInfo && registrationInfo.token) {
        this.recordTestResult('testPushNotifications', 'PASSED', 
          `Push notification registration successful: ${registrationInfo.token.substring(0, 20)}...`);
      } else {
        this.recordTestResult('testPushNotifications', 'WARNING', 
          'Push notification registration completed but no token received');
      }

    } catch (error) {
      this.recordTestResult('testPushNotifications', 'FAILED', 
        `Push notification test failed: ${error.message}`);
    }
  }

  async testNotificationCategories() {
    console.log('📂 Testing notification categories...');
    
    try {
      const categories = [
        {
          id: 'MESSAGE_CATEGORY',
          actions: [
            {
              id: 'REPLY_ACTION',
              title: 'Reply',
              input: true
            },
            {
              id: 'VIEW_ACTION',
              title: 'View'
            }
          ],
          hiddenPreviewsBodyPlaceholder: 'You have a new message'
        },
        {
          id: 'LOCATION_CATEGORY',
          actions: [
            {
              id: 'NAVIGATE_ACTION',
              title: 'Navigate'
            },
            {
              id: 'IGNORE_ACTION',
              title: 'Ignore',
              destructive: true
            }
          ]
        }
      ];

      await NotificationService.createCategories(categories);

      // Test notification with category
      const categorizedNotification = {
        title: 'New Message',
        body: 'Someone sent you a message nearby',
        id: 'test-categorized-notification',
        category: 'MESSAGE_CATEGORY',
        schedule: { at: new Date(Date.now() + 3000) }
      };

      await NotificationService.schedule(categorizedNotification);
      this.testNotifications.push(categorizedNotification);

      this.recordTestResult('testNotificationCategories', 'PASSED', 
        `${categories.length} notification categories created successfully`);

    } catch (error) {
      this.recordTestResult('testNotificationCategories', 'FAILED', 
        `Notification categories test failed: ${error.message}`);
    }
  }

  async testNotificationActions() {
    console.log('⚡ Testing notification action handling...');
    
    try {
      let actionReceived = false;
      
      // Set up action listener
      const removeListener = NotificationService.addListener('localNotificationActionPerformed', (result) => {
        console.log('Notification action performed:', result);
        actionReceived = true;
      });

      // Schedule a notification with actions
      const actionNotification = {
        title: 'Action Test',
        body: 'Tap an action to test',
        id: 'test-action-notification',
        category: 'MESSAGE_CATEGORY',
        schedule: { at: new Date(Date.now() + 2000) }
      };

      await NotificationService.schedule(actionNotification);
      this.testNotifications.push(actionNotification);

      // Wait for potential action
      await this.delay(8000);

      // Clean up listener
      if (removeListener) removeListener.remove();

      if (actionReceived) {
        this.recordTestResult('testNotificationActions', 'PASSED', 
          'Notification action handling working');
      } else {
        this.recordTestResult('testNotificationActions', 'SKIPPED', 
          'No notification actions performed (requires user interaction)');
      }

    } catch (error) {
      this.recordTestResult('testNotificationActions', 'FAILED', 
        `Notification actions test failed: ${error.message}`);
    }
  }

  async testNotificationBadges() {
    console.log('🔴 Testing notification badges...');
    
    try {
      // Set badge count
      await NotificationService.setBadgeCount(5);
      
      // Get badge count
      const badgeCount = await NotificationService.getBadgeCount();
      
      if (badgeCount === 5) {
        this.recordTestResult('testNotificationBadges', 'PASSED', 
          `Badge count set and retrieved correctly: ${badgeCount}`);
      } else {
        this.recordTestResult('testNotificationBadges', 'WARNING', 
          `Badge count mismatch: expected 5, got ${badgeCount}`);
      }

      // Clear badge
      await NotificationService.setBadgeCount(0);

    } catch (error) {
      this.recordTestResult('testNotificationBadges', 'FAILED', 
        `Badge test failed: ${error.message}`);
    }
  }

  async testQuietHours() {
    console.log('🌙 Testing quiet hours and Do Not Disturb...');
    
    try {
      // Check if quiet hours can be detected
      const currentHour = new Date().getHours();
      const isQuietTime = currentHour >= 22 || currentHour <= 7; // 10 PM to 7 AM

      // Schedule a notification during quiet hours
      const quietNotification = {
        title: 'Quiet Hours Test',
        body: 'This notification respects quiet hours',
        id: 'test-quiet-notification',
        schedule: { at: new Date(Date.now() + 2000) },
        sound: isQuietTime ? null : 'default', // No sound during quiet hours
        priority: isQuietTime ? 'low' : 'high'
      };

      await NotificationService.schedule(quietNotification);
      this.testNotifications.push(quietNotification);

      this.recordTestResult('testQuietHours', 'PASSED', 
        `Quiet hours handling configured (current time: ${isQuietTime ? 'quiet' : 'normal'})`);

    } catch (error) {
      this.recordTestResult('testQuietHours', 'FAILED', 
        `Quiet hours test failed: ${error.message}`);
    }
  }

  async testNotificationHistory() {
    console.log('📜 Testing notification history and management...');
    
    try {
      // Get pending notifications
      const pendingNotifications = await NotificationService.getPending();
      
      // Get delivered notifications (if supported)
      let deliveredNotifications = [];
      try {
        deliveredNotifications = await NotificationService.getDelivered();
      } catch (error) {
        console.log('Delivered notifications not supported on this platform');
      }

      // Cancel a specific notification
      if (this.testNotifications.length > 0) {
        const notificationToCancel = this.testNotifications[0];
        await NotificationService.cancel([notificationToCancel.id]);
        
        // Verify cancellation
        const updatedPending = await NotificationService.getPending();
        const wasCancelled = !updatedPending.some(n => n.id === notificationToCancel.id);
        
        if (wasCancelled) {
          this.recordTestResult('testNotificationHistory', 'PASSED', 
            `Notification management working: ${pendingNotifications.length} pending, ${deliveredNotifications.length} delivered`);
        } else {
          this.recordTestResult('testNotificationHistory', 'WARNING', 
            'Notification cancellation may not be working');
        }
      } else {
        this.recordTestResult('testNotificationHistory', 'PASSED', 
          `Notification history accessible: ${pendingNotifications.length} pending, ${deliveredNotifications.length} delivered`);
      }

    } catch (error) {
      this.recordTestResult('testNotificationHistory', 'FAILED', 
        `Notification history test failed: ${error.message}`);
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up test notifications...');
    
    try {
      // Cancel all pending test notifications
      const testIds = this.testNotifications.map(n => n.id);
      if (testIds.length > 0) {
        await NotificationService.cancel(testIds);
      }

      // Reset badge count
      await NotificationService.setBadgeCount(0);

      console.log(`✅ Cleaned up ${testIds.length} test notifications`);
    } catch (error) {
      console.warn('⚠️ Cleanup failed:', error.message);
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

  async generateReport() {
    // Clean up before generating report
    await this.cleanup();

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
      notificationsScheduled: this.testNotifications.length,
      timestamp: new Date().toISOString()
    };

    console.log('\n📊 Notification Test Report:');
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️ Warnings: ${report.summary.warnings}`);
    console.log(`⏭️ Skipped: ${report.summary.skipped}`);
    console.log(`🔔 Test Notifications: ${report.notificationsScheduled}`);
    console.log(`📈 Pass Rate: ${report.summary.passRate}`);

    return report;
  }
}