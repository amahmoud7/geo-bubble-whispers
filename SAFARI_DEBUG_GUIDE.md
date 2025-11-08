# Safari Blank Screen Debugging Guide

## Current Issue
Safari Web Inspector console is completely blank - no logs appearing at all.

## Step-by-Step Debugging

### 1. Verify Dev Server is Running
```bash
# In terminal, make sure the dev server is running:
npm run dev

# You should see:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:8080/
# ➜  Network: use --host to expose
```

### 2. Check What You're Accessing
- URL should be: `http://localhost:8080/`
- If you're on a physical device, use the Network URL shown by Vite
- Make sure you're not accessing `file://` protocol

### 3. Check Safari Web Inspector Tabs

#### Network Tab
1. Click "Network" tab in Web Inspector
2. Refresh the page (Cmd+R)
3. Look for:
   - **Red/failed requests** - indicates loading errors
   - **main.tsx** - should show status 200
   - **vite/client** - Vite's hot reload client
   
**What to look for:**
- ❌ If `main.tsx` is missing or failed → script not loading
- ❌ If getting CORS errors → server configuration issue
- ❌ If 404 errors → wrong URL or server not running

#### Elements Tab
1. Click "Elements" tab
2. Expand `<html>` → `<body>` → `<div id="root">`
3. Check if root div has any content inside

**Expected:**
- If blank: JavaScript failed to render
- If has content: Rendering issue, not loading issue

#### Console Tab Filtering
1. In Console tab, check the filter buttons at top
2. Make sure you're on "All" (not just Errors/Warnings)
3. Try clearing and refreshing: Cmd+K then Cmd+R

### 4. Force Refresh Without Cache
```
Safari: Hold Shift + Click Reload button
Or: Cmd + Option + R
```

### 5. Check for JavaScript Errors
If console is blank, JavaScript might be failing before any logs:

1. Look at **Errors** filter in console
2. Check **Sources** tab → look for any red error indicators
3. Try accessing console BEFORE loading the page:
   - Open Web Inspector first
   - Then navigate to localhost:8080

### 6. Test Basic HTML Loading
Check if the base HTML is loading:

1. In Console tab, type:
```javascript
document.getElementById('root')
```

**Expected results:**
- If returns `null` → HTML not loaded properly
- If returns `<div id="root">` → HTML loaded, JS not executing

### 7. Check Module Loading
In Console, check if modules are blocked:

```javascript
// Check if Vite client loaded
window.__vite_plugin_react_preamble_installed__

// Check if root element exists
document.getElementById('root')

// Check for any global errors
window.onerror
```

### 8. Mobile Safari Specific (If testing on iPhone)
If you're testing on actual iPhone via Safari Web Inspector:

1. On iPhone:
   - Settings → Safari → Advanced → Enable "Web Inspector"
   
2. On Mac Safari:
   - Connect iPhone via cable
   - Open Safari → Develop → [Your iPhone] → localhost:8080
   
3. Make sure iPhone and Mac are on same network

### 9. Check for Blocked Content
Safari might be blocking content:

1. In Safari URL bar, look for shield icon 🛡️
2. If present, click and allow content
3. Check Settings → Websites → Content Blockers

### 10. Restart Everything
Sometimes Safari caches aggressively:

```bash
# Stop dev server (Ctrl+C)
# Clear npm cache
npm cache clean --force

# Restart dev server
npm run dev
```

Then in Safari:
1. Quit Safari completely (Cmd+Q)
2. Reopen Safari
3. Navigate to localhost:8080

## Common Issues & Solutions

### Issue: Console shows "localhost:8080 refused to connect"
**Solution:** Dev server not running. Run `npm run dev`

### Issue: Console completely blank after refresh
**Solution:** 
- Check Network tab for failed requests
- Check if JavaScript is blocked
- Try different port: update vite.config.ts server.port

### Issue: Page loads but console has no logs
**Solution:**
- Console might be filtered - check "All" filter
- Try: `console.log('test')` in Console tab to verify it works
- Check if console is detached/in separate window

### Issue: "Failed to load module" errors
**Solution:**
- Delete node_modules and package-lock.json
- Run `npm install`
- Restart dev server

## Quick Test Script
Run this in your Mac terminal to verify server:

```bash
# Check if server responds
curl http://localhost:8080

# Should return HTML with <div id="root"></div>
```

## Next Steps Based on Findings

1. **If Network tab shows failed requests:**
   - Check server is running on correct port
   - Check firewall settings
   - Try different port

2. **If Elements tab shows empty root div:**
   - JavaScript is loading but not executing
   - Check Console Errors tab
   - Check browser compatibility

3. **If HTML doesn't load at all:**
   - Dev server not accessible
   - Wrong URL
   - Network/firewall issue

## Report Back With:
1. What does Network tab show when you refresh?
2. What does Elements tab show inside `<div id="root">`?
3. Do you see ANY red errors anywhere in Web Inspector?
4. Are you testing on Mac Safari or iPhone Safari (via Web Inspector)?
5. What URL are you accessing exactly?
