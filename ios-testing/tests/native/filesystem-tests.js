/**
 * iOS File System Testing Suite
 * Tests the native file system functionality for the Geo Bubble Whispers app
 */

import { FilesystemService } from '../../../src/services/filesystem';

export class FilesystemTests {
  constructor() {
    this.testResults = [];
    this.testFiles = [];
    this.testDirectory = 'geo-bubble-test';
  }

  async runAllTests() {
    console.log('📁 Starting Filesystem Tests...');
    
    const tests = [
      this.testDirectoryOperations,
      this.testFileCreation,
      this.testFileReading,
      this.testFileWriting,
      this.testFileDeleting,
      this.testFileCopy,
      this.testFileMove,
      this.testFileStats,
      this.testStorageQuota,
      this.testPermissions,
      this.cleanup
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

  async testDirectoryOperations() {
    console.log('📂 Testing directory operations...');
    
    try {
      // Create test directory
      const dirResult = await FilesystemService.mkdir({
        path: this.testDirectory,
        directory: 'documents',
        recursive: true
      });

      if (dirResult) {
        this.recordTestResult('testDirectoryOperations', 'PASSED', 'Test directory created successfully');
      } else {
        this.recordTestResult('testDirectoryOperations', 'FAILED', 'Failed to create test directory');
      }

      // List directory contents
      const contents = await FilesystemService.readdir({
        path: '.',
        directory: 'documents'
      });

      const hasTestDir = contents.files.some(file => file.name === this.testDirectory);
      
      if (hasTestDir) {
        this.recordTestResult('testDirectoryListing', 'PASSED', 'Directory listing works correctly');
      } else {
        this.recordTestResult('testDirectoryListing', 'WARNING', 'Test directory not found in listing');
      }

    } catch (error) {
      this.recordTestResult('testDirectoryOperations', 'FAILED', `Directory operations failed: ${error.message}`);
    }
  }

  async testFileCreation() {
    console.log('📄 Testing file creation...');
    
    try {
      const testFileName = `${this.testDirectory}/test-file.txt`;
      const testContent = 'Hello, Geo Bubble Whispers!';

      const result = await FilesystemService.writeFile({
        path: testFileName,
        data: testContent,
        directory: 'documents',
        encoding: 'utf8'
      });

      if (result.uri) {
        this.testFiles.push(testFileName);
        this.recordTestResult('testFileCreation', 'PASSED', `File created: ${result.uri}`);
      } else {
        this.recordTestResult('testFileCreation', 'FAILED', 'No URI returned from file creation');
      }

    } catch (error) {
      this.recordTestResult('testFileCreation', 'FAILED', `File creation failed: ${error.message}`);
    }
  }

  async testFileReading() {
    console.log('📖 Testing file reading...');
    
    if (this.testFiles.length === 0) {
      this.recordTestResult('testFileReading', 'SKIPPED', 'No test files available');
      return;
    }

    try {
      const testFileName = this.testFiles[0];
      
      const result = await FilesystemService.readFile({
        path: testFileName,
        directory: 'documents',
        encoding: 'utf8'
      });

      if (result.data && result.data.includes('Hello, Geo Bubble Whispers!')) {
        this.recordTestResult('testFileReading', 'PASSED', 'File content read correctly');
      } else {
        this.recordTestResult('testFileReading', 'FAILED', 'File content mismatch');
      }

    } catch (error) {
      this.recordTestResult('testFileReading', 'FAILED', `File reading failed: ${error.message}`);
    }
  }

  async testFileWriting() {
    console.log('✏️ Testing file writing (append)...');
    
    if (this.testFiles.length === 0) {
      this.recordTestResult('testFileWriting', 'SKIPPED', 'No test files available');
      return;
    }

    try {
      const testFileName = this.testFiles[0];
      const appendContent = '\nAppended content for testing.';

      await FilesystemService.appendFile({
        path: testFileName,
        data: appendContent,
        directory: 'documents',
        encoding: 'utf8'
      });

      // Read back to verify
      const result = await FilesystemService.readFile({
        path: testFileName,
        directory: 'documents',
        encoding: 'utf8'
      });

      if (result.data && result.data.includes('Appended content for testing.')) {
        this.recordTestResult('testFileWriting', 'PASSED', 'File append operation successful');
      } else {
        this.recordTestResult('testFileWriting', 'FAILED', 'Appended content not found');
      }

    } catch (error) {
      this.recordTestResult('testFileWriting', 'FAILED', `File writing failed: ${error.message}`);
    }
  }

  async testFileCopy() {
    console.log('📋 Testing file copy operations...');
    
    if (this.testFiles.length === 0) {
      this.recordTestResult('testFileCopy', 'SKIPPED', 'No test files available');
      return;
    }

    try {
      const sourceFile = this.testFiles[0];
      const targetFile = `${this.testDirectory}/copied-file.txt`;

      await FilesystemService.copy({
        from: sourceFile,
        to: targetFile,
        directory: 'documents'
      });

      // Verify copy exists
      const result = await FilesystemService.readFile({
        path: targetFile,
        directory: 'documents',
        encoding: 'utf8'
      });

      if (result.data) {
        this.testFiles.push(targetFile);
        this.recordTestResult('testFileCopy', 'PASSED', 'File copied successfully');
      } else {
        this.recordTestResult('testFileCopy', 'FAILED', 'Copied file not readable');
      }

    } catch (error) {
      this.recordTestResult('testFileCopy', 'FAILED', `File copy failed: ${error.message}`);
    }
  }

  async testFileMove() {
    console.log('🔄 Testing file move operations...');
    
    if (this.testFiles.length < 2) {
      this.recordTestResult('testFileMove', 'SKIPPED', 'Insufficient test files for move operation');
      return;
    }

    try {
      const sourceFile = this.testFiles[1]; // Use second file
      const targetFile = `${this.testDirectory}/moved-file.txt`;

      await FilesystemService.rename({
        from: sourceFile,
        to: targetFile,
        directory: 'documents'
      });

      // Verify original file is gone and new file exists
      try {
        await FilesystemService.readFile({
          path: sourceFile,
          directory: 'documents'
        });
        this.recordTestResult('testFileMove', 'FAILED', 'Original file still exists after move');
      } catch (error) {
        // Original file should not exist - this is expected
        try {
          const result = await FilesystemService.readFile({
            path: targetFile,
            directory: 'documents',
            encoding: 'utf8'
          });

          if (result.data) {
            // Update test files array
            this.testFiles[1] = targetFile;
            this.recordTestResult('testFileMove', 'PASSED', 'File moved successfully');
          } else {
            this.recordTestResult('testFileMove', 'FAILED', 'Moved file not readable');
          }
        } catch (moveError) {
          this.recordTestResult('testFileMove', 'FAILED', 'Moved file not found');
        }
      }

    } catch (error) {
      this.recordTestResult('testFileMove', 'FAILED', `File move failed: ${error.message}`);
    }
  }

  async testFileStats() {
    console.log('📊 Testing file statistics...');
    
    if (this.testFiles.length === 0) {
      this.recordTestResult('testFileStats', 'SKIPPED', 'No test files available');
      return;
    }

    try {
      const testFileName = this.testFiles[0];
      
      const stats = await FilesystemService.stat({
        path: testFileName,
        directory: 'documents'
      });

      const hasSize = typeof stats.size === 'number' && stats.size > 0;
      const hasType = typeof stats.type === 'string';
      const hasCtime = stats.ctime instanceof Date || typeof stats.ctime === 'number';
      const hasMtime = stats.mtime instanceof Date || typeof stats.mtime === 'number';

      const statsValid = [hasSize, hasType, hasCtime, hasMtime].filter(Boolean).length;

      if (statsValid >= 3) {
        this.recordTestResult('testFileStats', 'PASSED', 
          `File stats available: size=${hasSize}, type=${hasType}, ctime=${hasCtime}, mtime=${hasMtime}`);
      } else {
        this.recordTestResult('testFileStats', 'WARNING', 
          `Limited file stats: ${statsValid}/4 properties available`);
      }

    } catch (error) {
      this.recordTestResult('testFileStats', 'FAILED', `File stats failed: ${error.message}`);
    }
  }

  async testStorageQuota() {
    console.log('💾 Testing storage quota and space...');
    
    try {
      const freeSpace = await FilesystemService.getFreeDiskSpace();
      
      if (typeof freeSpace === 'number' && freeSpace > 0) {
        const freeSpaceMB = (freeSpace / (1024 * 1024)).toFixed(2);
        this.recordTestResult('testStorageQuota', 'PASSED', 
          `Free disk space: ${freeSpaceMB} MB`);
      } else {
        this.recordTestResult('testStorageQuota', 'WARNING', 
          'Could not determine free disk space');
      }

    } catch (error) {
      this.recordTestResult('testStorageQuota', 'FAILED', `Storage quota check failed: ${error.message}`);
    }
  }

  async testPermissions() {
    console.log('🔐 Testing file system permissions...');
    
    try {
      const permissions = await FilesystemService.requestPermissions();
      
      if (permissions.publicStorage === 'granted') {
        this.recordTestResult('testPermissions', 'PASSED', 'File system permissions granted');
      } else {
        this.recordTestResult('testPermissions', 'WARNING', 
          `Limited permissions: ${permissions.publicStorage}`);
      }

    } catch (error) {
      this.recordTestResult('testPermissions', 'FAILED', `Permissions check failed: ${error.message}`);
    }
  }

  async testFileDeleting() {
    console.log('🗑️ Testing file deletion...');
    
    if (this.testFiles.length === 0) {
      this.recordTestResult('testFileDeleting', 'SKIPPED', 'No test files to delete');
      return;
    }

    try {
      const testFileName = this.testFiles[this.testFiles.length - 1]; // Delete last file
      
      await FilesystemService.deleteFile({
        path: testFileName,
        directory: 'documents'
      });

      // Verify file is deleted
      try {
        await FilesystemService.readFile({
          path: testFileName,
          directory: 'documents'
        });
        this.recordTestResult('testFileDeleting', 'FAILED', 'File still exists after deletion');
      } catch (error) {
        // File should not exist - this is expected
        this.testFiles.pop(); // Remove from test files array
        this.recordTestResult('testFileDeleting', 'PASSED', 'File deleted successfully');
      }

    } catch (error) {
      this.recordTestResult('testFileDeleting', 'FAILED', `File deletion failed: ${error.message}`);
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up test files...');
    
    try {
      // Delete remaining test files
      for (const file of this.testFiles) {
        try {
          await FilesystemService.deleteFile({
            path: file,
            directory: 'documents'
          });
        } catch (error) {
          console.log(`Could not delete ${file}: ${error.message}`);
        }
      }

      // Delete test directory
      await FilesystemService.rmdir({
        path: this.testDirectory,
        directory: 'documents',
        recursive: true
      });

      this.recordTestResult('cleanup', 'PASSED', 'Test cleanup completed');

    } catch (error) {
      this.recordTestResult('cleanup', 'WARNING', `Cleanup issues: ${error.message}`);
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
      filesCreated: this.testFiles.length,
      timestamp: new Date().toISOString()
    };

    console.log('\n📊 Filesystem Test Report:');
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️ Warnings: ${report.summary.warnings}`);
    console.log(`⏭️ Skipped: ${report.summary.skipped}`);
    console.log(`📁 Files Created: ${report.filesCreated}`);
    console.log(`📈 Pass Rate: ${report.summary.passRate}`);

    return report;
  }
}