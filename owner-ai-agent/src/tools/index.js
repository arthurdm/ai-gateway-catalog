const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');
const ownershipTool = require('./ownership');
const availabilityTool = require('./availability');
const contactTool = require('./contact');

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

// Combine all tools
const allTools = {
  ...ownershipTool,
  ...availabilityTool,
  ...contactTool
};

/**
 * Initialize all tools
 */
async function initialize() {
  logger.info('Initializing tools');
  
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.resolve(process.env.DATA_DIR || './data');
    await fs.mkdir(dataDir, { recursive: true });
    
    // Initialize each tool module
    await Promise.all([
      ownershipTool.initialize(),
      availabilityTool.initialize(),
      contactTool.initialize()
    ]);
    
    logger.info('Tools initialized successfully');
  } catch (error) {
    logger.error('Error initializing tools:', error);
    throw error;
  }
}

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
  initialize,
  listTools,
  getTool
};

// Made with Bob
