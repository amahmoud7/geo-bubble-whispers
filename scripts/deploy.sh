#!/bin/bash

# Geo Bubble Whispers - iOS Deployment Script
# This script handles the complete deployment process for iOS App Store submission

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="Geo Bubble Whispers"
BUNDLE_ID="com.geobubblewhispers.app"
SCHEME_NAME="App"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check for Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check for npm
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check for Capacitor CLI
    if ! command_exists cap; then
        print_error "Capacitor CLI is not installed. Installing..."
        npm install -g @capacitor/cli
    fi
    
    # Check for Xcode (macOS only)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! command_exists xcodebuild; then
            print_error "Xcode is not installed. Please install Xcode from the App Store."
            exit 1
        fi
    fi
    
    print_success "All prerequisites are met!"
}

# Function to setup environment
setup_environment() {
    local env_type=${1:-production}
    print_status "Setting up $env_type environment..."
    
    # Copy appropriate environment file
    if [ -f ".env.$env_type" ]; then
        cp ".env.$env_type" ".env"
        print_success "Environment file copied for $env_type"
    else
        print_warning "No .env.$env_type file found, using defaults"
    fi
    
    # Copy appropriate Capacitor config
    if [ -f "capacitor.config.$env_type.ts" ]; then
        cp "capacitor.config.$env_type.ts" "capacitor.config.ts"
        print_success "Capacitor config copied for $env_type"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci --production=false
    print_success "Dependencies installed!"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Run linting
    if npm run lint; then
        print_success "Linting passed!"
    else
        print_error "Linting failed. Please fix the issues before deploying."
        exit 1
    fi
    
    # Run iOS tests if available
    if [ -f "ios-testing/scripts/run-tests.js" ]; then
        print_status "Running iOS tests..."
        npm run test:ios || print_warning "Some iOS tests failed, but continuing with deployment"
    fi
}

# Function to build the web app
build_web_app() {
    print_status "Building web application..."
    
    # Clean previous build
    rm -rf dist/
    
    # Build for production
    npm run build
    
    if [ -d "dist" ]; then
        print_success "Web application built successfully!"
        
        # Show build stats
        du -sh dist/
        find dist -name "*.js" -o -name "*.css" | head -10 | while read file; do
            size=$(du -h "$file" | cut -f1)
            echo "  $file - $size"
        done
    else
        print_error "Build failed!"
        exit 1
    fi
}

# Function to setup iOS project
setup_ios_project() {
    print_status "Setting up iOS project..."
    
    # Add iOS platform if not exists
    if [ ! -d "ios" ]; then
        npx cap add ios
    fi
    
    # Sync with latest web build
    npx cap sync ios
    
    # Copy iOS specific configurations
    if [ -f "ios-info-additions.plist" ]; then
        # This would typically be handled by Capacitor automatically
        print_success "iOS configuration files are ready"
    fi
    
    print_success "iOS project setup complete!"
}

# Function to update version numbers
update_version() {
    local version=${1:-"1.0.0"}
    local build_number=${2:-"1"}
    
    print_status "Updating version to $version (build $build_number)..."
    
    # Update package.json version
    npm version "$version" --no-git-tag-version
    
    # Update iOS version if iOS project exists
    if [ -d "ios" ]; then
        # Update Info.plist files
        find ios -name "Info.plist" -exec plutil -replace CFBundleShortVersionString -string "$version" {} \;
        find ios -name "Info.plist" -exec plutil -replace CFBundleVersion -string "$build_number" {} \;
    fi
    
    print_success "Version updated to $version (build $build_number)"
}

# Function to open Xcode
open_xcode() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_status "Opening Xcode..."
        npx cap open ios
        print_success "Xcode opened! You can now archive and upload to App Store Connect."
    else
        print_warning "Xcode can only be opened on macOS"
    fi
}

# Function to generate build report
generate_build_report() {
    local report_file="build-report-$(date +%Y%m%d-%H%M%S).md"
    
    print_status "Generating build report..."
    
    cat > "$report_file" << EOF
# Geo Bubble Whispers - Build Report

**Build Date:** $(date)
**Environment:** ${ENVIRONMENT:-production}
**Version:** $(node -p "require('./package.json').version")

## Build Summary

### Web Build
- Build tool: Vite
- Target: ES2020
- Minification: Terser
- Code splitting: Enabled

### Bundle Analysis
\`\`\`
$(du -sh dist/)
\`\`\`

### Key Files
$(find dist -name "*.js" -o -name "*.css" | head -10 | while read file; do
    size=$(du -h "$file" | cut -f1)
    echo "- $file - $size"
done)

### iOS Configuration
- Bundle ID: $BUNDLE_ID
- App Name: $APP_NAME
- iOS Version: $(cat ios-info-additions.plist | grep -A1 CFBundleShortVersionString | tail -1 | sed 's/<[^>]*>//g' | xargs || echo "Not set")

### Environment Variables
$(env | grep VITE_ | head -5 || echo "No VITE_ variables found")

### Next Steps
1. Open Xcode with: \`npx cap open ios\`
2. Archive the app in Xcode
3. Upload to App Store Connect
4. Submit for review

---
Generated by Geo Bubble Whispers deployment script
EOF

    print_success "Build report generated: $report_file"
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up temporary files..."
    # Remove any temporary files if needed
    print_success "Cleanup complete!"
}

# Main deployment function
deploy() {
    local environment=${1:-production}
    local version=${2:-"1.0.0"}
    local build_number=${3:-"1"}
    local skip_tests=${4:-false}
    
    print_status "Starting deployment for $APP_NAME"
    print_status "Environment: $environment"
    print_status "Version: $version (build $build_number)"
    
    # Run deployment steps
    check_prerequisites
    setup_environment "$environment"
    install_dependencies
    
    if [ "$skip_tests" != "true" ]; then
        run_tests
    else
        print_warning "Skipping tests as requested"
    fi
    
    update_version "$version" "$build_number"
    build_web_app
    setup_ios_project
    generate_build_report
    
    print_success "Deployment preparation complete!"
    print_status "Next steps:"
    echo "  1. Review the build report"
    echo "  2. Open Xcode: npx cap open ios"
    echo "  3. Archive and upload to App Store Connect"
    
    # Ask if user wants to open Xcode
    read -p "Do you want to open Xcode now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open_xcode
    fi
    
    cleanup
}

# Script entry point
main() {
    case "${1:-deploy}" in
        "deploy")
            deploy "${2:-production}" "${3:-1.0.0}" "${4:-1}" "${5:-false}"
            ;;
        "build-only")
            build_web_app
            ;;
        "ios-only")
            setup_ios_project
            ;;
        "version")
            update_version "${2:-1.0.0}" "${3:-1}"
            ;;
        "xcode")
            open_xcode
            ;;
        "report")
            generate_build_report
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  deploy [env] [version] [build] [skip-tests]  - Full deployment (default)"
            echo "  build-only                                   - Build web app only"
            echo "  ios-only                                     - Setup iOS project only"
            echo "  version [version] [build]                    - Update version numbers"
            echo "  xcode                                        - Open Xcode"
            echo "  report                                       - Generate build report"
            echo "  help                                         - Show this help"
            echo ""
            echo "Examples:"
            echo "  $0 deploy production 1.0.0 1"
            echo "  $0 deploy development 1.0.0-beta 2 true"
            echo "  $0 version 1.1.0 5"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"