# Universal Claude Toolkit - Quick Start

Welcome! Your project now has powerful development enhancement tools that work with **any framework**.

## 🚀 What's Installed

- **🎯 Context7 MCP**: Universal documentation and best practices
- **🎭 Playwright MCP**: Browser testing and validation
- **📋 Linear MCP**: Project management and issue tracking

## 🔧 Setup

### 1. Make Scripts Executable
```bash
chmod +x .claude/scripts/*.sh
```

### 2. Install Dependencies
```bash
bash .claude/scripts/setup.sh
```

### 3. Configure API Keys (Optional but Recommended)
```bash
cp .env.claude .env
# Edit .env with your actual API keys
```

### 4. Get Your API Keys

**Linear Integration:**
- Visit https://linear.app/settings/api
- Generate an API key
- Find your team/project IDs in Linear URL

**Context7 (if available):**
- Sign up at context7.com
- Get your API key from dashboard

## 🎯 Usage with Claude Code

The MCP servers automatically work with Claude Code when this `.claude` directory is present.

### 📚 Context7 Tools

```
🔍 get_best_practices - Framework-specific best practices
📝 get_code_pattern - Code examples and patterns  
🔬 analyze_project - Project analysis and recommendations
✅ validate_code_quality - Code quality validation
🛡️ get_security_checklist - Security recommendations
```

**Example Usage:**
- "Get React component best practices"
- "Show me a custom hook pattern for API calls"
- "Analyze my project structure"
- "Give me a security checklist for Node.js"

### 🎭 Playwright Tools

```
🧪 run_e2e_tests - Generate and run E2E tests
♿ audit_accessibility - WCAG compliance checking
⚡ measure_performance - Core Web Vitals measurement
📱 test_responsiveness - Multi-device testing
🌐 cross_browser_test - Cross-browser validation
📸 capture_screenshot - Take screenshots
```

**Example Usage:**
- "Generate E2E tests for my React app"
- "Run accessibility audit on localhost:3000"
- "Measure performance of my homepage"
- "Test responsive design across devices"

### 📋 Linear Tools

```
📋 get_issues - Fetch project issues
➕ create_issue - Create new issues
🔄 update_issue - Update issue status
🔗 link_commit_to_issue - Link commits to issues
📊 generate_project_report - Project status reports
👤 get_user_info - Get current user info
🏢 get_teams_and_projects - List teams and projects
```

**Example Usage:**
- "Show me all open issues"
- "Create a new bug report issue"
- "Update issue DEV-123 to In Progress"
- "Generate a project status report"

## 🚀 Framework-Specific Features

The toolkit automatically adapts to your project:

### React/Next.js Projects
- Component patterns and hooks
- State management best practices
- Performance optimization guides
- Testing patterns with React Testing Library

### Vue.js Projects  
- Composition API patterns
- Vuex/Pinia state management
- Vue 3 migration guides
- Vue-specific testing approaches

### Python Projects
- FastAPI/Django patterns
- Async programming best practices
- Testing with pytest
- API design guidelines

### Universal Features
- Security best practices
- Performance optimization
- Code quality standards
- Documentation patterns

## 🔄 Commands

### Quick Commands
```bash
# Run full setup
bash .claude/scripts/setup.sh

# Check toolkit status
bash .claude/scripts/setup.sh status

# Update toolkit
bash .claude/scripts/update.sh

# Validate configuration
bash .claude/scripts/setup.sh validate
```

### Test MCP Servers
```bash
# Test Context7
bash .claude/scripts/run-context7.sh

# Test Playwright  
bash .claude/scripts/run-playwright.sh

# Test Linear
bash .claude/scripts/run-linear.sh
```

## 🆘 Troubleshooting

### MCP Servers Not Loading
1. Check environment variables are set
2. Ensure scripts are executable: `chmod +x .claude/scripts/*.sh`
3. Run setup again: `bash .claude/scripts/setup.sh`

### Playwright Issues
1. Install browsers: `npx playwright install`
2. Check browser permissions
3. Try running in headless mode

### Linear API Issues
1. Verify API key is correct
2. Check team/project IDs
3. Ensure API key has required permissions

### Environment Variables
```bash
# Check if variables are loaded
echo $LINEAR_API_KEY
echo $CONTEXT7_API_KEY

# Source environment file
source .env.claude
```

## 📖 Documentation Files

- **Configuration**: `.claude/mcp-config.json`
- **Project Context**: `.claude/project-context.json`
- **Full Guide**: `.claude/universal-mcp-toolkit.md`
- **Installation**: `.claude/mcp-servers.md`

## 🔄 Updating

The toolkit supports automatic updates:

```bash
# Check for updates
bash .claude/scripts/update.sh check

# Update to latest version
bash .claude/scripts/update.sh

# Rollback if needed
bash .claude/scripts/update.sh rollback
```

## 🌟 Pro Tips

1. **Auto-Detection**: The toolkit automatically detects your framework and adapts accordingly
2. **Multi-Project**: Use the same toolkit across all your projects
3. **Team Sharing**: Share the `.claude` directory with your team for consistent tooling
4. **Customization**: Modify `project-context.json` to customize behavior
5. **Integration**: Works seamlessly with existing development workflows

## 🎉 Ready to Go!

Your Universal Claude Toolkit is now ready! Start by asking Claude Code to:

- "Analyze my project and suggest improvements"
- "Generate tests for my main component"
- "Show me security best practices for my tech stack"
- "Create a Linear issue for the new feature"

Happy coding! The toolkit will adapt to any project you work on. 🚀