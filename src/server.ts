import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import pkg from '../package.json' assert { type: 'json' };
import { listFieldsTools } from './tools/listFields.js';
import { queryDatasourceTool } from './tools/queryDatasource.js';

export const server = new McpServer({
  name: pkg.name,
  version: pkg.version,
  capabilities: {
    logging: {},
    tools: {},
  },
});

const tools = [queryDatasourceTool, listFieldsTools];
for (const { name, description, paramsSchema, callback } of tools) {
  server.tool(name, description, paramsSchema, callback);
}
