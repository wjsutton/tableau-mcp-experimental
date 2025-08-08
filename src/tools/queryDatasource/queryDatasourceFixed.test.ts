import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Err, Ok } from 'ts-results-es';

import { Server } from '../../server.js';
import { exportedForTesting as datasourceCredentialsExportedForTesting } from './datasourceCredentials.js';
import { getQueryDatasourceFixedTool } from './queryDatasourceFixed.js';

const { resetDatasourceCredentials } = datasourceCredentialsExportedForTesting;

const mockVdsResponses = vi.hoisted(() => ({
  success: {
    data: [
      {
        Category: 'Technology',
        'SUM(Profit)': 146543.37559999965,
      },
      {
        Category: 'Furniture',
        'SUM(Profit)': 19729.995600000024,
      },
      {
        Category: 'Office Supplies',
        'SUM(Profit)': 126023.44340000013,
      },
    ],
  },
  error: {
    errorCode: '400803',
    message: 'Unknown Field: Foobar.',
    datetime: '2024-06-19T17:51:36.4771244Z',
    debug: {
      details: {
        detail: 'Error in query, Unknown Field: Foobar.',
      },
    },
  },
}));

const mocks = vi.hoisted(() => ({
  mockQueryDatasource: vi.fn(),
  mockGetConfig: vi.fn(),
}));

vi.mock('../../config.js', () => ({
  getConfig: mocks.mockGetConfig,
}));

vi.mock('../../restApiInstance.js', () => ({
  useRestApi: vi.fn().mockImplementation(async ({ callback }) =>
    callback({
      signIn: vi.fn(),
      signOut: vi.fn(),
      vizqlDataServiceMethods: {
        queryDatasource: mocks.mockQueryDatasource,
      },
    }),
  ),
}));

