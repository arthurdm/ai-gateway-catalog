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

// Schedules and availability data
let schedules = [];

/**
 * Initialize the availability tool
 */
async function initialize() {
  try {
    const dataDir = path.resolve(process.env.DATA_DIR || './data');
    const schedulesFile = path.join(dataDir, 'schedules.json');
    
    try {
      const data = await fs.readFile(schedulesFile, 'utf8');
      schedules = JSON.parse(data);
      logger.info(`Loaded ${schedules.length} schedule records`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create example data if file doesn't exist
        schedules = [
          {
            "name": "Jane Smith",
            "email": "jane.smith@example.com",
            "timezone": "America/New_York",
            "team": "Infrastructure",
            "workHours": {
              "monday": { "start": "09:00", "end": "17:00" },
              "tuesday": { "start": "09:00", "end": "17:00" },
              "wednesday": { "start": "09:00", "end": "17:00" },
              "thursday": { "start": "09:00", "end": "17:00" },
              "friday": { "start": "09:00", "end": "17:00" }
            },
            "vacations": [
              {
                "startDate": "2023-12-24",
                "endDate": "2024-01-02",
                "note": "Winter holiday"
              }
            ],
            "sickLeave": null,
            "contact": {
              "slack": "@janesmith",
              "email": "jane.smith@example.com",
              "phone": "+1-555-123-4567"
            }
          },
          {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "timezone": "Europe/London",
            "team": "Infrastructure",
            "workHours": {
              "monday": { "start": "08:00", "end": "16:00" },
              "tuesday": { "start": "08:00", "end": "16:00" },
              "wednesday": { "start": "08:00", "end": "16:00" },
              "thursday": { "start": "08:00", "end": "16:00" },
              "friday": { "start": "08:00", "end": "16:00" }
            },
            "vacations": [],
            "sickLeave": null,
            "contact": {
              "slack": "@johndoe",
              "email": "john.doe@example.com",
              "phone": "+44-555-123-4567"
            }
          },
          {
            "name": "Bob Johnson",
            "email": "bob.johnson@example.com",
            "timezone": "America/Los_Angeles",
            "team": "Development",
            "workHours": {
              "monday": { "start": "10:00", "end": "18:00" },
              "tuesday": { "start": "10:00", "end": "18:00" },
              "wednesday": { "start": "10:00", "end": "18:00" },
              "thursday": { "start": "10:00", "end": "18:00" },
              "friday": { "start": "10:00", "end": "18:00" }
            },
            "vacations": [],
            "sickLeave": null,
            "contact": {
              "slack": "@bobjohnson",
              "email": "bob.johnson@example.com",
              "phone": "+1-555-987-6543"
            }
          }
        ];
        
        // Write example data to file
        await fs.writeFile(schedulesFile, JSON.stringify(schedules, null, 2));
        logger.info(`Created example schedules data with ${schedules.length} records`);
      } else {
        logger.error('Failed to load schedules data:', error);
        // Initialize with empty array if file not found
        schedules = [];
      }
    }
  } catch (error) {
    logger.error('Error initializing availability tool:', error);
    throw error;
  }
}

/**
 * Check if a person is on duty
 */
