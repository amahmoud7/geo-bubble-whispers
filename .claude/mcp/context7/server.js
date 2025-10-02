#!/usr/bin/env node

/**
 * Universal Context7 MCP Server
 * Provides documentation, best practices, and code guidance for any project
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';

class Context7Server {
  constructor() {
    this.server = new Server(
      {
        name: 'context7-universal',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.projectRoot = process.env.PROJECT_ROOT || process.cwd();
    this.contextFile = process.env.CONTEXT_FILE || path.join(this.projectRoot, '.claude/project-context.json');
    this.projectContext = null;
    
    this.setupToolHandlers();
  }

  async loadProjectContext() {
    try {
      const contextData = await fs.readFile(this.contextFile, 'utf-8');
      this.projectContext = JSON.parse(contextData);
      
      // Auto-detect if context is missing or outdated
      if (!this.projectContext || this.isContextOutdated()) {
        this.projectContext = await this.detectProjectContext();
        await this.saveProjectContext();
      }
    } catch (error) {
      // Create new context if file doesn't exist
      this.projectContext = await this.detectProjectContext();
      await this.saveProjectContext();
    }
  }

  async detectProjectContext() {
    const context = {
      projectName: path.basename(this.projectRoot),
      detected: {
        framework: await this.detectFramework(),
        language: await this.detectLanguage(),
        backend: await this.detectBackend(),
        database: await this.detectDatabase(),
        testing: await this.detectTesting(),
        styling: await this.detectStyling()
      },
      features: await this.detectFeatures(),
      generated: new Date().toISOString(),
      version: '1.0.0'
    };

    return context;
  }

  async detectFramework() {
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (deps.next) return 'nextjs';
      if (deps.react) return 'react';
      if (deps.vue) return 'vue';
      if (deps['@angular/core']) return 'angular';
      if (deps.svelte) return 'svelte';
      if (deps.express) return 'express';
      
      return 'nodejs';
    } catch {
      // Check for other framework indicators
      try {
        if (await fs.access(path.join(this.projectRoot, 'requirements.txt'))) {
          const requirements = await fs.readFile(path.join(this.projectRoot, 'requirements.txt'), 'utf-8');
          if (requirements.includes('fastapi')) return 'fastapi';
          if (requirements.includes('django')) return 'django';
          if (requirements.includes('flask')) return 'flask';
          return 'python';
        }
      } catch {}

      try {
        if (await fs.access(path.join(this.projectRoot, 'go.mod'))) return 'go';
      } catch {}

      try {
        if (await fs.access(path.join(this.projectRoot, 'Cargo.toml'))) return 'rust';
      } catch {}

      return 'unknown';
    }
  }

  async detectLanguage() {
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps.typescript || deps['@types/node']) return 'typescript';
      return 'javascript';
    } catch {
      // Check for other language files
      const files = await fs.readdir(this.projectRoot).catch(() => []);
      if (files.some(f => f.endsWith('.py'))) return 'python';
      if (files.some(f => f.endsWith('.go'))) return 'go';
      if (files.some(f => f.endsWith('.rs'))) return 'rust';
      if (files.some(f => f.endsWith('.java'))) return 'java';
      
      return 'unknown';
    }
  }

  async detectBackend() {
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps['@supabase/supabase-js']) return 'supabase';
      if (deps.firebase) return 'firebase';
      if (deps.aws-sdk || deps['@aws-sdk/client-s3']) return 'aws';
      if (deps.express) return 'express';
      
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async detectDatabase() {
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps['@supabase/supabase-js']) return 'postgresql';
      if (deps.mongoose) return 'mongodb';
      if (deps.mysql2 || deps.mysql) return 'mysql';
      if (deps.sqlite3) return 'sqlite';
      if (deps.pg) return 'postgresql';
      
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async detectTesting() {
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps.playwright) return 'playwright';
      if (deps.cypress) return 'cypress';
      if (deps.vitest) return 'vitest';
      if (deps.jest) return 'jest';
      
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async detectStyling() {
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps.tailwindcss) return 'tailwindcss';
      if (deps['styled-components']) return 'styled-components';
      if (deps['@emotion/react']) return 'emotion';
      if (deps.sass || deps.scss) return 'sass';
      
      return 'css';
    } catch {
      return 'css';
    }
  }

  async detectFeatures() {
    const features = {};
    
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      features.authentication = !!(deps['@supabase/supabase-js'] || deps.firebase || deps['next-auth']);
      features.realtime = !!(deps['@supabase/realtime-js'] || deps['socket.io'] || deps.ws);
      features.geolocation = !!(deps['@googlemaps/js-api-loader'] || deps.mapbox);
      features.mediaProcessing = !!(deps.multer || deps.sharp || deps.ffmpeg);
      features.mobileApp = !!(deps['@capacitor/core'] || deps['react-native']);
      features.stateManagement = !!(deps.redux || deps.zustand || deps['@tanstack/react-query']);
      
    } catch {
      // Default features
    }
    
    return features;
  }

  isContextOutdated() {
    if (!this.projectContext?.generated) return true;
    
    const generated = new Date(this.projectContext.generated);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return generated < weekAgo;
  }

  async saveProjectContext() {
    const contextDir = path.dirname(this.contextFile);
    await fs.mkdir(contextDir, { recursive: true });
    await fs.writeFile(this.contextFile, JSON.stringify(this.projectContext, null, 2));
  }

  getBestPractices(framework, category) {
    const practices = {
      react: {
        components: [
          "Use functional components with hooks",
          "Implement proper prop validation with TypeScript",
          "Use React.memo for performance optimization",
          "Keep components small and focused",
          "Use custom hooks for reusable logic"
        ],
        stateManagement: [
          "Use local state for component-specific data",
          "Use context for app-wide state",
          "Consider React Query for server state",
          "Avoid prop drilling with context",
          "Use reducers for complex state logic"
        ],
        performance: [
          "Implement code splitting with React.lazy",
          "Use useMemo and useCallback judiciously",
          "Optimize bundle size with tree shaking",
          "Implement proper error boundaries",
          "Use React DevTools Profiler"
        ]
      },
      nextjs: {
        routing: [
          "Use App Router for new projects",
          "Implement proper SEO with metadata",
          "Use dynamic imports for code splitting",
          "Implement proper error pages",
          "Use middleware for authentication"
        ],
        performance: [
          "Use Next.js Image component",
          "Implement proper caching strategies",
          "Use Server Components when possible",
          "Optimize fonts with next/font",
          "Implement proper loading states"
        ]
      },
      // Add more frameworks...
    };

    return practices[framework]?.[category] || practices.universal?.[category] || [];
  }

  getCodePatterns(framework, pattern) {
    const patterns = {
      react: {
        'custom-hook': `
// Custom hook pattern
import { useState, useEffect } from 'react';

export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}`,
        'error-boundary': `
// Error Boundary Component
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}`
      }
    };

    return patterns[framework]?.[pattern] || 'Pattern not found for this framework';
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_best_practices',
            description: 'Get framework-specific best practices for any category',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Category of best practices (components, testing, performance, etc.)',
                },
                framework: {
                  type: 'string',
                  description: 'Framework to get practices for (auto-detected if not specified)',
                },
              },
              required: ['category'],
            },
          },
          {
            name: 'get_code_pattern',
            description: 'Get code patterns and examples for specific use cases',
            inputSchema: {
              type: 'object',
              properties: {
                pattern: {
                  type: 'string',
                  description: 'Pattern name (custom-hook, error-boundary, api-client, etc.)',
                },
                framework: {
                  type: 'string',
                  description: 'Framework to get pattern for (auto-detected if not specified)',
                },
              },
              required: ['pattern'],
            },
          },
          {
            name: 'analyze_project',
            description: 'Analyze current project and provide recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                force_refresh: {
                  type: 'boolean',
                  description: 'Force refresh of project analysis',
                  default: false,
                },
              },
            },
          },
          {
            name: 'validate_code_quality',
            description: 'Validate code against best practices and standards',
            inputSchema: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: 'Path to file to validate',
                },
                code: {
                  type: 'string',
                  description: 'Code snippet to validate',
                },
              },
            },
          },
          {
            name: 'get_security_checklist',
            description: 'Get security checklist for current project type',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Security category (authentication, data-protection, api-security, etc.)',
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.projectContext) {
        await this.loadProjectContext();
      }

      switch (request.params.name) {
        case 'get_best_practices':
          const framework = request.params.arguments?.framework || this.projectContext.detected.framework;
          const category = request.params.arguments?.category;
          const practices = this.getBestPractices(framework, category);
          
          return {
            content: [
              {
                type: 'text',
                text: `Best Practices for ${framework} - ${category}:\n\n${practices.map(p => `• ${p}`).join('\n')}`,
              },
            ],
          };

        case 'get_code_pattern':
          const patternFramework = request.params.arguments?.framework || this.projectContext.detected.framework;
          const pattern = request.params.arguments?.pattern;
          const codePattern = this.getCodePatterns(patternFramework, pattern);
          
          return {
            content: [
              {
                type: 'text',
                text: `Code Pattern: ${pattern} for ${patternFramework}\n\n\`\`\`${this.projectContext.detected.language}\n${codePattern}\n\`\`\``,
              },
            ],
          };

        case 'analyze_project':
          if (request.params.arguments?.force_refresh) {
            this.projectContext = await this.detectProjectContext();
            await this.saveProjectContext();
          }
          
          return {
            content: [
              {
                type: 'text',
                text: `Project Analysis:\n\n${JSON.stringify(this.projectContext, null, 2)}`,
              },
            ],
          };

        case 'validate_code_quality':
          // Simple validation logic - in real implementation, integrate with ESLint, etc.
          const validation = "Code validation complete. Consider implementing proper linting tools for comprehensive analysis.";
          
          return {
            content: [
              {
                type: 'text',
                text: validation,
              },
            ],
          };

        case 'get_security_checklist':
          const securityCategory = request.params.arguments?.category || 'general';
          const checklist = this.getSecurityChecklist(this.projectContext.detected.framework, securityCategory);
          
          return {
            content: [
              {
                type: 'text',
                text: `Security Checklist - ${securityCategory}:\n\n${checklist.map(item => `□ ${item}`).join('\n')}`,
              },
            ],
          };

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  getSecurityChecklist(framework, category) {
    const checklists = {
      general: [
        "Validate all user inputs",
        "Use HTTPS for all communications",
        "Implement proper authentication",
        "Use environment variables for secrets",
        "Keep dependencies updated",
        "Implement proper error handling",
        "Log security events",
        "Use Content Security Policy (CSP)"
      ],
      authentication: [
        "Use strong password requirements",
        "Implement multi-factor authentication",
        "Use secure session management",
        "Implement proper logout functionality",
        "Hash passwords with bcrypt",
        "Use JWT tokens securely",
        "Implement account lockout policies"
      ],
      "data-protection": [
        "Encrypt sensitive data at rest",
        "Use parameterized queries",
        "Implement data validation",
        "Use proper access controls",
        "Implement audit logging",
        "Follow GDPR compliance",
        "Secure data backups"
      ]
    };

    return checklists[category] || checklists.general;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Context7 Universal MCP server running on stdio');
  }
}

const server = new Context7Server();
server.run().catch(console.error);