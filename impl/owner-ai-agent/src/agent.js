const config = require('config');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const reactEngine = require('./react/engine');
const tools = require('./tools');

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

// Store active conversations
const conversations = new Map();

/**
 * Initialize the agent
 */
async function initialize() {
  logger.info('Initializing Owner AI Agent');
  
  // Initialize tools
  await tools.initialize();
  
  // Initialize ReAct engine
  await reactEngine.initialize();
  
  logger.info('Owner AI Agent initialized');
}

/**
 * Process a user query
 */
async function processQuery(query, conversationId = null) {
  // Create or retrieve conversation
  if (!conversationId) {
    conversationId = uuidv4();
    conversations.set(conversationId, {
      id: conversationId,
      messages: [],
      createdAt: new Date()
    });
  }
  
  const conversation = conversations.get(conversationId);
  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }
  
  // Add user message to conversation
  conversation.messages.push({
    role: 'user',
    content: query,
    timestamp: new Date()
  });
  
  // Process with ReAct engine
  logger.info(`Processing query: "${query}" (conversation: ${conversationId})`);
  const result = await reactEngine.process(query, conversation);
  
  // Add agent response to conversation
  conversation.messages.push({
    role: 'agent',
    content: result.response,
    timestamp: new Date()
  });
  
  // Return response with conversation ID
  return {
    conversationId,
    response: result.response,
    thinking: result.thinking
  };
}

/**
 * Get available tools
 */
function getTools() {
  return tools.listTools();
}

/**
 * Get agent information
 */
function getInfo() {
  return {
    name: process.env.AGENT_NAME || 'owner-ai-agent',
    description: process.env.AGENT_DESCRIPTION || 'AI Agent for finding resource owners and contact information',
    version: process.env.AGENT_VERSION || '1.0.0',
    capabilities: ['react', 'tools', 'memory']
  };
}

module.exports = {
  initialize,
  processQuery,
  getTools,
  getInfo
};

// Made with Bob
