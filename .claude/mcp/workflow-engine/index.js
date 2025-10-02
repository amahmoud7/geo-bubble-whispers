#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Workflow Engine MCP Server - Process orchestration and state machines
class WorkflowEngineServer {
  constructor() {
    this.server = new Server({
      name: 'workflow-engine-mcp-server',
      version: '1.0.0'
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.workflows = new Map();
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // Create workflow
    this.server.tool('create-workflow', 'Create a new workflow definition', {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Workflow name' },
        states: { type: 'array', items: { type: 'string' }, description: 'Workflow states' },
        transitions: { type: 'array', description: 'State transitions' },
        initialState: { type: 'string', description: 'Initial state' }
      },
      required: ['name', 'states', 'initialState']
    }, async (request) => {
      const { name, states, transitions = [], initialState } = request.params;
      
      const workflow = {
        name,
        states,
        transitions,
        initialState,
        currentState: initialState,
        history: [initialState],
        created: new Date().toISOString()
      };
      
      this.workflows.set(name, workflow);
      
      return {
        content: [{
          type: 'text',
          text: `Created workflow "${name}" with states: ${states.join(', ')}. Current state: ${initialState}`
        }]
      };
    });

    // Execute workflow transition
    this.server.tool('execute-transition', 'Execute a state transition in a workflow', {
      type: 'object',
      properties: {
        workflow: { type: 'string', description: 'Workflow name' },
        event: { type: 'string', description: 'Transition event/trigger' },
        data: { type: 'object', description: 'Event data payload' }
      },
      required: ['workflow', 'event']
    }, async (request) => {
      const { workflow: workflowName, event, data = {} } = request.params;
      
      const workflow = this.workflows.get(workflowName);
      if (!workflow) {
        throw new Error(`Workflow "${workflowName}" not found`);
      }
      
      const result = this.executeTransition(workflow, event, data);
      
      return {
        content: [{
          type: 'text',
          text: `Workflow "${workflowName}" transitioned from ${result.fromState} to ${result.toState} via event "${event}"`
        }]
      };
    });

    // Get workflow status
    this.server.tool('get-workflow-status', 'Get current workflow status and history', {
      type: 'object',
      properties: {
        workflow: { type: 'string', description: 'Workflow name' }
      },
      required: ['workflow']
    }, async (request) => {
      const { workflow: workflowName } = request.params;
      
      const workflow = this.workflows.get(workflowName);
      if (!workflow) {
        throw new Error(`Workflow "${workflowName}" not found`);
      }
      
      return {
        content: [{
          type: 'text',
          text: `Workflow Status:
Name: ${workflow.name}
Current State: ${workflow.currentState}
States: ${workflow.states.join(', ')}
History: ${workflow.history.join(' → ')}
Created: ${workflow.created}`
        }]
      };
    });

    // List all workflows
    this.server.tool('list-workflows', 'List all active workflows', {
      type: 'object',
      properties: {}
    }, async () => {
      const workflowList = Array.from(this.workflows.values()).map(w => ({
        name: w.name,
        currentState: w.currentState,
        stateCount: w.states.length,
        created: w.created
      }));
      
      return {
        content: [{
          type: 'text',
          text: `Active Workflows (${workflowList.length}):
${workflowList.map(w => `- ${w.name}: ${w.currentState} (${w.stateCount} states)`).join('\n')}`
        }]
      };
    });

    // Generate workflow diagram
    this.server.tool('generate-workflow-diagram', 'Generate workflow diagram in mermaid format', {
      type: 'object',
      properties: {
        workflow: { type: 'string', description: 'Workflow name' }
      },
      required: ['workflow']
    }, async (request) => {
      const { workflow: workflowName } = request.params;
      
      const workflow = this.workflows.get(workflowName);
      if (!workflow) {
        throw new Error(`Workflow "${workflowName}" not found`);
      }
      
      const diagram = this.generateMermaidDiagram(workflow);
      
      return {
        content: [{
          type: 'text',
          text: `Workflow Diagram for "${workflowName}":

\`\`\`mermaid
${diagram}
\`\`\``
        }]
      };
    });
  }

  executeTransition(workflow, event, data) {
    const fromState = workflow.currentState;
    
    // Simple state transition logic (can be enhanced with complex rules)
    const validTransitions = {
      'pending': ['approved', 'rejected', 'cancelled'],
      'approved': ['completed', 'cancelled'],
      'rejected': ['pending', 'cancelled'],
      'completed': ['archived'],
      'cancelled': ['pending']
    };
    
    const validNextStates = validTransitions[fromState] || [];
    
    // Find matching transition
    let toState = null;
    if (event === 'approve') toState = 'approved';
    else if (event === 'reject') toState = 'rejected';
    else if (event === 'complete') toState = 'completed';
    else if (event === 'cancel') toState = 'cancelled';
    else if (event === 'archive') toState = 'archived';
    else if (event === 'reset') toState = 'pending';
    
    if (!toState || !validNextStates.includes(toState)) {
      throw new Error(`Invalid transition from ${fromState} with event ${event}`);
    }
    
    workflow.currentState = toState;
    workflow.history.push(toState);
    workflow.lastTransition = {
      from: fromState,
      to: toState,
      event,
      data,
      timestamp: new Date().toISOString()
    };
    
    return {
      fromState,
      toState,
      event,
      data
    };
  }

  generateMermaidDiagram(workflow) {
    const states = workflow.states.map(state => `  ${state}`).join('\n');
    const transitions = workflow.transitions.map(t => 
      `  ${t.from} --> ${t.to}: ${t.event}`
    ).join('\n');
    
    return `stateDiagram-v2
${states}
  [*] --> ${workflow.initialState}
${transitions}`;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new WorkflowEngineServer();
server.start().catch(console.error);