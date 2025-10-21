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
 * Get issues from a GitHub repository
 */
const getIssues = {
  description: 'Get issues from a GitHub repository',
  parameters: {
    owner: {
      type: 'string',
      description: 'Repository owner (user or organization)'
    },
    repo: {
      type: 'string',
      description: 'Repository name'
    },
    state: {
      type: 'string',
      description: 'Issue state (open, closed, all)',
      optional: true
    },
    labels: {
      type: 'string',
      description: 'Comma-separated list of label names',
      optional: true
    },
    sort: {
      type: 'string',
      description: 'What to sort results by (created, updated, comments)',
      optional: true
    },
    direction: {
      type: 'string',
      description: 'The direction of the sort (asc or desc)',
      optional: true
    },
    since: {
      type: 'string',
      description: 'Only issues updated at or after this time are returned (ISO 8601)',
      optional: true
    },
    per_page: {
      type: 'number',
      description: 'Number of results per page (max 100)',
      optional: true
    },
    page: {
      type: 'number',
      description: 'Page number of the results to fetch',
      optional: true
    }
  },
  returns: {
    issues: {
      type: 'array',
      description: 'List of issues'
    }
  },
  async execute({ owner, repo, ...options }) {
    logger.debug('Executing getIssues', { owner, repo, options });
    
    try {
      const issues = await githubClient.getIssues(owner, repo, options);
      
      return {
        issues: issues.map(issue => ({
          number: issue.number,
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
        }))
      };
    } catch (error) {
      logger.error('Error in getIssues', { error: error.message, owner, repo });
      throw error;
    }
  }
};

/**
 * Get a specific issue from a GitHub repository
 */
const getIssue = {
  description: 'Get a specific issue from a GitHub repository',
  parameters: {
    owner: {
      type: 'string',
      description: 'Repository owner (user or organization)'
    },
    repo: {
      type: 'string',
      description: 'Repository name'
    },
    issueNumber: {
      type: 'number',
      description: 'Issue number'
    }
  },
  returns: {
    issue: {
      type: 'object',
      description: 'Issue details'
    }
  },
  async execute({ owner, repo, issueNumber }) {
    logger.debug('Executing getIssue', { owner, repo, issueNumber });
    
    try {
      const issue = await githubClient.getIssue(owner, repo, issueNumber);
      
      return {
        issue: {
          number: issue.number,
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
        }
      };
    } catch (error) {
      logger.error('Error in getIssue', { error: error.message, owner, repo, issueNumber });
      throw error;
    }
  }
};

/**
 * Create a new issue in a GitHub repository
 */
const createIssue = {
  description: 'Create a new issue in a GitHub repository',
  parameters: {
    owner: {
      type: 'string',
      description: 'Repository owner (user or organization)'
    },
    repo: {
      type: 'string',
      description: 'Repository name'
    },
    title: {
      type: 'string',
      description: 'Issue title'
    },
    body: {
      type: 'string',
      description: 'Issue body'
    },
    labels: {
      type: 'array',
      description: 'Array of label names',
      optional: true
    }
  },
  returns: {
    issue: {
      type: 'object',
      description: 'Created issue'
    }
  },
  async execute({ owner, repo, title, body, labels = [] }) {
    logger.debug('Executing createIssue', { owner, repo, title });
    
    try {
      const issue = await githubClient.createIssue(owner, repo, title, body, labels);
      
      return {
        issue: {
          number: issue.number,
          title: issue.title,
          state: issue.state,
          body: issue.body,
          url: issue.html_url
        }
      };
    } catch (error) {
      logger.error('Error in createIssue', { error: error.message, owner, repo, title });
      throw error;
    }
  }
};

/**
 * Comment on an issue in a GitHub repository
 */
const commentOnIssue = {
  description: 'Add a comment to an existing issue',
  parameters: {
    owner: {
      type: 'string',
      description: 'Repository owner (user or organization)'
    },
    repo: {
      type: 'string',
      description: 'Repository name'
    },
    issueNumber: {
      type: 'number',
      description: 'Issue number'
    },
    body: {
      type: 'string',
      description: 'Comment body'
    }
  },
  returns: {
    comment: {
      type: 'object',
      description: 'Created comment'
    }
  },
  async execute({ owner, repo, issueNumber, body }) {
    logger.debug('Executing commentOnIssue', { owner, repo, issueNumber });
    
    try {
      const comment = await githubClient.commentOnIssue(owner, repo, issueNumber, body);
      
      return {
        comment: {
          id: comment.id,
          body: comment.body,
          user: {
            login: comment.user.login,
            avatar_url: comment.user.avatar_url,
            url: comment.user.html_url
          },
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          url: comment.html_url
        }
      };
    } catch (error) {
      logger.error('Error in commentOnIssue', { error: error.message, owner, repo, issueNumber });
      throw error;
    }
  }
};

module.exports = {
  'getIssues': getIssues,
  'getIssue': getIssue,
  'createIssue': createIssue,
  'commentOnIssue': commentOnIssue
};

// Made with Bob
