# Google Maps Integration Setup Guide

This guide covers the secure setup and configuration of Google Maps integration in the Lo platform.

## 🔐 Security Overview

The Lo platform implements secure Google Maps integration with the following features:
- ✅ **Environment-based API key management** - No hardcoded keys in source code
- ✅ **Error boundaries and fallback UI** - Graceful handling of API failures
- ✅ **API key validation** - Runtime validation of key format and permissions
- ✅ **Comprehensive error handling** - Detailed error reporting and recovery

## 📋 Prerequisites

1. **Google Cloud Project** with billing enabled
2. **Google Maps JavaScript API** enabled
3. **Places API** enabled (for location search)
4. **Valid API key** with proper restrictions

## 🚀 Setup Instructions

### 1. Create Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Enable the required APIs:
   - **Maps JavaScript API** (required)
   - **Places API** (required for search functionality)
   - **Geocoding API** (optional, for address validation)
4. Create credentials → API Key
5. Configure API key restrictions (recommended):
   - **HTTP referrers** for web usage
   - **IP addresses** for server usage

### 2. Configure Environment Variables

Create or update your `.env.local` file:

```bash
# Google Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...your-actual-api-key-here

# Required for full functionality
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Verify Configuration

The platform includes built-in diagnostics to verify your setup:

```typescript
import { runEnvironmentDiagnostics, logEnvironmentDiagnostics } from '@/utils/environmentDiagnostics';

// Log diagnostics to console
logEnvironmentDiagnostics();

// Get detailed diagnostic results
const diagnostics = runEnvironmentDiagnostics();
console.log('Overall status:', diagnostics.overall);
```

## 🏗️ Architecture

### Core Components

1. **GoogleMapsProvider** (`src/contexts/GoogleMapsContext.tsx`)
   - Centralized API loading and error handling
   - API key validation
   - Retry logic and error reporting

2. **GoogleMapsErrorBoundary** (`src/components/map/GoogleMapsErrorBoundary.tsx`)
   - React Error Boundary for map components
   - Automatic fallback to static map view
   - User-friendly error messages and recovery options

3. **FallbackMap** (`src/components/map/FallbackMap.tsx`)
   - Static map fallback when Google Maps fails to load
   - Troubleshooting tips and retry functionality
   - Graceful degradation of map features

4. **Environment Configuration** (`src/config/environment.ts`)
   - Secure environment variable management
   - Runtime validation and error handling
   - Production-safe logging

### Integration Flow

```
App.tsx
├── GoogleMapsProvider (API loading & validation)
├── MapView (wrapped in ErrorBoundary)
│   ├── GoogleMapsErrorBoundary
│   │   ├── GoogleMap (on success)
│   │   └── FallbackMap (on failure)
│   ├── Map Controls
│   ├── Message Markers
│   └── Live Stream Components
```

## 🛠️ Development

### Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Check for Google Maps integration issues
npm run build  # Validates environment configuration
```

### Testing Map Functionality

The platform includes comprehensive error handling:

1. **Invalid API Key**: Shows fallback map with error message
2. **API Quota Exceeded**: Displays appropriate error and retry option
3. **Network Issues**: Provides offline fallback and retry mechanisms
4. **Missing Permissions**: Clear error messages with setup instructions

### Debug Mode

Add to your `.env.local` for enhanced debugging:

```bash
VITE_ENABLE_DEV_TOOLS=true
NODE_ENV=development
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "API key not valid" Error
- **Cause**: Invalid or missing API key
- **Solution**: Verify `VITE_GOOGLE_MAPS_API_KEY` in `.env.local`
- **Check**: Ensure key starts with `AIza` and is properly formatted

#### 2. "Maps JavaScript API" Error  
- **Cause**: API not enabled in Google Cloud Console
- **Solution**: Enable Maps JavaScript API for your project

#### 3. "Quota Exceeded" Error
- **Cause**: API usage limits reached
- **Solution**: Increase quota or implement usage monitoring

#### 4. Map Not Loading
- **Cause**: Network issues or API restrictions
- **Solution**: Check network connectivity and API restrictions

### Diagnostic Tools

Use the built-in diagnostic utility:

```typescript
import { testGoogleMapsApiKey } from '@/utils/environmentDiagnostics';

// Test API key functionality
const result = await testGoogleMapsApiKey('your-api-key');
if (!result.valid) {
  console.error('API key test failed:', result.error);
}
```

### Error Boundary Testing

To test error boundary functionality:

1. Use an invalid API key temporarily
2. Block network access to Google Maps API
3. Use browser dev tools to simulate API failures

## 🚀 Production Deployment

### Environment Variables

Ensure these are set in your production environment:

```bash
NODE_ENV=production
VITE_GOOGLE_MAPS_API_KEY=your-production-api-key
VITE_SUPABASE_URL=your-production-supabase-url  
VITE_SUPABASE_ANON_KEY=your-production-supabase-key
```

### Security Best Practices

1. **API Key Restrictions**: 
   - Limit to specific domains/IPs
   - Enable only required APIs
   - Monitor usage regularly

2. **Environment Security**:
   - Never commit `.env.local` files
   - Use different keys for development/production  
   - Rotate keys regularly

3. **Error Handling**:
   - Monitor error rates
   - Set up alerting for API failures
   - Implement graceful degradation

### Performance Optimization

1. **Lazy Loading**: Maps are loaded on-demand
2. **Error Boundaries**: Prevent cascading failures
3. **Fallback UI**: Maintain functionality when maps fail
4. **Caching**: Implement appropriate caching strategies

## 🔧 Configuration Reference

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | `AIzaSy...` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://abc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbG...` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_ENABLE_DEV_TOOLS` | Enable development tools | `false` |
| `VITE_ENABLE_CRASH_REPORTING` | Enable error reporting | `true` |

## 📚 Additional Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [API Key Best Practices](https://developers.google.com/maps/api-key-best-practices)
- [React Google Maps API Library](https://github.com/JustFly1984/react-google-maps-api)

## 🆘 Support

If you encounter issues not covered in this guide:

1. Check the browser console for detailed error messages
2. Use the diagnostic utilities to verify configuration
3. Review the error boundaries and fallback UI behavior
4. Test with a minimal reproduction case

---

Last updated: September 2024
Version: 2.0.0