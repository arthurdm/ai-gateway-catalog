const codeTool = require('./code-tool');
const issuesTool = require('./issues-tool');

// Combine all tools
const allTools = {
  ...codeTool,
  ...issuesTool
};

/**
 * Get a list of all available tools with their metadata
 */
function listTools() {
  return Object.entries(allTools).map(([name, tool]) => ({
    name,
    description: tool.description,
    parameters: tool.parameters,
    returns: tool.returns
  }));
}

/**
 * Get a specific tool by name
 */
function getTool(name) {
  return allTools[name];
}

module.exports = {
  listTools,
  getTool
};

// Made with Bob
