# 💬 Prompt Logging & Replay Workflow

This guide shows you how to log your prompts before making changes, so you can replay, modify, or revert them later.

---

## 🚀 Quick Start

### 1. Start a Prompt Session
```bash
npm run prompt:start my-feature-session
```

### 2. Before Asking Claude for Changes
```bash
npm run prompt:log "Add dark mode toggle to the app" "Feature request"
```
*Note the prompt ID that gets generated (e.g., `prompt-1736304123`)*

### 3. Ask Claude & Make Changes
Go to Claude and paste your prompt, make your changes...

### 4. After Changes Are Complete
```bash
npm run prompt:update prompt-1736304123 "Added dark mode with CSS variables and toggle button in header"
```

---

## 📋 Full Workflow Example

```bash
# Start tracking session
npm run prompt:start dark-mode-feature

# Log your first prompt
npm run prompt:log "Add a dark mode toggle button in the app header"
# Returns: prompt-1736304123

# Go to Claude, make changes...

# Update the prompt with results
npm run prompt:update prompt-1736304123 "Added toggle button, CSS variables, and theme persistence"

# Log another prompt  
npm run prompt:log "Make the dark mode button more prominent and add icon"
# Returns: prompt-1736304456

# Make more changes...

# Update second prompt
npm run prompt:update prompt-1736304456 "Increased button size, added moon/sun icons, improved styling"

# View all prompts in session
npm run prompt:list
```

---

## 🔄 Replay & Modify Prompts

### Find Old Prompts
```bash
# Search across all sessions
npm run prompt:search "dark mode"
npm run prompt:search "splash screen"
npm run prompt:search "ticketmaster"
```

### Replay a Prompt
```bash
npm run prompt:replay prompt-1736304123
```

This will:
1. Show you the original prompt text
2. Offer to checkout the git state from before the prompt
3. Give you the exact prompt text to copy/paste to Claude

### Modify and Try Again
1. Replay the prompt (checkouts out old state)
2. Copy the original prompt text  
3. Modify it: *"Add a dark mode toggle button in the app header **with better animations and user preference saving**"*
4. Paste to Claude and see if you get better results

---

## 🎯 Integration with Version Control

### Combined Workflow (Prompts + Versions)
```bash
# 1. Check current status
npm run version:current
npm run prompt:list

# 2. Start prompt session if needed
npm run prompt:start new-feature

# 3. Create stable version before big changes
npm run version:create v2.0.1-stable "Stable before new feature"

# 4. Log prompt before making changes
npm run prompt:log "Add user authentication with Google login"

# 5. Make changes with Claude...

# 6. Update prompt with results
npm run prompt:update prompt-1234567 "Added Google OAuth, login button, user context"

# 7. Create new version after successful changes
npm run version:create v2.1.0 "Added Google authentication system"

# 8. Export session for documentation
npm run prompt:export session_v2.1.0_auth_feature.md
```

### If Something Goes Wrong
```bash
# Option 1: Rollback version, then replay prompt with modifications
npm run version:rollback v2.0.1-stable
npm run prompt:replay prompt-1234567
# Modify prompt and try again...

# Option 2: Just replay the prompt on current code  
npm run prompt:replay prompt-1234567
# Use prompt text to ask Claude to revert the changes
```

---

## 📊 Prompt Analysis

### View Your Prompt History
```bash
npm run prompt:list          # Current session
npm run prompt:search "auth" # Find all auth-related prompts  
npm run prompt:export        # Export to markdown file
```

### Search Examples
```bash
npm run prompt:search "splash"           # Find splash screen prompts
npm run prompt:search "button"           # Find UI button prompts  
npm run prompt:search "error"            # Find bug fix prompts
npm run prompt:search "ticketmaster"     # Find event-related prompts
```

---

## 🎯 Best Practices

### Effective Prompt Logging
- **Log before making changes**: Always log the prompt first
- **Be specific**: Include context about what you want
- **Update with results**: Document what actually happened
- **Use descriptive context**: "Feature request", "Bug fix", "UI improvement"

### Good Prompt Examples
```bash
npm run prompt:log "Add splash screen with animated logo that shows for 3 seconds" "UI Enhancement"

npm run prompt:log "Fix the event pins not displaying on map after latest changes" "Bug Fix"  

npm run prompt:log "Replace complex navigation with single button for event loading" "UX Simplification"
```

### Session Organization
- **One session per feature**: Don't mix unrelated prompts
- **Descriptive session names**: `auth-system`, `ui-redesign`, `bug-fixes-jan8`
- **Export completed sessions**: Keep markdown records of major features

---

## 🔍 Advanced Usage

### Export and Share Sessions
```bash
npm run prompt:export feature_development_jan8.md
```
Share the markdown file with team members to show your development process.

### Batch Replay for Testing
```bash
# Find all prompts from a feature
npm run prompt:search "dark mode"

# Replay each one to test if they still work
npm run prompt:replay prompt-1234567
npm run prompt:replay prompt-1234890
```

### Cross-Session Analysis
```bash
# Find patterns in your prompts
npm run prompt:search "add"      # All "add feature" prompts
npm run prompt:search "fix"      # All bug fix prompts  
npm run prompt:search "remove"   # All removal prompts
```

---

## 🚨 Troubleshooting

### "No active session" error
```bash
npm run prompt:start
```

### Can't find a prompt ID
```bash
npm run prompt:list    # Check current session
npm run prompt:search "part of your prompt text"
```

### Replay doesn't work
Make sure you have a clean git state before replaying:
```bash
git status  # Check for uncommitted changes
git stash   # Stash if needed, then replay
```

---

## 📁 File Structure

```
prompts/
├── current_session.json          # Active session data
├── archived_session_xyz.json     # Past sessions  
└── exported_sessions/
    ├── feature_auth_jan8.md       # Exported session docs
    └── ui_redesign_jan9.md
```

---

*This system lets you maintain complete control over your development process, making it easy to retry, refine, and revert any changes.*