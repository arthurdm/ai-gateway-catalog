const { Octokit } = require('octokit');
const { LRUCache } = require('lru-cache');
const winston = require('winston');

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

class GitHubClient {
  constructor() {
    // Initialize Octokit with GitHub token
    this.octokit = new Octokit({
      auth: process.env.GITHUB_API_TOKEN
    });
    
    // Initialize cache
    this.cache = new LRUCache({
      max: 500, // Maximum number of items in cache
      ttl: parseInt(process.env.CACHE_TTL || '3600') * 1000, // Time to live in milliseconds
      allowStale: false,
      updateAgeOnGet: true,
      updateAgeOnHas: false
    });
    
    // Initialize rate limiting
    this.rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW || '60000'); // 1 minute in milliseconds
    this.rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '60'); // 60 requests per minute
    this.requestCount = 0;
    this.requestTimestamps = [];
    
    logger.info('GitHub client initialized');
  }
  
  /**
   * Check if we're within rate limits
   */
  _checkRateLimit() {
    const now = Date.now();
    
    // Remove timestamps older than the window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.rateLimitWindow
    );
    
    // Check if we've reached the limit
    if (this.requestTimestamps.length >= this.rateLimitMax) {
      const oldestTimestamp = this.requestTimestamps[0];
      const resetTime = oldestTimestamp + this.rateLimitWindow;
      const waitTime = resetTime - now;
      
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    
    // Add current timestamp
    this.requestTimestamps.push(now);
  }
  
  /**
   * Get repository contents
   */
  async getRepositoryContents(owner, repo, path = '') {
    const cacheKey = `contents:${owner}/${repo}/${path}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      logger.debug('Cache hit for repository contents', { owner, repo, path });
      return this.cache.get(cacheKey);
    }
    
    // Check rate limit
    this._checkRateLimit();
    
    try {
      logger.debug('Fetching repository contents', { owner, repo, path });
      
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path
      });
      
      // Cache response
      this.cache.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      logger.error('Error fetching repository contents', { error: error.message, owner, repo, path });
      throw error;
    }
  }
  
  /**
   * Get file content
   */
  async getFileContent(owner, repo, path) {
    const contents = await this.getRepositoryContents(owner, repo, path);
    
    if (Array.isArray(contents)) {
      throw new Error(`Path '${path}' is a directory, not a file`);
    }
    
    if (contents.type !== 'file') {
      throw new Error(`Path '${path}' is not a file`);
    }
    
    // Decode content from base64
    const content = Buffer.from(contents.content, 'base64').toString('utf8');
    
    return {
      content,
      sha: contents.sha,
      size: contents.size,
      name: contents.name,
      path: contents.path,
      url: contents.html_url
    };
  }
  
  /**
   * Search code in repository
   */
  async searchCode(owner, repo, query) {
    const cacheKey = `search:${owner}/${repo}:${query}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      logger.debug('Cache hit for code search', { owner, repo, query });
      return this.cache.get(cacheKey);
    }
    
    // Check rate limit
    this._checkRateLimit();
    
    try {
      logger.debug('Searching code', { owner, repo, query });
      
      const response = await this.octokit.rest.search.code({
        q: `repo:${owner}/${repo} ${query}`
      });
      
      // Cache response
      this.cache.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      logger.error('Error searching code', { error: error.message, owner, repo, query });
      throw error;
    }
  }
  
  /**
   * Get repository issues
   */
  async getIssues(owner, repo, options = {}) {
    const cacheKey = `issues:${owner}/${repo}:${JSON.stringify(options)}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      logger.debug('Cache hit for repository issues', { owner, repo, options });
      return this.cache.get(cacheKey);
    }
    
    // Check rate limit
    this._checkRateLimit();
    
    try {
      logger.debug('Fetching repository issues', { owner, repo, options });
      
      const response = await this.octokit.rest.issues.listForRepo({
        owner,
        repo,
        ...options
      });
      
      // Cache response
      this.cache.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      logger.error('Error fetching repository issues', { error: error.message, owner, repo, options });
      throw error;
    }
  }
  
  /**
   * Get a specific issue
   */
  async getIssue(owner, repo, issueNumber) {
    const cacheKey = `issue:${owner}/${repo}:${issueNumber}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      logger.debug('Cache hit for issue', { owner, repo, issueNumber });
      return this.cache.get(cacheKey);
    }
    
    // Check rate limit
    this._checkRateLimit();
    
    try {
      logger.debug('Fetching issue', { owner, repo, issueNumber });
      
      const response = await this.octokit.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber
      });
      
      // Cache response
      this.cache.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      logger.error('Error fetching issue', { error: error.message, owner, repo, issueNumber });
      throw error;
    }
  }
  
  /**
   * Create an issue
   */
  async createIssue(owner, repo, title, body, labels = []) {
    // Check rate limit
    this._checkRateLimit();
    
    try {
      logger.debug('Creating issue', { owner, repo, title });
      
      const response = await this.octokit.rest.issues.create({
        owner,
        repo,
        title,
        body,
        labels
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error creating issue', { error: error.message, owner, repo, title });
      throw error;
    }
  }
  
  /**
   * Comment on an issue
   */
  async commentOnIssue(owner, repo, issueNumber, body) {
    // Check rate limit
    this._checkRateLimit();
    
    try {
      logger.debug('Commenting on issue', { owner, repo, issueNumber });
      
      const response = await this.octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error commenting on issue', { error: error.message, owner, repo, issueNumber });
      throw error;
    }
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Cache cleared');
  }
}

module.exports = new GitHubClient();

// Made with Bob
