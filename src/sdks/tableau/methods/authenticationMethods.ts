import { getJwt } from '../../../utils/getJwt.js';
import { getApiClient } from '../apis/authenticationApi.js';
import { AuthenticationApiClient } from '../apis/authenticationApi.js';
import { AuthConfig } from '../authConfig.js';
import { Credentials } from '../types/credentials.js';

/**
 * Authentication methods of the Tableau Server REST API
 *
 * @export
 * @class AuthenticationMethods
 * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_authentication.htm#sign_in
 */
export default class AuthenticationMethods {
  private _apiClient: AuthenticationApiClient;

  constructor(baseUrl: string) {
    this._apiClient = getApiClient(baseUrl);
  }

  signIn = async (authConfig: AuthConfig): Promise<Credentials> => {
    if (authConfig.type === 'auth-token') {
      throw new Error('Sign in not required when auth token already available.');
    }

    return (
      await this._apiClient.signIn({
        credentials: {
          site: {
            contentUrl: authConfig.siteName,
          },
          ...(await (async () => {
            switch (authConfig.type) {
              case 'username-password':
                return {
                  name: authConfig.username,
                  password: authConfig.password,
                };
              case 'pat':
                return {
                  personalAccessTokenName: authConfig.patName,
                  personalAccessTokenSecret: authConfig.patValue,
                };
              case 'jwt':
                return {
                  jwt: authConfig.jwt,
                };
              case 'direct-trust':
                return {
                  jwt: await getJwt({
                    username: authConfig.username,
                    connectedApp: {
                      clientId: authConfig.clientId,
                      secretId: authConfig.secretId,
                      secretValue: authConfig.secretValue,
                    },
                    scopes: authConfig.scopes,
                  }),
                };
            }
          })()),
        },
      })
    ).credentials;
  };
}
