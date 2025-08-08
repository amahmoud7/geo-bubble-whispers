#!/bin/bash

# Pre-deployment Checklist Script
# This script performs comprehensive checks before deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[CHECK]${NC} $1"; }
print_success() { echo -e "${GREEN}[PASS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[FAIL]${NC} $1"; }

ISSUES_FOUND=0

check_environment_files() {
    print_status "Checking environment configuration files..."
    
    if [ -f ".env.production" ]; then
        print_success "Production environment file exists"
        
        # Check for required variables
        required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "VITE_GOOGLE_MAPS_API_KEY")
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" .env.production; then
                print_success "Required variable $var is set"
            else
                print_error "Missing required variable: $var"
                ((ISSUES_FOUND++))
            fi
        done
    else
        print_error "Production environment file (.env.production) not found"
        ((ISSUES_FOUND++))
    fi
}

check_capacitor_config() {
    print_status "Checking Capacitor configuration..."
    
    if [ -f "capacitor.config.prod.ts" ]; then
        print_success "Production Capacitor config exists"
        
        # Check for production app ID
        if grep -q "com.geobubblewhispers.app" capacitor.config.prod.ts; then
            print_success "Production app ID is configured"
        else
            print_error "Production app ID not found or incorrect"
            ((ISSUES_FOUND++))
        fi
        
        # Check that dev server URL is not configured for production
        if grep -q "server:" capacitor.config.prod.ts && grep -q "url:" capacitor.config.prod.ts; then
            print_error "Production config should not have server.url configured"
            ((ISSUES_FOUND++))
        else
            print_success "No development server URL in production config"
        fi
    else
        print_error "Production Capacitor config not found"
        ((ISSUES_FOUND++))
    fi
}

check_ios_configuration() {
    print_status "Checking iOS configuration..."
    
    if [ -f "ios-info-additions.plist" ]; then
        print_success "iOS Info additions file exists"
        
        # Check for required permissions
        required_permissions=("NSLocationWhenInUseUsageDescription" "NSCameraUsageDescription" "NSPhotoLibraryUsageDescription")
        for perm in "${required_permissions[@]}"; do
            if grep -q "$perm" ios-info-additions.plist; then
                print_success "Permission $perm is configured"
            else
                print_error "Missing permission: $perm"
                ((ISSUES_FOUND++))
            fi
        done
        
        # Check App Transport Security
        if grep -q "NSAppTransportSecurity" ios-info-additions.plist; then
            print_success "App Transport Security is configured"
            
            # Warn about arbitrary loads
            if grep -q "<true/>" ios-info-additions.plist && grep -B2 -A2 "NSAllowsArbitraryLoads" ios-info-additions.plist | grep -q "<true/>"; then
                print_warning "NSAllowsArbitraryLoads is enabled - this may be rejected by App Store"
                ((ISSUES_FOUND++))
            fi
        else
            print_error "App Transport Security not configured"
            ((ISSUES_FOUND++))
        fi
    else
        print_error "iOS Info additions file not found"
        ((ISSUES_FOUND++))
    fi
}

check_app_store_metadata() {
    print_status "Checking App Store metadata..."
    
    if [ -f "app-store-metadata.json" ]; then
        print_success "App Store metadata file exists"
        
        # Check for required fields
        required_fields=("app_name" "bundle_id" "version" "description")
        for field in "${required_fields[@]}"; do
            if grep -q "\"$field\":" app-store-metadata.json; then
                print_success "Metadata field $field is present"
            else
                print_error "Missing metadata field: $field"
                ((ISSUES_FOUND++))
            fi
        done
        
        # Check for privacy policy URL
        if grep -q "privacy_policy_url" app-store-metadata.json; then
            privacy_url=$(grep "privacy_policy_url" app-store-metadata.json | cut -d'"' -f4)
            if [ -n "$privacy_url" ] && [ "$privacy_url" != "" ]; then
                print_success "Privacy policy URL is configured"
            else
                print_warning "Privacy policy URL is empty - required for App Store"
            fi
        fi
    else
        print_error "App Store metadata file not found"
        ((ISSUES_FOUND++))
    fi
}

