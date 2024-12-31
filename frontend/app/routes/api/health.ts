import type { HealthCheckOptions } from '@dts-stn/health-checks';
import { execute } from '@dts-stn/health-checks';
import { Redacted } from 'effect';

import type { Route } from './+types/health';

import { AzureADAuthenticationStrategy } from '~/.server/auth/auth-strategies';
import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';
import { getRedisClient } from '~/.server/redis';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

const log = LogFactory.getLogger(import.meta.url);

export async function loader({ context, params, request }: Route.LoaderArgs) {
  log.info('Handling health check request');

  const { include, exclude, timeout } = Object.fromEntries(new URL(request.url).searchParams);
  const redisHealthCheck = { name: 'redis', check: async () => void (await getRedisClient().ping()) };

  const healthCheckOptions: HealthCheckOptions = {
    excludeComponents: toArray(exclude),
    includeComponents: toArray(include),
    includeDetails: await isAuthorized(request),
    metadata: {
      buildId: serverEnvironment.BUILD_ID,
      version: serverEnvironment.BUILD_VERSION,
    },
    timeoutMs: toNumber(timeout),
  };

  log.debug('Health check options:', healthCheckOptions);

  if (serverEnvironment.SESSION_TYPE !== 'redis') {
    log.debug('Skipping Redis health check because SESSION_TYPE is not redis.');
    healthCheckOptions.excludeComponents ??= [];
    healthCheckOptions.excludeComponents.push(redisHealthCheck.name);
  }

  const summary = await execute([redisHealthCheck], healthCheckOptions);
  log.debug('Health check completed successfully. Summary:', summary);

  return Response.json({ summary });
}

async function isAuthorized(request: Request): Promise<boolean> {
  const authorization = request.headers.get('authorization') ?? '';
  const [scheme, token] = authorization.split(' ');

  if (scheme.toLowerCase() !== 'bearer' || !token) {
    log.info('No bearer token provided, authorization denied.');
    return false;
  }

  //
  // TODO :: GjB :: handle local (non-azure) auth
  //

  const { AZUREAD_ISSUER_URL, AZUREAD_CLIENT_ID } = serverEnvironment;
  const AZUREAD_CLIENT_SECRET = Redacted.value(serverEnvironment.AZUREAD_CLIENT_SECRET);

  if (!AZUREAD_ISSUER_URL || !AZUREAD_CLIENT_ID || !AZUREAD_CLIENT_SECRET) {
    throw new AppError('The Azure OIDC settings are misconfigured', ErrorCodes.MISCONFIGURED_PROVIDER);
  }

  const authStrategy = new AzureADAuthenticationStrategy(new URL(AZUREAD_ISSUER_URL), AZUREAD_CLIENT_ID, AZUREAD_CLIENT_SECRET);
  const jwtPayload = await authStrategy.decodeAndVerifyJwt(token, AZUREAD_CLIENT_ID);
  log.trace('JWT payload:', jwtPayload);

  return jwtPayload.roles?.includes('admin') ?? false;
}

function toArray(str?: string): string[] | undefined {
  const result = str?.split(',').filter(Boolean);
  return result && result.length > 0 ? result : undefined;
}

function toNumber(str?: string): number | undefined {
  const num = parseInt(str ?? '');
  return isNaN(num) ? undefined : num;
}
