import { redirect } from 'react-router';

import type { KeyLike } from 'jose';
import { exportJWK, importPKCS8, importSPKI, SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers';

import type { Route } from './+types/oidc-provider';
import { getServerEnvironment } from '~/.server/express/environment';
import type { TokenSet } from '~/utils/oidc-utils';

type AuthCode = string;

type KeyPair = {
  privateKey: KeyLike;
  publicKey: KeyLike;
};

const environment = getServerEnvironment();

const config = {
  issuer: `http://localhost:${environment.PORT}/auth/oidc`,
  clientId: '00000000-0000-0000-0000-000000000000',
  clientSecret: '00000000-0000-0000-0000-000000000000',
  allowedRedirectUris: [`http://localhost:${environment.PORT}/auth/callback/local`],
};

// a token cache to hold authcode → token mappings
const tokenCache = new Map<AuthCode, TokenSet>();

/**
 * Handle OIDC actions, such as token exchange.
 */
export async function action({ context, params, request }: Route.ActionArgs) {
  const { ENABLE_DEVMODE_OIDC } = context.environment.server;

  if (!ENABLE_DEVMODE_OIDC) {
    // return a 404 if devmode OIDC is not enabled
    throw Response.json(null, { status: 404 });
  }

  const endpoint = params['*'];

  switch (endpoint) {
    case 'token': {
      return await handleTokenRequest({ context, params, request });
    }

    default: {
      throw Response.json('OIDC endpoint not found', { status: 404 });
    }
  }
}

/**
 * Handle OIDC loader requests, such as discovery, user info, etc.
 */
export async function loader({ context, params, request }: Route.LoaderArgs) {
  const { ENABLE_DEVMODE_OIDC } = context.environment.server;

  if (!ENABLE_DEVMODE_OIDC) {
    // return a 404 if devmode OIDC is not enabled
    throw Response.json(null, { status: 404 });
  }

  const endpoint = params['*'];

  switch (endpoint) {
    case '.well-known/openid-configuration': {
      return handleMetadataRequest();
    }

    case '.well-known/jwks.json': {
      return await handleJwksRequest();
    }

    case 'authorize': {
      return await handleAuthorizeRequest({ context, params, request });
    }

    case 'userinfo': {
      return handleUserinfoRequest();
    }

    default: {
      throw Response.json('OIDC endpoint not found', { status: 404 });
    }
  }
}

/**
 * see: https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationEndpoint
 */
async function handleAuthorizeRequest({ request }: Route.LoaderArgs): Promise<void> {
  const searchParams = new URL(request.url).searchParams;

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');

  if (clientId !== config.clientId) {
    throw Response.json({ error: 'invalid_client_id' }, { status: 400 });
  }

  if (redirectUri && !config.allowedRedirectUris.includes(redirectUri)) {
    throw Response.json({ error: 'invalid_redirect_uri' }, { status: 400 });
  }

  if (!state) {
    throw Response.json({ error: 'invalid_state' }, { status: 400 });
  }

  //
  // validation passed; generate tokens and return authcode
  //

  const code = randomUUID();
  const { privateKey } = await getKeyPair();

  const accessToken = await new SignJWT({
    name: 'Application Developer',
    scopes: searchParams.get('scope')?.split(' '),
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setAudience(config.clientId)
    .setExpirationTime('24h')
    .setIssuedAt()
    .setIssuer(config.issuer)
    .setSubject('00000000-0000-0000-0000-000000000000')
    .sign(privateKey);

  const idToken = await new SignJWT({ name: 'Application Developer', roles: ['admin'] })
    .setProtectedHeader({ alg: 'RS256' })
    .setAudience(config.clientId)
    .setExpirationTime('24h')
    .setIssuedAt()
    .setIssuer(config.issuer)
    .setSubject('00000000-0000-0000-0000-000000000000')
    .sign(privateKey);

  // store in the token cache for 30 seconds (for retrieval during token exchange step)
  tokenCache.set(code, { accessToken, idToken });
  setTimeout(() => tokenCache.delete(code), 30_000);

  throw redirect(`${redirectUri}?code=${code}&state=${state}`);
}

/**
 * see: https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig
 */
function handleMetadataRequest(): Response {
  return Response.json({
    authorization_endpoint: `${config.issuer}/authorize`,
    claims_supported: ['aud', 'email', 'exp', 'iat', 'iss', 'name', 'sub'],
    id_token_signing_alg_values_supported: ['RS256'],
    issuer: config.issuer,
    jwks_uri: `${config.issuer}/.well-known/jwks.json`,
    response_types_supported: ['code id_token', 'id_token token'],
    scopes_supported: ['openid', 'profile', 'email'],
    subject_types_supported: ['public'],
    token_endpoint_auth_methods_supported: ['client_secret_post'],
    token_endpoint: `${config.issuer}/token`,
    userinfo_endpoint: `${config.issuer}/userinfo`,
  });
}

/**
 * see: https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig
 */
async function handleJwksRequest(): Promise<Response> {
  const { publicKey } = await getKeyPair();
  const jwk = await exportJWK(publicKey);
  return Response.json({ keys: [jwk] });
}

/**
 * see: https://openid.net/specs/openid-connect-core-1_0.html#TokenEndpoint
 */
async function handleTokenRequest({ request }: Route.LoaderArgs): Promise<Response> {
  const formData = await request.formData();

  const clientId = formData.get('client_id')?.toString();
  const clientSecret = formData.get('client_secret')?.toString();
  const code = formData.get('code')?.toString();
  const grantType = formData.get('grant_type')?.toString();
  const redirectUri = formData.get('redirect_uri')?.toString();

  if (clientId !== config.clientId) {
    throw Response.json({ error: 'invalid_client' }, { status: 400 });
  }

  if (clientSecret !== config.clientSecret) {
    throw Response.json({ error: 'invalid_client' }, { status: 400 });
  }

  if (!code) {
    throw Response.json({ error: 'invalid_code' }, { status: 400 });
  }

  if (grantType !== 'authorization_code') {
    throw Response.json({ error: 'invalid_grant_type' }, { status: 400 });
  }

  if (redirectUri && !config.allowedRedirectUris.includes(redirectUri)) {
    throw Response.json({ error: 'invalid_redirect_uri' }, { status: 400 });
  }

  //
  // first-level validation passed; fetch tokens from cache
  //

  const tokenSet = tokenCache.get(code);
  tokenCache.delete(code);

  if (!tokenSet) {
    throw Response.json({ error: 'invalid_code' }, { status: 400 });
  }

  //
  // second-level validation passed; return tokens
  //

  return Response.json({
    access_token: tokenSet.accessToken,
    expires_in: 24 * 60 * 60,
    id_token: tokenSet.idToken,
    token_type: 'Bearer',
  });
}

/**
 * see: https://openid.net/specs/openid-connect-core-1_0.html#UserInfo
 */
function handleUserinfoRequest(): Response {
  return Response.json({
    sub: '00000000-0000-0000-0000-000000000000',
    name: 'Application Developer',
    given_name: 'Application',
    family_name: 'Developer',
    email: 'developer@example.com',
  });
}

/**
 * Generate a public/private keypair to use when signing tokens.
 *
 * Note that while this might look dangerous, this is only ever used in
 * devmode, so there is no security risk in exposing this to the public!
 */
async function getKeyPair(): Promise<KeyPair> {
  return {
    privateKey: await importPKCS8(
      '-----BEGIN PRIVATE KEY-----' +
        'MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC5+g//WB25LGwm' +
        '0MehIRTkfE7mrWmBheUP2mwpMn2BRe7pKtTqXBYkYImryhiOrQc46B0i1FXR2Jjo' +
        'K08Z50BxnwIHVMg8CoxbnKXufGes80yVI6D01mu/ksuYNhyK0ZWhuppadV35HjJq' +
        'FD1syP+mRy+7wBwTA6UTvk6blw5DKmvk970eOOKU9X0xbRYDnqCevAbQvcQbaidN' +
        'FkE2Ff1ZJoPDgd5tEsb0cHeFTKEmp9b0dh3XvTzsJr2JkGPttG9ZuTRAWa7R7aB5' +
        'TBJoedFCwUo1nLJSU9jCoM+pdlIjA1T8Xten7qkQiik9z4G5EUmZ5LktwH41gOGD' +
        'JE8YtwbZAgMBAAECggEAOT/71bh76el9X5OMqJLk+hM0PLmsTWV45qDwA9yZmwZ6' +
        'rcd0JLL1U/xt1PbRCXbFTuTRN0wTIRait3HBl3FDOtbeioA0ZZs/quH1iI0+YxTA' +
        'gfamUUiCgcZAK1qY/bjX7aHiay9PHuWHUnVplUfovviR/qN8YPQRyJqgWzAsgUsS' +
        'I3OpHCeArTeAQ2CCR9DNV7v5I9odKzXq4EWeT+lQsaHf6uiyUnWzsQxUKZOv+CKC' +
        'Lxtcdw8dy3fRlh1n9o0HJettISQ2wAJibHKFsFHCkvR+Kf0dY0ISVWpXEZofLzY/' +
        'QVGNz33nv6uxKEBBE0vcApZxU75+Vp1Rs73g4Yo48wKBgQDztdUmNGhpmiq+0NLv' +
        'dln4ffk2tGACKlFS8pJzAfYjIMvncUOdIZBxqfjZTBWZ7hLPIRc1hNoqYO/meuhq' +
        'zcsc6mmA1DMsmywUeaDJG4m9CZ8tc1wJ8eGVeAk90G3SBu6kYPmMWls2/YTUtFl1' +
        '/2pAvS6UUIVXxtfOh/d1J2Ey1wKBgQDDWuwLOCZ1Ey2ziTEU0H627ffWMpG7jhGW' +
        '08E1NwDWphVr8jPvjHCcVCSAJQ23t/N97gLlhtx9Ebz9kfCJLImQ7iIqLJ3+ChnJ' +
        '/O3LpZrXDt7oiuk66Gs8+OcP3AaEa3jiiDy+cE3Fo301RXKaVUZTX9L7Qo6p4rO0' +
        'KOGIU4YNzwKBgQDTDJpjlWr+WIW/7TNeME3FxcH1v8qM1XzLqkls0zwGO7aY3RtC' +
        'jfh6lklsVFk4jlU3jl58+Gm93WijXbi8FS9aAR4QdLNEY7SOnq3AutpTHGv+fjIs' +
        'Yo2KVQMbxs3z3hD3xQsWooDvZCiN0wjOCLxJCAu4YOq4kvf8YP7JM6sWzQKBgQCg' +
        'c9lUDbZoimwK/i+17Nlm3mWlJLvV1IZV327dimPB6X/GvZQyuKL1g5bHOafesdPo' +
        'JslyRCZtA1i63Fc4E8CZrT2abjMGKL2tzXRyw34+DRTA4vdVTvhlh/ogaJNhx/Pt' +
        '/AAIWq1GG1YHnxbV9Bxi9l2PycbreiwnWTyEgDWmuQKBgQDULwwU3qKaqWkmnOz+' +
        'I5a6p7Cz2W590XBGMDiua3cVt/hFVPCvEtOCmodz9u5ovW/VLR5Xusn+d+jVYFsb' +
        'qPBiwRvpExe8Ory1eXWum6phpMDS99XXmZL+z6lNlXd99Cx5iSRZRCxTSAenj69Z' +
        'pGRIElx2LpscoD+GnZeLdWp+wQ==' +
        '-----END PRIVATE KEY-----',
      'RS256',
    ),
    publicKey: await importSPKI(
      '-----BEGIN PUBLIC KEY-----' +
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAufoP/1gduSxsJtDHoSEU' +
        '5HxO5q1pgYXlD9psKTJ9gUXu6SrU6lwWJGCJq8oYjq0HOOgdItRV0diY6CtPGedA' +
        'cZ8CB1TIPAqMW5yl7nxnrPNMlSOg9NZrv5LLmDYcitGVobqaWnVd+R4yahQ9bMj/' +
        'pkcvu8AcEwOlE75Om5cOQypr5Pe9HjjilPV9MW0WA56gnrwG0L3EG2onTRZBNhX9' +
        'WSaDw4HebRLG9HB3hUyhJqfW9HYd17087Ca9iZBj7bRvWbk0QFmu0e2geUwSaHnR' +
        'QsFKNZyyUlPYwqDPqXZSIwNU/F7Xp+6pEIopPc+BuRFJmeS5LcB+NYDhgyRPGLcG' +
        '2QIDAQAB' +
        '-----END PUBLIC KEY-----',
      'RS256',
    ),
  };
}