check_assets() {
    print_status "Checking app assets..."
    
    # Check for app icon configuration
    if [ -f "ios-assets/app-icon-config.json" ]; then
        print_success "App icon configuration exists"
    else
        print_warning "App icon configuration not found"
    fi
    
    # Check for launch screen configuration
    if [ -f "ios-assets/launch-screen-config.json" ]; then
        print_success "Launch screen configuration exists"
    else
        print_warning "Launch screen configuration not found"
    fi
    
    # Check public assets
    if [ -d "public" ]; then
        print_success "Public assets directory exists"
        
        if [ -f "public/favicon.ico" ]; then
            print_success "Favicon exists"
        else
            print_warning "Favicon not found"
        fi
    else
        print_error "Public assets directory not found"
        ((ISSUES_FOUND++))
    fi
}

check_dependencies() {
    print_status "Checking dependencies and security..."
    
    # Check for package.json
    if [ -f "package.json" ]; then
        print_success "Package.json exists"
        
        # Check for any known vulnerable packages (basic check)
        if command -v npm >/dev/null 2>&1; then
            npm audit --audit-level=high > /dev/null 2>&1 || {
                print_warning "npm audit found high-severity vulnerabilities"
            }
        fi
    else
        print_error "Package.json not found"
        ((ISSUES_FOUND++))
    fi
    
    # Check lock file
    if [ -f "package-lock.json" ] || [ -f "yarn.lock" ] || [ -f "bun.lockb" ]; then
        print_success "Lock file exists"
    else
        print_warning "No lock file found - dependencies may not be deterministic"
    fi
}

check_build_configuration() {
    print_status "Checking build configuration..."
    
    # Check Vite config
    if [ -f "vite.config.ts" ]; then
        print_success "Vite configuration exists"
        
        # Check for production optimizations
        if grep -q "minify" vite.config.ts; then
            print_success "Minification is configured"
        else
            print_warning "Minification not explicitly configured"
        fi
        
        if grep -q "manualChunks" vite.config.ts; then
            print_success "Code splitting is configured"
        else
            print_warning "Manual code splitting not configured"
        fi
    else
        print_error "Vite configuration not found"
        ((ISSUES_FOUND++))
    fi
    
    # Check TypeScript config
    if [ -f "tsconfig.json" ]; then
        print_success "TypeScript configuration exists"
    else
        print_warning "TypeScript configuration not found"
    fi
}

check_security_best_practices() {
    print_status "Checking security best practices..."
    
    # Check for hardcoded secrets (basic patterns)
    if grep -r "password.*=" src/ 2>/dev/null | grep -v "placeholder\|example\|demo" | head -1; then
        print_warning "Potential hardcoded passwords found in source code"
    fi
    
    if grep -r "api.*key.*=" src/ 2>/dev/null | grep -v "VITE_\|import.meta.env" | head -1; then
        print_warning "Potential hardcoded API keys found in source code"
    fi
    
    # Check environment variable usage
    if grep -r "import.meta.env" src/ >/dev/null 2>&1; then
        print_success "Environment variables are used properly"
    else
        print_warning "No environment variable usage detected"
    fi
}

run_all_checks() {
    echo "======================================="
    echo "  GEO BUBBLE WHISPERS - PRE-DEPLOY"
    echo "======================================="
    echo ""
    
    check_environment_files
    echo ""
    check_capacitor_config
    echo ""
    check_ios_configuration
    echo ""
    check_app_store_metadata
    echo ""
    check_assets
    echo ""
    check_dependencies
    echo ""
    check_build_configuration
    echo ""
    check_security_best_practices
    echo ""
    
    echo "======================================="
    if [ $ISSUES_FOUND -eq 0 ]; then
        print_success "All checks passed! Ready for deployment."
        echo ""
        echo "Next steps:"
        echo "  1. Run: ./scripts/deploy.sh deploy production 1.0.0 1"
        echo "  2. Archive and upload in Xcode"
        echo "  3. Submit for App Store review"
        exit 0
    else
        print_error "Found $ISSUES_FOUND issue(s) that need to be resolved before deployment."
        echo ""
        echo "Please fix the issues above and run this script again."
        exit 1
    fi
}

# Run all checks
run_all_checks