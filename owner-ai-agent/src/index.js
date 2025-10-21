require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const config = require('config');
const agent = require('./agent');
const a2aAdapter = require('./a2a/adapter');

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
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// A2A Protocol endpoints
app.post('/a2a/message', async (req, res) => {
  try {
    logger.info('Received A2A message');
    const message = req.body;
    const response = await a2aAdapter.handleMessage(message);
    res.json(response);
  } catch (error) {
    logger.error('Error handling A2A message:', error);
    res.status(500).json({
      error: {
        code: 'message_processing_error',
        message: error.message
      }
    });
  }
});

// Agent info endpoint
app.get('/info', (req, res) => {
  try {
    const info = agent.getInfo();
    res.json(info);
  } catch (error) {
    logger.error('Error getting agent info:', error);
    res.status(500).json({
      error: {
        code: 'internal_error',
        message: error.message
      }
    });
  }
});

// Tools endpoint
app.get('/tools', (req, res) => {
  try {
    const tools = agent.getTools();
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

// Start server
app.listen(port, () => {
  logger.info(`Owner AI Agent listening at http://localhost:${port}`);
  
  // Initialize agent
  agent.initialize()
    .then(() => {
      logger.info('Agent initialized successfully');
    })
    .catch((error) => {
      logger.error('Failed to initialize agent:', error);
    });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;

// Made with Bob
