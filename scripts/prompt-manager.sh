#!/bin/bash

# 💬 Geo Bubble Whispers - Prompt Manager
# Helps log, search, and replay user prompts that led to app changes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="Geo Bubble Whispers"
PROMPT_LOG_FILE="PROMPT_LOG.md"
PROMPTS_DIR="prompts"
SESSION_FILE="$PROMPTS_DIR/current_session.json"

# Helper functions
print_header() {
    echo -e "${BLUE}💬 $APP_NAME - Prompt Manager${NC}"
    echo "=========================================="
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

print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# Initialize prompt tracking directory
init_prompt_tracking() {
    if [[ ! -d "$PROMPTS_DIR" ]]; then
        mkdir -p "$PROMPTS_DIR"
        print_success "Created prompts directory"
    fi
    
    if [[ ! -f "$SESSION_FILE" ]]; then
        cat > "$SESSION_FILE" << 'EOF'
{
  "session_id": "",
  "start_time": "",
  "prompts": []
}
EOF
        print_success "Created session tracking file"
    fi
}

# Start a new session
start_session() {
    local session_name="$1"
    
    if [[ -z "$session_name" ]]; then
        session_name="session-$(date +%Y%m%d-%H%M%S)"
    fi
    
    print_header
    echo "🚀 Starting new prompt tracking session: $session_name"
    
    # Archive previous session if exists
    if [[ -f "$SESSION_FILE" ]]; then
        local prev_session_id=$(jq -r '.session_id // "unknown"' "$SESSION_FILE" 2>/dev/null || echo "unknown")
        if [[ "$prev_session_id" != "" && "$prev_session_id" != "null" ]]; then
            cp "$SESSION_FILE" "$PROMPTS_DIR/archived_session_${prev_session_id}.json"
            print_success "Archived previous session: $prev_session_id"
        fi
    fi
    
    # Create new session
    cat > "$SESSION_FILE" << EOF
{
  "session_id": "$session_name",
  "start_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "git_commit_start": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "version_start": "$(git describe --tags 2>/dev/null || echo 'unknown')",
  "prompts": []
}
EOF
    
    print_success "Started session: $session_name"
    echo "📝 Use '$0 log-prompt' to record prompts before making changes"
}

# Log a prompt before making changes
log_prompt() {
    local prompt_text="$1"
    local context="$2"
    
    if [[ -z "$prompt_text" ]]; then
        print_error "Usage: $0 log-prompt \"Your prompt text\" [context]"
        echo "Example: $0 log-prompt \"Add dark mode to the app\" \"Feature request\""
        exit 1
    fi
    
    if [[ ! -f "$SESSION_FILE" ]]; then
        print_warning "No active session. Starting new session..."
        start_session
    fi
    
    # Get current state
    local current_commit=$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')
    local current_version=$(git describe --tags 2>/dev/null || echo 'unknown')
    local current_branch=$(git branch --show-current 2>/dev/null || echo 'unknown')
    
    # Create prompt entry
    local prompt_id="prompt-$(date +%s)"
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    print_header
    echo "📝 Logging prompt: $prompt_id"
    echo "🕒 Time: $timestamp"
    echo "🔗 Commit: $current_commit"
    echo "🏷️  Version: $current_version"
    echo ""
    echo "💬 Prompt:"
    echo "\"$prompt_text\""
    if [[ -n "$context" ]]; then
        echo "📋 Context: $context"
    fi
    
    # Add to session file
    local temp_file=$(mktemp)
    jq --arg id "$prompt_id" \
       --arg time "$timestamp" \
       --arg text "$prompt_text" \
       --arg context "${context:-}" \
       --arg commit "$current_commit" \
       --arg version "$current_version" \
       --arg branch "$current_branch" \
       '.prompts += [{
         "id": $id,
         "timestamp": $time,
         "prompt": $text,
         "context": $context,
         "git_state": {
           "commit": $commit,
           "version": $version,
           "branch": $branch
         },
         "changes_made": [],
         "result": ""
       }]' "$SESSION_FILE" > "$temp_file" && mv "$temp_file" "$SESSION_FILE"
    
    print_success "Prompt logged successfully"
    echo ""
    print_info "After making changes, use: $0 update-prompt $prompt_id \"Description of changes\""
}

