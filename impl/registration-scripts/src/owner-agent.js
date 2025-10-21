const config = require('config');
const logger = require('./utils/logger');
const api = require('./utils/api');

/**
 * Register the Owner AI Agent with the MCP Gateway
 */
async function registerOwnerAgent() {
  logger.info('Registering Owner AI Agent');
  
  const agentConfig = config.get('ownerAgent');
  
  // Check if agent already exists
  const agents = await api.getAgents();
  const existingAgent = agents.find(a => a.name === agentConfig.name);
  
  if (existingAgent) {
    logger.info('Owner AI Agent already registered', { agentId: existingAgent.id });
    return existingAgent;
  }
  
  // Register agent
  const agent = {
    name: agentConfig.name,
    description: agentConfig.description,
    url: agentConfig.url,
    type: agentConfig.type,
    capabilities: ['react', 'tools', 'memory'],
    metadata: {
      version: '1.0.0'
    }
  };
  
  const result = await api.registerAgent(agent);
  logger.info('Owner AI Agent registered successfully', { agentId: result.id });
  
  return result;
}

/**
 * Unregister the Owner AI Agent from the MCP Gateway
 */
async function unregisterOwnerAgent() {
  logger.info('Unregistering Owner AI Agent');
  
  const agentConfig = config.get('ownerAgent');
  
  // Check if agent exists
  const agents = await api.getAgents();
  const existingAgent = agents.find(a => a.name === agentConfig.name);
  
  if (!existingAgent) {
    logger.info('Owner AI Agent not registered');
    return;
  }
  
  // Unregister agent
  await api.deleteAgent(existingAgent.id);
  logger.info('Owner AI Agent unregistered successfully', { agentId: existingAgent.id });
}

module.exports = {
  registerOwnerAgent,
  unregisterOwnerAgent
};

// Made with Bob
