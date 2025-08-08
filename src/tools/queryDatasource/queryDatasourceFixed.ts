import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Err } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import {
  Datasource,
  Query,
  QueryOutput,
  TableauError,
} from '../../sdks/tableau/apis/vizqlDataServiceApi.js';
import { Server } from '../../server.js';
import { Tool } from '../tool.js';
import { getDatasourceCredentials } from './datasourceCredentials.js';
import { handleQueryDatasourceError } from './queryDatasourceErrorHandler.js';
import { validateQuery } from './queryDatasourceValidator.js';
import { validateFilterValues } from './validators/validateFilterValues.js';

type Datasource = z.infer<typeof Datasource>;

const paramsSchema = {
  query: Query,
};

export type QueryDatasourceFixedError =
  | {
      type: 'filter-validation';
      message: string;
    }
  | {
      type: 'tableau-error';
      error: z.infer<typeof TableauError>;
    };

export const getQueryDatasourceFixedTool = (server: Server): Tool<typeof paramsSchema> => {
  const queryDatasourceFixedTool = new Tool({
    server,
    name: 'query-datasource-fixed',
    description: `# Query Fixed Tableau Data Source Tool

Executes VizQL queries against a pre-configured Tableau data source to answer business questions from published data. This tool uses the datasource LUID configured in the FIXED_DATASOURCE_LUID environment variable and allows you to retrieve aggregated and filtered data with proper sorting and grouping.

## Prerequisites
Before using this tool, you should:
1. Understand available fields and their types (use list-fields-fixed tool)
2. Understand the data structure and field relationships

## Best Practices

### Data Volume Management
- **Always prefer aggregation** - Use aggregated fields (SUM, COUNT, AVG, etc.) instead of raw row-level data to reduce response size
- **Profile data before querying** - When unsure about data volume, first run a COUNT query to understand the scale
- **Use TOP filters for rankings** - When users ask for "top N" results, use TOP filter type to limit results at the database level
- **Apply restrictive filters** - Use SET, QUANTITATIVE, or DATE filters to reduce data volume before processing
- **Avoid row-level queries when possible** - Only retrieve individual records when specifically requested and the business need is clear

### Query Construction
- **Group by meaningful dimensions** - Ensure grouping supports the business question being asked
- **Order results logically** - Use sortDirection and sortPriority to present data in a meaningful way
- **Use appropriate date functions** - Choose the right date aggregation (YEAR, QUARTER, MONTH, WEEK, DAY, or TRUNC_* variants)
- **Leverage filter capabilities** - Use the extensive filter options to narrow results

## Example Query Structure
\`\`\`json
{
  "query": {
    "fields": [
      {
        "fieldCaption": "Customer Name"
      },
      {
        "fieldCaption": "Sales",
        "function": "SUM",
        "fieldAlias": "Total Revenue",
        "sortDirection": "DESC",
        "sortPriority": 1
      }
    ],
    "filters": [
      {
        "field": {"fieldCaption": "Customer Name"},
        "filterType": "TOP",
        "howMany": 10,
        "direction": "TOP",
        "fieldToMeasure": {"fieldCaption": "Sales", "function": "SUM"}
      }
    ]
  }
}
\`\`\`

Note: This tool uses the fixed datasource configured in FIXED_DATASOURCE_LUID environment variable, so you only need to provide the query structure.
    `,
    paramsSchema,
    annotations: {
      title: 'Query Datasource (Fixed Datasource)',
      readOnlyHint: true,
      openWorldHint: false,
    },
    argsValidator: (args) => {
      // Only validate the query structure, not datasourceLuid since we use fixed LUID
      const config = getConfig();
      if (!config.fixedDatasourceLuid) {
        throw new Error(
          'FIXED_DATASOURCE_LUID environment variable is not configured. This tool requires a fixed datasource LUID to be set.',
        );
      }
      return validateQuery({ datasourceLuid: config.fixedDatasourceLuid, query: args.query });
    },
    callback: async ({ query }, { requestId }): Promise<CallToolResult> => {
      const config = getConfig();
      return await queryDatasourceFixedTool.logAndExecute<QueryOutput, QueryDatasourceFixedError>({
        requestId,
        args: { query },
        callback: async () => {
          if (!config.fixedDatasourceLuid) {
            throw new Error(
              'FIXED_DATASOURCE_LUID environment variable is not configured. This tool requires a fixed datasource LUID to be set.',
            );
          }

          const datasourceLuid = config.fixedDatasourceLuid;
          const datasource: Datasource = { datasourceLuid };
          const options = {
            returnFormat: 'OBJECTS',
            debug: true,
            disaggregate: false,
          } as const;

          const credentials = getDatasourceCredentials(datasourceLuid);
          if (credentials) {
            datasource.connections = credentials;
          }

          const queryRequest = {
            datasource,
            query,
            options,
          };

          return await useRestApi({
            config,
            requestId,
            server,
            callback: async (restApi) => {
              if (!config.disableQueryDatasourceFilterValidation) {
                // Validate filters values for SET and MATCH filters
                const filterValidationResult = await validateFilterValues(
                  server,
                  query,
                  restApi.vizqlDataServiceMethods,
                  datasource,
                );

                if (filterValidationResult.isErr()) {
                  const errors = filterValidationResult.error;
                  const errorMessage = errors.map((error) => error.message).join('\n\n');
                  return new Err({
                    type: 'filter-validation',
                    message: errorMessage,
                  });
                }
              }

              const result = await restApi.vizqlDataServiceMethods.queryDatasource(queryRequest);
              if (result.isErr()) {
                return new Err({
                  type: 'tableau-error',
                  error: result.error,
                });
              }
              return result;
            },
          });
        },
        getErrorText: (error: QueryDatasourceFixedError) => {
          switch (error.type) {
            case 'filter-validation':
              return JSON.stringify({
                requestId,
                errorType: 'validation',
                message: error.message,
              });
            case 'tableau-error':
              return JSON.stringify({
                requestId,
                ...handleQueryDatasourceError(error.error),
              });
          }
        },
      });
    },
  });

  return queryDatasourceFixedTool;
};
