/**
 * iOS Testing Report Generator
 * Creates comprehensive HTML reports with charts, screenshots, and detailed analysis
 */

import fs from 'fs/promises';
import path from 'path';

export class IOSTestReportGenerator {
  constructor() {
    this.reportsPath = './ios-testing/reports';
    this.templatePath = './ios-testing/templates';
  }

  async generateHTMLReport(testResults, options = {}) {
    console.log('📊 Generating comprehensive HTML test report...');

    const {
      includeScreenshots = true,
      includeCharts = true,
      includeDetails = true,
      theme = 'light'
    } = options;

    try {
      // Ensure reports directory exists
      await this.ensureDirectoryExists(this.reportsPath);

      // Generate report data
      const reportData = await this.processTestResults(testResults);
      
      // Generate HTML content
      const htmlContent = await this.generateHTML(reportData, {
        includeScreenshots,
        includeCharts,
        includeDetails,
        theme
      });

      // Write HTML report
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = path.join(this.reportsPath, `ios-test-report-${timestamp}.html`);
      
      await fs.writeFile(reportPath, htmlContent, 'utf8');

      // Generate JSON summary
      const jsonPath = path.join(this.reportsPath, `ios-test-summary-${timestamp}.json`);
      await fs.writeFile(jsonPath, JSON.stringify(reportData, null, 2), 'utf8');

      console.log(`✅ HTML report generated: ${reportPath}`);
      console.log(`✅ JSON summary generated: ${jsonPath}`);

      return {
        htmlReport: reportPath,
        jsonSummary: jsonPath,
        reportData
      };

    } catch (error) {
      console.error('❌ Failed to generate HTML report:', error.message);
      throw error;
    }
  }

  async processTestResults(testResults) {
    console.log('🔄 Processing test results...');

    const processedData = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(testResults),
      devices: {},
      categories: {},
      issues: [],
      performance: {},
      accessibility: {},
      screenshots: [],
      videos: []
    };

    // Process results by device
    for (const [deviceId, deviceResult] of Object.entries(testResults.deviceResults || testResults)) {
      const deviceData = {
        name: deviceResult.device?.name || deviceId,
        config: deviceResult.device,
        duration: deviceResult.duration,
        tests: {},
        summary: { total: 0, passed: 0, failed: 0, warnings: 0, skipped: 0 }
      };

      // Process test categories for this device
      for (const [category, categoryResult] of Object.entries(deviceResult.tests || {})) {
        const categoryData = await this.processCategoryResults(category, categoryResult);
        deviceData.tests[category] = categoryData;

        // Update device summary
        if (categoryData.summary) {
          deviceData.summary.total += categoryData.summary.total || 0;
          deviceData.summary.passed += categoryData.summary.passed || 0;
          deviceData.summary.failed += categoryData.summary.failed || 0;
          deviceData.summary.warnings += categoryData.summary.warnings || 0;
          deviceData.summary.skipped += categoryData.summary.skipped || 0;
        }

        // Collect issues
        if (categoryData.issues) {
          processedData.issues.push(...categoryData.issues.map(issue => ({
            ...issue,
            device: deviceId,
            category
          })));
        }

        // Collect performance data
        if (category === 'performance' && categoryData.metrics) {
          processedData.performance[deviceId] = categoryData.metrics;
        }

        // Collect accessibility data
        if (category === 'accessibility' && categoryData.accessibilityData) {
          processedData.accessibility[deviceId] = categoryData.accessibilityData;
        }
      }

      // Calculate pass rate
      deviceData.summary.passRate = deviceData.summary.total > 0 ? 
        ((deviceData.summary.passed / deviceData.summary.total) * 100).toFixed(1) : '100.0';

      processedData.devices[deviceId] = deviceData;
    }

    // Process by category across all devices
    processedData.categories = this.generateCategorySummary(processedData.devices);

    // Find screenshots and videos
    processedData.screenshots = await this.findScreenshots();
    processedData.videos = await this.findVideos();

