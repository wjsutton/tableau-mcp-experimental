import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';

import { getConfig } from '../config.js';
import { useRestApi } from '../restApiInstance.js';
import { Server } from '../server.js';
import { Tool } from './tool.js';

const paramsSchema = {};

export const getReadMetadataFixedTool = (server: Server): Tool<typeof paramsSchema> => {
  const readMetadataFixedTool = new Tool({
    server,
    name: 'read-metadata-fixed',
    description: `This tool wraps the read-metadata endpoint exposed by Tableau VizQL Data Service for a pre-configured datasource. It returns basic, high-level metadata for the datasource configured in the FIXED_DATASOURCE_LUID environment variable.
    It strictly provides the following:
    {
      "fieldName": "string",
      "fieldCaption": "string",
      "dataType": "INTEGER",
      "defaultAggregation": "SUM",
      "logicalTableId": "string"
    }
    This tool is useful for getting a quick overview of the data source, but it does not provide the rich metadata that the list-fields-fixed tool provides.
    `,
    paramsSchema,
    annotations: {
      title: 'Read Metadata (Fixed Datasource)',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async (_args, { requestId }): Promise<CallToolResult> => {
      const config = getConfig();

      return await readMetadataFixedTool.logAndExecute({
        requestId,
        args: {},
        callback: async () => {
          if (!config.fixedDatasourceLuid) {
            throw new Error(
              'FIXED_DATASOURCE_LUID environment variable is not configured. This tool requires a fixed datasource LUID to be set.',
            );
          }

          const datasourceLuid = config.fixedDatasourceLuid;

          return new Ok(
            await useRestApi({
              config,
              requestId,
              server,
              callback: async (restApi) => {
                return await restApi.vizqlDataServiceMethods.readMetadata({
                  datasource: {
                    datasourceLuid,
                  },
                });
              },
            }),
          );
        },
      });
    },
  });

  return readMetadataFixedTool;
};
