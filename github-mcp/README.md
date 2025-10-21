# GitHub MCP Server

A Model Context Protocol (MCP) server that provides tools and resources for accessing GitHub repositories and issues.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Development](#development)

## Overview

The GitHub MCP Server provides the following capabilities:

- **Tools**:
  - `getRepositoryCode`: Get code from a GitHub repository
  - `searchCode`: Search for code in a GitHub repository
  - `getIssues`: Get issues from a GitHub repository
  - `getIssue`: Get a specific issue from a GitHub repository
  - `createIssue`: Create a new issue in a GitHub repository
  - `commentOnIssue`: Add a comment to an existing issue

- **Resources**:
  - `github://repository/{owner}/{repo}`: Access a GitHub repository
  - `github://repository/{owner}/{repo}/file/{path}`: Access a file in a GitHub repository
  - `github://repository/{owner}/{repo}/issues`: Access issues in a GitHub repository
  - `github://repository/{owner}/{repo}/issues/{number}`: Access a specific issue in a GitHub repository

## Installation

### Prerequisites

- Node.js 18 or later
- GitHub API token

### Installation Steps

1. Clone the repository:

```bash
git clone https://github.com/instana/mcp-context-forge.git
cd mcp-context-forge/instana-integration/impl/github-mcp
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on the `.env.example` file:

```bash
cp .env.example .env
```

4. Edit the `.env` file and set your GitHub API token:

```
GITHUB_API_TOKEN=your_github_api_token_here
```

## Configuration

The GitHub MCP Server can be configured using environment variables:

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Port to listen on | `3000` |
| `LOG_LEVEL` | Log level (debug, info, warn, error) | `info` |
| `GITHUB_API_TOKEN` | GitHub API token | - |
| `CACHE_TTL` | Cache time-to-live in seconds | `3600` |
| `RATE_LIMIT_WINDOW` | Rate limit window in milliseconds | `60000` |
| `RATE_LIMIT_MAX` | Maximum number of requests per window | `60` |

## Usage

### Starting the Server

```bash
npm start
```

### Using the Tools

The GitHub MCP Server exposes tools that can be called via the MCP Gateway. Here are some examples:

#### Get Repository Code

```json
{
  "tool": "getRepositoryCode",
  "input": {
    "owner": "instana",
    "repo": "mcp-context-forge",
    "path": "README.md"
  }
}
```

#### Search Code

```json
{
  "tool": "searchCode",
  "input": {
    "owner": "instana",
    "repo": "mcp-context-forge",
    "query": "function getRepositoryCode"
  }
}
```

#### Get Issues

```json
{
  "tool": "getIssues",
  "input": {
    "owner": "instana",
    "repo": "mcp-context-forge",
    "state": "open"
  }
}
```

#### Create Issue

```json
{
  "tool": "createIssue",
  "input": {
    "owner": "instana",
    "repo": "mcp-context-forge",
    "title": "Bug: Something is not working",
    "body": "## Description\n\nSomething is not working correctly.\n\n## Steps to Reproduce\n\n1. Step 1\n2. Step 2\n3. Step 3\n\n## Expected Behavior\n\nIt should work correctly.",
    "labels": ["bug", "help wanted"]
  }
}
```

### Using the Resources

The GitHub MCP Server exposes resources that can be accessed via the MCP Gateway. Here are some examples:

#### Access a Repository

```
github://repository/instana/mcp-context-forge
```

#### Access a File

```
github://repository/instana/mcp-context-forge/file/README.md
```

#### Access Issues

```
github://repository/instana/mcp-context-forge/issues
```

#### Access a Specific Issue

```
github://repository/instana/mcp-context-forge/issues/123
```

## API Reference

### MCP Protocol Endpoints

- `GET /tools`: List available tools
- `POST /tools/:toolName`: Call a tool
- `GET /resources`: List available resources
- `GET /resources/:uri`: Get a resource

### Health Check Endpoint

- `GET /health`: Health check endpoint

## Development

### Project Structure

```
github-mcp/
├── src/
│   ├── server.js                # Main server file
│   ├── github/
│   │   └── client.js            # GitHub API client
│   ├── tools/
│   │   ├── index.js             # Tool registry
│   │   ├── code-tool.js         # Code-related tools
│   │   └── issues-tool.js       # Issue-related tools
│   └── resources/
│       ├── index.js             # Resource registry
│       ├── repository.js        # Repository resource
│       └── issue.js             # Issue resource
├── .env.example                 # Example environment variables
├── package.json                 # Node.js package file
└── README.md                    # Documentation
```

### Running in Development Mode

```bash
npm run dev
```

This will start the server with nodemon, which will automatically restart the server when changes are detected.

### Testing

```bash
npm test
```

This will run the test suite using Jest.