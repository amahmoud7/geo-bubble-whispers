#!/usr/bin/env node

/**
 * Main iOS Test Execution Script
 * Entry point for running iOS tests with command line arguments
 */

import IOSTestRunner from './test-runner.js';
import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
  devices: ['iphone-15-pro'], // Default device
  testCategories: ['native', 'performance', 'accessibility'], // Default categories
  outputPath: './ios-testing/reports',
  verbose: false,
  parallel: false
};

// Parse arguments
args.forEach((arg, index) => {
  switch (arg) {
    case '--devices':
      if (args[index + 1] && !args[index + 1].startsWith('--')) {
        const deviceArg = args[index + 1];
        if (deviceArg === 'all') {
          config.devices = ['iphone-se', 'iphone-15-pro', 'iphone-15-pro-max', 'ipad-air'];
        } else {
          config.devices = deviceArg.split(',');
        }
      }
      break;
    
    case '--category':
      if (args[index + 1] && !args[index + 1].startsWith('--')) {
        config.testCategories = [args[index + 1]];
      }
      break;
    
    case '--categories':
      if (args[index + 1] && !args[index + 1].startsWith('--')) {
        config.testCategories = args[index + 1].split(',');
      }
      break;
    
    case '--output':
      if (args[index + 1] && !args[index + 1].startsWith('--')) {
        config.outputPath = args[index + 1];
      }
      break;
    
    case '--verbose':
      config.verbose = true;
      break;
    
    case '--parallel':
      config.parallel = true;
      break;
    
    case '--help':
      showHelp();
      process.exit(0);
      break;
  }
});

function showHelp() {
  console.log(`
iOS Testing Suite for Geo Bubble Whispers

Usage: node run-tests.js [options]

Options:
  --devices <devices>     Comma-separated list of devices to test on
                         Options: iphone-se, iphone-15-pro, iphone-15-pro-max, ipad-air
                         Use 'all' to test on all devices
                         Default: iphone-15-pro

  --category <category>   Single test category to run
                         Options: native, performance, accessibility, integration

  --categories <cats>     Comma-separated list of test categories
                         Default: native,performance,accessibility

  --output <path>        Output directory for test reports
                         Default: ./ios-testing/reports

  --verbose              Enable verbose output and detailed logging

  --parallel             Run tests in parallel across devices

  --help                 Show this help message

Examples:
  node run-tests.js --devices all --verbose
  node run-tests.js --category native --devices iphone-15-pro
  node run-tests.js --categories native,performance --parallel
  node run-tests.js --devices iphone-se,ipad-air --output ./custom-reports
`);
}

async function main() {
  console.log('🚀 iOS Testing Suite Starting...');
  console.log('====================================');
  
  // Validate configuration
  if (!validateConfig(config)) {
    process.exit(1);
  }

  // Create output directories
  ensureDirectories(config.outputPath);

  // Initialize test runner
  const testRunner = new IOSTestRunner(config);

  try {
    // Run tests
    const startTime = Date.now();
    const report = await testRunner.runAllTests();
    const endTime = Date.now();

    // Save reports
    await saveReports(report, config.outputPath);

    // Display summary
    displaySummary(report, endTime - startTime);

    // Exit with appropriate code
    const hasFailures = report.summary.statistics.failedTests > 0;
    process.exit(hasFailures ? 1 : 0);

  } catch (error) {
    console.error('❌ Testing failed with error:', error);
    process.exit(1);
  }
}

