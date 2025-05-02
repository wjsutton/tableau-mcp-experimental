import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { server } from './server.js';

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
