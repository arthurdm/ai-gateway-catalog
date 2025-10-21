const config = require('config');
const logger = require('./utils/logger');
const api = require('./utils/api');

/**
 * Register the GitHub MCP server with the MCP Gateway
 */
async function registerGitHubServer() {
  logger.info('Registering GitHub MCP server');
  
  const serverConfig = config.get('githubServer');
  
  // Check if server already exists
  const servers = await api.getServers();
  const existingServer = servers.find(s => s.name === serverConfig.name);
  
  if (existingServer) {
    logger.info('GitHub MCP server already registered', { serverId: existingServer.id });
    return existingServer;
  }
  
  // Register server
  const server = {
    name: serverConfig.name,
    description: serverConfig.description,
    url: serverConfig.url,
    type: serverConfig.type,
    metadata: {
      provider: 'github',
      version: '1.0.0'
    }
  };
  
  const result = await api.registerServer(server);
  logger.info('GitHub MCP server registered successfully', { serverId: result.id });
  
  return result;
}

/**
 * Unregister the GitHub MCP server from the MCP Gateway
 */
async function unregisterGitHubServer() {
  logger.info('Unregistering GitHub MCP server');
  
  const serverConfig = config.get('githubServer');
  
  // Check if server exists
  const servers = await api.getServers();
  const existingServer = servers.find(s => s.name === serverConfig.name);
  
  if (!existingServer) {
    logger.info('GitHub MCP server not registered');
    return;
  }
  
  // Unregister server
  await api.deleteServer(existingServer.id);
  logger.info('GitHub MCP server unregistered successfully', { serverId: existingServer.id });
}

module.exports = {
  registerGitHubServer,
  unregisterGitHubServer
};

// Made with Bob
