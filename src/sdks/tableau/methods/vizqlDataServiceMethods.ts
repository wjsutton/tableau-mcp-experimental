import { z } from 'zod';

import {
  getApiClient,
  QueryOutput,
  QueryRequest,
  VizqlDataServiceApiClient,
} from '../apis/vizqlDataServiceApi.js';
import AuthenticatedMethods from './authenticatedMethods.js';

export default class VizqlDataServiceMethods extends AuthenticatedMethods {
  private _apiClient: VizqlDataServiceApiClient;

  constructor(baseUrl: string, token: string) {
    super(token);
    this._apiClient = getApiClient(baseUrl);
  }

  queryDatasource = async (
    queryRequest: z.infer<typeof QueryRequest>,
  ): Promise<z.infer<typeof QueryOutput>> => {
    return await this._apiClient.queryDatasource(queryRequest, { ...this.authHeader });
  };
}
