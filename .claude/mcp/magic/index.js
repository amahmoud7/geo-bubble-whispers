#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Magic MCP Server - Component generation and design system integration
class MagicServer {
  constructor() {
    this.server = new Server({
      name: 'magic-mcp-server',
      version: '1.0.0'
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // Component generation tool
    this.server.tool('generate-component', 'Generate React component with TypeScript and styling', {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Component name' },
        type: { type: 'string', enum: ['functional', 'class'], description: 'Component type' },
        styling: { type: 'string', enum: ['tailwind', 'styled-components', 'css-modules'], description: 'Styling approach' },
        features: { type: 'array', items: { type: 'string' }, description: 'Component features (hooks, props, etc.)' }
      },
      required: ['name', 'type']
    }, async (request) => {
      const { name, type, styling = 'tailwind', features = [] } = request.params;
      
      const component = this.generateComponent(name, type, styling, features);
      
      return {
        content: [{
          type: 'text',
          text: `Generated ${type} component "${name}":

${component.tsx}

${component.test}

${component.story}`
        }]
      };
    });

    // Design system integration
    this.server.tool('integrate-design-system', 'Integrate component with design system tokens', {
      type: 'object',
      properties: {
        component: { type: 'string', description: 'Component code' },
        system: { type: 'string', enum: ['tailwind', 'material-ui', 'ant-design', 'chakra-ui'], description: 'Design system' }
      },
      required: ['component', 'system']
    }, async (request) => {
      const { component, system } = request.params;
      
      const integrated = this.integrateDesignSystem(component, system);
      
      return {
        content: [{
          type: 'text',
          text: `Integrated component with ${system} design system:

${integrated}`
        }]
      };
    });

    // UI pattern library access
    this.server.tool('get-ui-pattern', 'Get UI pattern implementation', {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'UI pattern name (modal, dropdown, card, etc.)' },
        framework: { type: 'string', enum: ['react', 'vue', 'angular'], description: 'Framework' }
      },
      required: ['pattern', 'framework']
    }, async (request) => {
      const { pattern, framework } = request.params;
      
      const patternCode = this.getUIPattern(pattern, framework);
      
      return {
        content: [{
          type: 'text',
          text: `${framework} implementation of ${pattern} pattern:

${patternCode.implementation}

Usage Example:
${patternCode.usage}`
        }]
      };
    });
  }

  generateComponent(name, type, styling, features) {
    const componentName = name.charAt(0).toUpperCase() + name.slice(1);
    
    let tsx = '';
    if (type === 'functional') {
      tsx = `import React from 'react';
${features.includes('state') ? "import { useState } from 'react';" : ''}

interface ${componentName}Props {
  // Define props here
}

const ${componentName}: React.FC<${componentName}Props> = (props) => {
  ${features.includes('state') ? 'const [state, setState] = useState();' : ''}
  
  return (
    <div className="${styling === 'tailwind' ? 'p-4 bg-white rounded-lg shadow' : componentName.toLowerCase()}">
      <h2 className="${styling === 'tailwind' ? 'text-xl font-semibold' : 'title'}">${componentName}</h2>
    </div>
  );
};

export default ${componentName};`;
    }

    const test = `import { render, screen } from '@testing-library/react';
import ${componentName} from './${componentName}';

describe('${componentName}', () => {
  it('renders correctly', () => {
    render(<${componentName} />);
    expect(screen.getByText('${componentName}')).toBeInTheDocument();
  });
});`;

    const story = `import type { Meta, StoryObj } from '@storybook/react';
import ${componentName} from './${componentName}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Components/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};`;

    return { tsx, test, story };
  }

  integrateDesignSystem(component, system) {
    // Simple integration example
    if (system === 'tailwind') {
      return component.replace(/className="([^"]*)"/, 'className="$1 bg-blue-500 text-white p-4 rounded"');
    }
    return component + `\n// Integrated with ${system}`;
  }

  getUIPattern(pattern, framework) {
    const patterns = {
      react: {
        modal: {
          implementation: `const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <button 
          onClick={onClose}
          className="float-right text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};`,
          usage: `<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
  <h2>Modal Title</h2>
  <p>Modal content here</p>
</Modal>`
        },
        dropdown: {
          implementation: `const Dropdown = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 bg-white border rounded shadow-lg z-10">
          {children}
        </div>
      )}
    </div>
  );
};`,
          usage: `<Dropdown trigger={<button>Options</button>}>
  <div className="p-2">Option 1</div>
  <div className="p-2">Option 2</div>
</Dropdown>`
        }
      }
    };

    return patterns[framework]?.[pattern] || { 
      implementation: `// ${pattern} pattern not found for ${framework}`,
      usage: `// Usage example not available`
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new MagicServer();
server.start().catch(console.error);