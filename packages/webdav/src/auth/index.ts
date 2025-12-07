import type { OAuthToken, WebDAVClientContext } from '../types';

import { match } from 'ts-pattern';

import { AuthType } from '../types';
// import { createDigestContext } from './digest';
import { generateBasicAuthHeader } from './basic';
import { generateTokenAuthHeader } from './oauth';

export function setupAuth(
  context: WebDAVClientContext,
  username: string | undefined,
  password: string | undefined,
  oauthToken: OAuthToken | undefined,
  _ha1: string | undefined
): void {
  match(context.authType)
    .with(AuthType.Auto, () => {
      if (username && password)
        context.headers.set('Authorization', generateBasicAuthHeader(username, password));
    })
    .with(AuthType.Digest, () => {
      // TODO: Implement Digest Auth
      // context.digest = createDigestContext(username, password, _ha1);
    })
    .with(AuthType.None, () => {
    // Do nothing
    })
    .with(AuthType.Password, () => {
      if (!username || !password) throw new Error('Username and password must be provided for Password authentication.');
      context.headers.set('Authorization', generateBasicAuthHeader(username, password));
    })
    .with(AuthType.Token, () => {
      if (!oauthToken) throw new Error('OAuth token must be provided for Token authentication.');
      context.headers.set('Authorization', generateTokenAuthHeader(oauthToken));
    })
    .exhaustive();
}
