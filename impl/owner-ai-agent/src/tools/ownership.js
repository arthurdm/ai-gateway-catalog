const fs = require('fs').promises;
const path = require('path');
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

// Resource ownership data
let resourceOwnership = [];

/**
 * Initialize the ownership tool
 */
async function initialize() {
  try {
    const dataDir = path.resolve(process.env.DATA_DIR || './data');
    const resourcesFile = path.join(dataDir, 'resources.json');
    
    try {
      const data = await fs.readFile(resourcesFile, 'utf8');
      resourceOwnership = JSON.parse(data);
      logger.info(`Loaded ${resourceOwnership.length} resource ownership records`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create example data if file doesn't exist
        resourceOwnership = [
          {
            "type": "database",
            "name": "DB001",
            "description": "Main production database",
            "owner": {
              "name": "Jane Smith",
              "email": "jane.smith@example.com",
              "role": "Database Administrator"
            },
            "team": "Infrastructure",
            "backupOwners": [
              {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "role": "Senior Database Administrator"
              }
            ]
          },
          {
            "type": "server",
            "name": "SRV001",
            "description": "Main web server",
            "owner": {
              "name": "John Doe",
              "email": "john.doe@example.com",
              "role": "System Administrator"
            },
            "team": "Infrastructure",
            "backupOwners": [
              {
                "name": "Jane Smith",
                "email": "jane.smith@example.com",
                "role": "Database Administrator"
              }
            ]
          },
          {
            "type": "application",
            "name": "APP001",
            "description": "Customer portal",
            "owner": {
              "name": "Bob Johnson",
              "email": "bob.johnson@example.com",
              "role": "Application Developer"
            },
            "team": "Development",
            "backupOwners": [
              {
                "name": "Alice Williams",
                "email": "alice.williams@example.com",
                "role": "Senior Developer"
              }
            ]
          }
        ];
        
        // Write example data to file
        await fs.writeFile(resourcesFile, JSON.stringify(resourceOwnership, null, 2));
        logger.info(`Created example resource ownership data with ${resourceOwnership.length} records`);
      } else {
        logger.error('Failed to load resource ownership data:', error);
        // Initialize with empty array if file not found
        resourceOwnership = [];
      }
    }
  } catch (error) {
    logger.error('Error initializing ownership tool:', error);
    throw error;
  }
}

/**
 * Find the owner of a resource
 */
const findResourceOwner = {
  description: 'Find the owner of a specific resource',
  parameters: {
    resourceType: {
      type: 'string',
      description: 'Type of resource (e.g., database, server, application)'
    },
    resourceName: {
      type: 'string',
      description: 'Name of the resource'
    }
  },
  returns: {
    owner: {
      type: 'object',
      description: 'Resource owner information'
    },
    team: {
      type: 'string',
      description: 'Team responsible for the resource'
    }
  },
  async execute({ resourceType, resourceName }) {
    logger.debug(`Looking up owner for ${resourceType}: ${resourceName}`);
    
    // Find exact match
    let resource = resourceOwnership.find(r => 
      r.type.toLowerCase() === resourceType.toLowerCase() && 
      r.name.toLowerCase() === resourceName.toLowerCase()
    );
    
    // If no exact match, try partial match
    if (!resource) {
      resource = resourceOwnership.find(r => 
        r.type.toLowerCase() === resourceType.toLowerCase() && 
        resourceName.toLowerCase().includes(r.name.toLowerCase())
      );
    }
    
    if (!resource) {
      return {
        found: false,
        message: `No ownership information found for ${resourceType}: ${resourceName}`
      };
    }
    
    return {
      found: true,
      owner: {
        name: resource.owner.name,
        email: resource.owner.email,
        role: resource.owner.role
      },
      team: resource.team,
      backupOwners: resource.backupOwners || []
    };
  }
};

/**
 * List resources owned by a person
 */
const listOwnedResources = {
  description: 'List resources owned by a specific person',
  parameters: {
    ownerName: {
      type: 'string',
      description: 'Name of the owner'
    }
  },
  returns: {
    resources: {
      type: 'array',
      description: 'List of resources owned by the person'
    }
  },
  async execute({ ownerName }) {
    logger.debug(`Looking up resources owned by ${ownerName}`);
    
    const ownedResources = resourceOwnership.filter(r => 
      r.owner.name.toLowerCase().includes(ownerName.toLowerCase())
    );
    
    if (ownedResources.length === 0) {
      return {
        found: false,
        message: `No resources found for owner: ${ownerName}`
      };
    }
    
    return {
      found: true,
      resources: ownedResources.map(r => ({
        type: r.type,
        name: r.name,
        description: r.description,
        team: r.team
      }))
    };
  }
};

/**
 * Find resources by team
 */
const findTeamResources = {
  description: 'Find resources owned by a specific team',
  parameters: {
    teamName: {
      type: 'string',
      description: 'Name of the team'
    }
  },
  returns: {
    resources: {
      type: 'array',
      description: 'List of resources owned by the team'
    }
  },
  async execute({ teamName }) {
    logger.debug(`Looking up resources owned by team ${teamName}`);
    
    const teamResources = resourceOwnership.filter(r => 
      r.team.toLowerCase().includes(teamName.toLowerCase())
    );
    
    if (teamResources.length === 0) {
      return {
        found: false,
        message: `No resources found for team: ${teamName}`
      };
    }
    
    return {
      found: true,
      resources: teamResources.map(r => ({
        type: r.type,
        name: r.name,
        description: r.description,
        owner: {
          name: r.owner.name,
          role: r.owner.role
        }
      }))
    };
  }
};

module.exports = {
  initialize,
  'findResourceOwner': findResourceOwner,
  'listOwnedResources': listOwnedResources,
  'findTeamResources': findTeamResources
};

// Made with Bob
