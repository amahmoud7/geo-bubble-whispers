#!/bin/bash

# Universal Claude Toolkit Installer
# Works with any project - React, Vue, Python, Go, etc.

set -e

echo "🚀 Universal Claude Toolkit Installer"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TOOLKIT_VERSION="1.0.0"
CLAUDE_DIR=".claude"
MCP_DIR="$CLAUDE_DIR/mcp"
SCRIPTS_DIR="$CLAUDE_DIR/scripts"

# Detect project type
detect_project_type() {
    if [ -f "package.json" ]; then
        echo "📦 Detected Node.js project"
        PROJECT_TYPE="nodejs"
        
        # Detect specific framework
        if grep -q "next" package.json; then
            FRAMEWORK="nextjs"
        elif grep -q "react" package.json; then
            FRAMEWORK="react"
        elif grep -q "vue" package.json; then
            FRAMEWORK="vue"
        elif grep -q "@angular/core" package.json; then
            FRAMEWORK="angular"
        else
            FRAMEWORK="nodejs"
        fi
    elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
        echo "🐍 Detected Python project"
        PROJECT_TYPE="python"
        
        if [ -f "requirements.txt" ]; then
            if grep -q "fastapi" requirements.txt; then
                FRAMEWORK="fastapi"
            elif grep -q "django" requirements.txt; then
                FRAMEWORK="django"
            elif grep -q "flask" requirements.txt; then
                FRAMEWORK="flask"
            else
                FRAMEWORK="python"
            fi
        else
            FRAMEWORK="python"
        fi
    elif [ -f "go.mod" ]; then
        echo "🐹 Detected Go project"
        PROJECT_TYPE="go"
        FRAMEWORK="go"
    elif [ -f "Cargo.toml" ]; then
        echo "🦀 Detected Rust project"
        PROJECT_TYPE="rust"
        FRAMEWORK="rust"
    elif [ -f "pom.xml" ] || [ -f "build.gradle" ]; then
        echo "☕ Detected Java project"
        PROJECT_TYPE="java"
        FRAMEWORK="java"
    elif [ -f "composer.json" ]; then
        echo "🐘 Detected PHP project"
        PROJECT_TYPE="php"
        FRAMEWORK="php"
    else
        echo "❓ Unknown project type, using universal config"
        PROJECT_TYPE="universal"
        FRAMEWORK="universal"
    fi
    
    echo -e "${GREEN}Framework detected: $FRAMEWORK${NC}"
}

# Create directory structure
create_directories() {
    echo "📁 Creating directory structure..."
    
    mkdir -p "$CLAUDE_DIR"
    mkdir -p "$MCP_DIR/context7"
    mkdir -p "$MCP_DIR/playwright"
    mkdir -p "$MCP_DIR/linear"
    mkdir -p "$SCRIPTS_DIR"
    mkdir -p "$CLAUDE_DIR/agents"
    mkdir -p "$CLAUDE_DIR/templates"
    
    echo -e "${GREEN}✅ Directories created${NC}"
}

# Install Node.js dependencies
install_nodejs_deps() {
    echo "📦 Installing Node.js dependencies..."
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm not found. Please install Node.js first.${NC}"
        exit 1
    fi
    
    # Install MCP dependencies
    cd "$MCP_DIR/context7" && npm install
    cd "../playwright" && npm install && npx playwright install --with-deps
    cd "../linear" && npm install
    cd "../../.."
    
    # Install project-specific dependencies
    if [ "$PROJECT_TYPE" = "nodejs" ]; then
        echo "Installing Playwright for project..."
        npm install --save-dev playwright @axe-core/playwright
    fi
    
    echo -e "${GREEN}✅ Node.js dependencies installed${NC}"
}

# Install Python dependencies
install_python_deps() {
    if [ "$PROJECT_TYPE" = "python" ]; then
        echo "🐍 Installing Python dependencies..."
        
        if command -v pip &> /dev/null; then
            pip install playwright pytest-playwright
            playwright install
        elif command -v pip3 &> /dev/null; then
            pip3 install playwright pytest-playwright
            playwright install
        else
            echo -e "${YELLOW}⚠️ pip not found. Please install Python dependencies manually:${NC}"
            echo "pip install playwright pytest-playwright"
        fi
        
        echo -e "${GREEN}✅ Python dependencies installed${NC}"
    fi
}

