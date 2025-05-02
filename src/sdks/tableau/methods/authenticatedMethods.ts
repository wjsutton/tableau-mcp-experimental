type AuthHeaders = {
  headers: {
    'X-Tableau-Auth': string;
  };
};

/**
 * Base abstract class for any methods classes that require authentication.
 *
 * @export
 * @abstract
 * @class AuthenticatedMethods
 */
export default abstract class AuthenticatedMethods {
  private _token: string;

  protected get authHeader(): AuthHeaders {
    if (!this._token) {
      throw new Error('Authenticate by calling signIn() first');
    }

    return {
      headers: {
        'X-Tableau-Auth': this._token,
      },
    };
  }

  constructor(token: string) {
    this._token = token;
  }
}
