import type { HealthCheckOptions } from '@dts-stn/health-checks';
import { execute } from '@dts-stn/health-checks';

import type { Route } from './+types/health';

import { serverEnvironment } from '~/.server/environment';
import { getRedisClient } from '~/.server/redis';

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const { include, exclude, timeout } = Object.fromEntries(new URL(request.url).searchParams);

  const redisHealthCheck = { name: 'redis', check: () => void getRedisClient().ping() };

  const healthCheckOptions: HealthCheckOptions = {
    excludeComponents: toArray(exclude),
    includeComponents: toArray(include),
    includeDetails: isAuthorized(request),
    metadata: {
      buildId: serverEnvironment.BUILD_ID,
      version: serverEnvironment.BUILD_VERSION,
    },
    timeoutMs: toNumber(timeout),
  };

  if (serverEnvironment.SESSION_TYPE !== 'redis') {
    healthCheckOptions.excludeComponents ??= [];
    healthCheckOptions.excludeComponents.push(redisHealthCheck.name);
  }

  const summary = await execute([redisHealthCheck], healthCheckOptions);

  return Response.json({ summary });
}

function isAuthorized(request: Request): boolean {
  return false; // TODO
}

function toArray(str?: string): string[] | undefined {
  const result = str?.split(',').filter(Boolean);
  return result && result.length > 0 ? result : undefined;
}

function toNumber(str?: string): number | undefined {
  const num = parseInt(str ?? '');
  return isNaN(num) ? undefined : num;
}
