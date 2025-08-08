# 🏷️ Version Control Quick Reference

## 🚀 Quick Commands

```bash
# List all versions
npm run version:list

# Check current status
npm run version:current

# Create new version
npm run version:create v2.1.0 "Added user favorites feature"

# Rollback to previous version
npm run version:rollback v2.0.0-simple-ticketmaster

# Compare two versions  
npm run version:compare v1.0.0-complex-social v2.0.0-simple-ticketmaster

# Build and deploy current version
npm run deploy:ios
```

## 📱 Available Versions

### v2.0.0-simple-ticketmaster (Current)
- **Best for**: Quick event discovery
- **Features**: Splash screen → Map → Single button → Events
- **Use case**: Users who want immediate access to LA events

### v1.0.0-complex-social  
- **Best for**: Full social experience
- **Features**: Auth → Navigation → Stories → Complex UI
- **Use case**: Users who want social features + events

## 🔄 Common Workflows

### Making Changes
1. Work on your feature
2. Test thoroughly
3. Commit changes
4. Create version tag: `npm run version:create v2.1.0 "Your description"`

### Rolling Back
1. Check versions: `npm run version:list`
2. Rollback: `npm run version:rollback v2.0.0-simple-ticketmaster`
3. Test the rollback
4. If good, merge back to main

### Emergency Rollback
```bash
git checkout v2.0.0-simple-ticketmaster
npm run deploy:ios
# App is now back to working state
```

## 📋 Before Making Major Changes

1. **Create backup tag**: `npm run version:create v2.0.1-stable "Stable backup before changes"`
2. **Document in CHANGELOG.md**: What you're changing and why
3. **Test on iOS simulator**: Make sure current version works
4. **Make your changes**: Keep commits focused
5. **Test again**: Ensure new version works
6. **Tag new version**: `npm run version:create v2.1.0 "Description"`

## 🆘 Emergency Procedures

### If App Won't Build
```bash
npm run version:rollback v2.0.0-simple-ticketmaster
npm run deploy:ios
```

### If App Crashes on Launch
```bash
git checkout v2.0.0-simple-ticketmaster
npm install
npm run deploy:ios
```

### If You Lose Track of Changes
```bash
npm run version:current
npm run version:list
npm run version:compare v2.0.0-simple-ticketmaster HEAD
```

## 📝 Version Naming Convention

- **Major (v2.0.0)**: Complete UI/UX overhaul or architecture change
- **Minor (v2.1.0)**: New features added
- **Patch (v2.1.1)**: Bug fixes, small improvements

### Tag Suffixes
- `-simple-*`: Minimal, single-purpose versions
- `-complex-*`: Full-featured, multi-purpose versions  
- `-stable`: Known working versions
- `-experimental`: Testing new features

## 🔍 Debugging Version Issues

### Compare what changed
```bash
npm run version:compare v2.0.0-simple-ticketmaster v2.1.0
```

### See what files are different
```bash
git diff v2.0.0-simple-ticketmaster..HEAD --name-only
```

### View specific file changes
```bash
git show v2.0.0-simple-ticketmaster:src/App.tsx
```

## 💡 Pro Tips

1. **Always test before tagging**: Build and run on iOS simulator
2. **Keep CHANGELOG.md updated**: Future you will thank you
3. **Use descriptive tag messages**: Explain what changed and why
4. **Tag stable versions**: Before making risky changes
5. **Document decisions**: In CHANGELOG.md, explain why you chose a direction

---

*This guide is for the Geo Bubble Whispers app version management system.*