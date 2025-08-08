# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server for Tableau that provides AI tools for integrating with Tableau Server and Tableau Cloud. The project exposes tools for querying data sources, accessing metadata, and working with Tableau Pulse metrics through various Tableau APIs (REST, Metadata, VizQL Data Service, and Pulse).

## Development Commands

### Build and Development
- `npm run build` - Build the project using esbuild 
- `npm run build:watch` - Build in watch mode for development
- `npm run start:http` - Start HTTP server using the built project
- `npm run start:http:docker` - Start HTTP server in Docker container

### Testing
- `npm test` - Run tests using Vitest
- `npm run coverage` - Run test coverage analysis

### Linting
- `npm run lint` - Run ESLint for code quality checks

### Debugging and Inspection
- `npm run inspect` - Start MCP Inspector with stdio transport
- `npm run inspect:http` - Start MCP Inspector with HTTP transport
- `npm run inspect:docker` - Start MCP Inspector with Docker container
- `npm run build:inspect` - Build then run inspector (useful for testing changes)

### Docker Operations
- `npm run build:docker` - Build Docker image
- `docker run -p 3927:3927 -i --rm --env-file env.list tableau-mcp` - Run container with environment file

### Claude Desktop Extension
- `npm run build:dxt` - Build a Claude Desktop Extension (.dxt) file for easy distribution

## Architecture

### Core Components

**Transport Layer** (`src/transports.ts`):
- Supports both `stdio` and `http` transports via MCP protocol
- HTTP mode runs on Express server with configurable CORS

**Server** (`src/server.ts`):
- Main MCP server class extending `McpServer`
- Dynamically registers tools based on `INCLUDE_TOOLS`/`EXCLUDE_TOOLS` config
- Handles logging level configuration

**Configuration** (`src/config.ts`):
- Environment-based configuration system
- Required: `SERVER`, `PAT_NAME`, `PAT_VALUE`, `SITE_NAME`
- Optional transport, logging, tool filtering, and validation settings

### Tableau SDK Integration

**REST API Client** (`src/sdks/tableau/restApi.ts`):
- Unified interface for all Tableau APIs using Zodios for type-safe HTTP requests
- Uses Personal Access Token (PAT) authentication
- API version 3.24 for REST operations
- Separate endpoints for Metadata API and VizQL Data Service

**Authentication** (`src/sdks/tableau/authConfig.ts`):
- PAT-based authentication with site name support
- Automatic credential management and session handling

### Tool Architecture

**Tool Factory Pattern** (`src/tools/tools.ts`):
- Each tool is implemented as a factory function returning a `Tool<T>` interface
- Tools are registered dynamically based on configuration
- Standard structure: input schema, callback function, and metadata

**Available Tools** (`src/tools/toolName.ts`):
- `list-datasources` - List published data sources
- `list-fields` - Get field metadata for data sources
- `list-fields-fixed` - Get field metadata for a pre-configured data source (uses FIXED_DATASOURCE_LUID)
- `query-datasource` - Execute VizQL queries against data sources
- `query-datasource-fixed` - Execute VizQL queries against a pre-configured data source (uses FIXED_DATASOURCE_LUID)
- `read-metadata` - Retrieve data source metadata
- `read-metadata-fixed` - Retrieve basic metadata for a pre-configured data source (uses FIXED_DATASOURCE_LUID)
- Pulse API tools for metrics, definitions, and subscriptions

### Key Implementation Patterns

**Validation System** (`src/tools/queryDatasource/validators/`):
- Field validation against data source schemas
- Filter value validation (can be disabled via `DISABLE_QUERY_DATASOURCE_FILTER_VALIDATION`)
- Type-safe request validation using Zod schemas

**Error Handling** (`src/utils/getExceptionMessage.ts`):
- Consistent error message extraction across the codebase
- Proper error propagation in async operations

**Logging** (`src/logging/`):
- Configurable log levels with secret masking for security
- Structured logging compatible with MCP protocol

## Environment Configuration

Create `.env` file or use environment variables:

**Required:**
```
SERVER=https://your-tableau-server.com
SITE_NAME=your-site-name  
PAT_NAME=your-pat-name
PAT_VALUE=your-pat-value
```

**Optional:**
```
TRANSPORT=stdio|http
DEFAULT_LOG_LEVEL=debug|info|warn|error
INCLUDE_TOOLS=tool1,tool2  # Whitelist specific tools
EXCLUDE_TOOLS=tool1,tool2  # Blacklist specific tools  
MAX_RESULT_LIMIT=1000      # Limit array results
DISABLE_QUERY_DATASOURCE_FILTER_VALIDATION=true  # Skip filter validation
FIXED_DATASOURCE_LUID=your-datasource-luid  # For fixed datasource tools like list-fields-fixed
```

For Docker: use `env.list` file with same variables.

## Testing Strategy

- Unit tests for all tools and utilities using Vitest
- Test files follow `*.test.ts` naming convention
- Tests cover validation logic, API integration, and error scenarios
- Mock Tableau API responses for consistent testing

## Development Notes

- TypeScript with ES modules
- esbuild for fast compilation and bundling
- External packages bundled separately for MCP compatibility
- Node.js 20+ required for development and runtime


Project Goals
- Primary Objective: Develop new MCP for Tableau MCP Server

Key Deliverables:
- Develop new MCP tools in the same language and style as shown in src/tools 
- Tools should be tested, have a clear purpose and be well explained

Quality Targets:
- Test all functionality, documenting the tests, before submitting the task as complete.  

Claude’s Expected Behavior
- Act as an Expert Co-Developer: Provide actionable, precise solutions and code. Collaborate by proactively suggesting improvements, catching errors, and raising clarifying questions when requirements are ambiguous.
- Follow Project-Specific Conventions: Always adhere to the coding standards, naming conventions, and workflow rules outlined elsewhere in CLAUDE.md.
- Prioritize Security & Reliability: Flag insecure practices, avoid shortcuts that risk reliability, and warn before making major architectural suggestions.
- Communicate Clearly: Use concise language—no unnecessary explanations. Respond with relevant code snippets, direct answers, or step-by-step guidance as appropriate.
- Document Everything: When proposing code or workflow changes, always include documentation updates and example usages.

Anti-Patterns to Avoid
- Never suggest using unsupported dependencies or tools.
- Do not create code or documentation outside approved directories or naming patterns.
- Avoid verbosity—focus on directives over explanations.