# Update a prompt with the results
update_prompt() {
    local prompt_id="$1"
    local result_description="$2"
    
    if [[ -z "$prompt_id" || -z "$result_description" ]]; then
        print_error "Usage: $0 update-prompt <prompt-id> \"Description of what was changed\""
        exit 1
    fi
    
    if [[ ! -f "$SESSION_FILE" ]]; then
        print_error "No active session found"
        exit 1
    fi
    
    # Get changes since the prompt was logged
    local prompt_commit=$(jq -r --arg id "$prompt_id" '.prompts[] | select(.id == $id) | .git_state.commit' "$SESSION_FILE")
    if [[ "$prompt_commit" == "null" || -z "$prompt_commit" ]]; then
        print_error "Prompt ID not found: $prompt_id"
        exit 1
    fi
    
    local current_commit=$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')
    local files_changed=()
    
    if [[ "$prompt_commit" != "unknown" && "$current_commit" != "unknown" ]]; then
        # Get list of changed files
        while IFS= read -r line; do
            files_changed+=("$line")
        done < <(git diff --name-only "$prompt_commit"..HEAD 2>/dev/null || echo "")
    fi
    
    print_header
    echo "📝 Updating prompt: $prompt_id"
    echo "📋 Result: $result_description"
    if [[ ${#files_changed[@]} -gt 0 ]]; then
        echo "📁 Files changed: ${#files_changed[@]}"
        printf '   - %s\n' "${files_changed[@]}"
    fi
    
    # Update the session file
    local temp_file=$(mktemp)
    jq --arg id "$prompt_id" \
       --arg result "$result_description" \
       --arg new_commit "$current_commit" \
       --argjson files "$(printf '%s\n' "${files_changed[@]}" | jq -R . | jq -s .)" \
       '(.prompts[] | select(.id == $id)) |= (
         .result = $result | 
         .git_state.commit_after = $new_commit | 
         .changes_made = $files
       )' "$SESSION_FILE" > "$temp_file" && mv "$temp_file" "$SESSION_FILE"
    
    print_success "Prompt updated successfully"
}

# List all prompts in current session
list_prompts() {
    if [[ ! -f "$SESSION_FILE" ]]; then
        print_warning "No active session found"
        echo "Start a session with: $0 start-session"
        return
    fi
    
    print_header
    
    local session_id=$(jq -r '.session_id // "unknown"' "$SESSION_FILE")
    local start_time=$(jq -r '.start_time // "unknown"' "$SESSION_FILE")
    
    echo "📋 Session: $session_id"
    echo "🕒 Started: $start_time"
    echo ""
    
    local prompt_count=$(jq '.prompts | length' "$SESSION_FILE")
    if [[ "$prompt_count" == "0" ]]; then
        print_warning "No prompts logged in this session"
        echo "Log a prompt with: $0 log-prompt \"Your prompt text\""
        return
    fi
    
    echo "💬 Prompts ($prompt_count):"
    echo ""
    
    jq -r '.prompts[] | 
        "🎯 " + .id + " (" + (.timestamp | split("T")[0]) + ")" + "\n" +
        "   💬 " + .prompt + "\n" +
        "   🔗 " + .git_state.commit + " → " + (.git_state.commit_after // "pending") + "\n" +
        "   📋 " + (.result // "No result logged") + "\n"' "$SESSION_FILE"
}

# Search prompts across all sessions
search_prompts() {
    local search_term="$1"
    
    if [[ -z "$search_term" ]]; then
        print_error "Usage: $0 search \"search term\""
        echo "Example: $0 search \"splash screen\""
        exit 1
    fi
    
    print_header
    echo "🔍 Searching for: \"$search_term\""
    echo ""
    
    # Search in current session
    if [[ -f "$SESSION_FILE" ]]; then
        local matches=$(jq --arg term "$search_term" '[.prompts[] | select(.prompt | test($term; "i"))]' "$SESSION_FILE")
        local match_count=$(echo "$matches" | jq 'length')
        
        if [[ "$match_count" -gt 0 ]]; then
            echo "📋 Current Session Matches ($match_count):"
            echo "$matches" | jq -r '.[] | 
                "🎯 " + .id + "\n" +
                "   💬 " + .prompt + "\n" +
                "   📋 " + (.result // "No result logged") + "\n"'
        fi
    fi
    
    # Search in archived sessions
    if [[ -d "$PROMPTS_DIR" ]]; then
        local archived_matches=0
        for archive in "$PROMPTS_DIR"/archived_session_*.json; do
            if [[ -f "$archive" ]]; then
                local matches=$(jq --arg term "$search_term" '[.prompts[]? | select(.prompt | test($term; "i"))]' "$archive" 2>/dev/null || echo '[]')
                local match_count=$(echo "$matches" | jq 'length')
                
                if [[ "$match_count" -gt 0 ]]; then
                    local session_id=$(jq -r '.session_id // "unknown"' "$archive")
                    echo ""
                    echo "📋 Archived Session '$session_id' Matches ($match_count):"
                    echo "$matches" | jq -r '.[] | 
                        "🎯 " + .id + "\n" +
                        "   💬 " + .prompt + "\n" +
                        "   📋 " + (.result // "No result logged") + "\n"'
                    ((archived_matches += match_count))
                fi
            fi
        done
        
        if [[ "$archived_matches" == 0 ]]; then
            echo ""
            print_info "No matches found in archived sessions"
        fi
    fi
    
    # Also search in PROMPT_LOG.md
    if [[ -f "$PROMPT_LOG_FILE" ]]; then
        echo ""
        echo "📋 Manual Log Matches:"
        grep -i -n "$search_term" "$PROMPT_LOG_FILE" | head -10 | while read -r line; do
            echo "   📄 Line ${line%%:*}: ${line#*:}"
        done
    fi
}

# Replay a prompt (checkout the state before and show the prompt)
replay_prompt() {
    local prompt_id="$1"
    
    if [[ -z "$prompt_id" ]]; then
        print_error "Usage: $0 replay <prompt-id>"
        echo "Use '$0 list' to see available prompts"
        exit 1
    fi
    
    # Search in current session
    local prompt_data=""
    if [[ -f "$SESSION_FILE" ]]; then
        prompt_data=$(jq --arg id "$prompt_id" '.prompts[] | select(.id == $id)' "$SESSION_FILE")
    fi
    
    # Search in archived sessions if not found
    if [[ -z "$prompt_data" || "$prompt_data" == "null" ]]; then
        for archive in "$PROMPTS_DIR"/archived_session_*.json; do
            if [[ -f "$archive" ]]; then
                prompt_data=$(jq --arg id "$prompt_id" '.prompts[]? | select(.id == $id)' "$archive" 2>/dev/null || echo "")
                if [[ -n "$prompt_data" && "$prompt_data" != "null" ]]; then
                    break
                fi
            fi
        done
    fi
    
    if [[ -z "$prompt_data" || "$prompt_data" == "null" ]]; then
        print_error "Prompt ID not found: $prompt_id"
        exit 1
    fi
    
    print_header
    echo "🔄 Replaying prompt: $prompt_id"
    echo ""
    
    local prompt_text=$(echo "$prompt_data" | jq -r '.prompt')
    local commit_before=$(echo "$prompt_data" | jq -r '.git_state.commit')
    local version_before=$(echo "$prompt_data" | jq -r '.git_state.version')
    local original_result=$(echo "$prompt_data" | jq -r '.result // "No result logged"')
    
    echo "📝 Original Prompt:"
    echo "\"$prompt_text\""
    echo ""
    echo "🔗 Git State Before: $commit_before ($version_before)"
    echo "📋 Original Result: $original_result"
    echo ""
    
    read -p "Do you want to checkout the state before this prompt? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$commit_before" != "unknown" ]]; then
            # Create backup of current state
            local backup_branch="backup-before-replay-$(date +%s)"
            git branch "$backup_branch" 2>/dev/null || true
            
            git checkout "$commit_before"
            print_success "Checked out to commit: $commit_before"
            print_info "Your current state is backed up in branch: $backup_branch"
            echo ""
            echo "🎯 Now you can:"
            echo "   1. Copy this prompt to Claude: \"$prompt_text\""
            echo "   2. Modify the prompt if you want different results"
            echo "   3. See if you get the same or better outcome"
        else
            print_warning "Cannot checkout - original commit unknown"
        fi
    fi
    
    echo ""
    print_info "Prompt text for copy/paste:"
    echo "----------------------------------------"
    echo "$prompt_text"
    echo "----------------------------------------"
}

# Export session to markdown
export_session() {
    local output_file="$1"
    
    if [[ -z "$output_file" ]]; then
        output_file="session_export_$(date +%Y%m%d_%H%M%S).md"
    fi
    
    if [[ ! -f "$SESSION_FILE" ]]; then
        print_error "No active session found"
        exit 1
    fi
    
    print_header
    echo "📄 Exporting session to: $output_file"
    
    local session_id=$(jq -r '.session_id // "unknown"' "$SESSION_FILE")
    local start_time=$(jq -r '.start_time // "unknown"' "$SESSION_FILE")
    local git_start=$(jq -r '.git_commit_start // "unknown"' "$SESSION_FILE")
    
    cat > "$output_file" << EOF
# 💬 Prompt Session Export: $session_id

**Session Started:** $start_time  
**Starting Git Commit:** $git_start  

---

EOF
    
    jq -r '.prompts[] | 
        "## 🎯 " + .id + "\n\n" +
        "**Timestamp:** " + .timestamp + "  \n" +
        "**Git Before:** " + .git_state.commit + " (" + .git_state.version + ")  \n" +
        if .git_state.commit_after then "**Git After:** " + .git_state.commit_after + "  \n" else "" end +
        "\n**User Prompt:**\n> " + .prompt + "\n\n" +
        if .context != "" then "**Context:** " + .context + "\n\n" else "" end +
        if (.changes_made | length) > 0 then "**Files Changed:** " + (.changes_made | join(", ")) + "\n\n" else "" end +
        "**Result:** " + (.result // "No result logged") + "\n\n---\n\n"' "$SESSION_FILE" >> "$output_file"
    
    print_success "Session exported to: $output_file"
}

# Main command dispatcher
main() {
    init_prompt_tracking
    
    case "${1:-help}" in
        "start"|"start-session")
            start_session "$2"
            ;;
        "log"|"log-prompt")
            log_prompt "$2" "$3"
            ;;
        "update"|"update-prompt")
            update_prompt "$2" "$3"
            ;;
        "list"|"ls")
            list_prompts
            ;;
        "search"|"find")
            search_prompts "$2"
            ;;
        "replay")
            replay_prompt "$2"
            ;;
        "export")
            export_session "$2"
            ;;
        "help"|"-h"|"--help")
            print_header
            echo ""
            echo "📋 Available Commands:"
            echo ""
            echo "  $0 start [session-name]           - Start new prompt tracking session"
            echo "  $0 log \"prompt\" [context]        - Log a prompt before making changes"
            echo "  $0 update <id> \"result\"           - Update prompt with results"
            echo "  $0 list                           - List all prompts in current session"
            echo "  $0 search \"term\"                  - Search prompts across all sessions"
            echo "  $0 replay <prompt-id>             - Replay a prompt (checkout + show text)"
            echo "  $0 export [filename]              - Export session to markdown"
            echo ""
            echo "📖 Workflow Example:"
            echo "  $0 start my-session"
            echo "  $0 log \"Add dark mode to the app\" \"Feature request\""
            echo "  # ... make changes with Claude ..."
            echo "  $0 update prompt-1234567 \"Added dark mode toggle and CSS variables\""
            echo ""
            echo "🔄 Replay Example:"
            echo "  $0 search \"dark mode\""
            echo "  $0 replay prompt-1234567"
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