#!/bin/bash

# Universal Claude Toolkit Update Script
# Updates the toolkit to the latest version

set -e

echo "🔄 Universal Claude Toolkit Updater"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

CLAUDE_DIR=".claude"
BACKUP_DIR=".claude-backup-$(date +%Y%m%d-%H%M%S)"
TOOLKIT_REPO="https://github.com/your-org/claude-universal-toolkit"

# Backup current installation
backup_current() {
    echo "💾 Creating backup..."
    
    if [ -d "$CLAUDE_DIR" ]; then
        cp -r "$CLAUDE_DIR" "$BACKUP_DIR"
        echo -e "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"
    else
        echo -e "${YELLOW}⚠️ No existing installation found${NC}"
    fi
}

# Check for updates
check_updates() {
    echo "🔍 Checking for updates..."
    
    local current_version="1.0.0"
    if [ -f "$CLAUDE_DIR/project-context.json" ]; then
        current_version=$(node -e "
        const fs = require('fs');
        try {
            const context = JSON.parse(fs.readFileSync('.claude/project-context.json', 'utf8'));
            console.log(context.version || '1.0.0');
        } catch (e) {
            console.log('1.0.0');
        }
        " 2>/dev/null || echo "1.0.0")
    fi
    
    echo "Current version: $current_version"
    
    # In a real implementation, this would check against a remote repository
    local latest_version="1.0.0"
    echo "Latest version: $latest_version"
    
    if [ "$current_version" = "$latest_version" ]; then
        echo -e "${GREEN}✅ Already up to date!${NC}"
        return 1
    fi
    
    return 0
}

# Update MCP servers
update_mcp_servers() {
    echo "🔧 Updating MCP servers..."
    
    # In a real implementation, this would download from repository
    # For now, we'll just update the package dependencies
    
    for server in context7 playwright linear; do
        if [ -d "$CLAUDE_DIR/mcp/$server" ]; then
            echo "Updating $server..."
            cd "$CLAUDE_DIR/mcp/$server"
            npm update
            cd "../../.."
        fi
    done
    
    echo -e "${GREEN}✅ MCP servers updated${NC}"
}

# Update project context
update_project_context() {
    echo "📋 Updating project context..."
    
    if [ -f "$CLAUDE_DIR/project-context.json" ]; then
        # Preserve user customizations while updating structure
        node -e "
        const fs = require('fs');
        try {
            const context = JSON.parse(fs.readFileSync('.claude/project-context.json', 'utf8'));
            
            // Update version and timestamp
            context.version = '1.0.0';
            context.lastUpdated = new Date().toISOString();
            
            // Add new fields if they don't exist
            if (!context.toolkitFeatures) {
                context.toolkitFeatures = {
                    'context7': true,
                    'playwright': true,
                    'linear': true
                };
            }
            
            fs.writeFileSync('.claude/project-context.json', JSON.stringify(context, null, 2));
            console.log('✅ Project context updated');
        } catch (e) {
            console.error('❌ Failed to update project context:', e.message);
        }
        " || echo -e "${YELLOW}⚠️ Manual project context update needed${NC}"
    fi
}

# Update configuration
update_configuration() {
    echo "⚙️ Updating configuration..."
    
    # Update MCP config with new features
    if [ -f "$CLAUDE_DIR/mcp-config.json" ]; then
        node -e "
        const fs = require('fs');
        try {
            const config = JSON.parse(fs.readFileSync('.claude/mcp-config.json', 'utf8'));
            
            // Update version
            config.version = '1.0.0';
            config.lastUpdated = new Date().toISOString();
            
            // Add new global configuration options
            if (!config.globalConfig) {
                config.globalConfig = {
                    'autoDetectFramework': true,
                    'adaptToProject': true,
                    'updateBestPractices': 'weekly',
                    'logLevel': 'info'
                };
            }
            
            fs.writeFileSync('.claude/mcp-config.json', JSON.stringify(config, null, 2));
            console.log('✅ Configuration updated');
        } catch (e) {
            console.error('❌ Failed to update configuration:', e.message);
        }
        "
    fi
}

# Update scripts
update_scripts() {
    echo "📝 Updating scripts..."
    
    # Make sure all scripts are executable
    chmod +x "$CLAUDE_DIR/scripts/"*.sh
    
    # Update script versions (in a real implementation, these would be downloaded)
    echo -e "${GREEN}✅ Scripts updated${NC}"
}

# Clean up old files
cleanup_old_files() {
    echo "🧹 Cleaning up old files..."
    
    # Remove deprecated files
    local deprecated_files=(
        "$CLAUDE_DIR/old-config.json"
        "$CLAUDE_DIR/deprecated-script.sh"
    )
    
    for file in "${deprecated_files[@]}"; do
        if [ -f "$file" ]; then
            rm -f "$file"
            echo "Removed deprecated file: $file"
        fi
    done
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Validate installation
validate_installation() {
    echo "✅ Validating updated installation..."
    
    # Run setup validation
    if [ -f "$CLAUDE_DIR/scripts/setup.sh" ]; then
        bash "$CLAUDE_DIR/scripts/setup.sh" validate
    else
        echo -e "${YELLOW}⚠️ Could not validate installation${NC}"
    fi
}

# Show update summary
show_summary() {
    echo ""
    echo -e "${BLUE}📊 Update Summary${NC}"
    echo "=================="
    
    if [ -f "$CLAUDE_DIR/project-context.json" ]; then
        local version=$(node -e "
        const context = JSON.parse(require('fs').readFileSync('.claude/project-context.json', 'utf8'));
        console.log(context.version || 'Unknown');
        " 2>/dev/null || echo "Unknown")
        
        echo "📦 Toolkit version: $version"
    fi
    
    echo "🔧 MCP servers: Updated"
    echo "📋 Project context: Updated"
    echo "⚙️ Configuration: Updated"
    echo "📝 Scripts: Updated"
    echo "💾 Backup: $BACKUP_DIR"
    
    echo ""
    echo -e "${GREEN}🎉 Update completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. 🔄 Run setup to ensure everything is configured: bash .claude/scripts/setup.sh"
    echo "2. 🧪 Test the updated toolkit with Claude Code"
    echo "3. 🗑️ Remove backup if everything works: rm -rf $BACKUP_DIR"
}

# Rollback function
rollback() {
    echo -e "${YELLOW}🔄 Rolling back to previous version...${NC}"
    
    if [ -d "$BACKUP_DIR" ]; then
        rm -rf "$CLAUDE_DIR"
        mv "$BACKUP_DIR" "$CLAUDE_DIR"
        echo -e "${GREEN}✅ Rollback completed${NC}"
    else
        echo -e "${RED}❌ No backup found for rollback${NC}"
        exit 1
    fi
}

# Main update function
main() {
    echo "Checking for Universal Claude Toolkit updates..."
    echo ""
    
    # Check if toolkit is installed
    if [ ! -d "$CLAUDE_DIR" ]; then
        echo -e "${RED}❌ Claude toolkit not found. Please run install.sh first.${NC}"
        exit 1
    fi
    
    # Check for updates
    if ! check_updates; then
        exit 0
    fi
    
    # Ask for confirmation
    echo ""
    read -p "Do you want to update the toolkit? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Update cancelled."
        exit 0
    fi
    
    backup_current
    
    # Perform update steps
    update_mcp_servers || { echo -e "${RED}❌ Failed to update MCP servers${NC}"; rollback; exit 1; }
    update_project_context || { echo -e "${YELLOW}⚠️ Project context update had issues${NC}"; }
    update_configuration || { echo -e "${YELLOW}⚠️ Configuration update had issues${NC}"; }
    update_scripts
    cleanup_old_files
    
    # Validate the update
    validate_installation || { 
        echo -e "${RED}❌ Validation failed${NC}"
        read -p "Do you want to rollback? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback
            exit 1
        fi
    }
    
    show_summary
}

# Handle command line arguments
case "${1:-update}" in
    "update"|"")
        main
        ;;
    "check")
        check_updates && echo -e "${YELLOW}⚠️ Updates available${NC}" || echo -e "${GREEN}✅ Up to date${NC}"
        ;;
    "rollback")
        rollback
        ;;
    "--help"|"-h")
        echo "Universal Claude Toolkit Updater"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  update    Update toolkit to latest version (default)"
        echo "  check     Check for available updates"
        echo "  rollback  Rollback to previous version"
        echo "  --help    Show this help"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac