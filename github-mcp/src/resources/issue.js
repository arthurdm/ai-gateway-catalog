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
 * Issues resource
 */
const issues = {
  async read(uri) {
    const parsedUri = parseResourceUri(uri);
    
    if (!parsedUri || parsedUri.type !== 'issues') {
      throw new Error(`Invalid issues URI: ${uri}`);
    }
    
    const { owner, repo } = parsedUri;
    
    logger.debug('Reading issues resource', { owner, repo });
    
    try {
      const issues = await githubClient.getIssues(owner, repo);
      
      return {
        owner,
        repo,
        issues: issues.map(issue => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          user: {
            login: issue.user.login,
            avatar_url: issue.user.avatar_url,
            url: issue.user.html_url
          },
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          url: issue.html_url
        }))
      };
    } catch (error) {
      logger.error('Error reading issues resource', { error: error.message, owner, repo });
      throw error;
    }
  }
};

/**
 * Issue resource
 */
const issue = {
  async read(uri) {
    const parsedUri = parseResourceUri(uri);
    
    if (!parsedUri || parsedUri.type !== 'issue') {
      throw new Error(`Invalid issue URI: ${uri}`);
    }
    
    const { owner, repo, number } = parsedUri;
    
    logger.debug('Reading issue resource', { owner, repo, number });
    
    try {
      const issue = await githubClient.getIssue(owner, repo, number);
      
      return {
        owner,
        repo,
        number,
        title: issue.title,
        state: issue.state,
        body: issue.body,
        user: {
          login: issue.user.login,
          avatar_url: issue.user.avatar_url,
          url: issue.user.html_url
        },
        labels: issue.labels.map(label => ({
          name: label.name,
          color: label.color
        })),
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        closed_at: issue.closed_at,
        url: issue.html_url
      };
    } catch (error) {
      logger.error('Error reading issue resource', { error: error.message, owner, repo, number });
      throw error;
    }
  }
};

module.exports = {
  issues,
  issue
};

// Made with Bob
