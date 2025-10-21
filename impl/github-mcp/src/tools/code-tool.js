const winston = require('winston');
const githubClient = require('../github/client');

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
 * Get code from a GitHub repository
 */
const getRepositoryCode = {
  description: 'Get code from a GitHub repository',
  parameters: {
    owner: {
      type: 'string',
      description: 'Repository owner (user or organization)'
    },
    repo: {
      type: 'string',
      description: 'Repository name'
    },
    path: {
      type: 'string',
      description: 'File or directory path within the repository'
    }
  },
  returns: {
    content: {
      type: 'string',
      description: 'File content (if path is a file)'
    },
    files: {
      type: 'array',
      description: 'List of files (if path is a directory)'
    }
  },
  async execute({ owner, repo, path = '' }) {
    logger.debug('Executing getRepositoryCode', { owner, repo, path });
    
    try {
      const contents = await githubClient.getRepositoryContents(owner, repo, path);
      
      // If contents is an array, it's a directory
      if (Array.isArray(contents)) {
        return {
          isDirectory: true,
          files: contents.map(item => ({
            name: item.name,
            path: item.path,
            type: item.type,
            size: item.size,
            url: item.html_url
          }))
        };
      }
      
      // If contents is not an array, it's a file
      if (contents.type === 'file') {
        const fileContent = await githubClient.getFileContent(owner, repo, path);
        return {
          isDirectory: false,
          content: fileContent.content,
          name: fileContent.name,
          path: fileContent.path,
          size: fileContent.size,
          url: fileContent.url
        };
      }
      
      // If contents is neither an array nor a file, it's something else (e.g., a symlink)
      return {
        isDirectory: false,
        isFile: false,
        type: contents.type,
        name: contents.name,
        path: contents.path,
        url: contents.html_url
      };
    } catch (error) {
      logger.error('Error in getRepositoryCode', { error: error.message, owner, repo, path });
      throw error;
    }
  }
};

/**
 * Search for code in a GitHub repository
 */
const searchCode = {
  description: 'Search for code in a GitHub repository',
  parameters: {
    owner: {
      type: 'string',
      description: 'Repository owner (user or organization)'
    },
    repo: {
      type: 'string',
      description: 'Repository name'
    },
    query: {
      type: 'string',
      description: 'Search query'
    }
  },
  returns: {
    items: {
      type: 'array',
      description: 'List of matching files'
    },
    totalCount: {
      type: 'number',
      description: 'Total number of matches'
    }
  },
  async execute({ owner, repo, query }) {
    logger.debug('Executing searchCode', { owner, repo, query });
    
    try {
      const results = await githubClient.searchCode(owner, repo, query);
      
      return {
        totalCount: results.total_count,
        items: results.items.map(item => ({
          name: item.name,
          path: item.path,
          url: item.html_url,
          repository: {
            name: item.repository.name,
            owner: item.repository.owner.login
          }
        }))
      };
    } catch (error) {
      logger.error('Error in searchCode', { error: error.message, owner, repo, query });
      throw error;
    }
  }
};

module.exports = {
  'getRepositoryCode': getRepositoryCode,
  'searchCode': searchCode
};

// Made with Bob
