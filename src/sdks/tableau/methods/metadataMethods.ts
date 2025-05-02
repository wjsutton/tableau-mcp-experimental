import { getApiClient, GraphQLResponse, MetadataApiClient } from '../apis/metadataApi.js';
import AuthenticatedMethods from './authenticatedMethods.js';

export default class MetadataMethods extends AuthenticatedMethods {
  private _apiClient: MetadataApiClient;

  constructor(baseUrl: string, token: string) {
    super(token);
    this._apiClient = getApiClient(baseUrl);
  }

  graphql = async (query: string): Promise<GraphQLResponse> => {
    return await this._apiClient.graphql({ query }, { ...this.authHeader });
  };
}
