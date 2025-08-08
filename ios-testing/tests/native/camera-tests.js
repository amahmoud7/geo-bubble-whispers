/**
 * iOS Camera and Media Capture Testing Suite
 * Tests the native camera functionality for the Geo Bubble Whispers app
 */

import { CameraService } from '../../../src/services/camera';

export class CameraTests {
  constructor() {
    this.testResults = [];
    this.testImages = [];
  }

  async runAllTests() {
    console.log('📸 Starting Camera Tests...');
    
    const tests = [
      this.testCameraPermission,
      this.testPhotoCapture,
      this.testGalleryAccess,
      this.testImageQuality,
      this.testImageMetadata,
      this.testVideoCapture,
      this.testCameraSettings,
      this.testStoragePermissions
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

  async testCameraPermission() {
    console.log('🔐 Testing camera permission flow...');
    
    try {
      const permissions = await CameraService.requestPermissions();
      
      if (permissions.camera === 'granted' && permissions.photos === 'granted') {
        this.recordTestResult('testCameraPermission', 'PASSED', 'Camera and photos permissions granted');
      } else {
        this.recordTestResult('testCameraPermission', 'FAILED', 
          `Permissions denied - Camera: ${permissions.camera}, Photos: ${permissions.photos}`);
      }
    } catch (error) {
      this.recordTestResult('testCameraPermission', 'FAILED', `Permission request failed: ${error.message}`);
    }
  }

  async testPhotoCapture() {
    console.log('📷 Testing photo capture...');
    
    try {
      const options = {
        quality: 90,
        allowEditing: false,
        resultType: 'uri',
        source: 'camera'
      };

      const image = await CameraService.getPhoto(options);
      
      if (image && image.webPath) {
        this.testImages.push(image);
        this.recordTestResult('testPhotoCapture', 'PASSED', 
          `Photo captured successfully: ${image.format}, ${image.webPath.length} chars`);
      } else {
        this.recordTestResult('testPhotoCapture', 'FAILED', 'No image data received');
      }
    } catch (error) {
      if (error.message.includes('User cancelled')) {
        this.recordTestResult('testPhotoCapture', 'SKIPPED', 'User cancelled photo capture');
      } else {
        this.recordTestResult('testPhotoCapture', 'FAILED', `Photo capture failed: ${error.message}`);
      }
    }
  }

  async testGalleryAccess() {
    console.log('🖼️ Testing gallery access...');
    
    try {
      const options = {
        quality: 90,
        allowEditing: false,
        resultType: 'uri',
        source: 'photos'
      };

      const image = await CameraService.getPhoto(options);
      
      if (image && image.webPath) {
        this.testImages.push(image);
        this.recordTestResult('testGalleryAccess', 'PASSED', 
          `Gallery image selected: ${image.format}, ${image.webPath.length} chars`);
      } else {
        this.recordTestResult('testGalleryAccess', 'FAILED', 'No image selected from gallery');
      }
    } catch (error) {
      if (error.message.includes('User cancelled')) {
        this.recordTestResult('testGalleryAccess', 'SKIPPED', 'User cancelled gallery selection');
      } else {
        this.recordTestResult('testGalleryAccess', 'FAILED', `Gallery access failed: ${error.message}`);
      }
    }
  }

  async testImageQuality() {
    console.log('🎨 Testing image quality settings...');
    
    const qualityLevels = [25, 50, 75, 100];
    const results = [];

    for (const quality of qualityLevels) {
      try {
        const options = {
          quality,
          allowEditing: false,
          resultType: 'dataUrl',
          source: 'camera'
        };

        // Note: In a real test, this would capture actual photos
        // For simulation, we'll test the configuration
        const config = await CameraService.validateOptions(options);
        
        if (config.quality === quality) {
          results.push({ quality, status: 'PASSED' });
        } else {
          results.push({ quality, status: 'FAILED', actual: config.quality });
        }
      } catch (error) {
        results.push({ quality, status: 'FAILED', error: error.message });
      }
    }

    const passedTests = results.filter(r => r.status === 'PASSED').length;
    
    if (passedTests === qualityLevels.length) {
      this.recordTestResult('testImageQuality', 'PASSED', 
        `All quality levels supported: ${qualityLevels.join(', ')}`);
    } else {
      this.recordTestResult('testImageQuality', 'WARNING', 
        `${passedTests}/${qualityLevels.length} quality levels working`);
    }
  }

  async testImageMetadata() {
    console.log('📋 Testing image metadata extraction...');
    
    if (this.testImages.length === 0) {
      this.recordTestResult('testImageMetadata', 'SKIPPED', 'No test images available');
      return;
    }

    try {
      const image = this.testImages[0];
      
      // Check for expected metadata
      const hasFormat = !!image.format;
      const hasSize = !!(image.webPath && image.webPath.length > 0);
      const hasExif = !!image.exif;

      const metadataScore = [hasFormat, hasSize, hasExif].filter(Boolean).length;
      
      if (metadataScore >= 2) {
        this.recordTestResult('testImageMetadata', 'PASSED', 
          `Metadata available: format=${hasFormat}, size=${hasSize}, exif=${hasExif}`);
      } else {
        this.recordTestResult('testImageMetadata', 'WARNING', 
          `Limited metadata: format=${hasFormat}, size=${hasSize}, exif=${hasExif}`);
      }
    } catch (error) {
      this.recordTestResult('testImageMetadata', 'FAILED', `Metadata extraction failed: ${error.message}`);
    }
  }

  async testVideoCapture() {
    console.log('🎥 Testing video capture capabilities...');
    
    try {
      // Check if video capture is supported
      const capabilities = await CameraService.getCapabilities();
      
      if (capabilities.video) {
        // Test video capture configuration
        const videoOptions = {
          quality: 'high',
          duration: 30,
          resultType: 'uri'
        };

        // Note: Actual video capture would require user interaction
        this.recordTestResult('testVideoCapture', 'PASSED', 'Video capture capabilities available');
      } else {
        this.recordTestResult('testVideoCapture', 'WARNING', 'Video capture not supported');
      }
    } catch (error) {
      this.recordTestResult('testVideoCapture', 'FAILED', `Video test failed: ${error.message}`);
    }
  }

  async testCameraSettings() {
    console.log('⚙️ Testing camera settings and configurations...');
    
    try {
      const settingsTests = [
        { setting: 'flash', values: ['on', 'off', 'auto'] },
        { setting: 'camera', values: ['front', 'rear'] },
        { setting: 'format', values: ['jpeg', 'png'] }
      ];

      let passedSettings = 0;

      for (const test of settingsTests) {
        try {
          for (const value of test.values) {
            const options = { [test.setting]: value };
            const isValid = await CameraService.validateOptions(options);
            
            if (isValid) {
              passedSettings++;
              break; // At least one value works for this setting
            }
          }
        } catch (error) {
          console.log(`Setting ${test.setting} test failed: ${error.message}`);
        }
      }

      if (passedSettings >= settingsTests.length * 0.7) { // 70% threshold
        this.recordTestResult('testCameraSettings', 'PASSED', 
          `${passedSettings}/${settingsTests.length} settings working`);
      } else {
        this.recordTestResult('testCameraSettings', 'WARNING', 
          `Only ${passedSettings}/${settingsTests.length} settings working`);
      }
    } catch (error) {
      this.recordTestResult('testCameraSettings', 'FAILED', `Settings test failed: ${error.message}`);
    }
  }

  async testStoragePermissions() {
    console.log('💾 Testing photo storage permissions...');
    
    try {
      // Test saving a captured image
      if (this.testImages.length > 0) {
        const image = this.testImages[0];
        
        // Attempt to save to photo album
        const saveResult = await CameraService.saveToPhotoAlbum(image);
        
        if (saveResult.success) {
          this.recordTestResult('testStoragePermissions', 'PASSED', 'Photo saved to album successfully');
        } else {
          this.recordTestResult('testStoragePermissions', 'FAILED', 'Failed to save photo to album');
        }
      } else {
        // Test storage permission without actual save
        const hasPermission = await CameraService.checkPhotoPermissions();
        
        if (hasPermission) {
          this.recordTestResult('testStoragePermissions', 'PASSED', 'Photo storage permissions granted');
        } else {
          this.recordTestResult('testStoragePermissions', 'FAILED', 'Photo storage permissions denied');
        }
      }
    } catch (error) {
      this.recordTestResult('testStoragePermissions', 'FAILED', `Storage test failed: ${error.message}`);
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
      capturedImages: this.testImages.length,
      timestamp: new Date().toISOString()
    };

    console.log('\n📊 Camera Test Report:');
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️ Warnings: ${report.summary.warnings}`);
    console.log(`⏭️ Skipped: ${report.summary.skipped}`);
    console.log(`📸 Images Captured: ${report.capturedImages}`);
    console.log(`📈 Pass Rate: ${report.summary.passRate}`);

    return report;
  }
}