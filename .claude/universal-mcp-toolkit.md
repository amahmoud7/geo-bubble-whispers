# Universal MCP Toolkit for Any Project

A portable, global development enhancement toolkit that can be deployed to any project for optimal development workflows.

## Philosophy

This toolkit is designed to be:
- **Framework Agnostic**: Works with React, Vue, Angular, Node.js, Python, etc.
- **Project Independent**: Can be dropped into any codebase
- **Team Portable**: Consistent experience across all projects
- **Continuously Updated**: Always uses latest best practices

## Global Architecture

```
~/.claude-global/                     # Global installation
├── mcp-servers/
│   ├── context7/
│   ├── playwright/
│   └── linear/
├── templates/
├── scripts/
└── config/

project/.claude/                      # Project-specific config
├── mcp-config.json                   # Points to global servers
├── project-context.json             # Project-specific settings
├── agents/                           # Project-specific agents
└── templates/                        # Project-specific templates
```

## Universal MCP Servers

### 1. Context7 MCP - Universal Documentation

**Capabilities:**
- **Auto-detect tech stack** from package.json, requirements.txt, etc.
- **Framework-specific best practices** (React, Vue, FastAPI, Django, etc.)
- **Universal patterns** (authentication, testing, deployment)
- **Code quality standards** across all languages
- **Security best practices** for any stack

**Smart Detection:**
```typescript
interface ProjectContext {
  framework: 'react' | 'vue' | 'angular' | 'nextjs' | 'fastapi' | 'django' | 'express' | 'unknown';
  language: 'typescript' | 'javascript' | 'python' | 'go' | 'rust' | 'java';
  database: 'postgres' | 'mysql' | 'mongodb' | 'sqlite' | 'supabase' | 'firebase';
  deployment: 'vercel' | 'netlify' | 'aws' | 'gcp' | 'docker' | 'kubernetes';
  testing: 'jest' | 'vitest' | 'pytest' | 'cypress' | 'playwright';
}
```

### 2. Playwright MCP - Universal Testing

**Capabilities:**
- **Multi-framework support** (React, Vue, vanilla HTML, SPAs)
- **Universal test patterns** adaptable to any project
- **Cross-browser validation** regardless of tech stack
- **Accessibility testing** for any web application
- **Performance monitoring** for all project types

**Adaptive Testing:**
```typescript
interface UniversalTestSuite {
  detectFramework(): Promise<TestFramework>;
  generateTests(framework: TestFramework): Promise<TestFile[]>;
  runCrossBrowserTests(): Promise<TestResults>;
  validateAccessibility(): Promise<A11yReport>;
  measurePerformance(): Promise<PerformanceReport>;
}
```

### 3. Linear MCP - Universal Project Management

**Capabilities:**
- **Project-agnostic issue tracking** for any codebase
- **Universal progress patterns** (tickets, PRs, deployments)
- **Multi-repo support** for microservices or monorepos
- **Team workflow integration** regardless of project type
- **Automated status updates** across all project types

## Installation Methods

### Method 1: Global Installation (Recommended)

```bash
# Install globally
curl -fsSL https://raw.githubusercontent.com/your-org/claude-toolkit/main/install.sh | bash

# Or using npm
npm install -g @your-org/claude-toolkit

# Initialize in any project
claude-toolkit init
```

### Method 2: Copy Template

```bash
# Clone template to any project
git clone https://github.com/your-org/claude-toolkit.git .claude
cd .claude && ./setup.sh
```

### Method 3: Symlink Approach

```bash
# Set up global installation
git clone https://github.com/your-org/claude-toolkit.git ~/.claude-global

# Symlink to any project
ln -s ~/.claude-global/mcp-servers ./claude/mcp-servers
```

## Project-Specific Configuration

### Auto-Detection Engine

```json
// project/.claude/project-context.json
{
  "detected": {
    "framework": "react",
    "language": "typescript", 
    "database": "supabase",
    "deployment": "vercel",
    "testing": "playwright"
  },
  "overrides": {
    "framework": "nextjs",
    "customPatterns": ["social-media", "real-time"]
  },
  "features": {
    "authentication": true,
    "realtime": true,
    "geolocation": true,
    "media-processing": true
  }
}
```

### Universal MCP Configuration

```json
// project/.claude/mcp-config.json
{
  "mcpServers": {
    "context7": {
      "command": "node",
      "args": ["~/.claude-global/mcp-servers/context7/server.js"],
      "env": {
        "PROJECT_ROOT": "${PWD}",
        "CONTEXT_FILE": "${PWD}/.claude/project-context.json"
      }
    },
    "playwright": {
      "command": "node", 
      "args": ["~/.claude-global/mcp-servers/playwright/server.js"],
      "env": {
        "PROJECT_ROOT": "${PWD}",
        "TEST_CONFIG": "${PWD}/.claude/test-config.json"
      }
    },
    "linear": {
      "command": "node",
      "args": ["~/.claude-global/mcp-servers/linear/server.js"],
      "env": {
        "PROJECT_ROOT": "${PWD}",
        "LINEAR_PROJECT_ID": "${LINEAR_PROJECT_ID}"
      }
    }
  }
}
```

## Universal Tool Capabilities

### Context7 Universal Tools

```typescript
interface Context7UniversalTools {
  // Auto-detect and provide framework-specific guidance
  getBestPractice(category: string): Promise<BestPracticeResult>;
  validateCodeStyle(file: string): Promise<ValidationResult>;
  getFrameworkPattern(pattern: string): Promise<PatternResult>;
  
  // Universal patterns
  getAuthenticationPattern(): Promise<AuthPattern>;
  getTestingPattern(): Promise<TestPattern>;
  getDeploymentPattern(): Promise<DeploymentPattern>;
  
  // Security
  getSecurityChecklist(): Promise<SecurityChecklist>;
  validateSecurityConfig(): Promise<SecurityResult>;
}
```

