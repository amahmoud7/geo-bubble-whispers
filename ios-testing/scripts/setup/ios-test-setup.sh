#!/bin/bash

# iOS Testing Environment Setup Script
# Sets up the complete iOS testing environment for Geo Bubble Whispers

set -e

echo "🚀 Setting up iOS Testing Environment..."
echo "======================================="

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: iOS testing requires macOS"
    exit 1
fi

# Check for required tools
echo "🔍 Checking required tools..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check for Xcode
if ! xcode-select -p &> /dev/null; then
    echo "❌ Xcode is not installed. Please install Xcode from the App Store."
    exit 1
fi

# Check for iOS Simulator
if ! xcrun simctl list devices | grep -q "iOS"; then
    echo "❌ iOS Simulator is not available. Please install Xcode and iOS Simulator."
    exit 1
fi

echo "✅ All required tools are available"

# Install iOS testing dependencies
echo "📦 Installing iOS testing dependencies..."

# Install Capacitor CLI if not already installed
if ! command -v cap &> /dev/null; then
    echo "Installing Capacitor CLI..."
    npm install -g @capacitor/cli
fi

# Install ios-sim for simulator management
if ! command -v ios-sim &> /dev/null; then
    echo "Installing ios-sim..."
    npm install -g ios-sim
fi

# Install testing utilities
echo "Installing testing utilities..."
npm install --save-dev \
    @capacitor/ios \
    ios-deploy \
    node-simctl \
    appium \
    webdriverio

echo "✅ Dependencies installed successfully"

# Set up iOS project if it doesn't exist
echo "🏗️ Setting up iOS project..."

# Build the web project first
echo "Building web project..."
npm run build

# Add iOS platform if not already added
if [ ! -d "ios" ]; then
    echo "Adding iOS platform..."
    npx cap add ios
else
    echo "iOS platform already exists"
fi

# Sync the project
echo "Syncing iOS project..."
npx cap sync ios

echo "✅ iOS project setup complete"

# Create iOS simulators if they don't exist
echo "📱 Setting up iOS simulators..."

# Function to create simulator if it doesn't exist
create_simulator_if_needed() {
    local name="$1"
    local device_type="$2"
    local runtime="$3"
    
    if ! xcrun simctl list devices | grep -q "$name"; then
        echo "Creating simulator: $name"
        xcrun simctl create "$name" "$device_type" "$runtime"
    else
        echo "Simulator already exists: $name"
    fi
}

# Get latest iOS runtime
IOS_RUNTIME=$(xcrun simctl list runtimes | grep iOS | tail -1 | awk '{print $NF}')
echo "Using iOS runtime: $IOS_RUNTIME"

# Create test simulators
create_simulator_if_needed "GBW Test iPhone SE" "iPhone SE (3rd generation)" "$IOS_RUNTIME"
create_simulator_if_needed "GBW Test iPhone 15 Pro" "iPhone 15 Pro" "$IOS_RUNTIME"
create_simulator_if_needed "GBW Test iPhone 15 Pro Max" "iPhone 15 Pro Max" "$IOS_RUNTIME"
create_simulator_if_needed "GBW Test iPad Air" "iPad Air (5th generation)" "$IOS_RUNTIME"

echo "✅ iOS simulators setup complete"

# Set up test directories
echo "📁 Setting up test directories..."

mkdir -p ios-testing/reports/screenshots
mkdir -p ios-testing/reports/videos
mkdir -p ios-testing/reports/logs
mkdir -p ios-testing/reports/coverage

echo "✅ Test directories created"

# Set up test configuration
echo "⚙️ Setting up test configuration..."

# Create test configuration file
cat > ios-testing/config/test-config.json << EOF
{
  "simulators": {
    "iphone-se": {
      "name": "GBW Test iPhone SE",
      "deviceType": "iPhone SE (3rd generation)",
      "runtime": "$IOS_RUNTIME"
    },
    "iphone-15-pro": {
      "name": "GBW Test iPhone 15 Pro",
      "deviceType": "iPhone 15 Pro",
      "runtime": "$IOS_RUNTIME"
    },
    "iphone-15-pro-max": {
      "name": "GBW Test iPhone 15 Pro Max",
      "deviceType": "iPhone 15 Pro Max",
      "runtime": "$IOS_RUNTIME"
    },
    "ipad-air": {
      "name": "GBW Test iPad Air",
      "deviceType": "iPad Air (5th generation)",
      "runtime": "$IOS_RUNTIME"
    }
  },
  "testSettings": {
    "timeout": 30000,
    "retries": 2,
    "screenshots": true,
    "video": true,
    "parallel": false
  },
  "capabilities": {
    "platformName": "iOS",
    "automationName": "XCUITest",
    "deviceName": "iPhone 15 Pro",
    "platformVersion": "17.2",
    "bundleId": "app.lovable.822f9e01fc9740d1b5062512241aa634",
    "noReset": false,
    "fullReset": false
  }
}
EOF

