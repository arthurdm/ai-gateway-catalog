const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const agent = require('../agent');
const schema = require('./schema');

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

/**
 * Handle an incoming A2A message
 */
async function handleMessage(message) {
  logger.debug('Handling A2A message', { messageType: message.type });
  
  try {
    // Validate message against schema
    const validationResult = schema.validateMessage(message);
    if (!validationResult.valid) {
      return createErrorResponse(message, 'invalid_message', validationResult.errors.join(', '));
    }
    
    // Handle different message types
    switch (message.type) {
      case 'query':
        return handleQueryMessage(message);
      case 'tool_call':
        return handleToolCallMessage(message);
      case 'status':
        return handleStatusMessage(message);
      default:
        return createErrorResponse(message, 'unsupported_message_type', `Message type '${message.type}' is not supported`);
    }
  } catch (error) {
    logger.error('Error handling A2A message:', error);
    return createErrorResponse(message, 'internal_error', error.message);
  }
}

/**
 * Handle a query message
 */
async function handleQueryMessage(message) {
  const query = message.content.query;
  
  try {
    // Process query with agent
    const result = await agent.processQuery(query, message.id);
    
    // Create response
    return {
      type: 'response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      inResponseTo: message.id,
      sender: {
        id: process.env.AGENT_NAME || 'owner-ai-agent',
        name: process.env.AGENT_NAME || 'owner-ai-agent'
      },
      content: {
        response: result.response,
        thinking: result.thinking
      }
    };
  } catch (error) {
    logger.error('Error processing query:', error);
    return createErrorResponse(message, 'query_processing_error', error.message);
  }
}

/**
 * Handle a tool call message
 */
async function handleToolCallMessage(message) {
  const toolName = message.content.tool;
  const toolInput = message.content.input;
  
  try {
    // Get tool
    const tools = agent.getTools();
    const tool = tools.find(t => t.name === toolName);
    
    if (!tool) {
      return createErrorResponse(message, 'tool_not_found', `Tool '${toolName}' not found`);
    }
    
    // Execute tool
    const result = await tool.execute(toolInput);
    
    // Create response
    return {
      type: 'tool_result',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      inResponseTo: message.id,
      sender: {
        id: process.env.AGENT_NAME || 'owner-ai-agent',
        name: process.env.AGENT_NAME || 'owner-ai-agent'
      },
      content: {
        tool: toolName,
        result
      }
    };
  } catch (error) {
    logger.error('Error executing tool:', error);
    return createErrorResponse(message, 'tool_execution_error', error.message);
  }
}

/**
 * Handle a status message
 */
async function handleStatusMessage(message) {
  try {
    // Get agent info
    const info = agent.getInfo();
    
    // Create response
    return {
      type: 'status_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      inResponseTo: message.id,
      sender: {
        id: process.env.AGENT_NAME || 'owner-ai-agent',
        name: process.env.AGENT_NAME || 'owner-ai-agent'
      },
      content: {
        status: 'ok',
        info
      }
    };
  } catch (error) {
    logger.error('Error getting agent status:', error);
    return createErrorResponse(message, 'status_error', error.message);
  }
}

/**
 * Create an error response
 */
function createErrorResponse(message, code, errorMessage) {
  return {
    type: 'error',
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    inResponseTo: message?.id,
    sender: {
      id: process.env.AGENT_NAME || 'owner-ai-agent',
      name: process.env.AGENT_NAME || 'owner-ai-agent'
    },
    content: {
      error: {
        code,
        message: errorMessage
      }
    }
  };
}

module.exports = {
  handleMessage
};

// Made with Bob