### Playwright Universal Tools

```typescript
interface PlaywrightUniversalTools {
  // Framework-agnostic testing
  generateE2ETests(): Promise<TestSuite>;
  runCrossBrowserTests(): Promise<CrossBrowserResults>;
  validateAccessibility(): Promise<A11yResults>;
  
  // Performance testing for any app
  measureCoreWebVitals(): Promise<WebVitalsReport>;
  testMobileResponsiveness(): Promise<MobileReport>;
  
  // Visual regression testing
  captureScreenshots(): Promise<ScreenshotResults>;
  compareVisualChanges(): Promise<VisualDiffReport>;
}
```

### Linear Universal Tools

```typescript
interface LinearUniversalTools {
  // Project-agnostic issue management
  syncProjectProgress(): Promise<SyncResult>;
  createFeatureTicket(description: string): Promise<LinearIssue>;
  updateTicketFromCommit(commitHash: string): Promise<UpdateResult>;
  
  // Universal workflow patterns
  getSprintOverview(): Promise<SprintReport>;
  trackFeatureCompletion(): Promise<CompletionReport>;
  generateProjectMetrics(): Promise<ProjectMetrics>;
}
```

## Framework-Specific Adaptations

### React/Next.js Projects
```json
{
  "patterns": ["component-library", "state-management", "routing"],
  "testing": ["component-testing", "integration-testing"],
  "performance": ["bundle-analysis", "core-web-vitals"]
}
```

### Python/FastAPI Projects
```json
{
  "patterns": ["api-design", "database-models", "authentication"],
  "testing": ["pytest-patterns", "api-testing"],
  "performance": ["async-optimization", "database-queries"]
}
```

### Full-Stack Projects
```json
{
  "patterns": ["monorepo-structure", "api-contracts", "deployment"],
  "testing": ["end-to-end", "api-testing", "database-testing"],
  "performance": ["full-stack-monitoring", "database-optimization"]
}
```

## Setup Scripts

### Universal Installer

```bash
#!/bin/bash
# ~/.claude-global/scripts/install.sh

echo "🚀 Installing Universal Claude Toolkit..."

# Detect project type
if [ -f "package.json" ]; then
    echo "📦 Detected Node.js project"
    PROJECT_TYPE="nodejs"
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    echo "🐍 Detected Python project"
    PROJECT_TYPE="python"
elif [ -f "go.mod" ]; then
    echo "🐹 Detected Go project"
    PROJECT_TYPE="go"
else
    echo "❓ Unknown project type, using universal config"
    PROJECT_TYPE="universal"
fi

# Create .claude directory
mkdir -p .claude/agents

# Copy appropriate templates
cp ~/.claude-global/templates/$PROJECT_TYPE/* .claude/
cp ~/.claude-global/templates/universal/* .claude/

# Install dependencies based on project type
case $PROJECT_TYPE in
    "nodejs")
        npm install --save-dev playwright @axe-core/playwright
        ;;
    "python")
        pip install playwright pytest-playwright
        ;;
esac

echo "✅ Universal Claude Toolkit installed!"
echo "📚 Run 'claude-toolkit help' for usage information"
```

### Project Initializer

```javascript
// ~/.claude-global/scripts/init.js
const fs = require('fs');
const path = require('path');

class ProjectInitializer {
    detectFramework() {
        const packageJson = this.readPackageJson();
        if (!packageJson) return 'unknown';
        
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (deps.react) return deps.next ? 'nextjs' : 'react';
        if (deps.vue) return 'vue';
        if (deps.angular) return 'angular';
        if (deps.fastapi) return 'fastapi';
        if (deps.django) return 'django';
        
        return 'nodejs';
    }
    
    generateProjectContext() {
        return {
            detected: {
                framework: this.detectFramework(),
                language: this.detectLanguage(),
                database: this.detectDatabase(),
                testing: this.detectTesting()
            },
            generated: new Date().toISOString()
        };
    }
}
```

## Benefits Across All Projects

### Consistent Development Experience
- Same powerful tools regardless of tech stack
- Unified workflow patterns across projects
- Reduced context switching between projects

### Continuous Best Practices
- Always up-to-date with latest standards
- Framework-specific optimizations
- Security patterns that evolve with threats

### Team Productivity
- New team members get same powerful toolkit
- Consistent code quality across all projects
- Reduced time setting up development environments

### Project Quality
- Universal testing standards
- Consistent documentation patterns
- Automated quality gates for any project

## Usage Examples

### New React Project
```bash
npx create-react-app my-app
cd my-app
claude-toolkit init
# Auto-detects React, sets up appropriate testing, linting, and patterns
```

### Existing Python API
```bash
cd existing-python-api
claude-toolkit init
# Detects FastAPI/Django, provides API testing patterns and documentation
```

### Multi-repo Organization
```bash
# Install globally once
claude-toolkit install-global

# Use in any repo
cd frontend-app && claude-toolkit link
cd backend-api && claude-toolkit link
cd mobile-app && claude-toolkit link
```

## Maintenance Strategy

### Automatic Updates
- MCP servers auto-update from central repository
- Framework patterns updated based on ecosystem changes
- Security patches deployed globally
- Best practices continuously refined

### Community Contributions
- Open source toolkit for community improvements
- Framework-specific patterns contributed by experts
- Shared testing patterns and templates
- Collaborative documentation improvements

This universal toolkit transforms any project into an optimally configured development environment with consistent, powerful tooling regardless of technology stack!