const repositoryResource = require('./repository');
const issueResource = require('./issue');

// Combine all resources
const allResources = {
  ...repositoryResource,
  ...issueResource
};

/**
 * Parse a resource URI to extract components
 */
function parseResourceUri(uri) {
  // Repository resource: github://repository/{owner}/{repo}
  const repoMatch = uri.match(/^github:\/\/repository\/([^\/]+)\/([^\/]+)$/);
  if (repoMatch) {
    return {
      type: 'repository',
      owner: repoMatch[1],
      repo: repoMatch[2]
    };
  }
  
  // File resource: github://repository/{owner}/{repo}/file/{path}
  const fileMatch = uri.match(/^github:\/\/repository\/([^\/]+)\/([^\/]+)\/file\/(.+)$/);
  if (fileMatch) {
    return {
      type: 'file',
      owner: fileMatch[1],
      repo: fileMatch[2],
      path: fileMatch[3]
    };
  }
  
  // Issues resource: github://repository/{owner}/{repo}/issues
  const issuesMatch = uri.match(/^github:\/\/repository\/([^\/]+)\/([^\/]+)\/issues$/);
  if (issuesMatch) {
    return {
      type: 'issues',
      owner: issuesMatch[1],
      repo: issuesMatch[2]
    };
  }
  
  // Issue resource: github://repository/{owner}/{repo}/issues/{number}
  const issueMatch = uri.match(/^github:\/\/repository\/([^\/]+)\/([^\/]+)\/issues\/(\d+)$/);
  if (issueMatch) {
    return {
      type: 'issue',
      owner: issueMatch[1],
      repo: issueMatch[2],
      number: parseInt(issueMatch[3])
    };
  }
  
  return null;
}

/**
 * Get a list of all available resources with their metadata
 */
function listResources() {
  return [
    {
      uriPattern: 'github://repository/{owner}/{repo}',
      description: 'Access a GitHub repository',
      parameters: {
        owner: 'Repository owner (user or organization)',
        repo: 'Repository name'
      }
    },
    {
      uriPattern: 'github://repository/{owner}/{repo}/file/{path}',
      description: 'Access a file in a GitHub repository',
      parameters: {
        owner: 'Repository owner (user or organization)',
        repo: 'Repository name',
        path: 'File path within the repository'
      }
    },
    {
      uriPattern: 'github://repository/{owner}/{repo}/issues',
      description: 'Access issues in a GitHub repository',
      parameters: {
        owner: 'Repository owner (user or organization)',
        repo: 'Repository name'
      }
    },
    {
      uriPattern: 'github://repository/{owner}/{repo}/issues/{number}',
      description: 'Access a specific issue in a GitHub repository',
      parameters: {
        owner: 'Repository owner (user or organization)',
        repo: 'Repository name',
        number: 'Issue number'
      }
    }
  ];
}

/**
 * Get a resource handler for a specific URI
 */
function getResource(uri) {
  const parsedUri = parseResourceUri(uri);
  
  if (!parsedUri) {
    return null;
  }
  
  switch (parsedUri.type) {
    case 'repository':
    case 'file':
      return repositoryResource[parsedUri.type];
    case 'issues':
    case 'issue':
      return issueResource[parsedUri.type];
    default:
      return null;
  }
}

module.exports = {
  listResources,
  getResource,
  parseResourceUri
};

// Made with Bob
