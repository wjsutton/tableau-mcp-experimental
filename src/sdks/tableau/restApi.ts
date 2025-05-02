import { AuthConfig } from './authConfig.js';
import AuthenticationMethods from './methods/authenticationMethods.js';
import MetadataMethods from './methods/metadataMethods.js';
import VizqlDataServiceMethods from './methods/vizqlDataServiceMethods.js';

/**
 * Interface for the Tableau REST APIs
 *
 * @export
 * @class RestApi
 */
export default class RestApi {
  private _token?: string;
  private readonly _host: string;
  private readonly _baseUrl: string;
  private readonly _baseUrlWithoutVersion: string;

  private static _version = '3.24';

  constructor(host: string) {
    this._host = host;
    this._baseUrl = `${this._host}/api/${RestApi._version}`;
    this._baseUrlWithoutVersion = `${this._host}/api/-`;
  }

  static getNewInstanceAsync = async (host: string, authConfig: AuthConfig): Promise<RestApi> => {
    const restApi = new RestApi(host);
    if (authConfig.type === 'auth-token') {
      restApi._token = authConfig.authToken;
    } else {
      await restApi.signIn(authConfig);
    }

    return restApi;
  };

  get token(): string {
    if (!this._token) {
      throw new Error('No token found. Authenticate by calling signIn() first.');
    }

    return this._token;
  }

  get metadataMethods(): MetadataMethods {
    return new MetadataMethods(`${this._host}/api/metadata`, this.token);
  }

  get vizqlDataServiceMethods(): VizqlDataServiceMethods {
    return new VizqlDataServiceMethods(`${this._host}/api/v1/vizql-data-service`, this.token);
  }

  signIn = async (authConfig: AuthConfig): Promise<void> => {
    const authenticationMethods = new AuthenticationMethods(this._baseUrl);
    this._token = (await authenticationMethods.signIn(authConfig)).token;
  };
}
