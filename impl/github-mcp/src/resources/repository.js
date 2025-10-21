const winston = require('winston');
const githubClient = require('../github/client');
const { parseResourceUri } = require('./index');

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
 * Repository resource
 */
const repository = {
  async read(uri) {
    const parsedUri = parseResourceUri(uri);
    
    if (!parsedUri || parsedUri.type !== 'repository') {
      throw new Error(`Invalid repository URI: ${uri}`);
    }
    
    const { owner, repo } = parsedUri;
    
    logger.debug('Reading repository resource', { owner, repo });
    
    try {
      // For a repository, we'll return the root contents
      const contents = await githubClient.getRepositoryContents(owner, repo);
      
      return {
        owner,
        repo,
        files: contents.map(item => ({
          name: item.name,
          path: item.path,
          type: item.type,
          size: item.size,
          url: item.html_url
        }))
      };
    } catch (error) {
      logger.error('Error reading repository resource', { error: error.message, owner, repo });
      throw error;
    }
  }
};

/**
 * File resource
 */
const file = {
  async read(uri) {
    const parsedUri = parseResourceUri(uri);
    
    if (!parsedUri || parsedUri.type !== 'file') {
      throw new Error(`Invalid file URI: ${uri}`);
    }
    
    const { owner, repo, path } = parsedUri;
    
    logger.debug('Reading file resource', { owner, repo, path });
    
    try {
      const fileContent = await githubClient.getFileContent(owner, repo, path);
      
      return {
        owner,
        repo,
        path,
        content: fileContent.content,
        name: fileContent.name,
        size: fileContent.size,
        url: fileContent.url
      };
    } catch (error) {
      logger.error('Error reading file resource', { error: error.message, owner, repo, path });
      throw error;
    }
  }
};

module.exports = {
  repository,
  file
};

// Made with Bob
