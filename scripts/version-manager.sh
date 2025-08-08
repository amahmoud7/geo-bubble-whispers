#!/bin/bash

# 🏷️ Geo Bubble Whispers - Version Manager
# Helps manage versions, tags, and rollbacks for the app

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="Geo Bubble Whispers"
CHANGELOG_FILE="CHANGELOG.md"

# Helper functions
print_header() {
    echo -e "${BLUE}🏷️  $APP_NAME - Version Manager${NC}"
    echo "============================================="
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository!"
        exit 1
    fi
}

# List all version tags
list_versions() {
    print_header
    echo "📋 Available Versions:"
    echo ""
    
    if git tag -l "v*" | head -1 > /dev/null 2>&1; then
        git tag -l "v*" | sort -V | while read tag; do
            commit_hash=$(git rev-list -n 1 "$tag" 2>/dev/null || echo "unknown")
            commit_date=$(git log -1 --format="%ad" --date=short "$tag" 2>/dev/null || echo "unknown")
            commit_msg=$(git log -1 --format="%s" "$tag" 2>/dev/null || echo "No message")
            
            echo -e "  🏷️  ${GREEN}$tag${NC} (${commit_date})"
            echo -e "      📝 $commit_msg"
            echo -e "      🔗 $commit_hash"
            echo ""
        done
    else
        print_warning "No version tags found"
        echo "   Create your first version with: $0 create v1.0.0 'Initial version'"
    fi
}

# Create a new version tag
create_version() {
    local version_tag="$1"
    local description="$2"
    
    if [[ -z "$version_tag" || -z "$description" ]]; then
        print_error "Usage: $0 create <version-tag> <description>"
        echo "Example: $0 create v2.1.0 'Added user favorites feature'"
        exit 1
    fi
    
    # Check if tag already exists
    if git tag -l | grep -q "^$version_tag$"; then
        print_error "Version tag '$version_tag' already exists!"
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        print_error "You have uncommitted changes. Please commit or stash them first."
        git status --short
        exit 1
    fi
    
    print_header
    echo "🏷️  Creating version: $version_tag"
    echo "📝 Description: $description"
    echo ""
    
    # Create annotated tag with description
    git tag -a "$version_tag" -m "$description"
    
    print_success "Version $version_tag created successfully!"
    echo ""
    echo "📋 To push this version to remote:"
    echo "   git push origin $version_tag"
    echo ""
    echo "📝 Don't forget to update $CHANGELOG_FILE"
}

# Rollback to a specific version
rollback() {
    local version_tag="$1"
    
    if [[ -z "$version_tag" ]]; then
        print_error "Usage: $0 rollback <version-tag>"
        echo "Example: $0 rollback v2.0.0"
        echo ""
        echo "Available versions:"
        git tag -l "v*" | sort -V | sed 's/^/  - /'
        exit 1
    fi
    
    # Check if tag exists
    if ! git tag -l | grep -q "^$version_tag$"; then
        print_error "Version tag '$version_tag' does not exist!"
        echo ""
        echo "Available versions:"
        git tag -l "v*" | sort -V | sed 's/^/  - /'
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        print_error "You have uncommitted changes. Please commit or stash them first."
        git status --short
        exit 1
    fi
    
    print_header
    echo "🔄 Rolling back to version: $version_tag"
    
    # Show what we're rolling back to
    commit_date=$(git log -1 --format="%ad" --date=short "$version_tag")
    commit_msg=$(git log -1 --format="%s" "$version_tag")
    echo "📅 Date: $commit_date"
    echo "📝 Description: $commit_msg"
    echo ""
    
    read -p "Are you sure you want to rollback? This will reset your working directory. (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Rollback cancelled"
        exit 0
    fi
    
    # Create a backup branch first
    backup_branch="backup-before-rollback-$(date +%Y%m%d-%H%M%S)"
    git branch "$backup_branch"
    print_success "Created backup branch: $backup_branch"
    
    # Rollback
    git checkout "$version_tag"
    git checkout -b "rollback-to-$version_tag"
    
    print_success "Rolled back to $version_tag"
    echo ""
    echo "📝 You're now on branch: rollback-to-$version_tag"
    echo "🔧 To continue development, you may want to merge this back to main:"
    echo "   git checkout main"
    echo "   git merge rollback-to-$version_tag"
    echo ""
    echo "🗂️  Your previous work is saved in branch: $backup_branch"
}

