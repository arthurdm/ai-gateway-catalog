const axios = require('axios');
const config = require('config');
const winston = require('winston');

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

class ApiClient {
  constructor() {
    this.baseUrl = config.get('mcpGateway.url');
    this.apiKey = config.get('mcpGateway.apiKey');
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Add request interceptor for logging
    this.client.interceptors.request.use(request => {
      logger.debug('API Request', {
        method: request.method,
        url: request.url
      });
      return request;
    });
    
    // Add response interceptor for logging
    this.client.interceptors.response.use(
      response => {
        logger.debug('API Response', {
          status: response.status,
          statusText: response.statusText
        });
        return response;
      },
      error => {
        logger.error('API Error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Register a server with the MCP Gateway
   */
  async registerServer(server) {
    try {
      const response = await this.client.post('/api/v1/servers', server);
      return response.data;
    } catch (error) {
      logger.error('Failed to register server', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Register an agent with the MCP Gateway
   */
  async registerAgent(agent) {
    try {
      const response = await this.client.post('/api/v1/agents', agent);
      return response.data;
    } catch (error) {
      logger.error('Failed to register agent', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get a list of registered servers
   */
  async getServers() {
    try {
      const response = await this.client.get('/api/v1/servers');
      return response.data;
    } catch (error) {
      logger.error('Failed to get servers', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get a list of registered agents
   */
  async getAgents() {
    try {
      const response = await this.client.get('/api/v1/agents');
      return response.data;
    } catch (error) {
      logger.error('Failed to get agents', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Delete a server registration
   */
  async deleteServer(serverId) {
    try {
      const response = await this.client.delete(`/api/v1/servers/${serverId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to delete server', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Delete an agent registration
   */
  async deleteAgent(agentId) {
    try {
      const response = await this.client.delete(`/api/v1/agents/${agentId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to delete agent', { error: error.message });
      throw error;
    }
  }
}

module.exports = new ApiClient();

// Made with Bob
