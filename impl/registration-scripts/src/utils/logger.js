const winston = require('winston');
const config = require('config');

// Create logger
const logger = winston.createLogger({
  level: config.get('logging.level') || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(info => {
          return `${info.timestamp} ${info.level}: ${info.message}${info.data ? ' ' + JSON.stringify(info.data) : ''}`;
        })
      )
    })
  ]
});

module.exports = logger;

// Made with Bob
