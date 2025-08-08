# Geo Bubble Whispers - iOS Deployment Guide

This guide provides complete instructions for deploying the Geo Bubble Whispers iOS app to the App Store.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Build Process](#build-process)
5. [iOS Configuration](#ios-configuration)
6. [App Store Submission](#app-store-submission)
7. [Troubleshooting](#troubleshooting)
8. [Release Management](#release-management)

## Prerequisites

### Required Software

- **macOS 12.0+** (for iOS development)
- **Xcode 14.0+** with iOS 16.0+ SDK
- **Node.js 18.0+** and npm
- **Capacitor CLI 5.0+**
- **Apple Developer Account** (required for App Store distribution)

### Apple Developer Account Setup

1. Enroll in the Apple Developer Program ($99/year)
2. Create App ID: `com.geobubblewhispers.app`
3. Set up provisioning profiles for distribution
4. Configure App Store Connect app record

### Development Tools

```bash
# Install Capacitor CLI globally
npm install -g @capacitor/cli

# Verify installations
node --version    # Should be 18.0+
npm --version     # Should be 8.0+
cap --version     # Should be 5.0+
xcodebuild -version
```

## Environment Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd geo-bubble-whispers
npm install
```

### 2. Environment Configuration

Copy and configure environment files:

```bash
# Copy environment template
cp .env.example .env.production

# Edit .env.production with your values
nano .env.production
```

Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key  
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API key with restrictions
- `VITE_APP_VERSION`: Current app version (e.g., "1.0.0")

### 3. API Key Security

#### Google Maps API Key Configuration
1. Create a restricted API key in Google Cloud Console
2. Enable required APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Street View Static API
3. Add iOS bundle ID restriction: `com.geobubblewhispers.app`

#### Supabase Configuration
- Use Row Level Security (RLS) on all tables
- Configure proper authentication policies
- Enable real-time subscriptions with proper authorization

## Pre-Deployment Checklist

Run the automated pre-deployment checks:

```bash
npm run deploy:check
```

### Manual Verification Items

#### Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] No console.log statements in production code
- [ ] Proper error handling implemented

#### Security
- [ ] No hardcoded API keys or secrets
- [ ] Environment variables properly configured
- [ ] App Transport Security configured
- [ ] User data encryption enabled

#### App Store Requirements
- [ ] App metadata completed in `app-store-metadata.json`
- [ ] Privacy policy URL configured
- [ ] Age rating appropriate (12+)
- [ ] App icons generated for all sizes
- [ ] Launch screens configured

#### Testing
- [ ] All core features tested on iOS simulator
- [ ] Location services tested with permissions
- [ ] Camera and photo library access tested
- [ ] Push notifications configured and tested
- [ ] Offline functionality verified

## Build Process

### 1. Production Build

```bash
# Run full production deployment
npm run deploy:prod

# Or step by step:
npm run build:prod
npm run cap:sync
```

### 2. Version Management

Update version numbers before each release:

```bash
# Update to version 1.0.0 with build number 1
npm run deploy:version 1.0.0 1
```

This updates:
- `package.json` version
- iOS `CFBundleShortVersionString`
- iOS `CFBundleVersion`

### 3. Build Optimization

The build process includes:
- **Code splitting**: Separate chunks for vendors and features
- **Tree shaking**: Remove unused code
- **Minification**: Compress JavaScript and CSS
- **Asset optimization**: Compress images and fonts
- **Bundle analysis**: Track bundle sizes

## iOS Configuration

### 1. Capacitor Setup

```bash
# Add iOS platform (if not already added)
npx cap add ios

# Sync web build with native project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### 2. Xcode Project Configuration

#### Bundle Identifier
- Set to: `com.geobubblewhispers.app`
- Must match Apple Developer Account App ID

#### Signing & Capabilities
1. Select your development team
2. Enable automatic signing for development
3. For distribution, use manual signing with App Store provisioning profile

#### Required Capabilities
- Location Services
- Camera
- Photo Library
- Push Notifications
- Background App Refresh
- Background Processing

### 3. Info.plist Configuration

The `ios-info-additions.plist` file is automatically merged and includes:

- **Location permissions**: Required for map functionality
- **Camera permissions**: For photo/video messages
- **Photo library permissions**: For media selection
- **Microphone permissions**: For video recording
- **Push notification settings**
- **App Transport Security**: Configured for production APIs
- **URL schemes**: For deep linking

### 4. App Icons and Launch Screen

#### App Icons Required Sizes
- iPhone: 20pt, 29pt, 40pt, 60pt (all @2x and @3x)
- iPad: 20pt, 29pt, 40pt, 76pt, 83.5pt (@1x and @2x)
- App Store: 1024pt (@1x)

#### Launch Screen
- Uses storyboard-based launch screen
- Background color: `#6366f1` (brand primary)
- Supports all device sizes and orientations

## App Store Submission

### 1. Archive Build

In Xcode:
1. Select "Any iOS Device" as target
2. Product → Archive
3. Wait for archive to complete
4. Organizer window opens automatically

### 2. App Store Connect Configuration

#### App Information
- **Name**: Geo Bubble Whispers
- **Bundle ID**: com.geobubblewhispers.app
- **SKU**: GBW-iOS-001
- **Category**: Social Networking

#### Version Information
- **Version Number**: Match build version (e.g., 1.0.0)
- **Build Number**: Auto-incremented (e.g., 1, 2, 3...)
- **Copyright**: © 2024 Geo Bubble Whispers

#### App Description
Use the description from `app-store-metadata.json`:
- Compelling title and subtitle
- Feature-focused description
- Relevant keywords for App Store search

#### Screenshots Required
- iPhone 6.7" (3 minimum, 10 maximum)
- iPhone 6.5" (3 minimum, 10 maximum)  
- iPad Pro 12.9" (3 minimum, 10 maximum)
- iPad Pro 11" (3 minimum, 10 maximum)

#### App Review Information
- **Review Notes**: See `app-store-metadata.json`
- **Demo Account**: Provide test credentials
- **Contact Information**: Support email and phone

### 3. Upload Binary

From Xcode Organizer:
1. Click "Distribute App"
2. Select "App Store Connect"
3. Choose "Upload"
4. Select signing options (automatic recommended)
5. Review and upload

### 4. Submit for Review

In App Store Connect:
1. Select uploaded build
2. Complete all required metadata
3. Add screenshots
4. Set pricing (Free)
5. Submit for review

## Troubleshooting

### Common Build Issues

#### "Command PhaseScriptExecution failed"
- **Cause**: Node.js script errors during build
- **Solution**: Check Node.js version, clear node_modules, reinstall

#### "No matching provisioning profiles found"
- **Cause**: Signing configuration issues
- **Solution**: Verify Apple Developer Account, regenerate profiles

#### "Missing required architecture"
- **Cause**: Missing simulator or device architectures
- **Solution**: Clean build folder, ensure all targets included

### Runtime Issues

#### Location Services Not Working
- **Check**: Info.plist permissions configured
- **Check**: Device location services enabled
- **Check**: App location permission granted

#### Google Maps Not Loading
- **Check**: API key restrictions
- **Check**: Required APIs enabled
- **Check**: Network connectivity

#### Push Notifications Not Working
- **Check**: Push notification capability enabled
- **Check**: APNs certificate configured
- **Check**: Device notification permissions

### App Store Rejection Reasons

#### Common Rejections
1. **Missing privacy policy**: Add URL to App Store Connect
2. **Insufficient app functionality**: Ensure core features work
3. **Location usage unclear**: Clear permission descriptions
4. **App Transport Security**: Proper HTTPS configuration

#### Resolution Steps
1. Address Apple's feedback completely
2. Test on physical devices
3. Update metadata if required
4. Resubmit with detailed notes

## Release Management

### Version Numbering

Follow semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

Examples:
- Initial release: `1.0.0`
- Feature update: `1.1.0`
- Bug fix: `1.0.1`

### Build Numbers

Increment build number for each submission:
- Version 1.0.0: Builds 1, 2, 3...
- Version 1.1.0: Builds 4, 5, 6...

### Release Notes Template

```markdown
## What's New in Version X.X.X

### ✨ New Features
- Feature 1 description
- Feature 2 description

### 🐛 Bug Fixes
- Bug fix 1
- Bug fix 2

### 🔧 Improvements
- Performance improvements
- UI/UX enhancements

### 📱 Compatibility
- iOS 13.0 and later
- iPhone and iPad
```

### Post-Release Monitoring

1. **Crash Reports**: Monitor in App Store Connect
2. **User Reviews**: Respond to App Store reviews
3. **Analytics**: Track app usage and performance
4. **Performance**: Monitor app launch times and memory usage

## Security Considerations

### Data Protection
- All user data encrypted at rest
- Secure transmission using HTTPS/TLS
- Proper authentication and authorization

### Privacy Compliance
- Clear data usage descriptions
- User consent for location services
- Data retention and deletion policies
- GDPR/CCPA compliance measures

### API Security
- API keys properly restricted
- Rate limiting implemented
- Input validation and sanitization
- SQL injection prevention

## Support and Maintenance

### Regular Updates
- Security patches
- iOS compatibility updates
- Feature enhancements
- Bug fixes

### Monitoring
- Crash reporting via analytics service
- Performance monitoring
- User feedback collection
- App Store review monitoring

### Documentation
- Keep deployment guide updated
- Maintain troubleshooting knowledge base
- Document configuration changes
- Track release history

---

## Quick Reference Commands

```bash
# Check deployment readiness
npm run deploy:check

# Build and deploy production
npm run deploy:prod

# Update version
npm run deploy:version 1.0.0 1

# Open Xcode
npm run deploy:xcode

# Generate build report
npm run deploy:report
```

## Support

For deployment issues or questions:
- Review this documentation
- Check troubleshooting section
- Consult Apple Developer Documentation
- Contact development team

---

*Last updated: August 2024*
*Version: 1.0.0*