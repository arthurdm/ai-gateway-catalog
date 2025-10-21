const winston = require('winston');
const githubServer = require('./github-server');
const ownerAgent = require('./owner-agent');

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
 * Main function
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0];
    const target = args[1];
    
    if (!command) {
      console.log('Usage: node index.js <command> <target>');
      console.log('Commands: register, unregister');
      console.log('Targets: github-server, owner-agent, all');
      return;
    }
    
    switch (command) {
      case 'register':
        await handleRegister(target);
        break;
      case 'unregister':
        await handleUnregister(target);
        break;
      default:
        console.log(`Unknown command: ${command}`);
        break;
    }
  } catch (error) {
    logger.error('Error in main function', { error: error.message });
    process.exit(1);
  }
}

/**
 * Handle register command
 */
async function handleRegister(target) {
  switch (target) {
    case 'github-server':
      await githubServer.registerGitHubServer();
      break;
    case 'owner-agent':
      await ownerAgent.registerOwnerAgent();
      break;
    case 'all':
      await githubServer.registerGitHubServer();
      await ownerAgent.registerOwnerAgent();
      break;
    default:
      console.log(`Unknown target: ${target}`);
      break;
  }
}

/**
 * Handle unregister command
 */
async function handleUnregister(target) {
  switch (target) {
    case 'github-server':
      await githubServer.unregisterGitHubServer();
      break;
    case 'owner-agent':
      await ownerAgent.unregisterOwnerAgent();
      break;
    case 'all':
      await githubServer.unregisterGitHubServer();
      await ownerAgent.unregisterOwnerAgent();
      break;
    default:
      console.log(`Unknown target: ${target}`);
      break;
  }
}

// Run main function
main().catch(error => {
  logger.error('Unhandled error', { error: error.message });
  process.exit(1);
});

// Made with Bob
