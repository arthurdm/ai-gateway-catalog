const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');
const moment = require('moment-timezone');

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

// Contact preferences data
let contacts = [];

/**
 * Initialize the contact tool
 */
async function initialize() {
  try {
    const dataDir = path.resolve(process.env.DATA_DIR || './data');
    const contactsFile = path.join(dataDir, 'contacts.json');
    
    try {
      const data = await fs.readFile(contactsFile, 'utf8');
      contacts = JSON.parse(data);
      logger.info(`Loaded ${contacts.length} contact records`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create example data if file doesn't exist
        contacts = [
          {
            "name": "Jane Smith",
            "email": "jane.smith@example.com",
            "timezone": "America/New_York",
            "preferences": [
              {
                "method": "slack",
                "contact": "@janesmith",
                "priority": 1,
                "hours": { "start": "09:00", "end": "17:00" },
                "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"]
              },
              {
                "method": "email",
                "contact": "jane.smith@example.com",
                "priority": 2,
                "hours": { "start": "00:00", "end": "23:59" },
                "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
              },
              {
                "method": "phone",
                "contact": "+1-555-123-4567",
                "priority": 3,
                "hours": { "start": "09:00", "end": "17:00" },
                "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"]
              }
            ],
            "emergencyContact": {
              "method": "phone",
              "contact": "+1-555-123-4567"
            },
            "doNotDisturb": {
              "hours": { "start": "22:00", "end": "07:00" },
              "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
            }
          },
          {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "timezone": "Europe/London",
            "preferences": [
              {
                "method": "email",
                "contact": "john.doe@example.com",
                "priority": 1,
                "hours": { "start": "00:00", "end": "23:59" },
                "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
              },
              {
                "method": "slack",
                "contact": "@johndoe",
                "priority": 2,
                "hours": { "start": "08:00", "end": "16:00" },
                "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"]
              },
              {
                "method": "phone",
                "contact": "+44-555-123-4567",
                "priority": 3,
                "hours": { "start": "09:00", "end": "16:00" },
                "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"]
              }
            ],
            "emergencyContact": {
              "method": "phone",
              "contact": "+44-555-123-4567"
            },
            "doNotDisturb": {
              "hours": { "start": "21:00", "end": "07:00" },
              "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
            }
          },
          {
            "name": "Bob Johnson",
            "email": "bob.johnson@example.com",
            "timezone": "America/Los_Angeles",
            "preferences": [
              {
                "method": "slack",
                "contact": "@bobjohnson",
                "priority": 1,
                "hours": { "start": "10:00", "end": "18:00" },
                "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"]
              },
              {
                "method": "email",
                "contact": "bob.johnson@example.com",
                "priority": 2,
                "hours": { "start": "00:00", "end": "23:59" },
                "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
              }
            ],
            "emergencyContact": {
              "method": "phone",
              "contact": "+1-555-987-6543"
            },
            "doNotDisturb": {
              "hours": { "start": "20:00", "end": "08:00" },
              "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
            }
          }
        ];
        
        // Write example data to file
        await fs.writeFile(contactsFile, JSON.stringify(contacts, null, 2));
        logger.info(`Created example contacts data with ${contacts.length} records`);
      } else {
        logger.error('Failed to load contacts data:', error);
        // Initialize with empty array if file not found
        contacts = [];
      }
    }
  } catch (error) {
    logger.error('Error initializing contact tool:', error);
    throw error;
  }
}

/**
 * Get a person's contact preferences
 */
const getContactPreferences = {
  description: 'Get a person\'s contact preferences',
  parameters: {
    personName: {
      type: 'string',
      description: 'Name of the person'
    }
  },
  returns: {
    preferences: {
      type: 'array',
      description: 'List of contact methods in order of preference'
    }
  },
  async execute({ personName }) {
    logger.debug(`Getting contact preferences for ${personName}`);
    
    // Find person's contact preferences
    const person = contacts.find(p => 
      p.name.toLowerCase().includes(personName.toLowerCase())
    );
    
    if (!person) {
      return {
        found: false,
        message: `No contact preferences found for ${personName}`
      };
    }
    
    return {
      found: true,
      preferences: person.preferences.map(p => ({
        method: p.method,
        contact: p.contact,
        priority: p.priority
      }))
    };
  }
};

/**
 * Recommend the best way to contact a person based on time and availability
 */