const checkOnDutyStatus = {
  description: 'Check if a person is currently on duty',
  parameters: {
    personName: {
      type: 'string',
      description: 'Name of the person to check'
    }
  },
  returns: {
    onDuty: {
      type: 'boolean',
      description: 'Whether the person is currently on duty'
    },
    status: {
      type: 'string',
      description: 'Current status (available, vacation, sick, etc.)'
    }
  },
  async execute({ personName }) {
    logger.debug(`Checking on-duty status for ${personName}`);
    
    // Find person's schedule
    const person = schedules.find(p => 
      p.name.toLowerCase().includes(personName.toLowerCase())
    );
    
    if (!person) {
      return {
        found: false,
        message: `No schedule information found for ${personName}`
      };
    }
    
    // Check current status
    const now = moment();
    
    // Check if on vacation
    const onVacation = person.vacations?.some(vacation => {
      const startDate = moment(vacation.startDate);
      const endDate = moment(vacation.endDate);
      return now.isBetween(startDate, endDate, null, '[]');
    });
    
    if (onVacation) {
      const currentVacation = person.vacations.find(vacation => {
        const startDate = moment(vacation.startDate);
        const endDate = moment(vacation.endDate);
        return now.isBetween(startDate, endDate, null, '[]');
      });
      
      return {
        found: true,
        onDuty: false,
        status: 'vacation',
        details: {
          returnDate: currentVacation.endDate,
          note: currentVacation.note || 'On vacation'
        }
      };
    }
    
    // Check if sick
    if (person.sickLeave && moment(person.sickLeave.startDate).isSameOrBefore(now) && 
        (!person.sickLeave.endDate || moment(person.sickLeave.endDate).isSameOrAfter(now))) {
      return {
        found: true,
        onDuty: false,
        status: 'sick',
        details: {
          returnDate: person.sickLeave.endDate || 'unknown',
          note: person.sickLeave.note || 'On sick leave'
        }
      };
    }
    
    // Check work hours
    const currentDay = now.format('dddd').toLowerCase();
    const workHours = person.workHours?.[currentDay];
    
    if (!workHours) {
      return {
        found: true,
        onDuty: false,
        status: 'off',
        details: {
          note: `Not scheduled to work on ${now.format('dddd')}`
        }
      };
    }
    
    const currentTime = now.format('HH:mm');
    const startTime = workHours.start;
    const endTime = workHours.end;
    
    const isWorkingHours = currentTime >= startTime && currentTime <= endTime;
    
    return {
      found: true,
      onDuty: isWorkingHours,
      status: isWorkingHours ? 'available' : 'off',
      details: {
        timezone: person.timezone,
        workHours: {
          start: startTime,
          end: endTime
        },
        currentLocalTime: moment().tz(person.timezone).format('HH:mm')
      }
    };
  }
};

/**
 * Get on-call rotation
 */
const getOnCallRotation = {
  description: 'Get the current on-call rotation for a team',
  parameters: {
    teamName: {
      type: 'string',
      description: 'Name of the team'
    }
  },
  returns: {
    onCall: {
      type: 'object',
      description: 'Person currently on call'
    }
  },
  async execute({ teamName }) {
    logger.debug(`Getting on-call rotation for team ${teamName}`);
    
    // Find team members
    const teamMembers = schedules.filter(p => 
      p.team && p.team.toLowerCase().includes(teamName.toLowerCase())
    );
    
    if (teamMembers.length === 0) {
      return {
        found: false,
        message: `No team members found for team: ${teamName}`
      };
    }
    
    // Find current on-call person
    const now = moment();
    const currentWeek = now.week();
    
    // Simple rotation based on week number
    const onCallIndex = currentWeek % teamMembers.length;
    const onCallPerson = teamMembers[onCallIndex];
    
    // Check if on-call person is available
    const onDutyCheck = await checkOnDutyStatus.execute({ personName: onCallPerson.name });
    
    // If primary on-call is not available, find backup
    if (!onDutyCheck.onDuty) {
      // Find first available backup
      for (const member of teamMembers) {
        if (member.name !== onCallPerson.name) {
          const backupCheck = await checkOnDutyStatus.execute({ personName: member.name });
          if (backupCheck.onDuty) {
            return {
              found: true,
              onCall: {
                primary: {
                  name: onCallPerson.name,
                  available: false,
                  status: onDutyCheck.status,
                  note: onDutyCheck.details?.note
                },
                backup: {
                  name: member.name,
                  available: true,
                  contact: member.contact
                }
              }
            };
          }
        }
      }
    }
    
    return {
      found: true,
      onCall: {
        primary: {
          name: onCallPerson.name,
          available: onDutyCheck.onDuty,
          status: onDutyCheck.status,
          contact: onCallPerson.contact
        }
      }
    };
  }
};

module.exports = {
  initialize,
  'checkOnDutyStatus': checkOnDutyStatus,
  'getOnCallRotation': getOnCallRotation
};

// Made with Bob
