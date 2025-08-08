#!/usr/bin/env node

/**
 * Test Results Consolidation Script
 * Consolidates test results from multiple devices and test runs
 */

import fs from 'fs/promises';
import path from 'path';

class TestResultsConsolidator {
  constructor() {
    this.consolidatedResults = {
      timestamp: new Date().toISOString(),
      summary: {
        totalDevices: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        warningTests: 0,
        skippedTests: 0,
        passRate: '0.0',
        overallStatus: 'NO_TESTS'
      },
      deviceResults: {},
      categories: {},
      issues: [],
      screenshots: [],
      videos: []
    };
  }

  async consolidateResults(resultsDirectory) {
    console.log(`🔄 Consolidating test results from: ${resultsDirectory}`);

    try {
      // Find all test result files
      const resultFiles = await this.findResultFiles(resultsDirectory);
      console.log(`📁 Found ${resultFiles.length} result files`);

      // Process each result file
      for (const resultFile of resultFiles) {
        try {
          console.log(`📋 Processing: ${resultFile.path}`);
          await this.processResultFile(resultFile);
        } catch (error) {
          console.warn(`⚠️ Could not process ${resultFile.path}: ${error.message}`);
        }
      }

      // Calculate consolidated summary
      this.calculateConsolidatedSummary();

      // Save consolidated results
      const outputPath = path.join('./ios-testing/reports', 'consolidated-results.json');
      await fs.writeFile(outputPath, JSON.stringify(this.consolidatedResults, null, 2), 'utf8');

      console.log(`✅ Consolidated results saved to: ${outputPath}`);
      
      // Also save as latest results for report generation
      const latestPath = path.join('./ios-testing/reports', 'latest-results.json');
      await fs.writeFile(latestPath, JSON.stringify(this.consolidatedResults, null, 2), 'utf8');

      return this.consolidatedResults;

    } catch (error) {
      console.error('❌ Failed to consolidate results:', error.message);
      throw error;
    }
  }

