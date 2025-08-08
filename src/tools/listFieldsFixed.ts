import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';

import { getConfig } from '../config.js';
import { useRestApi } from '../restApiInstance.js';
import { Server } from '../server.js';
import { getGraphqlQuery } from './listFields.js';
import { Tool } from './tool.js';

const paramsSchema = {};

export const getListFieldsFixedTool = (server: Server): Tool<typeof paramsSchema> => {
  const listFieldsFixedTool = new Tool({
    server,
    name: 'list-fields-fixed',
    description: `
    Fetches rich field metadata (name, description, inherited description, dataType, dataCategory, role, etc.) for a pre-configured datasource via Tableau's Metadata API.
    This tool uses the datasource LUID configured in the FIXED_DATASOURCE_LUID environment variable.
    Returns a list of field dicts or an error message. This tool should be used for getting the metadata to ground the use of the query_datasource tool.
    Note that not all fields, such as Hierarchy fields, can be used with the queryDatasource tool.
    `,
    paramsSchema,
    annotations: {
      title: 'List Fields (Fixed Datasource)',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async (_args, { requestId }): Promise<CallToolResult> => {
      const config = getConfig();

      return await listFieldsFixedTool.logAndExecute({
        requestId,
        args: {},
        callback: async () => {
          if (!config.fixedDatasourceLuid) {
            throw new Error(
              'FIXED_DATASOURCE_LUID environment variable is not configured. This tool requires a fixed datasource LUID to be set.',
            );
          }

          const datasourceLuid = config.fixedDatasourceLuid;
          const query = getGraphqlQuery(datasourceLuid);

          return new Ok(
            await useRestApi({
              config,
              requestId,
              server,
              callback: async (restApi) => {
                return await restApi.metadataMethods.graphql(query);
              },
            }),
          );
        },
      });
    },
  });

  return listFieldsFixedTool;
};