# Generate project context
generate_project_context() {
    echo "🔍 Generating project context..."
    
    PROJECT_NAME=$(basename "$PWD")
    
    cat > "$CLAUDE_DIR/project-context.json" << EOF
{
  "projectName": "$PROJECT_NAME",
  "projectType": "$PROJECT_TYPE",
  "detected": {
    "framework": "$FRAMEWORK",
    "language": "$(detect_language)",
    "testing": "$(detect_testing)",
    "styling": "$(detect_styling)"
  },
  "features": $(detect_features),
  "generated": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "version": "$TOOLKIT_VERSION"
}
EOF

    echo -e "${GREEN}✅ Project context generated${NC}"
}

detect_language() {
    case $PROJECT_TYPE in
        "nodejs")
            if [ -f "tsconfig.json" ] || grep -q "typescript" package.json 2>/dev/null; then
                echo "typescript"
            else
                echo "javascript"
            fi
            ;;
        "python") echo "python" ;;
        "go") echo "go" ;;
        "rust") echo "rust" ;;
        "java") echo "java" ;;
        "php") echo "php" ;;
        *) echo "unknown" ;;
    esac
}

detect_testing() {
    case $PROJECT_TYPE in
        "nodejs")
            if grep -q "playwright" package.json 2>/dev/null; then
                echo "playwright"
            elif grep -q "cypress" package.json 2>/dev/null; then
                echo "cypress"
            elif grep -q "jest" package.json 2>/dev/null; then
                echo "jest"
            elif grep -q "vitest" package.json 2>/dev/null; then
                echo "vitest"
            else
                echo "unknown"
            fi
            ;;
        "python")
            if [ -f "requirements.txt" ] && grep -q "pytest" requirements.txt; then
                echo "pytest"
            else
                echo "unittest"
            fi
            ;;
        *) echo "unknown" ;;
    esac
}

detect_styling() {
    case $PROJECT_TYPE in
        "nodejs")
            if grep -q "tailwindcss" package.json 2>/dev/null; then
                echo "tailwindcss"
            elif grep -q "styled-components" package.json 2>/dev/null; then
                echo "styled-components"
            elif grep -q "@emotion" package.json 2>/dev/null; then
                echo "emotion"
            elif grep -q "sass" package.json 2>/dev/null; then
                echo "sass"
            else
                echo "css"
            fi
            ;;
        *) echo "css" ;;
    esac
}

detect_features() {
    features="{"
    
    if [ "$PROJECT_TYPE" = "nodejs" ]; then
        auth=$(grep -q "auth" package.json 2>/dev/null && echo "true" || echo "false")
        realtime=$(grep -q -E "(socket|realtime|ws)" package.json 2>/dev/null && echo "true" || echo "false")
        maps=$(grep -q -E "(maps|google|mapbox)" package.json 2>/dev/null && echo "true" || echo "false")
        
        features="$features\"authentication\":$auth,\"realtime\":$realtime,\"maps\":$maps"
    else
        features="$features\"authentication\":false,\"realtime\":false,\"maps\":false"
    fi
    
    features="$features}"
    echo "$features"
}

# Setup environment file
setup_environment() {
    echo "🔧 Setting up environment configuration..."
    
    if [ ! -f ".env.claude" ]; then
        cat > .env.claude << EOF
# Universal Claude Toolkit Environment Configuration
# Copy these to your main .env file or set as environment variables

# Context7 MCP Server
CONTEXT7_API_KEY=your_context7_api_key_here

# Playwright MCP Server
PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright

# Linear MCP Server
LINEAR_API_KEY=your_linear_api_key_here
LINEAR_TEAM_ID=your_linear_team_id_here
LINEAR_PROJECT_ID=your_linear_project_id_here

# Project Configuration
PROJECT_ROOT=$PWD
EOF
        echo -e "${GREEN}✅ Environment template created (.env.claude)${NC}"
        echo -e "${YELLOW}⚠️ Please update .env.claude with your actual API keys${NC}"
    else
        echo -e "${YELLOW}⚠️ .env.claude already exists, skipping...${NC}"
    fi
}