  async findResultFiles(directory) {
    const resultFiles = [];

    async function searchDirectory(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await searchDirectory(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.json')) {
            // Skip our own output files
            if (!entry.name.includes('consolidated') && 
                !entry.name.includes('latest-results') &&
                !entry.name.includes('test-summary')) {
              
              const stats = await fs.stat(fullPath);
              resultFiles.push({
                path: fullPath,
                name: entry.name,
                directory: path.dirname(fullPath),
                size: stats.size,
                mtime: stats.mtime
              });
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not read directory ${dir}: ${error.message}`);
      }
    }

    await searchDirectory(directory);

    // Sort by modification time (newest first)
    return resultFiles.sort((a, b) => b.mtime - a.mtime);
  }

  async processResultFile(resultFile) {
    const content = await fs.readFile(resultFile.path, 'utf8');
    let data;

    try {
      data = JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON in ${resultFile.name}`);
    }

    // Determine the type of result file and process accordingly
    if (data.deviceResults) {
      // This is a master test result file
      await this.processMasterResults(data, resultFile);
    } else if (data.device && data.summary) {
      // This is a single device result file
      await this.processDeviceResults(data, resultFile);
    } else if (data.category && data.results) {
      // This is a single category result file
      await this.processCategoryResults(data, resultFile);
    } else {
      console.warn(`⚠️ Unknown result file format: ${resultFile.name}`);
    }
  }

  async processMasterResults(data, resultFile) {
    console.log(`📊 Processing master results from: ${resultFile.name}`);

    // Merge device results
    for (const [deviceId, deviceResult] of Object.entries(data.deviceResults)) {
      if (!this.consolidatedResults.deviceResults[deviceId]) {
        this.consolidatedResults.deviceResults[deviceId] = {
          device: deviceResult.device,
          tests: {},
          startTime: deviceResult.startTime,
          endTime: deviceResult.endTime,
          duration: deviceResult.duration
        };
      }

      // Merge test results
      for (const [category, categoryResult] of Object.entries(deviceResult.tests)) {
        this.consolidatedResults.deviceResults[deviceId].tests[category] = categoryResult;
      }
    }

    // Merge summary data if available
    if (data.summary) {
      this.mergeSummaryData(data.summary);
    }
  }

  async processDeviceResults(data, resultFile) {
    const deviceId = this.extractDeviceIdFromPath(resultFile.path) || 
                     data.device?.name?.toLowerCase().replace(/\s+/g, '-') || 
                     'unknown-device';

    console.log(`📱 Processing device results for: ${deviceId}`);

    if (!this.consolidatedResults.deviceResults[deviceId]) {
      this.consolidatedResults.deviceResults[deviceId] = {
        device: data.device,
        tests: {},
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0
      };
    }

    // Add this result to the device
    const category = this.extractCategoryFromPath(resultFile.path) || 'unknown';
    this.consolidatedResults.deviceResults[deviceId].tests[category] = {
      category: data.category || category,
      results: data,
      timestamp: data.timestamp || new Date().toISOString()
    };
  }

  async processCategoryResults(data, resultFile) {
    const category = data.category || this.extractCategoryFromPath(resultFile.path) || 'unknown';
    const deviceId = this.extractDeviceIdFromPath(resultFile.path) || 'unknown-device';

    console.log(`🧪 Processing category results: ${category} for ${deviceId}`);

    if (!this.consolidatedResults.deviceResults[deviceId]) {
      this.consolidatedResults.deviceResults[deviceId] = {
        device: { name: deviceId },
        tests: {},
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0
      };
    }

    this.consolidatedResults.deviceResults[deviceId].tests[category] = data;
  }

  extractDeviceIdFromPath(filePath) {
    const pathParts = filePath.split(path.sep);
    
    // Look for device names in the path
    const deviceNames = ['iphone-se', 'iphone-15-pro', 'iphone-15-pro-max', 'ipad-air'];
    
    for (const part of pathParts) {
      for (const deviceName of deviceNames) {
        if (part.includes(deviceName)) {
          return deviceName;
        }
      }
    }

    // Look in filename
    const filename = path.basename(filePath, '.json');
    for (const deviceName of deviceNames) {
      if (filename.includes(deviceName)) {
        return deviceName;
      }
    }

    return null;
  }

  extractCategoryFromPath(filePath) {
    const pathParts = filePath.split(path.sep);
    const filename = path.basename(filePath, '.json');
    
    const categories = ['native', 'performance', 'accessibility', 'compatibility', 'integration'];
    
    // Check path parts
    for (const part of pathParts) {
      for (const category of categories) {
        if (part.includes(category)) {
          return category;
        }
      }
    }

    // Check filename
    for (const category of categories) {
      if (filename.includes(category)) {
        return category;
      }
    }

    return null;
  }

  mergeSummaryData(summaryData) {
    const current = this.consolidatedResults.summary;
    
    current.totalTests += summaryData.totalTests || 0;
    current.passedTests += summaryData.passedTests || 0;
    current.failedTests += summaryData.failedTests || 0;
    current.warningTests += summaryData.warningTests || 0;
    current.skippedTests += summaryData.skippedTests || 0;
  }

  calculateConsolidatedSummary() {
    console.log('🧮 Calculating consolidated summary...');

    const summary = this.consolidatedResults.summary;
    summary.totalDevices = Object.keys(this.consolidatedResults.deviceResults).length;

    // Reset counters
    summary.totalTests = 0;
    summary.passedTests = 0;
    summary.failedTests = 0;
    summary.warningTests = 0;
    summary.skippedTests = 0;

    // Calculate from device results
    for (const [deviceId, deviceResult] of Object.entries(this.consolidatedResults.deviceResults)) {
      for (const [category, categoryResult] of Object.entries(deviceResult.tests)) {
        if (categoryResult.results && categoryResult.results.summary) {
          const catSummary = categoryResult.results.summary;
          summary.totalTests += catSummary.total || 0;
          summary.passedTests += catSummary.passed || 0;
          summary.failedTests += catSummary.failed || 0;
          summary.warningTests += catSummary.warnings || 0;
          summary.skippedTests += catSummary.skipped || 0;
        }

        // Collect issues
        if (categoryResult.results && categoryResult.results.issues) {
          this.consolidatedResults.issues.push(...categoryResult.results.issues.map(issue => ({
            ...issue,
            device: deviceId,
            category: category
          })));
        }
      }
    }

    // Calculate pass rate
    if (summary.totalTests > 0) {
      summary.passRate = ((summary.passedTests / summary.totalTests) * 100).toFixed(1);
    } else {
      summary.passRate = '100.0';
    }

    // Determine overall status
    summary.overallStatus = this.calculateOverallStatus(summary.passedTests, summary.totalTests);

    // Generate category summary
    this.consolidatedResults.categories = this.generateCategorySummary();

    console.log(`📊 Consolidated Summary:`);
    console.log(`   Devices: ${summary.totalDevices}`);
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   Passed: ${summary.passedTests}`);
    console.log(`   Failed: ${summary.failedTests}`);
    console.log(`   Warnings: ${summary.warningTests}`);
    console.log(`   Pass Rate: ${summary.passRate}%`);
    console.log(`   Status: ${summary.overallStatus}`);
    console.log(`   Issues Found: ${this.consolidatedResults.issues.length}`);
  }

  generateCategorySummary() {
    const categories = {};

    for (const [deviceId, deviceResult] of Object.entries(this.consolidatedResults.deviceResults)) {
      for (const [categoryName, categoryResult] of Object.entries(deviceResult.tests)) {
        if (!categories[categoryName]) {
          categories[categoryName] = {
            total: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            skipped: 0,
            devices: []
          };
        }

        if (!categories[categoryName].devices.includes(deviceId)) {
          categories[categoryName].devices.push(deviceId);
        }

        if (categoryResult.results && categoryResult.results.summary) {
          const summary = categoryResult.results.summary;
          categories[categoryName].total += summary.total || 0;
          categories[categoryName].passed += summary.passed || 0;
          categories[categoryName].failed += summary.failed || 0;
          categories[categoryName].warnings += summary.warnings || 0;
          categories[categoryName].skipped += summary.skipped || 0;
        }
      }
    }

    // Calculate pass rates for categories
    for (const [categoryName, categoryData] of Object.entries(categories)) {
      if (categoryData.total > 0) {
        categoryData.passRate = ((categoryData.passed / categoryData.total) * 100).toFixed(1);
      } else {
        categoryData.passRate = '100.0';
      }
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

  async generateSummaryReport() {
    const summary = {
      timestamp: this.consolidatedResults.timestamp,
      summary: this.consolidatedResults.summary,
      devices: {},
      categories: this.consolidatedResults.categories,
      topIssues: this.consolidatedResults.issues.slice(0, 10) // Top 10 issues
    };

    // Simplified device summary
    for (const [deviceId, deviceResult] of Object.entries(this.consolidatedResults.deviceResults)) {
      const deviceSummary = {
        name: deviceResult.device?.name || deviceId,
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        skipped: 0,
        categories: Object.keys(deviceResult.tests)
      };

      for (const categoryResult of Object.values(deviceResult.tests)) {
        if (categoryResult.results && categoryResult.results.summary) {
          const catSummary = categoryResult.results.summary;
          deviceSummary.total += catSummary.total || 0;
          deviceSummary.passed += catSummary.passed || 0;
          deviceSummary.failed += catSummary.failed || 0;
          deviceSummary.warnings += catSummary.warnings || 0;
          deviceSummary.skipped += catSummary.skipped || 0;
        }
      }

      deviceSummary.passRate = deviceSummary.total > 0 ? 
        ((deviceSummary.passed / deviceSummary.total) * 100).toFixed(1) : '100.0';

      summary.devices[deviceId] = deviceSummary;
    }

    // Save summary report
    const summaryPath = path.join('./ios-testing/reports', 'ios-test-summary-latest.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

    console.log(`✅ Summary report saved to: ${summaryPath}`);
    return summary;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const consolidator = new TestResultsConsolidator();
  
  async function main() {
    try {
      const resultsDirectory = process.argv[2] || './test-results';
      
      console.log('🚀 Starting test results consolidation...');
      
      // Consolidate all results
      const consolidatedResults = await consolidator.consolidateResults(resultsDirectory);
      
      // Generate summary report
      const summary = await consolidator.generateSummaryReport();
      
      console.log('\n🎉 Consolidation completed successfully!');
      console.log(`📊 Final Summary: ${summary.summary.passRate}% pass rate across ${summary.summary.totalDevices} devices`);
      
      // Exit with error code if tests failed
      if (summary.summary.overallStatus === 'NEEDS_IMPROVEMENT') {
        console.log('❌ Test suite needs improvement - exiting with error code');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Consolidation failed:', error.message);
      process.exit(1);
    }
  }
  
  main();
}

export default TestResultsConsolidator;