# Compare two versions
compare_versions() {
    local version1="$1"
    local version2="$2"
    
    if [[ -z "$version1" || -z "$version2" ]]; then
        print_error "Usage: $0 compare <version1> <version2>"
        echo "Example: $0 compare v1.0.0 v2.0.0"
        exit 1
    fi
    
    print_header
    echo "🔍 Comparing $version1 → $version2"
    echo ""
    
    # Show commits between versions
    echo "📋 Commits between versions:"
    git log --oneline "$version1".."$version2" | head -20
    echo ""
    
    # Show file changes
    echo "📁 Files changed:"
    git diff --name-status "$version1" "$version2" | head -20
    echo ""
    
    # Show detailed diff for important files
    echo "🔧 Key file changes:"
    for file in "package.json" "src/App.tsx" "src/pages/Home.tsx"; do
        if git diff --quiet "$version1" "$version2" -- "$file" 2>/dev/null; then
            continue
        fi
        echo ""
        echo "📄 $file:"
        git diff --stat "$version1" "$version2" -- "$file" 2>/dev/null || echo "   (file may not exist in one version)"
    done
}

# Build and test a version
build_version() {
    local version_tag="$1"
    
    if [[ -z "$version_tag" ]]; then
        version_tag="current"
        echo "🔨 Building current version..."
    else
        if ! git tag -l | grep -q "^$version_tag$"; then
            print_error "Version tag '$version_tag' does not exist!"
            exit 1
        fi
        
        echo "🔨 Building version: $version_tag"
        git checkout "$version_tag"
    fi
    
    print_header
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    # Run build
    echo "🏗️  Building app..."
    npm run build
    
    # Sync with Capacitor
    echo "📱 Syncing with iOS..."
    npx cap sync ios
    
    print_success "Build completed successfully!"
    echo ""
    echo "🚀 To deploy to iOS simulator:"
    echo "   npx cap run ios"
}

# Show current version info
current_version() {
    print_header
    
    # Get current branch
    current_branch=$(git branch --show-current)
    echo "🌿 Current branch: $current_branch"
    
    # Get current commit
    current_commit=$(git rev-parse --short HEAD)
    commit_date=$(git log -1 --format="%ad" --date=short)
    commit_msg=$(git log -1 --format="%s")
    
    echo "🔗 Current commit: $current_commit ($commit_date)"
    echo "📝 Last commit: $commit_msg"
    
    # Check if current commit has a tag
    current_tags=$(git tag --points-at HEAD)
    if [[ -n "$current_tags" ]]; then
        echo "🏷️  Current tags: $current_tags"
    else
        echo "🏷️  No tags on current commit"
    fi
    
    # Show uncommitted changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo ""
        print_warning "Uncommitted changes detected:"
        git status --short
    else
        echo ""
        print_success "Working directory is clean"
    fi
}

# Main command dispatcher
main() {
    check_git_repo
    
    case "${1:-help}" in
        "list"|"ls")
            list_versions
            ;;
        "create"|"tag")
            create_version "$2" "$3"
            ;;
        "rollback"|"checkout")
            rollback "$2"
            ;;
        "compare"|"diff")
            compare_versions "$2" "$3"
            ;;
        "build")
            build_version "$2"
            ;;
        "current"|"status")
            current_version
            ;;
        "help"|"-h"|"--help")
            print_header
            echo ""
            echo "📋 Available Commands:"
            echo ""
            echo "  $0 list                     - List all version tags"
            echo "  $0 create <tag> <desc>      - Create new version tag"
            echo "  $0 rollback <tag>           - Rollback to specific version"
            echo "  $0 compare <tag1> <tag2>    - Compare two versions"
            echo "  $0 build [tag]              - Build app (current or specific version)"
            echo "  $0 current                  - Show current version info"
            echo ""
            echo "📖 Examples:"
            echo "  $0 create v2.1.0 'Added user favorites'"
            echo "  $0 rollback v2.0.0"
            echo "  $0 compare v1.0.0 v2.0.0"
            echo "  $0 build v2.0.0"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"