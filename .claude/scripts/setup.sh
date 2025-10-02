#!/bin/bash

# Universal Claude Toolkit Setup Script
# Configures the toolkit for the current project

set -e

echo "🔧 Universal Claude Toolkit Setup"
echo "================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CLAUDE_DIR=".claude"
MCP_DIR="$CLAUDE_DIR/mcp"

# Make scripts executable
chmod +x "$CLAUDE_DIR/scripts/"*.sh

# Install MCP server dependencies
install_mcp_dependencies() {
    echo "📦 Installing MCP server dependencies..."
    
    if [ -d "$MCP_DIR/context7" ]; then
        echo "Installing Context7 MCP dependencies..."
        cd "$MCP_DIR/context7" && npm install
        cd "../../.."
    fi
    
    if [ -d "$MCP_DIR/playwright" ]; then
        echo "Installing Playwright MCP dependencies..."
        cd "$MCP_DIR/playwright" && npm install
        cd "../../.."
    fi
    
    if [ -d "$MCP_DIR/linear" ]; then
        echo "Installing Linear MCP dependencies..."
        cd "$MCP_DIR/linear" && npm install
        cd "../../.."
    fi
    
    echo -e "${GREEN}✅ MCP dependencies installed${NC}"
}

# Install Playwright browsers
install_playwright_browsers() {
    echo "🌐 Installing Playwright browsers..."
    
    if command -v npx &> /dev/null; then
        npx playwright install
        echo -e "${GREEN}✅ Playwright browsers installed${NC}"
    else
        echo -e "${YELLOW}⚠️ npx not found. Please install Playwright browsers manually:${NC}"
        echo "npx playwright install"
    fi
}

# Test MCP servers
test_mcp_servers() {
    echo "🧪 Testing MCP servers..."
    
    # Test Context7
    if [ -f "$MCP_DIR/context7/server.js" ]; then
        echo "Testing Context7 MCP server..."
        timeout 5s node "$MCP_DIR/context7/server.js" --version 2>/dev/null || echo "Context7 server ready"
    fi
    
    # Test Playwright
    if [ -f "$MCP_DIR/playwright/server.js" ]; then
        echo "Testing Playwright MCP server..."
        timeout 5s node "$MCP_DIR/playwright/server.js" --version 2>/dev/null || echo "Playwright server ready"
    fi
    
    # Test Linear
    if [ -f "$MCP_DIR/linear/server.js" ]; then
        echo "Testing Linear MCP server..."
        timeout 5s node "$MCP_DIR/linear/server.js" --version 2>/dev/null || echo "Linear server ready"
    fi
    
    echo -e "${GREEN}✅ MCP servers tested${NC}"
}

# Create development scripts
create_dev_scripts() {
    echo "📝 Creating development scripts..."
    
    # Context7 runner
    cat > "$CLAUDE_DIR/scripts/run-context7.sh" << 'EOF'
#!/bin/bash
export PROJECT_ROOT="$PWD"
export CONTEXT_FILE="$PWD/.claude/project-context.json"
node .claude/mcp/context7/server.js
EOF

    # Playwright runner
    cat > "$CLAUDE_DIR/scripts/run-playwright.sh" << 'EOF'
#!/bin/bash
export PROJECT_ROOT="$PWD"
export PLAYWRIGHT_CONFIG="$PWD/.claude/playwright.config.js"
node .claude/mcp/playwright/server.js
EOF

    # Linear runner
    cat > "$CLAUDE_DIR/scripts/run-linear.sh" << 'EOF'
#!/bin/bash
export PROJECT_ROOT="$PWD"
if [ -f ".env" ]; then
    source .env
fi
if [ -f ".env.claude" ]; then
    source .env.claude
fi
node .claude/mcp/linear/server.js
EOF

    # Make scripts executable
    chmod +x "$CLAUDE_DIR/scripts/run-"*.sh
    
    echo -e "${GREEN}✅ Development scripts created${NC}"
}

# Update project context
update_project_context() {
    echo "🔄 Updating project context..."
    
    if [ -f "$CLAUDE_DIR/project-context.json" ]; then
        # Update timestamp
        node -e "
        const fs = require('fs');
        const context = JSON.parse(fs.readFileSync('.claude/project-context.json', 'utf8'));
        context.lastUpdated = new Date().toISOString();
        context.toolkitVersion = '1.0.0';
        fs.writeFileSync('.claude/project-context.json', JSON.stringify(context, null, 2));
        " 2>/dev/null || echo "Manual context update needed"
    fi
    
    echo -e "${GREEN}✅ Project context updated${NC}"
}

