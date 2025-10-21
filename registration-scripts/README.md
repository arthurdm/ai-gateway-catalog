# Registration Scripts

Scripts for registering Instana integration components with the MCP Gateway.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Development](#development)

## Overview

The registration scripts are used to register and unregister the following components with the MCP Gateway:

- **GitHub MCP Server**: A Model Context Protocol (MCP) server that provides tools and resources for accessing GitHub repositories and issues.
- **Owner AI Agent**: An AI Agent that uses the ReAct pattern to help users identify resource owners and determine the best way to contact them.

## Installation

### Prerequisites

- Node.js 18 or later
- MCP Gateway running and accessible

### Installation Steps

1. Clone the repository:

```bash
git clone https://github.com/instana/mcp-context-forge.git
cd mcp-context-forge/instana-integration/impl/registration-scripts
```

2. Install dependencies:

```bash
npm install
```

## Configuration

The registration scripts are configured using a JSON file (`config/default.json`). You can modify this file to match your environment:

```json
{
  "mcpGateway": {
    "url": "http://localhost:8000",
    "apiKey": "YOUR_API_KEY_HERE"
  },
  "githubServer": {
    "name": "github-mcp-server",
    "description": "MCP server for GitHub integration",
    "url": "http://localhost:3000",
    "type": "remote"
  },
  "ownerAgent": {
    "name": "owner-ai-agent",
    "description": "AI Agent for finding resource owners",
    "url": "http://localhost:3001",
    "type": "remote"
  },
  "logging": {
    "level": "info"
  }
}
```

## Usage

### Registering Components

To register the GitHub MCP server:

```bash
npm run register:github
```

To register the Owner AI Agent:

```bash
npm run register:owner
```

To register both components:

```bash
npm run register:all
```

### Unregistering Components

To unregister the GitHub MCP server:

```bash
npm run unregister:github
```

To unregister the Owner AI Agent:

```bash
npm run unregister:owner
```

To unregister both components:

```bash
npm run unregister:all
```

### Manual Registration

You can also use the scripts directly:

```bash
node src/index.js register github-server
node src/index.js register owner-agent
node src/index.js register all
node src/index.js unregister github-server
node src/index.js unregister owner-agent
node src/index.js unregister all
```

## Development

### Project Structure

```
registration-scripts/
├── src/
│   ├── index.js                 # Main entry point
│   ├── github-server.js         # GitHub MCP server registration
│   ├── owner-agent.js           # Owner AI Agent registration
│   └── utils/
│       ├── api.js               # API client for MCP Gateway
│       └── logger.js            # Logging utilities
├── config/
│   └── default.json             # Default configuration
├── package.json                 # Node.js package file
└── README.md                    # Documentation
```

### Adding New Components

To add a new component for registration:

1. Create a new file in `src/` for your component (e.g., `src/new-component.js`)
2. Implement the registration and unregistration functions
3. Add the component to the configuration file (`config/default.json`)
4. Update the main entry point (`src/index.js`) to handle the new component
5. Add new scripts to `package.json` for the new component