import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { Server } from '../server.js';
import { getReadMetadataFixedTool } from './readMetadataFixed.js';

const mockMetadataResponses = vi.hoisted(() => ({
  success: {
    data: [
      {
        fieldName: 'Fixed_Calculation_123456789',
        fieldCaption: 'Fixed Profit Ratio',
        dataType: 'REAL',
        logicalTableId: '',
      },
      {
        fieldName: 'Fixed Product Name',
        fieldCaption: 'Fixed Product Name',
        dataType: 'STRING',
        logicalTableId: 'FixedOrders_123456789',
      },
      {
        fieldName: 'Fixed Quantity',
        fieldCaption: 'Fixed Quantity',
        dataType: 'INTEGER',
        logicalTableId: 'FixedOrders_123456789',
      },
    ],
  },
  empty: {
    data: [],
  },
}));

const mocks = vi.hoisted(() => ({
  mockReadMetadata: vi.fn(),
  mockGetConfig: vi.fn(),
}));

vi.mock('../config.js', () => ({
  getConfig: mocks.mockGetConfig,
}));

vi.mock('../restApiInstance.js', () => ({
  useRestApi: vi.fn().mockImplementation(async ({ callback }) =>
    callback({
      vizqlDataServiceMethods: {
        readMetadata: mocks.mockReadMetadata,
      },
    }),
  ),
}));

describe('readMetadataFixedTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a tool instance with correct properties', () => {
    mocks.mockGetConfig.mockReturnValue({ fixedDatasourceLuid: 'fixed-test-luid' });

    const readMetadataFixedTool = getReadMetadataFixedTool(new Server());
    expect(readMetadataFixedTool.name).toBe('read-metadata-fixed');
    expect(readMetadataFixedTool.description).toEqual(expect.any(String));
    expect(readMetadataFixedTool.paramsSchema).toEqual({});
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

  it('should successfully fetch and return metadata using fixed datasource LUID', async () => {
    mocks.mockGetConfig.mockReturnValue({ fixedDatasourceLuid: 'fixed-test-luid' });
    mocks.mockReadMetadata.mockResolvedValue(mockMetadataResponses.success);

    const result = await getToolResult();

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toEqual(JSON.stringify(mockMetadataResponses.success));
    expect(mocks.mockReadMetadata).toHaveBeenCalledWith({
      datasource: {
        datasourceLuid: 'fixed-test-luid',
      },
    });
  });

  it('should successfully fetch and return empty list when no metadata is found', async () => {
    mocks.mockGetConfig.mockReturnValue({ fixedDatasourceLuid: 'fixed-test-luid' });
    mocks.mockReadMetadata.mockResolvedValue(mockMetadataResponses.empty);

    const result = await getToolResult();

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toEqual(JSON.stringify(mockMetadataResponses.empty));
    expect(mocks.mockReadMetadata).toHaveBeenCalledWith({
      datasource: {
        datasourceLuid: 'fixed-test-luid',
      },
    });
  });

  it('should handle API errors gracefully', async () => {
    mocks.mockGetConfig.mockReturnValue({ fixedDatasourceLuid: 'fixed-test-luid' });
    const errorMessage = 'Fixed API Error';
    mocks.mockReadMetadata.mockRejectedValue(new Error(errorMessage));

    const result = await getToolResult();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('requestId: test-request-id, error: Fixed API Error');
  });
});

async function getToolResult(): Promise<CallToolResult> {
  const readMetadataFixedTool = getReadMetadataFixedTool(new Server());
  return await readMetadataFixedTool.callback(
    {}, // No parameters for fixed tool
    {
      signal: new AbortController().signal,
      requestId: 'test-request-id',
      sendNotification: vi.fn(),
      sendRequest: vi.fn(),
    },
  );
}