describe('queryDatasourceFixedTool', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
    };
    resetDatasourceCredentials();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should create a tool instance with correct properties', () => {
    mocks.mockGetConfig.mockReturnValue({ 
      fixedDatasourceLuid: 'fixed-test-luid',
      disableQueryDatasourceFilterValidation: false 
    });

    const queryDatasourceFixedTool = getQueryDatasourceFixedTool(new Server());
    expect(queryDatasourceFixedTool.name).toBe('query-datasource-fixed');
    expect(queryDatasourceFixedTool.description).toEqual(expect.any(String));
    expect(queryDatasourceFixedTool.paramsSchema).not.toBeUndefined();
    expect(queryDatasourceFixedTool.paramsSchema).not.toHaveProperty('datasourceLuid');
    expect(queryDatasourceFixedTool.paramsSchema).toHaveProperty('query');
  });

  it('should return error when FIXED_DATASOURCE_LUID is not configured', async () => {
    mocks.mockGetConfig.mockReturnValue({ fixedDatasourceLuid: null });

    const result = await getToolResult();

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(
      'FIXED_DATASOURCE_LUID environment variable is not configured',
    );
  });

  it('should return error when FIXED_DATASOURCE_LUID is empty string', async () => {
    mocks.mockGetConfig.mockReturnValue({ fixedDatasourceLuid: null });

    const result = await getToolResult();

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(
      'FIXED_DATASOURCE_LUID environment variable is not configured',
    );
  });

  it('should successfully query the fixed datasource', async () => {
    mocks.mockGetConfig.mockReturnValue({ 
      fixedDatasourceLuid: 'fixed-test-luid',
      disableQueryDatasourceFilterValidation: false 
    });
    mocks.mockQueryDatasource.mockResolvedValue(new Ok(mockVdsResponses.success));

    const result = await getToolResult();

    expect(result.isError).toBe(false);
    expect(JSON.parse(result.content[0].text as string)).toEqual(mockVdsResponses.success);
    expect(mocks.mockQueryDatasource).toHaveBeenCalledWith({
      datasource: {
        datasourceLuid: 'fixed-test-luid',
      },
      options: {
        debug: true,
        disaggregate: false,
        returnFormat: 'OBJECTS',
      },
      query: {
        fields: [
          {
            fieldCaption: 'Category',
          },
          {
            fieldCaption: 'Profit',
            function: 'SUM',
            sortDirection: 'DESC',
          },
        ],
      },
    });
  });

  it('should add datasource credentials to the request when provided', async () => {
    process.env.DATASOURCE_CREDENTIALS = JSON.stringify({
      'fixed-test-luid': [
        { luid: 'test-luid', u: 'test-user', p: 'test-pass' },
      ],
    });

    mocks.mockGetConfig.mockReturnValue({ 
      fixedDatasourceLuid: 'fixed-test-luid',
      disableQueryDatasourceFilterValidation: false,
      datasourceCredentials: process.env.DATASOURCE_CREDENTIALS
    });
    mocks.mockQueryDatasource.mockResolvedValue(new Ok(mockVdsResponses.success));

    // Reset credentials after setting up environment
    resetDatasourceCredentials();

    const result = await getToolResult();
    expect(result.isError).toBe(false);

    expect(mocks.mockQueryDatasource).toHaveBeenCalledWith({
      datasource: {
        datasourceLuid: 'fixed-test-luid',
        connections: [
          {
            connectionLuid: 'test-luid',
            connectionUsername: 'test-user',
            connectionPassword: 'test-pass',
          },
        ],
      },
      options: {
        debug: true,
        disaggregate: false,
        returnFormat: 'OBJECTS',
      },
      query: {
        fields: [
          {
            fieldCaption: 'Category',
          },
          {
            fieldCaption: 'Profit',
            function: 'SUM',
            sortDirection: 'DESC',
          },
        ],
      },
    });
  });

  it('should return error when VDS returns an error', async () => {
    mocks.mockGetConfig.mockReturnValue({ 
      fixedDatasourceLuid: 'fixed-test-luid',
      disableQueryDatasourceFilterValidation: false 
    });
    mocks.mockQueryDatasource.mockResolvedValue(new Err(mockVdsResponses.error));

    const result = await getToolResult();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe(
      JSON.stringify({
        requestId: 'test-request-id',
        ...mockVdsResponses.error,
        condition: 'Validation failed',
        details: "The incoming request isn't valid per the validation rules.",
      }),
    );
    expect(mocks.mockQueryDatasource).toHaveBeenCalledWith({
      datasource: {
        datasourceLuid: 'fixed-test-luid',
      },
      options: {
        debug: true,
        disaggregate: false,
        returnFormat: 'OBJECTS',
      },
      query: {
        fields: [
          {
            fieldCaption: 'Category',
          },
          {
            fieldCaption: 'Profit',
            function: 'SUM',
            sortDirection: 'DESC',
          },
        ],
      },
    });
  });

  it('should handle API errors gracefully', async () => {
    mocks.mockGetConfig.mockReturnValue({ 
      fixedDatasourceLuid: 'fixed-test-luid',
      disableQueryDatasourceFilterValidation: false 
    });
    const errorMessage = 'Fixed API Error';
    mocks.mockQueryDatasource.mockRejectedValue(new Error(errorMessage));

    const result = await getToolResult();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('requestId: test-request-id, error: Fixed API Error');
  });

  describe('Filter Validation', () => {
    it('should return validation error for SET filter with invalid values using fixed datasource', async () => {
      mocks.mockGetConfig.mockReturnValue({ 
        fixedDatasourceLuid: 'fixed-test-luid',
        disableQueryDatasourceFilterValidation: false 
      });

      // Mock validation query to return existing values
      mocks.mockQueryDatasource
        .mockResolvedValueOnce(
          new Ok({
            data: [
              { DistinctValues: 'East' },
              { DistinctValues: 'West' },
              { DistinctValues: 'North' },
              { DistinctValues: 'South' },
              { DistinctValues: 'Central' },
            ],
          }),
        );
      const queryDatasourceFixedTool = getQueryDatasourceFixedTool(new Server());
      const result = await queryDatasourceFixedTool.callback(
        {
          query: {
            fields: [{ fieldCaption: 'Sales', function: 'SUM' }],
            filters: [
              {
                field: { fieldCaption: 'Region' },
                filterType: 'SET',
                values: ['East', 'Wast'], // 'Wast' is a typo for 'West'
              },
            ],
          },
        },
        {
          signal: new AbortController().signal,
          requestId: 'test-request-id',
          sendNotification: vi.fn(),
          sendRequest: vi.fn(),
        },
      );

      expect(result.isError).toBe(true);
      const errorResponse = JSON.parse(result.content[0].text as string);
      expect(errorResponse.message).toContain('Filter validation failed for field "Region"');
      expect(errorResponse.message).toContain('Wast');
      expect(errorResponse.message).toContain('Did you mean:');
      expect(errorResponse.message).toContain('West'); // Should suggest fuzzy match

      // Should call only the validation query & error on invalid values
      expect(mocks.mockQueryDatasource).toHaveBeenCalledTimes(1);
    });

    it('should not run SET/MATCH filters validation when DISABLE_QUERY_DATASOURCE_FILTER_VALIDATION is true', async () => {
      mocks.mockGetConfig.mockReturnValue({ 
        fixedDatasourceLuid: 'fixed-test-luid',
        disableQueryDatasourceFilterValidation: true 
      });

      const mockMainQueryResult = {
        data: [{ Region: 'East', 'SUM(Sales)': 100000 }],
      };

      // Mock main query only
      mocks.mockQueryDatasource.mockResolvedValueOnce(new Ok(mockMainQueryResult));

      const queryDatasourceFixedTool = getQueryDatasourceFixedTool(new Server());
      const result = await queryDatasourceFixedTool.callback(
        {
          query: {
            fields: [{ fieldCaption: 'Region' }, { fieldCaption: 'Sales', function: 'SUM' }],
            filters: [
              {
                field: { fieldCaption: 'Sales' },
                filterType: 'QUANTITATIVE_NUMERICAL',
                quantitativeFilterType: 'MIN',
                min: 1000,
              },
            ],
          },
        },
        {
          signal: new AbortController().signal,
          requestId: 'test-request-id',
          sendNotification: vi.fn(),
          sendRequest: vi.fn(),
        },
      );

      expect(result.isError).toBe(false);
      expect(JSON.parse(result.content[0].text as string)).toEqual(mockMainQueryResult);

      // Should only call the main query (no validation needed)
      expect(mocks.mockQueryDatasource).toHaveBeenCalledTimes(1);
    });
  });
});

async function getToolResult(): Promise<CallToolResult> {
  const queryDatasourceFixedTool = getQueryDatasourceFixedTool(new Server());
  return await queryDatasourceFixedTool.callback(
    {
      query: {
        fields: [
          { fieldCaption: 'Category' },
          { fieldCaption: 'Profit', function: 'SUM', sortDirection: 'DESC' },
        ],
      },
    },
    {
      signal: new AbortController().signal,
      requestId: 'test-request-id',
      sendNotification: vi.fn(),
      sendRequest: vi.fn(),
    },
  );
}
