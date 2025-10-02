# Google Maps Troubleshooting Guide

## Issue Diagnosis

Your Lo app is experiencing Google Maps loading issues. This guide provides a comprehensive solution to diagnose and fix the problem.

## Quick Diagnostic

1. **Visit the diagnostic page**: http://localhost:8080/diagnostic
2. **Check browser console** for JavaScript errors (F12 → Console)
3. **Verify network connectivity** to Google APIs

## Common Issues & Solutions

### 1. API Key Issues

**Problem**: Invalid, missing, or restricted API key
**Solutions**:
- Check `.env.local` file contains `VITE_GOOGLE_MAPS_API_KEY=your_key_here`
- Verify the API key in Google Cloud Console
- Ensure the key hasn't been regenerated

```bash
# Check if API key is loaded
echo $VITE_GOOGLE_MAPS_API_KEY
```

### 2. Google Cloud Console Configuration

**Required APIs to Enable**:
- Maps JavaScript API
- Places API (for search functionality)
- Geocoding API (optional, for address lookups)

**Steps**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Library"
3. Enable the required APIs listed above
4. Check "APIs & Services" → "Credentials" for API key restrictions

### 3. API Key Restrictions

**Development Setup**:
```
HTTP referrers (web sites):
- localhost:*
- 127.0.0.1:*
- *.localhost:*
```

**Production Setup**:
```
HTTP referrers (web sites):
- yourdomain.com/*
- *.yourdomain.com/*
```

### 4. Billing Issues

**Problem**: Billing not enabled or quota exceeded
**Solutions**:
- Enable billing in Google Cloud Console
- Check current usage in "APIs & Services" → "Quotas"
- Set up quota alerts to prevent service interruption

### 5. Network/Firewall Issues

**Problem**: Corporate firewall or proxy blocking Google APIs
**Solutions**:
- Whitelist `*.googleapis.com` and `*.google.com`
- Check if VPN is interfering
- Test from different network

## Implementation Fixes Applied

### 1. Enhanced Error Handling

The MapView component now includes:
- Better error messages
- Fallback static map when interactive map fails
- Retry functionality
- Diagnostic page integration

### 2. Fallback Map Component

When Google Maps fails, users see:
- Static map image (if API key works for static maps)
- Current location coordinates
- Troubleshooting tips
- Retry and diagnostic buttons

### 3. Improved Loading States

- Progressive loading with skeleton UI
- Clear error states with actionable messages
- Offline detection and handling

## Testing the Fix

### 1. Test with Valid API Key
```bash
# Start development server
npm run dev

# Visit main map
http://localhost:8080/

# Visit diagnostic page
http://localhost:8080/diagnostic
```

### 2. Test Error Scenarios
```bash
# Test with invalid API key
# Temporarily modify .env.local with invalid key
VITE_GOOGLE_MAPS_API_KEY=invalid_key

# Test without API key
# Comment out the VITE_GOOGLE_MAPS_API_KEY line
```

## Verification Checklist

- [ ] Google Maps JavaScript API enabled in Cloud Console
- [ ] Places API enabled in Cloud Console
- [ ] Billing enabled for the project
- [ ] API key has correct restrictions (localhost for dev)
- [ ] API key hasn't exceeded quota
- [ ] Network allows connections to googleapis.com
- [ ] No JavaScript errors in browser console
- [ ] MapView component renders without errors
- [ ] Diagnostic page shows green status

## Production Deployment

### Environment Variables
```bash
# Production .env
VITE_GOOGLE_MAPS_API_KEY=your_production_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### API Key Restrictions for Production
```
HTTP referrers:
- your-domain.com/*
- *.your-domain.com/*
```

## Monitoring & Alerts

1. **Set up quota alerts** in Google Cloud Console
2. **Monitor API usage** to avoid unexpected charges
3. **Set up error monitoring** to catch map loading failures
4. **Test regularly** from different locations and networks

## Contact Support

If issues persist after following this guide:
1. Visit the diagnostic page at `/diagnostic`
2. Check browser console for specific error messages
3. Verify Google Cloud Console settings
4. Contact development team with specific error details

## Files Modified

- `/src/components/MapView.tsx` - Enhanced error handling
- `/src/components/map/FallbackMap.tsx` - New fallback component
- `/src/pages/DiagnosticHome.tsx` - Enhanced diagnostic information
- `/src/App.tsx` - Added diagnostic route

## Next Steps

1. Test the application with your current API key
2. If issues persist, follow the troubleshooting steps above
3. Use the diagnostic page to identify specific problems
4. Contact the development team with diagnostic results if needed