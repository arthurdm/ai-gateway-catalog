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

/**
 * Validate a message against the A2A protocol schema
 */
function validateMessage(message) {
  const errors = [];
  
  // Check required fields
  if (!message.type) {
    errors.push('Message type is required');
  }
  
  if (!message.id) {
    errors.push('Message ID is required');
  }
  
  if (!message.timestamp) {
    errors.push('Message timestamp is required');
  }
  
  if (!message.sender) {
    errors.push('Message sender is required');
  } else {
    if (!message.sender.id) {
      errors.push('Sender ID is required');
    }
  }
  
  if (!message.content) {
    errors.push('Message content is required');
  } else {
    // Validate content based on message type
    switch (message.type) {
      case 'query':
        if (!message.content.query) {
          errors.push('Query content is required for query messages');
        }
        break;
      case 'tool_call':
        if (!message.content.tool) {
          errors.push('Tool name is required for tool_call messages');
        }
        if (message.content.input === undefined) {
          errors.push('Tool input is required for tool_call messages');
        }
        break;
      case 'status':
        // No specific content required for status messages
        break;
      default:
        errors.push(`Unsupported message type: ${message.type}`);
        break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a query message
 */
function createQueryMessage(query, sender) {
  return {
    type: 'query',
    id: generateId(),
    timestamp: new Date().toISOString(),
    sender,
    content: {
      query
    }
  };
}

/**
 * Create a tool call message
 */
function createToolCallMessage(tool, input, sender) {
  return {
    type: 'tool_call',
    id: generateId(),
    timestamp: new Date().toISOString(),
    sender,
    content: {
      tool,
      input
    }
  };
}

/**
 * Create a status message
 */
function createStatusMessage(sender) {
  return {
    type: 'status',
    id: generateId(),
    timestamp: new Date().toISOString(),
    sender,
    content: {}
  };
}

/**
 * Generate a unique ID
 */
function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

module.exports = {
  validateMessage,
  createQueryMessage,
  createToolCallMessage,
  createStatusMessage
};

// Made with Bob