echo "✅ Test configuration created"

# Set up npm scripts for testing
echo "📝 Adding test scripts to package.json..."

# Create test scripts
npm pkg set scripts.test:ios="node ios-testing/scripts/test-runner.js"
npm pkg set scripts.test:ios:native="node ios-testing/scripts/test-runner.js --category=native"
npm pkg set scripts.test:ios:performance="node ios-testing/scripts/test-runner.js --category=performance"
npm pkg set scripts.test:ios:accessibility="node ios-testing/scripts/test-runner.js --category=accessibility"
npm pkg set scripts.test:ios:integration="node ios-testing/scripts/test-runner.js --category=integration"
npm pkg set scripts.test:ios:devices="node ios-testing/scripts/test-runner.js --devices=all"
npm pkg set scripts.ios:setup="bash ios-testing/scripts/setup/ios-test-setup.sh"

echo "✅ Test scripts added to package.json"

# Validate setup
echo "🧪 Validating setup..."

# Check if simulators can be booted
echo "Testing simulator boot..."
SIMULATOR_ID=$(xcrun simctl list devices | grep "GBW Test iPhone 15 Pro" | head -1 | sed 's/.*(\([^)]*\)).*/\1/')

if [ ! -z "$SIMULATOR_ID" ]; then
    echo "Booting test simulator..."
    xcrun simctl boot "$SIMULATOR_ID" || echo "Simulator already booted"
    
    # Wait for simulator to be ready
    echo "Waiting for simulator to be ready..."
    sleep 5
    
    # Check simulator status
    if xcrun simctl list devices | grep "$SIMULATOR_ID" | grep -q "Booted"; then
        echo "✅ Simulator is running successfully"
        
        # Shutdown simulator
        xcrun simctl shutdown "$SIMULATOR_ID"
        echo "✅ Simulator shutdown successful"
    else
        echo "⚠️ Warning: Simulator may not be fully functional"
    fi
else
    echo "⚠️ Warning: Could not find test simulator"
fi

# Create a simple test to verify setup
echo "Running setup verification test..."

cat > ios-testing/scripts/verify-setup.js << 'EOF'
#!/usr/bin/env node

console.log('🧪 Verifying iOS testing setup...');

const checks = [
  { name: 'Node.js', check: () => process.version },
  { name: 'iOS Testing Directory', check: () => require('fs').existsSync('./ios-testing') },
  { name: 'Test Configuration', check: () => require('fs').existsSync('./ios-testing/config/test-config.json') },
  { name: 'iOS Platform', check: () => require('fs').existsSync('./ios') },
  { name: 'Capacitor Config', check: () => require('fs').existsSync('./capacitor.config.ts') }
];

let allPassed = true;

checks.forEach(check => {
  try {
    const result = check.check();
    if (result) {
      console.log(`✅ ${check.name}: OK`);
    } else {
      console.log(`❌ ${check.name}: FAILED`);
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ ${check.name}: ERROR - ${error.message}`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('\n🎉 iOS testing setup verification passed!');
  console.log('You can now run iOS tests with: npm run test:ios');
} else {
  console.log('\n❌ Setup verification failed. Please check the errors above.');
  process.exit(1);
}
EOF

node ios-testing/scripts/verify-setup.js

echo ""
echo "🎉 iOS Testing Environment Setup Complete!"
echo "=========================================="
echo ""
echo "Available commands:"
echo "  npm run test:ios                 - Run all iOS tests"
echo "  npm run test:ios:native         - Run native feature tests"
echo "  npm run test:ios:performance    - Run performance tests"
echo "  npm run test:ios:accessibility  - Run accessibility tests"
echo "  npm run test:ios:integration    - Run integration tests"
echo "  npm run test:ios:devices        - Run tests on all devices"
echo ""
echo "Test reports will be saved to: ios-testing/reports/"
echo ""
echo "To get started, run: npm run test:ios"
echo ""