#!/usr/bin/env node

/**
 * Universal Linear MCP Server
 * Provides project management, issue tracking, and progress updates for any project
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';

class LinearMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'linear-universal',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.projectRoot = process.env.PROJECT_ROOT || process.cwd();
    this.apiKey = process.env.LINEAR_API_KEY;
    this.teamId = process.env.LINEAR_TEAM_ID;
    this.projectId = process.env.LINEAR_PROJECT_ID;
    this.apiBase = 'https://api.linear.app/graphql';
    
    this.setupToolHandlers();
  }

  async makeLinearRequest(query, variables = {}) {
    if (!this.apiKey) {
      throw new Error('LINEAR_API_KEY environment variable is required');
    }

    const response = await fetch(this.apiBase, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`Linear API error: ${data.errors.map(e => e.message).join(', ')}`);
    }
    
    return data.data;
  }

  async getCurrentUser() {
    const query = `
      query {
        viewer {
          id
          name
          email
          teams {
            nodes {
              id
              name
            }
          }
        }
      }
    `;
    
    const data = await this.makeLinearRequest(query);
    return data.viewer;
  }

  async getTeams() {
    const query = `
      query {
        teams {
          nodes {
            id
            name
            description
            projects {
              nodes {
                id
                name
                description
                state
              }
            }
          }
        }
      }
    `;
    
    const data = await this.makeLinearRequest(query);
    return data.teams.nodes;
  }

  async getIssues(filters = {}) {
    const filterConditions = [];
    
    if (filters.teamId) {
      filterConditions.push(`team: { id: { eq: "${filters.teamId}" } }`);
    }
    
    if (filters.projectId) {
      filterConditions.push(`project: { id: { eq: "${filters.projectId}" } }`);
    }
    
    if (filters.state) {
      filterConditions.push(`state: { name: { eq: "${filters.state}" } }`);
    }
    
    if (filters.assigneeId) {
      filterConditions.push(`assignee: { id: { eq: "${filters.assigneeId}" } }`);
    }

    const filterString = filterConditions.length > 0 ? 
      `filter: { ${filterConditions.join(', ')} }` : '';

    const query = `
      query GetIssues {
        issues(${filterString}, first: 50) {
          nodes {
            id
            identifier
            title
            description
            priority
            estimate
            url
            state {
              name
              type
            }
            assignee {
              name
              email
            }
            team {
              name
            }
            project {
              name
            }
            createdAt
            updatedAt
            dueDate
            labels {
              nodes {
                name
                color
              }
            }
          }
        }
      }
    `;
    
    const data = await this.makeLinearRequest(query);
    return data.issues.nodes;
  }

  async createIssue(input) {
    const mutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            url
            state {
              name
            }
          }
        }
      }
    `;

    const variables = {
      input: {
        title: input.title,
        description: input.description,
        teamId: input.teamId || this.teamId,
        projectId: input.projectId || this.projectId,
        priority: input.priority || 3,
        estimate: input.estimate,
        assigneeId: input.assigneeId,
        labelIds: input.labelIds || [],
        dueDate: input.dueDate
      }
    };

    const data = await this.makeLinearRequest(mutation, variables);
    return data.issueCreate;
  }

  async updateIssue(issueId, updates) {
    const mutation = `
      mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue {
            id
            identifier
            title
            state {
              name
            }
          }
        }
      }
    `;

    const variables = {
      id: issueId,
      input: updates
    };

    const data = await this.makeLinearRequest(mutation, variables);
    return data.issueUpdate;
  }

  async getWorkflowStates(teamId) {
    const query = `
      query GetWorkflowStates($teamId: String!) {
        team(id: $teamId) {
          states {
            nodes {
              id
              name
              type
              description
            }
          }
        }
      }
    `;

    const data = await this.makeLinearRequest(query, { teamId: teamId || this.teamId });
    return data.team.states.nodes;
  }

  async detectProjectContext() {
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf-8')
      );
      
      return {
        name: packageJson.name || path.basename(this.projectRoot),
        description: packageJson.description || '',
        version: packageJson.version || '1.0.0',
        repository: packageJson.repository?.url || '',
        homepage: packageJson.homepage || ''
      };
    } catch {
      return {
        name: path.basename(this.projectRoot),
        description: 'Project managed with Universal Claude Toolkit',
        version: '1.0.0'
      };
    }
  }

  async linkCommitToIssue(commitHash, issueIdentifier) {
    // In a real implementation, this would:
    // 1. Parse the commit message for issue references
    // 2. Update the issue with commit information
    // 3. Add comments linking to the commit
    
    const mutation = `
      mutation AddComment($id: String!, $input: CommentCreateInput!) {
        commentCreate(id: $id, input: $input) {
          success
          comment {
            id
            body
          }
        }
      }
    `;

    const commitUrl = await this.getCommitUrl(commitHash);
    const commentBody = `🔗 **Commit linked:** [${commitHash.slice(0, 8)}](${commitUrl})\n\nThis issue has been updated with code changes.`;

    // Find issue by identifier
    const issues = await this.getIssues();
    const issue = issues.find(i => i.identifier === issueIdentifier);
    
    if (!issue) {
      throw new Error(`Issue ${issueIdentifier} not found`);
    }

    const variables = {
      id: issue.id,
      input: {
        body: commentBody
      }
    };

    const data = await this.makeLinearRequest(mutation, variables);
    return data.commentCreate;
  }

  async getCommitUrl(commitHash) {
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf-8')
      );
      
      if (packageJson.repository?.url) {
        const repoUrl = packageJson.repository.url
          .replace('git+', '')
          .replace('.git', '')
          .replace('git://github.com/', 'https://github.com/');
        
        return `${repoUrl}/commit/${commitHash}`;
      }
    } catch {}
    
    return `https://github.com/owner/repo/commit/${commitHash}`;
  }

  async generateProjectReport() {
    try {
      const issues = await this.getIssues({ teamId: this.teamId, projectId: this.projectId });
      
      const statusCounts = issues.reduce((acc, issue) => {
        const status = issue.state.name;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const priorityCounts = issues.reduce((acc, issue) => {
        const priority = issue.priority || 'Unset';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {});

      const assigneeWorkload = issues.reduce((acc, issue) => {
        const assignee = issue.assignee?.name || 'Unassigned';
        acc[assignee] = (acc[assignee] || 0) + 1;
        return acc;
      }, {});

      return {
        totalIssues: issues.length,
        statusBreakdown: statusCounts,
        priorityBreakdown: priorityCounts,
        assigneeWorkload,
        recentIssues: issues
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(issue => ({
            identifier: issue.identifier,
            title: issue.title,
            state: issue.state.name,
            assignee: issue.assignee?.name || 'Unassigned',
            createdAt: issue.createdAt
          }))
      };
    } catch (error) {
      return {
        error: `Failed to generate report: ${error.message}`,
        totalIssues: 0,
        statusBreakdown: {},
        priorityBreakdown: {},
        assigneeWorkload: {}
      };
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_issues',
            description: 'Get issues from Linear with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                teamId: {
                  type: 'string',
                  description: 'Team ID to filter by',
                },
                projectId: {
                  type: 'string',
                  description: 'Project ID to filter by',
                },
                state: {
                  type: 'string',
                  description: 'Issue state to filter by',
                },
                assigneeId: {
                  type: 'string',
                  description: 'Assignee ID to filter by',
                },
              },
            },
          },
          {
            name: 'create_issue',
            description: 'Create a new issue in Linear',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Issue title',
                },
                description: {
                  type: 'string',
                  description: 'Issue description',
                },
                priority: {
                  type: 'number',
                  description: 'Priority level (1-4, 4 is highest)',
                },
                estimate: {
                  type: 'number',
                  description: 'Story points estimate',
                },
                teamId: {
                  type: 'string',
                  description: 'Team ID (uses default if not specified)',
                },
                projectId: {
                  type: 'string',
                  description: 'Project ID (uses default if not specified)',
                },
                assigneeId: {
                  type: 'string',
                  description: 'Assignee user ID',
                },
                labelIds: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of label IDs',
                },
                dueDate: {
                  type: 'string',
                  description: 'Due date in ISO format',
                },
              },
              required: ['title'],
            },
          },
          {
            name: 'update_issue',
            description: 'Update an existing issue',
            inputSchema: {
              type: 'object',
              properties: {
                issueId: {
                  type: 'string',
                  description: 'Issue ID to update',
                },
                title: {
                  type: 'string',
                  description: 'New title',
                },
                description: {
                  type: 'string',
                  description: 'New description',
                },
                stateId: {
                  type: 'string',
                  description: 'New state ID',
                },
                priority: {
                  type: 'number',
                  description: 'New priority level',
                },
                estimate: {
                  type: 'number',
                  description: 'New estimate',
                },
                assigneeId: {
                  type: 'string',
                  description: 'New assignee ID',
                },
              },
              required: ['issueId'],
            },
          },
          {
            name: 'get_teams_and_projects',
            description: 'Get all teams and their projects',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_workflow_states',
            description: 'Get workflow states for a team',
            inputSchema: {
              type: 'object',
              properties: {
                teamId: {
                  type: 'string',
                  description: 'Team ID (uses default if not specified)',
                },
              },
            },
          },
          {
            name: 'link_commit_to_issue',
            description: 'Link a git commit to a Linear issue',
            inputSchema: {
              type: 'object',
              properties: {
                commitHash: {
                  type: 'string',
                  description: 'Git commit hash',
                },
                issueIdentifier: {
                  type: 'string',
                  description: 'Linear issue identifier (e.g., DEV-123)',
                },
              },
              required: ['commitHash', 'issueIdentifier'],
            },
          },
          {
            name: 'generate_project_report',
            description: 'Generate a comprehensive project status report',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_user_info',
            description: 'Get current user information and accessible teams',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'get_issues':
            const filters = request.params.arguments || {};
            const issues = await this.getIssues(filters);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Found ${issues.length} issues:\n\n${issues.map(issue => 
                    `• ${issue.identifier}: ${issue.title}\n` +
                    `  State: ${issue.state.name} | Priority: ${issue.priority}\n` +
                    `  Assignee: ${issue.assignee?.name || 'Unassigned'}\n` +
                    `  URL: ${issue.url}\n`
                  ).join('\n')}`,
                },
              ],
            };

          case 'create_issue':
            const issueInput = request.params.arguments;
            const createResult = await this.createIssue(issueInput);
            
            if (createResult.success) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `✅ Issue created successfully!\n\n` +
                          `ID: ${createResult.issue.identifier}\n` +
                          `Title: ${createResult.issue.title}\n` +
                          `State: ${createResult.issue.state.name}\n` +
                          `URL: ${createResult.issue.url}`,
                  },
                ],
              };
            } else {
              throw new Error('Failed to create issue');
            }

          case 'update_issue':
            const { issueId, ...updates } = request.params.arguments;
            const updateResult = await this.updateIssue(issueId, updates);
            
            if (updateResult.success) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `✅ Issue updated successfully!\n\n` +
                          `ID: ${updateResult.issue.identifier}\n` +
                          `Title: ${updateResult.issue.title}\n` +
                          `State: ${updateResult.issue.state.name}`,
                  },
                ],
              };
            } else {
              throw new Error('Failed to update issue');
            }

          case 'get_teams_and_projects':
            const teams = await this.getTeams();
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Available Teams and Projects:\n\n${teams.map(team =>
                    `**${team.name}** (${team.id})\n` +
                    `${team.description || 'No description'}\n` +
                    `Projects:\n${team.projects.nodes.map(project =>
                      `  • ${project.name} (${project.state}) - ${project.id}`
                    ).join('\n') || '  No projects'}\n`
                  ).join('\n')}`,
                },
              ],
            };

          case 'get_workflow_states':
            const teamId = request.params.arguments?.teamId || this.teamId;
            const states = await this.getWorkflowStates(teamId);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Workflow States:\n\n${states.map(state =>
                    `• ${state.name} (${state.type}) - ${state.id}\n` +
                    `  ${state.description || 'No description'}`
                  ).join('\n')}`,
                },
              ],
            };

          case 'link_commit_to_issue':
            const { commitHash, issueIdentifier } = request.params.arguments;
            const linkResult = await this.linkCommitToIssue(commitHash, issueIdentifier);
            
            if (linkResult.success) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `✅ Commit ${commitHash.slice(0, 8)} linked to issue ${issueIdentifier}`,
                  },
                ],
              };
            } else {
              throw new Error('Failed to link commit to issue');
            }

          case 'generate_project_report':
            const report = await this.generateProjectReport();
            
            if (report.error) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `❌ ${report.error}`,
                  },
                ],
              };
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: `📊 Project Status Report\n\n` +
                        `**Total Issues:** ${report.totalIssues}\n\n` +
                        `**Status Breakdown:**\n${Object.entries(report.statusBreakdown).map(([status, count]) =>
                          `  • ${status}: ${count}`
                        ).join('\n')}\n\n` +
                        `**Priority Breakdown:**\n${Object.entries(report.priorityBreakdown).map(([priority, count]) =>
                          `  • Priority ${priority}: ${count}`
                        ).join('\n')}\n\n` +
                        `**Workload by Assignee:**\n${Object.entries(report.assigneeWorkload).map(([assignee, count]) =>
                          `  • ${assignee}: ${count} issues`
                        ).join('\n')}\n\n` +
                        `**Recent Issues:**\n${report.recentIssues.map(issue =>
                          `  • ${issue.identifier}: ${issue.title} (${issue.state})`
                        ).join('\n')}`,
                },
              ],
            };

          case 'get_user_info':
            const user = await this.getCurrentUser();
            
            return {
              content: [
                {
                  type: 'text',
                  text: `👤 Current User: ${user.name}\n` +
                        `📧 Email: ${user.email}\n` +
                        `🏢 Teams: ${user.teams.nodes.map(team => team.name).join(', ')}`,
                },
              ],
            };

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Linear Universal MCP server running on stdio');
  }
}

const server = new LinearMCPServer();
server.run().catch(console.error);