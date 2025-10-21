require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const toolRegistry = require('./tools');
const resourceRegistry = require('./resources');

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

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// MCP Protocol endpoints

// List tools
app.get('/tools', (req, res) => {
  try {
    const tools = toolRegistry.listTools();
    res.json({ tools });
  } catch (error) {
    logger.error('Error listing tools:', error);
    res.status(500).json({
      error: {
        code: 'internal_error',
        message: error.message
      }
    });
  }
});

// Call tool
app.post('/tools/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    const input = req.body;
    
    logger.info(`Calling tool: ${toolName}`, { input });
    
    const tool = toolRegistry.getTool(toolName);
    if (!tool) {
      return res.status(404).json({
        error: {
          code: 'tool_not_found',
          message: `Tool '${toolName}' not found`
        }
      });
    }
    
    const result = await tool.execute(input);
    res.json({ result });
  } catch (error) {
    logger.error('Error calling tool:', error);
    res.status(500).json({
      error: {
        code: 'tool_execution_error',
        message: error.message
      }
    });
  }
});

// List resources
app.get('/resources', (req, res) => {
  try {
    const resources = resourceRegistry.listResources();
    res.json({ resources });
  } catch (error) {
    logger.error('Error listing resources:', error);
    res.status(500).json({
      error: {
        code: 'internal_error',
        message: error.message
      }
    });
  }
});

// Get resource
app.get('/resources/:uri(*)', async (req, res) => {
  try {
    const uri = req.params.uri;
    
    logger.info(`Getting resource: ${uri}`);
    
    const resource = resourceRegistry.getResource(uri);
    if (!resource) {
      return res.status(404).json({
        error: {
          code: 'resource_not_found',
          message: `Resource '${uri}' not found`
        }
      });
    }
    
    const result = await resource.read(uri);
    res.json({ result });
  } catch (error) {
    logger.error('Error getting resource:', error);
    res.status(500).json({
      error: {
        code: 'resource_read_error',
        message: error.message
      }
    });
  }
});

// Start server
app.listen(port, () => {
  logger.info(`GitHub MCP server listening at http://localhost:${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;

// Made with Bob
