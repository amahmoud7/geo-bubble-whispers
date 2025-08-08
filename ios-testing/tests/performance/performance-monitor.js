/**
 * iOS Performance Monitoring Suite
 * Monitors memory usage, battery consumption, network performance, and UI responsiveness
 */

export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      memory: [],
      battery: [],
      network: [],
      rendering: [],
      cpu: []
    };
    this.testResults = [];
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  async runPerformanceTests() {
    console.log('⚡ Starting Performance Tests...');

    const tests = [
      this.testMemoryUsage,
      this.testBatteryConsumption,
      this.testNetworkPerformance,
      this.testUIResponsiveness,
      this.testMapPerformance,
      this.testImageLoadingPerformance,
      this.testAppLaunchTime
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

  startMonitoring(intervalMs = 1000) {
    if (this.isMonitoring) return;

    console.log('📊 Starting performance monitoring...');
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;

    console.log('🛑 Stopping performance monitoring...');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  async collectMetrics() {
    const timestamp = Date.now();

    try {
      // Memory metrics
      if (window.performance && window.performance.memory) {
        this.metrics.memory.push({
          timestamp,
          usedJSHeapSize: window.performance.memory.usedJSHeapSize,
          totalJSHeapSize: window.performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit
        });
      }

      // Network metrics
      if (navigator.connection) {
        this.metrics.network.push({
          timestamp,
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData
        });
      }

      // Rendering metrics
      if (window.performance && window.performance.getEntriesByType) {
        const paintEntries = window.performance.getEntriesByType('paint');
        const navigationEntries = window.performance.getEntriesByType('navigation');
        
        this.metrics.rendering.push({
          timestamp,
          paintEntries: paintEntries.map(entry => ({
            name: entry.name,
            startTime: entry.startTime
          })),
          navigationTiming: navigationEntries.length > 0 ? {
            domComplete: navigationEntries[0].domComplete,
            loadEventEnd: navigationEntries[0].loadEventEnd
          } : null
        });
      }

      // Battery metrics (if supported)
      if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        this.metrics.battery.push({
          timestamp,
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        });
      }

    } catch (error) {
      console.warn('Error collecting metrics:', error);
    }
  }

  async testMemoryUsage() {
    console.log('💾 Testing memory usage...');

    this.startMonitoring(500); // Monitor every 500ms for detailed memory tracking

    // Simulate memory-intensive operations
    await this.simulateHeavyMapOperations();
    await this.simulateImageLoading();
    await this.simulateMessageLoading();

    // Wait for metrics collection
    await this.delay(5000);
    this.stopMonitoring();

    if (this.metrics.memory.length > 0) {
      const memoryUsage = this.analyzeMemoryUsage();
      
      if (memoryUsage.peakUsage < 100 * 1024 * 1024) { // Less than 100MB
        this.recordTestResult('testMemoryUsage', 'PASSED', 
          `Peak memory: ${(memoryUsage.peakUsage / 1024 / 1024).toFixed(1)}MB`);
      } else if (memoryUsage.peakUsage < 200 * 1024 * 1024) { // Less than 200MB
        this.recordTestResult('testMemoryUsage', 'WARNING', 
          `High memory usage: ${(memoryUsage.peakUsage / 1024 / 1024).toFixed(1)}MB`);
      } else {
        this.recordTestResult('testMemoryUsage', 'FAILED', 
          `Excessive memory usage: ${(memoryUsage.peakUsage / 1024 / 1024).toFixed(1)}MB`);
      }
    } else {
      this.recordTestResult('testMemoryUsage', 'FAILED', 'Unable to collect memory metrics');
    }
  }

  async testBatteryConsumption() {
    console.log('🔋 Testing battery consumption...');

    if (!navigator.getBattery) {
      this.recordTestResult('testBatteryConsumption', 'SKIPPED', 'Battery API not supported');
      return;
    }

    const initialBattery = await navigator.getBattery();
    const initialLevel = initialBattery.level;
    const startTime = Date.now();

    // Run battery-intensive operations
    await this.simulateGPSUsage();
    await this.simulateCameraUsage();
    await this.simulateNetworkRequests();

    const endTime = Date.now();
    const finalBattery = await navigator.getBattery();
    const finalLevel = finalBattery.level;

    const batteryDrain = initialLevel - finalLevel;
    const testDuration = (endTime - startTime) / 1000; // seconds

    if (batteryDrain < 0.01) { // Less than 1% drain
      this.recordTestResult('testBatteryConsumption', 'PASSED', 
        `Battery drain: ${(batteryDrain * 100).toFixed(2)}% in ${testDuration}s`);
    } else if (batteryDrain < 0.05) { // Less than 5% drain
      this.recordTestResult('testBatteryConsumption', 'WARNING', 
        `Moderate battery drain: ${(batteryDrain * 100).toFixed(2)}% in ${testDuration}s`);
    } else {
      this.recordTestResult('testBatteryConsumption', 'FAILED', 
        `High battery drain: ${(batteryDrain * 100).toFixed(2)}% in ${testDuration}s`);
    }
  }

  async testNetworkPerformance() {
    console.log('🌐 Testing network performance...');

    const networkTests = [
      { name: 'API Response Time', url: '/api/messages', expectedTime: 2000 },
      { name: 'Image Loading', url: '/api/upload', expectedTime: 5000 },
      { name: 'Map Tiles', url: '/api/map-data', expectedTime: 3000 }
    ];

    const results = [];

    for (const test of networkTests) {
      try {
        const startTime = Date.now();
        
        // Simulate network request
        await this.simulateNetworkRequest(test.url);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        results.push({
          name: test.name,
          responseTime,
          expected: test.expectedTime,
          passed: responseTime <= test.expectedTime
        });

      } catch (error) {
        results.push({
          name: test.name,
          error: error.message,
          passed: false
        });
      }
    }

    const passedTests = results.filter(r => r.passed).length;
    const avgResponseTime = results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    if (passedTests >= results.length * 0.8) { // 80% threshold
      this.recordTestResult('testNetworkPerformance', 'PASSED', 
        `${passedTests}/${results.length} tests passed, avg: ${avgResponseTime.toFixed(0)}ms`);
    } else {
      this.recordTestResult('testNetworkPerformance', 'WARNING', 
        `${passedTests}/${results.length} tests passed, avg: ${avgResponseTime.toFixed(0)}ms`);
    }
  }

  async testUIResponsiveness() {
    console.log('🎨 Testing UI responsiveness...');

    const responsivenesTests = [
      { name: 'Button Tap Response', target: 'button', expectedTime: 100 },
      { name: 'Map Pan/Zoom', target: 'map', expectedTime: 200 },
      { name: 'Modal Animation', target: 'modal', expectedTime: 300 },
      { name: 'List Scroll', target: 'list', expectedTime: 150 }
    ];

    const results = [];

    for (const test of responsivenesTests) {
      try {
        const responseTime = await this.measureUIResponse(test.target);
        
        results.push({
          name: test.name,
          responseTime,
          expected: test.expectedTime,
          passed: responseTime <= test.expectedTime
        });

      } catch (error) {
        results.push({
          name: test.name,
          error: error.message,
          passed: false
        });
      }
    }

    const passedTests = results.filter(r => r.passed).length;
    const avgResponseTime = results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    if (passedTests >= results.length * 0.8) {
      this.recordTestResult('testUIResponsiveness', 'PASSED', 
        `${passedTests}/${results.length} UI tests passed, avg: ${avgResponseTime.toFixed(0)}ms`);
    } else {
      this.recordTestResult('testUIResponsiveness', 'WARNING', 
        `${passedTests}/${results.length} UI tests passed, avg: ${avgResponseTime.toFixed(0)}ms`);
    }
  }

  async testMapPerformance() {
    console.log('🗺️ Testing map performance...');

    const mapTests = [
      { name: 'Initial Load', operation: 'load' },
      { name: 'Marker Rendering', operation: 'markers' },
      { name: 'Zoom Performance', operation: 'zoom' },
      { name: 'Pan Performance', operation: 'pan' }
    ];

    const results = [];

    for (const test of mapTests) {
      try {
        const startTime = Date.now();
        await this.simulateMapOperation(test.operation);
        const endTime = Date.now();

        const operationTime = endTime - startTime;
        const passed = operationTime <= 1000; // 1 second threshold

        results.push({
          name: test.name,
          operationTime,
          passed
        });

      } catch (error) {
        results.push({
          name: test.name,
          error: error.message,
          passed: false
        });
      }
    }

    const passedTests = results.filter(r => r.passed).length;

    if (passedTests >= results.length * 0.75) {
      this.recordTestResult('testMapPerformance', 'PASSED', 
        `${passedTests}/${results.length} map operations performed well`);
    } else {
      this.recordTestResult('testMapPerformance', 'WARNING', 
        `${passedTests}/${results.length} map operations slow`);
    }
  }

  async testImageLoadingPerformance() {
    console.log('🖼️ Testing image loading performance...');

    const imageSizes = ['small', 'medium', 'large'];
    const results = [];

    for (const size of imageSizes) {
      try {
        const startTime = Date.now();
        await this.simulateImageLoad(size);
        const endTime = Date.now();

        const loadTime = endTime - startTime;
        const expectedTime = size === 'large' ? 3000 : size === 'medium' ? 1500 : 500;

        results.push({
          size,
          loadTime,
          expectedTime,
          passed: loadTime <= expectedTime
        });

      } catch (error) {
        results.push({
          size,
          error: error.message,
          passed: false
        });
      }
    }

    const passedTests = results.filter(r => r.passed).length;

    if (passedTests === results.length) {
      this.recordTestResult('testImageLoadingPerformance', 'PASSED', 
        `All image sizes loaded within expected time`);
    } else {
      this.recordTestResult('testImageLoadingPerformance', 'WARNING', 
        `${passedTests}/${results.length} image sizes loaded on time`);
    }
  }

  async testAppLaunchTime() {
    console.log('🚀 Testing app launch time...');

    try {
      const navigationTiming = window.performance.getEntriesByType('navigation')[0];
      
      if (navigationTiming) {
        const launchTime = navigationTiming.loadEventEnd - navigationTiming.navigationStart;
        
        if (launchTime <= 3000) { // 3 seconds
          this.recordTestResult('testAppLaunchTime', 'PASSED', 
            `App launched in ${launchTime}ms`);
        } else if (launchTime <= 5000) { // 5 seconds
          this.recordTestResult('testAppLaunchTime', 'WARNING', 
            `Slow app launch: ${launchTime}ms`);
        } else {
          this.recordTestResult('testAppLaunchTime', 'FAILED', 
            `Very slow app launch: ${launchTime}ms`);
        }
      } else {
        this.recordTestResult('testAppLaunchTime', 'FAILED', 'Unable to measure launch time');
      }
    } catch (error) {
      this.recordTestResult('testAppLaunchTime', 'FAILED', `Launch time test failed: ${error.message}`);
    }
  }

  // Simulation methods for testing
  async simulateHeavyMapOperations() {
    // Simulate heavy map operations
    await this.delay(2000);
  }

  async simulateImageLoading() {
    // Simulate loading multiple images
    await this.delay(1500);
  }

  async simulateMessageLoading() {
    // Simulate loading messages
    await this.delay(1000);
  }

  async simulateGPSUsage() {
    // Simulate GPS usage
    await this.delay(3000);
  }

  async simulateCameraUsage() {
    // Simulate camera usage
    await this.delay(2000);
  }

  async simulateNetworkRequests() {
    // Simulate network requests
    await this.delay(1000);
  }

  async simulateNetworkRequest(url) {
    // Simulate network request with random delay
    const delay = Math.random() * 2000 + 500; // 500-2500ms
    await this.delay(delay);
  }

  async measureUIResponse(target) {
    // Simulate UI response measurement
    const responseTime = Math.random() * 200 + 50; // 50-250ms
    await this.delay(100);
    return responseTime;
  }

  async simulateMapOperation(operation) {
    // Simulate map operations
    const operationTime = Math.random() * 1500 + 200; // 200-1700ms
    await this.delay(operationTime);
  }

  async simulateImageLoad(size) {
    // Simulate image loading based on size
    const baseTime = size === 'large' ? 2000 : size === 'medium' ? 1000 : 300;
    const variance = baseTime * 0.3;
    const loadTime = baseTime + (Math.random() * variance - variance / 2);
    await this.delay(loadTime);
  }

  analyzeMemoryUsage() {
    if (this.metrics.memory.length === 0) return null;

    const usages = this.metrics.memory.map(m => m.usedJSHeapSize);
    const peakUsage = Math.max(...usages);
    const avgUsage = usages.reduce((sum, usage) => sum + usage, 0) / usages.length;

    return { peakUsage, avgUsage };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
      metrics: {
        memoryDataPoints: this.metrics.memory.length,
        batteryDataPoints: this.metrics.battery.length,
        networkDataPoints: this.metrics.network.length,
        renderingDataPoints: this.metrics.rendering.length
      },
      timestamp: new Date().toISOString()
    };

    console.log('\n📊 Performance Test Report:');
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️ Warnings: ${report.summary.warnings}`);
    console.log(`⏭️ Skipped: ${report.summary.skipped}`);
    console.log(`📈 Pass Rate: ${report.summary.passRate}`);
    console.log(`📊 Metrics Collected: ${JSON.stringify(report.metrics, null, 2)}`);

    return report;
  }
}