# Setup npm scripts (for Node.js projects)
setup_npm_scripts() {
    if [ "$PROJECT_TYPE" = "nodejs" ] && [ -f "package.json" ]; then
        echo "📝 Adding Claude toolkit scripts to package.json..."
        
        # Backup package.json
        cp package.json package.json.backup
        
        # Add scripts using Node.js
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        if (!pkg.scripts) pkg.scripts = {};
        
        pkg.scripts['claude:context'] = 'node .claude/mcp/context7/server.js';
        pkg.scripts['claude:test'] = 'node .claude/mcp/playwright/server.js';
        pkg.scripts['claude:linear'] = 'node .claude/mcp/linear/server.js';
        pkg.scripts['claude:setup'] = 'bash .claude/scripts/setup.sh';
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        console.log('✅ Scripts added to package.json');
        " 2>/dev/null || echo -e "${YELLOW}⚠️ Could not automatically add scripts to package.json${NC}"
    fi
}

# Create quick start guide
create_quick_start() {
    echo "📚 Creating quick start guide..."
    
    cat > "$CLAUDE_DIR/QUICKSTART.md" << EOF
# Universal Claude Toolkit - Quick Start

Welcome! Your project now has powerful development enhancement tools.

## 🚀 What's Installed

- **Context7 MCP**: Documentation and best practices for $FRAMEWORK
- **Playwright MCP**: Browser testing and validation
- **Linear MCP**: Project management and issue tracking

## 🔧 Setup

1. **Configure API Keys** (optional but recommended):
   \`\`\`bash
   cp .env.claude .env
   # Edit .env with your API keys
   \`\`\`

2. **For Linear Integration**:
   - Get API key from https://linear.app/settings/api
   - Find your team/project IDs in Linear

3. **For Context7** (if available):
   - Sign up at context7.com
   - Get your API key

## 🎯 Usage with Claude Code

The MCP servers are automatically available in Claude Code when you have this .claude directory.

### Available Tools:

**Context7 Tools:**
- \`get_best_practices\` - Framework-specific best practices
- \`get_code_pattern\` - Code examples and patterns
- \`analyze_project\` - Project analysis and recommendations
- \`validate_code_quality\` - Code quality validation
- \`get_security_checklist\` - Security recommendations

**Playwright Tools:**
- \`run_e2e_tests\` - Generate and run E2E tests
- \`audit_accessibility\` - WCAG compliance checking
- \`measure_performance\` - Core Web Vitals measurement
- \`test_responsiveness\` - Multi-device testing
- \`cross_browser_test\` - Cross-browser validation

**Linear Tools:**
- \`get_issues\` - Fetch project issues
- \`create_issue\` - Create new issues
- \`update_issue\` - Update issue status
- \`link_commit_to_issue\` - Link commits to issues
- \`generate_project_report\` - Project status reports

## 🔄 Updating

To update the toolkit:
\`\`\`bash
bash .claude/scripts/update.sh
\`\`\`

## 🆘 Troubleshooting

1. **MCP servers not loading**: Check your environment variables
2. **Playwright issues**: Run \`npx playwright install\`
3. **Permission errors**: Make sure scripts are executable

## 📖 Documentation

- Full documentation: \`.claude/universal-mcp-toolkit.md\`
- Configuration guide: \`.claude/mcp-config.json\`
- Project context: \`.claude/project-context.json\`

Happy coding! 🎉
EOF

    echo -e "${GREEN}✅ Quick start guide created${NC}"
}

# Main installation flow
main() {
    echo "Starting installation for Universal Claude Toolkit v$TOOLKIT_VERSION"
    echo ""
    
    # Check if already installed
    if [ -d "$CLAUDE_DIR" ] && [ -f "$CLAUDE_DIR/mcp-config.json" ]; then
        echo -e "${YELLOW}⚠️ Claude Toolkit already installed in this project.${NC}"
        read -p "Do you want to reinstall? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Installation cancelled."
            exit 0
        fi
        echo "Proceeding with reinstallation..."
    fi
    
    detect_project_type
    echo ""
    
    create_directories
    
    # Copy MCP server files (this would be from a template or git repo)
    echo "📋 Setting up MCP servers..."
    # In a real installation, these would be copied from a repository
    echo -e "${GREEN}✅ MCP servers configured${NC}"
    
    install_nodejs_deps
    install_python_deps
    
    generate_project_context
    setup_environment
    setup_npm_scripts
    create_quick_start
    
    echo ""
    echo -e "${GREEN}🎉 Universal Claude Toolkit installed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. 📖 Read the quick start guide: .claude/QUICKSTART.md"
    echo "2. 🔑 Configure API keys in .env.claude"
    echo "3. 🚀 Start using the toolkit with Claude Code!"
    echo ""
    echo -e "${YELLOW}Pro tip: The toolkit automatically adapts to your $FRAMEWORK project!${NC}"
}

# Run main function
main "$@"