    return processedData;
  }

  async processCategoryResults(category, categoryResult) {
    const categoryData = {
      status: categoryResult.status,
      timestamp: categoryResult.timestamp,
      summary: null,
      results: [],
      issues: [],
      metrics: null,
      accessibilityData: null
    };

    if (categoryResult.results) {
      if (categoryResult.results.summary) {
        categoryData.summary = categoryResult.results.summary;
      }

      if (categoryResult.results.results) {
        categoryData.results = categoryResult.results.results;
      }

      // Extract category-specific data
      switch (category) {
        case 'performance':
          categoryData.metrics = {
            memoryDataPoints: categoryResult.results.metrics?.memoryDataPoints || 0,
            batteryDataPoints: categoryResult.results.metrics?.batteryDataPoints || 0,
            networkDataPoints: categoryResult.results.metrics?.networkDataPoints || 0,
            renderingDataPoints: categoryResult.results.metrics?.renderingDataPoints || 0
          };
          break;

        case 'accessibility':
          categoryData.accessibilityData = {
            issues: categoryResult.results.issues || [],
            totalIssues: categoryResult.results.issues?.length || 0
          };
          categoryData.issues = categoryResult.results.issues || [];
          break;

        case 'native':
          // Process native test results
          if (typeof categoryResult.results === 'object') {
            for (const [testName, testResult] of Object.entries(categoryResult.results)) {
              if (testResult.results) {
                categoryData.results.push(...testResult.results);
              }
            }
          }
          break;
      }
    }

    return categoryData;
  }

  generateSummary(testResults) {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let warningTests = 0;
    let skippedTests = 0;
    let totalDevices = 0;

    const deviceResults = testResults.deviceResults || testResults;
    
    for (const [deviceId, deviceResult] of Object.entries(deviceResults)) {
      totalDevices++;
      
      for (const [category, categoryResult] of Object.entries(deviceResult.tests || {})) {
        if (categoryResult.results && categoryResult.results.summary) {
          const summary = categoryResult.results.summary;
          totalTests += summary.total || 0;
          passedTests += summary.passed || 0;
          failedTests += summary.failed || 0;
          warningTests += summary.warnings || 0;
          skippedTests += summary.skipped || 0;
        }
      }
    }

    return {
      totalDevices,
      totalTests,
      passedTests,
      failedTests,
      warningTests,
      skippedTests,
      passRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '100.0',
      overallStatus: this.calculateOverallStatus(passedTests, totalTests)
    };
  }

  generateCategorySummary(devices) {
    const categories = {};

    for (const [deviceId, deviceData] of Object.entries(devices)) {
      for (const [category, categoryData] of Object.entries(deviceData.tests)) {
        if (!categories[category]) {
          categories[category] = {
            total: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            skipped: 0,
            devices: []
          };
        }

        categories[category].devices.push(deviceId);

        if (categoryData.summary) {
          categories[category].total += categoryData.summary.total || 0;
          categories[category].passed += categoryData.summary.passed || 0;
          categories[category].failed += categoryData.summary.failed || 0;
          categories[category].warnings += categoryData.summary.warnings || 0;
          categories[category].skipped += categoryData.summary.skipped || 0;
        }
      }
    }

    // Calculate pass rates
    for (const category of Object.values(categories)) {
      category.passRate = category.total > 0 ? 
        ((category.passed / category.total) * 100).toFixed(1) : '100.0';
    }

    return categories;
  }

  calculateOverallStatus(passed, total) {
    if (total === 0) return 'NO_TESTS';
    
    const passRate = passed / total;
    
    if (passRate >= 0.95) return 'EXCELLENT';
    if (passRate >= 0.85) return 'GOOD';
    if (passRate >= 0.70) return 'ACCEPTABLE';
    return 'NEEDS_IMPROVEMENT';
  }

  async findScreenshots() {
    const screenshots = [];
    const screenshotsPath = path.join(this.reportsPath, 'screenshots');

    try {
      const devices = await fs.readdir(screenshotsPath);
      
      for (const device of devices) {
        const devicePath = path.join(screenshotsPath, device);
        const files = await fs.readdir(devicePath);
        
        for (const file of files) {
          if (file.endsWith('.png') || file.endsWith('.jpg')) {
            screenshots.push({
              device,
              filename: file,
              path: path.join('screenshots', device, file),
              timestamp: await this.getFileTimestamp(path.join(devicePath, file))
            });
          }
        }
      }
    } catch (error) {
      // Screenshots directory might not exist
    }

    return screenshots.sort((a, b) => b.timestamp - a.timestamp);
  }

  async findVideos() {
    const videos = [];
    const videosPath = path.join(this.reportsPath, 'videos');

    try {
      const devices = await fs.readdir(videosPath);
      
      for (const device of devices) {
        const devicePath = path.join(videosPath, device);
        const files = await fs.readdir(devicePath);
        
        for (const file of files) {
          if (file.endsWith('.mov') || file.endsWith('.mp4')) {
            videos.push({
              device,
              filename: file,
              path: path.join('videos', device, file),
              timestamp: await this.getFileTimestamp(path.join(devicePath, file))
            });
          }
        }
      }
    } catch (error) {
      // Videos directory might not exist
    }

    return videos.sort((a, b) => b.timestamp - a.timestamp);
  }

  async getFileTimestamp(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.mtime.getTime();
    } catch (error) {
      return 0;
    }
  }

  async generateHTML(reportData, options) {
    const {
      includeScreenshots = true,
      includeCharts = true,
      includeDetails = true,
      theme = 'light'
    } = options;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>iOS Testing Report - Geo Bubble Whispers</title>
    <style>
        ${this.getCSS(theme)}
    </style>
    ${includeCharts ? '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>' : ''}
</head>
<body class="${theme}">
    <div class="container">
        <header class="report-header">
            <h1>🧪 iOS Testing Report</h1>
            <h2>Geo Bubble Whispers</h2>
            <div class="timestamp">Generated: ${new Date(reportData.timestamp).toLocaleString()}</div>
            <div class="status-badge status-${reportData.summary.overallStatus.toLowerCase()}">
                ${reportData.summary.overallStatus.replace('_', ' ')}
            </div>
        </header>

        ${this.generateSummarySection(reportData.summary)}
        
        ${includeCharts ? this.generateChartsSection(reportData) : ''}
        
        ${this.generateDevicesSection(reportData.devices)}
        
        ${this.generateCategoriesSection(reportData.categories)}
        
        ${this.generateIssuesSection(reportData.issues)}
        
        ${includeScreenshots ? this.generateScreenshotsSection(reportData.screenshots) : ''}
        
        ${includeDetails ? this.generateDetailsSection(reportData) : ''}
    </div>

    <script>
        ${this.getJavaScript(reportData, includeCharts)}
    </script>
</body>
</html>`;

    return html;
  }

  generateSummarySection(summary) {
    return `
        <section class="summary-section">
            <h3>📊 Test Summary</h3>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-number">${summary.totalDevices}</div>
                    <div class="summary-label">Devices Tested</div>
                </div>
                <div class="summary-card">
                    <div class="summary-number">${summary.totalTests}</div>
                    <div class="summary-label">Total Tests</div>
                </div>
                <div class="summary-card passed">
                    <div class="summary-number">${summary.passedTests}</div>
                    <div class="summary-label">Passed</div>
                </div>
                <div class="summary-card failed">
                    <div class="summary-number">${summary.failedTests}</div>
                    <div class="summary-label">Failed</div>
                </div>
                <div class="summary-card warning">
                    <div class="summary-number">${summary.warningTests}</div>
                    <div class="summary-label">Warnings</div>
                </div>
                <div class="summary-card skipped">
                    <div class="summary-number">${summary.skippedTests}</div>
                    <div class="summary-label">Skipped</div>
                </div>
                <div class="summary-card pass-rate">
                    <div class="summary-number">${summary.passRate}%</div>
                    <div class="summary-label">Pass Rate</div>
                </div>
            </div>
        </section>`;
  }

  generateChartsSection(reportData) {
    return `
        <section class="charts-section">
            <h3>📈 Visual Analysis</h3>
            <div class="charts-grid">
                <div class="chart-container">
                    <canvas id="summaryChart" width="400" height="200"></canvas>
                    <h4>Overall Test Results</h4>
                </div>
                <div class="chart-container">
                    <canvas id="deviceChart" width="400" height="200"></canvas>
                    <h4>Results by Device</h4>
                </div>
                <div class="chart-container">
                    <canvas id="categoryChart" width="400" height="200"></canvas>
                    <h4>Results by Category</h4>
                </div>
            </div>
        </section>`;
  }

  generateDevicesSection(devices) {
    let html = `
        <section class="devices-section">
            <h3>📱 Device Results</h3>
            <div class="devices-grid">`;

    for (const [deviceId, deviceData] of Object.entries(devices)) {
      html += `
                <div class="device-card">
                    <div class="device-header">
                        <h4>${deviceData.name}</h4>
                        <div class="device-pass-rate">${deviceData.summary.passRate}%</div>
                    </div>
                    <div class="device-stats">
                        <span class="stat passed">${deviceData.summary.passed} passed</span>
                        <span class="stat failed">${deviceData.summary.failed} failed</span>
                        <span class="stat warning">${deviceData.summary.warnings} warnings</span>
                    </div>
                    <div class="device-categories">
                        ${Object.keys(deviceData.tests).map(category => 
                          `<span class="category-tag">${category}</span>`
                        ).join('')}
                    </div>
                </div>`;
    }

    html += `
            </div>
        </section>`;

    return html;
  }

  generateCategoriesSection(categories) {
    let html = `
        <section class="categories-section">
            <h3>🧪 Test Categories</h3>
            <div class="categories-list">`;

    for (const [categoryName, categoryData] of Object.entries(categories)) {
      html += `
                <div class="category-item">
                    <div class="category-header">
                        <h4>${this.getCategoryIcon(categoryName)} ${categoryName}</h4>
                        <div class="category-pass-rate">${categoryData.passRate}%</div>
                    </div>
                    <div class="category-stats">
                        <span class="stat passed">${categoryData.passed} passed</span>
                        <span class="stat failed">${categoryData.failed} failed</span>
                        <span class="stat warning">${categoryData.warnings} warnings</span>
                        <span class="devices-count">${categoryData.devices.length} devices</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${categoryData.passRate}%"></div>
                    </div>
                </div>`;
    }

    html += `
            </div>
        </section>`;

    return html;
  }

  generateIssuesSection(issues) {
    if (issues.length === 0) {
      return `
        <section class="issues-section">
            <h3>🎉 No Issues Found</h3>
            <p>All tests passed without any issues or warnings!</p>
        </section>`;
    }

    let html = `
        <section class="issues-section">
            <h3>⚠️ Issues Found (${issues.length})</h3>
            <div class="issues-list">`;

    // Group issues by severity
    const groupedIssues = issues.reduce((groups, issue) => {
      const severity = issue.severity || 'medium';
      if (!groups[severity]) groups[severity] = [];
      groups[severity].push(issue);
      return groups;
    }, {});

    for (const [severity, severityIssues] of Object.entries(groupedIssues)) {
      html += `
                <div class="issue-group">
                    <h4>${this.getSeverityIcon(severity)} ${severity.toUpperCase()} (${severityIssues.length})</h4>`;

      severityIssues.forEach(issue => {
        html += `
                    <div class="issue-item severity-${severity}">
                        <div class="issue-header">
                            <span class="issue-element">${issue.element}</span>
                            <span class="issue-device">${issue.device}</span>
                            <span class="issue-category">${issue.category}</span>
                        </div>
                        <div class="issue-description">${issue.issue}</div>
                    </div>`;
      });

      html += `</div>`;
    }

    html += `
            </div>
        </section>`;

    return html;
  }

  generateScreenshotsSection(screenshots) {
    if (screenshots.length === 0) {
      return '';
    }

    let html = `
        <section class="screenshots-section">
            <h3>📸 Screenshots (${screenshots.length})</h3>
            <div class="screenshots-grid">`;

    screenshots.slice(0, 12).forEach(screenshot => { // Limit to 12 screenshots
      html += `
                <div class="screenshot-item">
                    <img src="${screenshot.path}" alt="${screenshot.device} - ${screenshot.filename}" 
                         onclick="openScreenshot('${screenshot.path}')">
                    <div class="screenshot-info">
                        <div class="screenshot-device">${screenshot.device}</div>
                        <div class="screenshot-filename">${screenshot.filename}</div>
                    </div>
                </div>`;
    });

    html += `
            </div>
        </section>`;

    return html;
  }

  generateDetailsSection(reportData) {
    return `
        <section class="details-section">
            <h3>🔍 Detailed Results</h3>
            <div class="details-content">
                <pre><code>${JSON.stringify(reportData, null, 2)}</code></pre>
            </div>
        </section>`;
  }

  getCategoryIcon(category) {
    const icons = {
      'native': '📱',
      'performance': '⚡',
      'accessibility': '♿',
      'compatibility': '🔄',
      'integration': '🔗'
    };
    return icons[category] || '🧪';
  }

  getSeverityIcon(severity) {
    const icons = {
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢'
    };
    return icons[severity] || '⚪';
  }

  getCSS(theme) {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }

        body.dark {
            color: #e0e0e0;
            background-color: #1a1a1a;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .report-header {
            text-align: center;
            margin-bottom: 40px;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
        }

        .report-header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .report-header h2 {
            font-size: 1.5rem;
            opacity: 0.9;
            margin-bottom: 20px;
        }

        .timestamp {
            font-size: 0.9rem;
            opacity: 0.8;
            margin-bottom: 20px;
        }

        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.8rem;
        }

        .status-excellent { background-color: #4caf50; }
        .status-good { background-color: #8bc34a; }
        .status-acceptable { background-color: #ff9800; }
        .status-needs_improvement { background-color: #f44336; }

        section {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        body.dark section {
            background: #2a2a2a;
        }

        h3 {
            font-size: 1.5rem;
            margin-bottom: 20px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
        }

        .summary-card {
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            background: #f8f9fa;
            border: 2px solid #e9ecef;
        }

        body.dark .summary-card {
            background: #3a3a3a;
            border-color: #4a4a4a;
        }

        .summary-card.passed { border-color: #4caf50; }
        .summary-card.failed { border-color: #f44336; }
        .summary-card.warning { border-color: #ff9800; }
        .summary-card.skipped { border-color: #9e9e9e; }
        .summary-card.pass-rate { border-color: #667eea; }

        .summary-number {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .summary-label {
            font-size: 0.9rem;
            opacity: 0.7;
        }

        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }

        .chart-container {
            text-align: center;
        }

        .chart-container h4 {
            margin-top: 15px;
            color: #666;
        }

        .devices-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .device-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            background: #fafafa;
        }

        body.dark .device-card {
            background: #3a3a3a;
            border-color: #4a4a4a;
        }

        .device-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 15px;
        }

        .device-pass-rate {
            font-weight: bold;
            color: #667eea;
            font-size: 1.2rem;
        }

        .device-stats {
            margin-bottom: 15px;
        }

        .stat {
            display: inline-block;
            padding: 4px 8px;
            margin-right: 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
        }

        .stat.passed { background-color: #e8f5e8; color: #4caf50; }
        .stat.failed { background-color: #ffeaea; color: #f44336; }
        .stat.warning { background-color: #fff3e0; color: #ff9800; }

        .category-tag {
            display: inline-block;
            padding: 4px 8px;
            margin-right: 8px;
            background-color: #e3f2fd;
            color: #1976d2;
            border-radius: 4px;
            font-size: 0.8rem;
        }

        .categories-list {
            space-y: 15px;
        }

        .category-item {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
        }

        .category-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .progress-bar {
            height: 8px;
            background-color: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background-color: #4caf50;
            transition: width 0.3s ease;
        }

        .issues-list {
            space-y: 20px;
        }

        .issue-group {
            margin-bottom: 25px;
        }

        .issue-group h4 {
            margin-bottom: 15px;
            padding: 10px;
            background: #f5f5f5;
            border-left: 4px solid #667eea;
        }

        .issue-item {
            border-left: 4px solid #ccc;
            padding: 15px;
            background: #fafafa;
            margin-bottom: 10px;
        }

        .issue-item.severity-high { border-left-color: #f44336; }
        .issue-item.severity-medium { border-left-color: #ff9800; }
        .issue-item.severity-low { border-left-color: #4caf50; }

        .issue-header {
            display: flex;
            gap: 15px;
            margin-bottom: 8px;
            font-size: 0.9rem;
        }

        .issue-element {
            font-weight: bold;
            color: #667eea;
        }

        .issue-device,
        .issue-category {
            background: #e3f2fd;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.8rem;
        }

        .screenshots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }

        .screenshot-item {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s ease;
        }

        .screenshot-item:hover {
            transform: scale(1.02);
        }

        .screenshot-item img {
            width: 100%;
            height: 150px;
            object-fit: cover;
        }

        .screenshot-info {
            padding: 10px;
            text-align: center;
        }

        .screenshot-device {
            font-weight: bold;
            margin-bottom: 5px;
        }

        .screenshot-filename {
            font-size: 0.8rem;
            opacity: 0.7;
        }

        .details-content {
            max-height: 400px;
            overflow-y: auto;
            background: #f8f9fa;
            border-radius: 4px;
            padding: 20px;
        }

        .details-content pre {
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.85rem;
            line-height: 1.4;
        }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .summary-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .devices-grid {
                grid-template-columns: 1fr;
            }
            
            .charts-grid {
                grid-template-columns: 1fr;
            }
        }
    `;
  }

  getJavaScript(reportData, includeCharts) {
    if (!includeCharts) return '';

    return `
        // Chart.js configurations
        const chartColors = {
            passed: '#4caf50',
            failed: '#f44336',
            warning: '#ff9800',
            skipped: '#9e9e9e'
        };

        // Summary Chart
        const summaryCtx = document.getElementById('summaryChart').getContext('2d');
        new Chart(summaryCtx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Warnings', 'Skipped'],
                datasets: [{
                    data: [
                        ${reportData.summary.passedTests},
                        ${reportData.summary.failedTests},
                        ${reportData.summary.warningTests},
                        ${reportData.summary.skippedTests}
                    ],
                    backgroundColor: [
                        chartColors.passed,
                        chartColors.failed,
                        chartColors.warning,
                        chartColors.skipped
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    position: 'bottom'
                }
            }
        });

        // Device Chart
        const deviceCtx = document.getElementById('deviceChart').getContext('2d');
        const deviceLabels = [${Object.keys(reportData.devices).map(d => `'${d}'`).join(', ')}];
        const devicePassRates = [${Object.values(reportData.devices).map(d => d.summary.passRate).join(', ')}];

        new Chart(deviceCtx, {
            type: 'bar',
            data: {
                labels: deviceLabels,
                datasets: [{
                    label: 'Pass Rate (%)',
                    data: devicePassRates,
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // Category Chart
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        const categoryLabels = [${Object.keys(reportData.categories).map(c => `'${c}'`).join(', ')}];
        const categoryPassRates = [${Object.values(reportData.categories).map(c => c.passRate).join(', ')}];

        new Chart(categoryCtx, {
            type: 'radar',
            data: {
                labels: categoryLabels,
                datasets: [{
                    label: 'Pass Rate (%)',
                    data: categoryPassRates,
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: '#667eea',
                    pointBackgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scale: {
                    ticks: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // Screenshot modal
        function openScreenshot(path) {
            const modal = document.createElement('div');
            modal.style.cssText = \`
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                cursor: pointer;
            \`;
            
            const img = document.createElement('img');
            img.src = path;
            img.style.cssText = \`
                max-width: 90%;
                max-height: 90%;
                border-radius: 8px;
            \`;
            
            modal.appendChild(img);
            document.body.appendChild(modal);
            
            modal.onclick = function() {
                document.body.removeChild(modal);
            };
        }
    `;
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new IOSTestReportGenerator();
  
  async function generateReport() {
    try {
      const reportPath = process.argv[2] || './ios-testing/reports/latest-results.json';
      
      // Read test results
      const testResults = JSON.parse(await fs.readFile(reportPath, 'utf8'));
      
      // Generate HTML report
      const report = await generator.generateHTMLReport(testResults, {
        includeScreenshots: true,
        includeCharts: true,
        includeDetails: true,
        theme: 'light'
      });
      
      console.log('📊 Report generation completed!');
      console.log(`HTML Report: ${report.htmlReport}`);
      console.log(`JSON Summary: ${report.jsonSummary}`);
      
    } catch (error) {
      console.error('❌ Report generation failed:', error.message);
      process.exit(1);
    }
  }
  
  generateReport();
}

export default IOSTestReportGenerator;