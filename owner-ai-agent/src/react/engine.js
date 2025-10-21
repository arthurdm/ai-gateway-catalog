const winston = require('winston');
const { OpenAI } = require('openai');
const prompts = require('./prompts');
const tools = require('../tools');

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

// Initialize OpenAI client
let openai;

/**
 * Initialize the ReAct engine
 */
async function initialize() {
  logger.info('Initializing ReAct engine');
  
  // Validate configuration
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  // Initialize OpenAI client
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  logger.info('ReAct engine initialized');
}

/**
 * Process a query using the ReAct pattern
 */
async function process(query, conversation) {
  const maxIterations = parseInt(process.env.MAX_ITERATIONS || '10');
  const availableTools = tools.listTools();
  
  // Build system prompt
  const systemPrompt = prompts.getSystemPrompt(availableTools);
  
  // Build conversation history
  const messages = [
    { role: 'system', content: systemPrompt }
  ];
  
  // Add conversation history (limited to last 10 messages)
  const history = conversation.messages.slice(-10);
  for (const msg of history) {
    messages.push({
      role: msg.role === 'agent' ? 'assistant' : msg.role,
      content: msg.content
    });
  }
  
  // Start ReAct loop
  let iterations = 0;
  let finalResponse = null;
  let thinking = [];
  
  while (iterations < maxIterations) {
    iterations++;
    logger.debug(`ReAct iteration ${iterations}`);
    
    // Get LLM response
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages,
      temperature: parseFloat(process.env.TEMPERATURE || '0.2'),
      max_tokens: parseInt(process.env.MAX_RESPONSE_TOKENS || '1000')
    });
    
    const response = completion.choices[0].message.content;
    
    // Parse response to extract thought, action, and observation
    const { thought, action, actionInput, finalAnswer } = parseResponse(response);
    
    // Record thinking
    thinking.push({ thought, action, actionInput });
    
    // If final answer is provided, we're done
    if (finalAnswer) {
      finalResponse = finalAnswer;
      break;
    }
    
    // Execute tool if action is provided
    if (action && actionInput) {
      const observation = await executeAction(action, actionInput);
      thinking[thinking.length - 1].observation = observation;
      
      // Add observation to messages
      messages.push({
        role: 'assistant',
        content: response
      });
      
      messages.push({
        role: 'user',
        content: `Observation: ${observation}`
      });
    } else {
      // No action, treat as final response
      finalResponse = response;
      break;
    }
  }
  
  // If we reached max iterations without a final answer, use the last response
  if (!finalResponse) {
    finalResponse = "I'm sorry, I wasn't able to find a complete answer within the allowed number of steps.";
  }
  
  return {
    response: finalResponse,
    thinking
  };
}

/**
 * Parse LLM response to extract thought, action, and observation
 */
function parseResponse(response) {
  const result = {
    thought: null,
    action: null,
    actionInput: null,
    finalAnswer: null
  };
  
  // Extract thought
  const thoughtMatch = response.match(/Thought: (.*?)(?=\n\nAction:|$)/s);
  if (thoughtMatch) {
    result.thought = thoughtMatch[1].trim();
  }
  
  // Extract action and action input
  const actionMatch = response.match(/Action: (.*?)(?=\n\nAction Input:|$)/s);
  const actionInputMatch = response.match(/Action Input: (.*?)(?=\n\nFinal Answer:|$)/s);
  
  if (actionMatch) {
    result.action = actionMatch[1].trim();
  }
  
  if (actionInputMatch) {
    try {
      result.actionInput = JSON.parse(actionInputMatch[1].trim());
    } catch (e) {
      // If not valid JSON, use as string
      result.actionInput = actionInputMatch[1].trim();
    }
  }
  
  // Extract final answer
  const finalAnswerMatch = response.match(/Final Answer: (.*)/s);
  if (finalAnswerMatch) {
    result.finalAnswer = finalAnswerMatch[1].trim();
  }
  
  return result;
}

/**
 * Execute a tool action
 */
async function executeAction(action, actionInput) {
  try {
    const tool = tools.getTool(action);
    if (!tool) {
      return `Error: Tool '${action}' not found`;
    }
    
    const result = await tool.execute(actionInput);
    return JSON.stringify(result);
  } catch (error) {
    logger.error(`Error executing action ${action}:`, error);
    return `Error: ${error.message}`;
  }
}

module.exports = {
  initialize,
  process
};

// Made with Bob
