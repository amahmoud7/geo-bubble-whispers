/**
 * iOS Simulator Manager
 * Automates iOS simulator setup, configuration, and management for testing
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export class IOSSimulatorManager {
  constructor() {
    this.availableSimulators = [];
    this.configuredSimulators = {};
    this.runningSimulators = [];
  }

  async initialize() {
    console.log('🚀 Initializing iOS Simulator Manager...');
    
    try {
      await this.checkXcodeInstallation();
      await this.loadAvailableSimulators();
      await this.loadDeviceConfigurations();
      
      console.log('✅ iOS Simulator Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize iOS Simulator Manager:', error.message);
      throw error;
    }
  }

  async checkXcodeInstallation() {
    console.log('🔍 Checking Xcode installation...');
    
    return new Promise((resolve, reject) => {
      exec('xcode-select --print-path', (error, stdout, stderr) => {
        if (error) {
          reject(new Error('Xcode is not installed or not properly configured. Please install Xcode and run: sudo xcode-select --install'));
          return;
        }
        
        console.log(`✅ Xcode found at: ${stdout.trim()}`);
        resolve(stdout.trim());
      });
    });
  }

  async loadAvailableSimulators() {
    console.log('📱 Loading available iOS simulators...');
    
    return new Promise((resolve, reject) => {
      exec('xcrun simctl list devices --json', (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to list simulators: ${error.message}`));
          return;
        }

        try {
          const data = JSON.parse(stdout);
          this.availableSimulators = this.parseSimulatorData(data);
          
          console.log(`✅ Found ${this.availableSimulators.length} available iOS simulators`);
          resolve(this.availableSimulators);
        } catch (parseError) {
          reject(new Error(`Failed to parse simulator data: ${parseError.message}`));
        }
      });
    });
  }

  parseSimulatorData(data) {
    const simulators = [];
    
    for (const [runtime, devices] of Object.entries(data.devices)) {
      if (runtime.includes('iOS')) {
        devices.forEach(device => {
          if (device.isAvailable) {
            simulators.push({
              udid: device.udid,
              name: device.name,
              runtime: runtime,
              state: device.state,
              deviceTypeIdentifier: device.deviceTypeIdentifier
            });
          }
        });
      }
    }
    
    return simulators;
  }

  async loadDeviceConfigurations() {
    console.log('⚙️ Loading device configurations...');
    
    const configsPath = path.join(process.cwd(), 'ios-testing', 'configs', 'devices');
    
    try {
      const configFiles = await fs.readdir(configsPath);
      
      for (const file of configFiles) {
        if (file.endsWith('.json')) {
          const configPath = path.join(configsPath, file);
          const configData = await fs.readFile(configPath, 'utf8');
          const config = JSON.parse(configData);
          
          const deviceKey = file.replace('.json', '');
          this.configuredSimulators[deviceKey] = config;
        }
      }
      
      console.log(`✅ Loaded ${Object.keys(this.configuredSimulators).length} device configurations`);
    } catch (error) {
      console.warn(`⚠️ Could not load device configurations: ${error.message}`);
    }
  }

  async createSimulator(deviceName, deviceType, runtime) {
    console.log(`🔨 Creating simulator: ${deviceName}...`);
    
    return new Promise((resolve, reject) => {
      const command = `xcrun simctl create "${deviceName}" "${deviceType}" "${runtime}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to create simulator: ${error.message}`));
          return;
        }
        
        const udid = stdout.trim();
        console.log(`✅ Created simulator ${deviceName} with UDID: ${udid}`);
        
        resolve({
          udid,
          name: deviceName,
          deviceType,
          runtime,
          state: 'Shutdown'
        });
      });
    });
  }

  async bootSimulator(udid) {
    console.log(`🚀 Booting simulator: ${udid}...`);
    
    return new Promise((resolve, reject) => {
      exec(`xcrun simctl boot ${udid}`, (error, stdout, stderr) => {
        if (error && !error.message.includes('already booted')) {
          reject(new Error(`Failed to boot simulator: ${error.message}`));
          return;
        }
        
        console.log(`✅ Simulator ${udid} booted successfully`);
        resolve(true);
      });
    });
  }

  async shutdownSimulator(udid) {
    console.log(`🛑 Shutting down simulator: ${udid}...`);
    
    return new Promise((resolve, reject) => {
      exec(`xcrun simctl shutdown ${udid}`, (error, stdout, stderr) => {
        if (error && !error.message.includes('not booted')) {
          reject(new Error(`Failed to shutdown simulator: ${error.message}`));
          return;
        }
        
        console.log(`✅ Simulator ${udid} shut down successfully`);
        resolve(true);
      });
    });
  }

  async openSimulator(udid) {
    console.log(`📱 Opening Simulator app for: ${udid}...`);
    
    return new Promise((resolve, reject) => {
      exec(`open -a Simulator --args -CurrentDeviceUDID ${udid}`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to open simulator: ${error.message}`));
          return;
        }
        
        console.log(`✅ Simulator app opened for ${udid}`);
        resolve(true);
      });
    });
  }

  async installApp(udid, appPath) {
    console.log(`📦 Installing app on simulator: ${udid}...`);
    
    return new Promise((resolve, reject) => {
      exec(`xcrun simctl install ${udid} "${appPath}"`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to install app: ${error.message}`));
          return;
        }
        
        console.log(`✅ App installed successfully on ${udid}`);
        resolve(true);
      });
    });
  }

  async launchApp(udid, bundleId) {
    console.log(`🚀 Launching app on simulator: ${bundleId}...`);
    
    return new Promise((resolve, reject) => {
      exec(`xcrun simctl launch ${udid} ${bundleId}`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to launch app: ${error.message}`));
          return;
        }
        
        console.log(`✅ App ${bundleId} launched successfully`);
        resolve(true);
      });
    });
  }

  async setSimulatorSettings(udid, settings) {
    console.log(`⚙️ Configuring simulator settings for: ${udid}...`);
    
    const settingPromises = [];
    
    // Set location if specified
    if (settings.location) {
      settingPromises.push(this.setLocation(udid, settings.location));
    }
    
    // Set device appearance
    if (settings.appearance) {
      settingPromises.push(this.setAppearance(udid, settings.appearance));
    }
    
    // Set accessibility settings
    if (settings.accessibility) {
      settingPromises.push(this.setAccessibilitySettings(udid, settings.accessibility));
    }
    
    // Set language and region
    if (settings.language) {
      settingPromises.push(this.setLanguage(udid, settings.language));
    }
    
    try {
      await Promise.all(settingPromises);
      console.log(`✅ Simulator settings configured for ${udid}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to configure simulator settings: ${error.message}`);
      throw error;
    }
  }

  async setLocation(udid, location) {
    const { latitude, longitude } = location;
    
    return new Promise((resolve, reject) => {
      exec(`xcrun simctl location ${udid} set ${latitude} ${longitude}`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to set location: ${error.message}`));
          return;
        }
        
        console.log(`✅ Location set to ${latitude}, ${longitude}`);
        resolve(true);
      });
    });
  }

  async setAppearance(udid, appearance) {
    const appearanceValue = appearance === 'dark' ? 'dark' : 'light';
    
    return new Promise((resolve, reject) => {
      exec(`xcrun simctl ui ${udid} appearance ${appearanceValue}`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to set appearance: ${error.message}`));
          return;
        }
        
        console.log(`✅ Appearance set to ${appearanceValue}`);
        resolve(true);
      });
    });
  }

  async setAccessibilitySettings(udid, accessibility) {
    const promises = [];
    
    // Enable/disable VoiceOver
    if (accessibility.voiceOver !== undefined) {
      promises.push(this.setAccessibilitySetting(udid, 'VoiceOverTouchEnabled', accessibility.voiceOver));
    }
    
    // Set dynamic type size
    if (accessibility.dynamicTypeSize) {
      promises.push(this.setDynamicTypeSize(udid, accessibility.dynamicTypeSize));
    }
    
    // Enable/disable reduce motion
    if (accessibility.reduceMotion !== undefined) {
      promises.push(this.setAccessibilitySetting(udid, 'ReduceMotionEnabled', accessibility.reduceMotion));
    }
    
    // Enable/disable increase contrast
    if (accessibility.increaseContrast !== undefined) {
      promises.push(this.setAccessibilitySetting(udid, 'IncreaseContrastEnabled', accessibility.increaseContrast));
    }
    
    return Promise.all(promises);
  }

  async setAccessibilitySetting(udid, setting, value) {
    const boolValue = value ? 'true' : 'false';
    
    return new Promise((resolve, reject) => {
      const command = `xcrun simctl spawn ${udid} defaults write com.apple.accessibility ${setting} -bool ${boolValue}`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.warn(`⚠️ Could not set ${setting}: ${error.message}`);
          resolve(false);
          return;
        }
        
        console.log(`✅ ${setting} set to ${value}`);
        resolve(true);
      });
    });
  }

  async setDynamicTypeSize(udid, size) {
    const sizeMap = {
      'extra-small': 'UICTContentSizeCategoryXS',
      'small': 'UICTContentSizeCategoryS',
      'medium': 'UICTContentSizeCategoryM',
      'large': 'UICTContentSizeCategoryL',
      'extra-large': 'UICTContentSizeCategoryXL',
      'extra-extra-large': 'UICTContentSizeCategoryXXL',
      'extra-extra-extra-large': 'UICTContentSizeCategoryXXXL',
      'accessibility-medium': 'UICTContentSizeCategoryAccessibilityM',
      'accessibility-large': 'UICTContentSizeCategoryAccessibilityL',
      'accessibility-extra-large': 'UICTContentSizeCategoryAccessibilityXL',
      'accessibility-extra-extra-large': 'UICTContentSizeCategoryAccessibilityXXL',
      'accessibility-extra-extra-extra-large': 'UICTContentSizeCategoryAccessibilityXXXL'
    };
    
    const sizeValue = sizeMap[size] || sizeMap['large'];
    
    return new Promise((resolve, reject) => {
      const command = `xcrun simctl spawn ${udid} defaults write -g UIPreferredContentSizeCategory -string ${sizeValue}`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to set dynamic type size: ${error.message}`));
          return;
        }
        
        console.log(`✅ Dynamic type size set to ${size}`);
        resolve(true);
      });
    });
  }

  async setLanguage(udid, language) {
    return new Promise((resolve, reject) => {
      const command = `xcrun simctl spawn ${udid} defaults write -g AppleLanguages -array-add ${language}`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to set language: ${error.message}`));
          return;
        }
        
        console.log(`✅ Language set to ${language}`);
        resolve(true);
      });
    });
  }

  async takeScreenshot(udid, outputPath) {
    console.log(`📸 Taking screenshot of simulator: ${udid}...`);
    
    return new Promise((resolve, reject) => {
      exec(`xcrun simctl io ${udid} screenshot "${outputPath}"`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to take screenshot: ${error.message}`));
          return;
        }
        
        console.log(`✅ Screenshot saved to: ${outputPath}`);
        resolve(outputPath);
      });
    });
  }

  async recordVideo(udid, outputPath, duration = 30) {
    console.log(`🎥 Recording video of simulator: ${udid} for ${duration}s...`);
    
    return new Promise((resolve, reject) => {
      const command = `timeout ${duration} xcrun simctl io ${udid} recordVideo "${outputPath}"`;
      
      exec(command, (error, stdout, stderr) => {
        // timeout command will exit with code 124, which is expected
        if (error && error.code !== 124) {
          reject(new Error(`Failed to record video: ${error.message}`));
          return;
        }
        
        console.log(`✅ Video recording saved to: ${outputPath}`);
        resolve(outputPath);
      });
    });
  }

  async setupTestingEnvironment(deviceConfigs) {
    console.log('🏗️ Setting up comprehensive testing environment...');
    
    const setupResults = {};
    
    for (const [deviceKey, config] of Object.entries(deviceConfigs)) {
      try {
        console.log(`\n📱 Setting up ${config.name}...`);
        
        // Find or create simulator
        let simulator = await this.findSimulator(config);
        
        if (!simulator) {
          simulator = await this.createSimulator(
            `GBW-Test-${config.name}`,
            config.identifier,
            config.runtime
          );
        }
        
        // Boot simulator
        await this.bootSimulator(simulator.udid);
        
        // Configure simulator settings
        const settings = {
          location: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
          appearance: 'light',
          language: 'en',
          accessibility: {
            voiceOver: false,
            reduceMotion: false,
            increaseContrast: false,
            dynamicTypeSize: 'large'
          }
        };
        
        await this.setSimulatorSettings(simulator.udid, settings);
        
        // Open simulator app
        await this.openSimulator(simulator.udid);
        
        setupResults[deviceKey] = {
          success: true,
          simulator,
          config
        };
        
        console.log(`✅ ${config.name} setup completed`);
        
      } catch (error) {
        console.error(`❌ Failed to setup ${config.name}: ${error.message}`);
        
        setupResults[deviceKey] = {
          success: false,
          error: error.message,
          config
        };
      }
    }
    
    return setupResults;
  }

  async findSimulator(config) {
    return this.availableSimulators.find(sim => 
      sim.name.includes(config.name) || 
      sim.deviceTypeIdentifier === config.identifier
    );
  }

  async cleanupTestingEnvironment(deviceConfigs) {
    console.log('🧹 Cleaning up testing environment...');
    
    for (const [deviceKey, config] of Object.entries(deviceConfigs)) {
      try {
        const simulator = await this.findSimulator(config);
        
        if (simulator) {
          await this.shutdownSimulator(simulator.udid);
          console.log(`✅ Cleaned up ${config.name}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not cleanup ${config.name}: ${error.message}`);
      }
    }
  }

  async runTestingSession(options = {}) {
    console.log('🧪 Starting comprehensive iOS testing session...');
    
    const {
      devices = ['iphone-se', 'iphone-15-pro', 'iphone-15-pro-max', 'ipad-air'],
      testDuration = 60,
      captureScreenshots = true,
      captureVideo = false
    } = options;
    
    const sessionResults = {};
    
    try {
      // Setup testing environment
      const deviceConfigs = {};
      devices.forEach(device => {
        if (this.configuredSimulators[device]) {
          deviceConfigs[device] = this.configuredSimulators[device];
        }
      });
      
      const setupResults = await this.setupTestingEnvironment(deviceConfigs);
      
      // Run tests on each device
      for (const [deviceKey, setup] of Object.entries(setupResults)) {
        if (!setup.success) {
          sessionResults[deviceKey] = { error: setup.error };
          continue;
        }
        
        console.log(`\n🧪 Running tests on ${setup.config.name}...`);
        
        const testResults = {
          setup: setup,
          screenshots: [],
          videos: [],
          startTime: Date.now()
        };
        
        // Capture initial screenshot
        if (captureScreenshots) {
          const screenshotPath = `./ios-testing/reports/screenshots/${deviceKey}/initial-${Date.now()}.png`;
          await this.ensureDirectoryExists(path.dirname(screenshotPath));
          
          try {
            await this.takeScreenshot(setup.simulator.udid, screenshotPath);
            testResults.screenshots.push(screenshotPath);
          } catch (error) {
            console.warn(`⚠️ Could not capture screenshot: ${error.message}`);
          }
        }
        
        // Start video recording if requested
        let videoPromise = null;
        if (captureVideo) {
          const videoPath = `./ios-testing/reports/videos/${deviceKey}/session-${Date.now()}.mov`;
          await this.ensureDirectoryExists(path.dirname(videoPath));
          
          videoPromise = this.recordVideo(setup.simulator.udid, videoPath, testDuration)
            .then(path => {
              testResults.videos.push(path);
              return path;
            })
            .catch(error => {
              console.warn(`⚠️ Could not record video: ${error.message}`);
              return null;
            });
        }
        
        // Wait for test duration
        await this.delay(testDuration * 1000);
        
        // Capture final screenshot
        if (captureScreenshots) {
          const screenshotPath = `./ios-testing/reports/screenshots/${deviceKey}/final-${Date.now()}.png`;
          
          try {
            await this.takeScreenshot(setup.simulator.udid, screenshotPath);
            testResults.screenshots.push(screenshotPath);
          } catch (error) {
            console.warn(`⚠️ Could not capture final screenshot: ${error.message}`);
          }
        }
        
        // Wait for video recording to complete
        if (videoPromise) {
          await videoPromise;
        }
        
        testResults.endTime = Date.now();
        testResults.duration = testResults.endTime - testResults.startTime;
        
        sessionResults[deviceKey] = testResults;
        
        console.log(`✅ Completed tests on ${setup.config.name} (${testResults.duration}ms)`);
      }
      
      // Cleanup
      await this.cleanupTestingEnvironment(deviceConfigs);
      
      console.log('🎉 iOS testing session completed successfully!');
      
      return sessionResults;
      
    } catch (error) {
      console.error('❌ iOS testing session failed:', error.message);
      throw error;
    }
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // CLI interface methods
  async listSimulators() {
    await this.loadAvailableSimulators();
    
    console.log('\n📱 Available iOS Simulators:');
    console.log('=' * 50);
    
    this.availableSimulators.forEach((sim, index) => {
      console.log(`${index + 1}. ${sim.name}`);
      console.log(`   UDID: ${sim.udid}`);
      console.log(`   Runtime: ${sim.runtime}`);
      console.log(`   State: ${sim.state}`);
      console.log('');
    });
  }

  async quickTest(deviceName) {
    console.log(`🚀 Running quick test on ${deviceName}...`);
    
    const device = Object.keys(this.configuredSimulators).find(key => 
      key.includes(deviceName.toLowerCase())
    );
    
    if (!device) {
      throw new Error(`Device configuration not found for: ${deviceName}`);
    }
    
    const results = await this.runTestingSession({
      devices: [device],
      testDuration: 30,
      captureScreenshots: true,
      captureVideo: false
    });
    
    console.log('\n📊 Quick Test Results:');
    console.log(JSON.stringify(results, null, 2));
    
    return results;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new IOSSimulatorManager();
  
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  async function runCLI() {
    try {
      await manager.initialize();
      
      switch (command) {
        case 'list':
          await manager.listSimulators();
          break;
          
        case 'setup':
          const devices = args.length > 0 ? args : ['iphone-se', 'iphone-15-pro', 'iphone-15-pro-max', 'ipad-air'];
          const deviceConfigs = {};
          devices.forEach(device => {
            if (manager.configuredSimulators[device]) {
              deviceConfigs[device] = manager.configuredSimulators[device];
            }
          });
          
          await manager.setupTestingEnvironment(deviceConfigs);
          break;
          
        case 'test':
          const deviceName = args[0] || 'iphone-15-pro';
          await manager.quickTest(deviceName);
          break;
          
        case 'session':
          const sessionOptions = {
            devices: args.length > 0 ? args : ['iphone-15-pro'],
            testDuration: 60,
            captureScreenshots: true,
            captureVideo: process.argv.includes('--video')
          };
          
          await manager.runTestingSession(sessionOptions);
          break;
          
        default:
          console.log(`
🚀 iOS Simulator Manager

Usage: node simulator-manager.js <command> [options]

Commands:
  list                    List available iOS simulators
  setup [devices...]      Setup testing environment for specified devices
  test <device>          Run quick test on specified device
  session [devices...]   Run full testing session

Examples:
  node simulator-manager.js list
  node simulator-manager.js setup iphone-15-pro ipad-air
  node simulator-manager.js test iphone-se
  node simulator-manager.js session iphone-15-pro --video

Available devices: iphone-se, iphone-15-pro, iphone-15-pro-max, ipad-air
          `);
      }
    } catch (error) {
      console.error('❌ CLI Error:', error.message);
      process.exit(1);
    }
  }
  
  runCLI();
}

export default IOSSimulatorManager;