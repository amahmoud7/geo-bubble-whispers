# iOS Diagnostic Questions

I need specific information to fix the iOS issue:

## What EXACTLY do you see on your iPhone screen?

1. **When you launch the app, what appears?**
   - [ ] Blue screen with splash image (native splash)
   - [ ] Black screen
   - [ ] White screen
   - [ ] Nothing at all / app crashes immediately
   - [ ] Lo logo animation (React splash)
   - [ ] Other (describe):

2. **Does the screen stay that way or does it change?**
   - [ ] Stays frozen on one screen
   - [ ] Changes after a few seconds (what to?)
   - [ ] Flashes briefly then goes black
   - [ ] Other:

3. **Do you see the Lo logo animation at all?**
   - [ ] Yes, I see it
   - [ ] No, never see it
   - [ ] See it briefly then it disappears

## In Xcode Console (Very Important)

**Please check the Xcode console:**
1. In Xcode, press **Cmd+Shift+Y** to open Debug Area
2. Look at the console output (bottom panel)
3. **Look for RED error messages**

**What do you see in the console?**
- Copy and paste any RED error messages here
- Look for errors that mention:
  - "Failed to load"
  - "Error"
  - "undefined"
  - "Cannot find"
  - Any JavaScript errors

## Clean Build Check

**Did you do a CLEAN build?**
1. In Xcode menu: Product → Clean Build Folder (Cmd+Shift+K)
2. Wait for it to complete
3. Then: Product → Run (Cmd+R)

**If you haven't done this yet, please do it now.**

## Alternative Diagnostic

**Can you also check:**
1. Does the app icon show on your iPhone home screen?
2. When you tap it, does it open at all?
3. Does it show the Apple loading spinner?
4. Does the app appear in the app switcher?

## Most Likely Issues

Based on "no difference", it could be:
1. **Cached old build** - Need clean build in Xcode
2. **JavaScript error on iOS** - Would show in console
3. **Resource not loading** - dist folder not synced properly
4. **Native crash** - App closes immediately

Please provide these details so I can fix the actual problem.