const recommendContactMethod = {
  description: 'Recommend the best way to contact a person based on time and availability',
  parameters: {
    personName: {
      type: 'string',
      description: 'Name of the person'
    },
    urgency: {
      type: 'string',
      description: 'Urgency level (low, medium, high)'
    }
  },
  returns: {
    method: {
      type: 'string',
      description: 'Recommended contact method'
    },
    contact: {
      type: 'string',
      description: 'Contact information'
    },
    reason: {
      type: 'string',
      description: 'Reason for the recommendation'
    }
  },
  async execute({ personName, urgency }) {
    logger.debug(`Recommending contact method for ${personName} with urgency ${urgency}`);
    
    // Find person's contact preferences
    const person = contacts.find(p => 
      p.name.toLowerCase().includes(personName.toLowerCase())
    );
    
    if (!person) {
      return {
        found: false,
        message: `No contact preferences found for ${personName}`
      };
    }
    
    // Get current time in person's timezone
    const now = moment().tz(person.timezone || 'UTC');
    const currentHour = now.format('HH:mm');
    const currentDay = now.format('dddd').toLowerCase();
    
    // Check if in do not disturb hours
    const inDoNotDisturb = person.doNotDisturb && 
      person.doNotDisturb.daysOfWeek.includes(currentDay) &&
      currentHour >= person.doNotDisturb.hours.start &&
      currentHour <= person.doNotDisturb.hours.end;
    
    // If high urgency, use emergency contact
    if (urgency === 'high') {
      if (person.emergencyContact) {
        return {
          found: true,
          method: person.emergencyContact.method,
          contact: person.emergencyContact.contact,
          reason: 'High urgency requires immediate attention'
        };
      }
    }
    
    // If in do not disturb and not high urgency, use email
    if (inDoNotDisturb && urgency !== 'high') {
      const emailPref = person.preferences.find(p => p.method === 'email');
      if (emailPref) {
        return {
          found: true,
          method: 'email',
          contact: emailPref.contact,
          reason: 'Person is in do not disturb hours, email is recommended'
        };
      }
    }
    
    // Find available contact methods based on current time and day
    const availableMethods = person.preferences.filter(p => 
      p.daysOfWeek.includes(currentDay) &&
      currentHour >= p.hours.start &&
      currentHour <= p.hours.end
    );
    
    if (availableMethods.length === 0) {
      // If no available methods, use email as fallback
      const emailPref = person.preferences.find(p => p.method === 'email');
      if (emailPref) {
        return {
          found: true,
          method: 'email',
          contact: emailPref.contact,
          reason: 'No contact methods available at this time, email is recommended as fallback'
        };
      }
      
      // If no email, use first preference
      return {
        found: true,
        method: person.preferences[0].method,
        contact: person.preferences[0].contact,
        reason: 'No contact methods available at this time, using default preference'
      };
    }
    
    // Sort by priority
    availableMethods.sort((a, b) => a.priority - b.priority);
    
    // Return highest priority method
    return {
      found: true,
      method: availableMethods[0].method,
      contact: availableMethods[0].contact,
      reason: `${availableMethods[0].method} is the preferred contact method at this time`
    };
  }
};

/**
 * Send a notification to a person using their preferred contact method
 */
const notifyPerson = {
  description: 'Send a notification to a person using their preferred contact method',
  parameters: {
    personName: {
      type: 'string',
      description: 'Name of the person'
    },
    message: {
      type: 'string',
      description: 'Message to send'
    },
    urgency: {
      type: 'string',
      description: 'Urgency level (low, medium, high)'
    }
  },
  returns: {
    success: {
      type: 'boolean',
      description: 'Whether the notification was sent successfully'
    },
    method: {
      type: 'string',
      description: 'Contact method used'
    },
    timestamp: {
      type: 'string',
      description: 'Time the notification was sent'
    }
  },
  async execute({ personName, message, urgency }) {
    logger.debug(`Sending notification to ${personName} with urgency ${urgency}`);
    
    // First, get recommended contact method
    const recommendation = await recommendContactMethod.execute({ personName, urgency });
    
    if (!recommendation.found) {
      return {
        success: false,
        message: recommendation.message
      };
    }
    
    // In a real implementation, this would integrate with notification services
    // For now, we'll just log the notification
    logger.info(`Notification sent to ${personName} via ${recommendation.method} (${recommendation.contact}): ${message}`);
    
    return {
      success: true,
      method: recommendation.method,
      contact: recommendation.contact,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  initialize,
  'getContactPreferences': getContactPreferences,
  'recommendContactMethod': recommendContactMethod,
  'notifyPerson': notifyPerson
};

// Made with Bob