function validateConfig(config) {
  const validDevices = ['iphone-se', 'iphone-15-pro', 'iphone-15-pro-max', 'ipad-air'];
  const validCategories = ['native', 'performance', 'accessibility', 'integration'];

  // Validate devices
  for (const device of config.devices) {
    if (!validDevices.includes(device)) {
      console.error(`❌ Invalid device: ${device}`);
      console.error(`   Valid devices: ${validDevices.join(', ')}`);
      return false;
    }
  }

  // Validate categories
  for (const category of config.testCategories) {
    if (!validCategories.includes(category)) {
      console.error(`❌ Invalid test category: ${category}`);
      console.error(`   Valid categories: ${validCategories.join(', ')}`);
      return false;
    }
  }

  // Validate output path
  try {
    if (!fs.existsSync(path.dirname(config.outputPath))) {
      console.error(`❌ Output directory parent does not exist: ${path.dirname(config.outputPath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Invalid output path: ${config.outputPath}`);
    return false;
  }

  return true;
}

function ensureDirectories(outputPath) {
  const directories = [
    outputPath,
    path.join(outputPath, 'screenshots'),
    path.join(outputPath, 'videos'),
    path.join(outputPath, 'logs'),
    path.join(outputPath, 'json')
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

async function saveReports(report, outputPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    // Save JSON report
    const jsonPath = path.join(outputPath, 'json', `ios-test-report-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report saved: ${jsonPath}`);

    // Save HTML report
    const htmlReport = generateHTMLReport(report);
    const htmlPath = path.join(outputPath, `ios-test-report-${timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    console.log(`📄 HTML report saved: ${htmlPath}`);

    // Save summary report
    const summaryPath = path.join(outputPath, `test-summary-${timestamp}.txt`);
    const summaryText = generateSummaryReport(report);
    fs.writeFileSync(summaryPath, summaryText);
    console.log(`📄 Summary report saved: ${summaryPath}`);

  } catch (error) {
    console.error('❌ Failed to save reports:', error);
  }
}

function generateHTMLReport(report) {
  const { summary, deviceResults } = report;
  const timestamp = new Date(report.timestamp).toLocaleString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>iOS Test Report - Geo Bubble Whispers</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { color: #1d4ed8; margin: 0; font-size: 2.5em; }
        .header p { color: #6b7280; margin: 10px 0 0 0; font-size: 1.1em; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
        .stat-card h3 { margin: 0 0 10px 0; font-size: 2em; }
        .stat-card p { margin: 0; opacity: 0.9; }
        .status-excellent { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); }
        .status-good { background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); }
        .status-warning { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); }
        .status-failed { background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); }
        .device-results { margin-top: 30px; }
        .device-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
        .device-header { background: #edf2f7; padding: 15px 20px; border-bottom: 1px solid #e2e8f0; }
        .device-header h3 { margin: 0; color: #2d3748; }
        .test-category { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; }
        .test-category:last-child { border-bottom: none; }
        .test-category h4 { margin: 0 0 10px 0; color: #4a5568; }
        .test-results { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
        .test-result { padding: 8px 12px; border-radius: 6px; text-align: center; font-size: 0.9em; }
        .test-passed { background: #c6f6d5; color: #22543d; }
        .test-failed { background: #fed7d7; color: #742a2a; }
        .test-warning { background: #fefcbf; color: #744210; }
        .test-skipped { background: #e2e8f0; color: #4a5568; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📱 iOS Test Report</h1>
            <p>Geo Bubble Whispers - ${timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card status-${summary.overallStatus.toLowerCase()}">
                <h3>${summary.overallStatus}</h3>
                <p>Overall Status</p>
            </div>
            <div class="stat-card">
                <h3>${summary.totalDevices}</h3>
                <p>Devices Tested</p>
            </div>
            <div class="stat-card">
                <h3>${summary.statistics.passRate}</h3>
                <p>Pass Rate</p>
            </div>
            <div class="stat-card">
                <h3>${Math.round(summary.totalDuration / 1000)}s</h3>
                <p>Total Duration</p>
            </div>
        </div>

        <div class="device-results">
            ${Object.entries(deviceResults).map(([deviceName, deviceResult]) => `
                <div class="device-card">
                    <div class="device-header">
                        <h3>📱 ${deviceResult.device.name}</h3>
                    </div>
                    ${Object.entries(deviceResult.tests).map(([category, categoryResult]) => `
                        <div class="test-category">
                            <h4>🧪 ${category.charAt(0).toUpperCase() + category.slice(1)} Tests</h4>
                            <div class="test-results">
                                ${categoryResult.results && categoryResult.results.results ? 
                                    categoryResult.results.results.map(result => `
                                        <div class="test-result test-${result.status.toLowerCase()}">
                                            ${result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : result.status === 'WARNING' ? '⚠️' : '⏭️'} 
                                            ${result.test}
                                        </div>
                                    `).join('') : 
                                    '<div class="test-result test-skipped">No detailed results</div>'
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>Generated by iOS Testing Suite for Geo Bubble Whispers</p>
            <p>Report ID: ${report.timestamp}</p>
        </div>
    </div>
</body>
</html>`;
}

function generateSummaryReport(report) {
  const { summary, deviceResults } = report;
  
  let summaryText = `
iOS TEST REPORT SUMMARY
=======================
Generated: ${new Date(report.timestamp).toLocaleString()}

OVERALL RESULTS
---------------
Status: ${summary.overallStatus}
Devices Tested: ${summary.totalDevices}
Test Categories: ${summary.testCategories.join(', ')}
Total Duration: ${Math.round(summary.totalDuration / 1000)} seconds

STATISTICS
----------
Total Tests: ${summary.statistics.totalTests}
Passed: ${summary.statistics.passedTests}
Failed: ${summary.statistics.failedTests}
Warnings: ${summary.statistics.warningTests}
Skipped: ${summary.statistics.skippedTests}
Pass Rate: ${summary.statistics.passRate}

DEVICE RESULTS
--------------
`;

  Object.entries(deviceResults).forEach(([deviceName, deviceResult]) => {
    summaryText += `
${deviceResult.device.name}:
  Duration: ${Math.round(deviceResult.duration / 1000)} seconds
  Test Categories: ${Object.keys(deviceResult.tests).join(', ')}
`;
  });

  return summaryText;
}

function displaySummary(report, duration) {
  const { summary } = report;
  
  console.log('\n🎉 iOS Testing Suite Completed!');
  console.log('================================');
  console.log(`🎯 Overall Status: ${summary.overallStatus}`);
  console.log(`📱 Devices Tested: ${summary.totalDevices}`);
  console.log(`⏱️ Total Duration: ${Math.round(duration / 1000)} seconds`);
  console.log(`📊 Statistics:`);
  console.log(`   Total Tests: ${summary.statistics.totalTests}`);
  console.log(`   ✅ Passed: ${summary.statistics.passedTests}`);
  console.log(`   ❌ Failed: ${summary.statistics.failedTests}`);
  console.log(`   ⚠️ Warnings: ${summary.statistics.warningTests}`);
  console.log(`   ⏭️ Skipped: ${summary.statistics.skippedTests}`);
  console.log(`   📈 Pass Rate: ${summary.statistics.passRate}`);
  
  if (summary.statistics.failedTests > 0) {
    console.log('\n⚠️ Some tests failed. Check the detailed reports for more information.');
  } else if (summary.statistics.warningTests > 0) {
    console.log('\n⚠️ All tests passed but some had warnings. Review the reports for details.');
  } else {
    console.log('\n✅ All tests passed successfully!');
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});