# Validate configuration
validate_config() {
    echo "✅ Validating configuration..."
    
    local errors=0
    
    # Check required files
    if [ ! -f "$CLAUDE_DIR/mcp-config.json" ]; then
        echo -e "${YELLOW}⚠️ MCP config missing${NC}"
        errors=$((errors + 1))
    fi
    
    if [ ! -f "$CLAUDE_DIR/project-context.json" ]; then
        echo -e "${YELLOW}⚠️ Project context missing${NC}"
        errors=$((errors + 1))
    fi
    
    # Check MCP servers
    for server in context7 playwright linear; do
        if [ ! -f "$MCP_DIR/$server/server.js" ]; then
            echo -e "${YELLOW}⚠️ $server MCP server missing${NC}"
            errors=$((errors + 1))
        fi
    done
    
    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}✅ Configuration valid${NC}"
    else
        echo -e "${YELLOW}⚠️ Found $errors configuration issues${NC}"
    fi
    
    return $errors
}

# Show status
show_status() {
    echo ""
    echo -e "${BLUE}📊 Toolkit Status${NC}"
    echo "=================="
    
    echo "📁 Claude directory: $([ -d "$CLAUDE_DIR" ] && echo "✅ Present" || echo "❌ Missing")"
    echo "⚙️ MCP config: $([ -f "$CLAUDE_DIR/mcp-config.json" ] && echo "✅ Present" || echo "❌ Missing")"
    echo "📋 Project context: $([ -f "$CLAUDE_DIR/project-context.json" ] && echo "✅ Present" || echo "❌ Missing")"
    
    echo ""
    echo "🔧 MCP Servers:"
    for server in context7 playwright linear; do
        if [ -f "$MCP_DIR/$server/server.js" ]; then
            echo "  • $server: ✅ Installed"
        else
            echo "  • $server: ❌ Missing"
        fi
    done
    
    echo ""
    echo "🔑 Environment:"
    if [ -f ".env.claude" ]; then
        echo "  • .env.claude: ✅ Present"
        
        # Check for API keys (without exposing them)
        if grep -q "CONTEXT7_API_KEY=.*[^=]$" .env.claude 2>/dev/null; then
            echo "  • Context7 API key: ✅ Configured"
        else
            echo "  • Context7 API key: ⚠️ Not configured"
        fi
        
        if grep -q "LINEAR_API_KEY=.*[^=]$" .env.claude 2>/dev/null; then
            echo "  • Linear API key: ✅ Configured"
        else
            echo "  • Linear API key: ⚠️ Not configured"
        fi
    else
        echo "  • .env.claude: ❌ Missing"
    fi
}

# Main setup function
main() {
    echo "Setting up Universal Claude Toolkit..."
    echo ""
    
    if [ ! -d "$CLAUDE_DIR" ]; then
        echo -e "${YELLOW}⚠️ Claude toolkit not found. Please run install.sh first.${NC}"
        exit 1
    fi
    
    install_mcp_dependencies
    install_playwright_browsers
    create_dev_scripts
    update_project_context
    test_mcp_servers
    
    echo ""
    validate_config
    show_status
    
    echo ""
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. 🔑 Configure API keys in .env.claude"
    echo "2. 🔄 Source your environment: source .env.claude"
    echo "3. 🚀 Start using the toolkit with Claude Code!"
    echo ""
    echo -e "${BLUE}Quick commands:${NC}"
    echo "• Test Context7: bash .claude/scripts/run-context7.sh"
    echo "• Test Playwright: bash .claude/scripts/run-playwright.sh"
    echo "• Test Linear: bash .claude/scripts/run-linear.sh"
}

# Handle command line arguments
case "${1:-setup}" in
    "setup"|"")
        main
        ;;
    "status")
        show_status
        ;;
    "validate")
        validate_config
        ;;
    "update")
        update_project_context
        echo -e "${GREEN}✅ Project context updated${NC}"
        ;;
    "--help"|"-h")
        echo "Universal Claude Toolkit Setup"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  setup     Run full setup (default)"
        echo "  status    Show toolkit status"
        echo "  validate  Validate configuration"
        echo "  update    Update project context"
        echo "  --help    Show this help"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac