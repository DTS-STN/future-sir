import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/* eslint-disable @typescript-eslint/no-unnecessary-condition */

export const instanceNames = ['redisClient'] as const;

export type InstanceName = (typeof instanceNames)[number];

/**
 * Retrieves a singleton instance. If the instance does not exist, it is created using the provided factory function.
 *
 * @throws {AppError} If the instance is not found and no factory function is provided.
 */
export function singleton<T>(instanceName: InstanceName, factory?: () => T): T {
  globalThis.__instanceRegistry ??= new Map<InstanceName, unknown>();

  if (!globalThis.__instanceRegistry.has(instanceName)) {
    if (!factory) {
      throw new AppError(`Instance [${instanceName}] not found and factory not provided`, ErrorCodes.NO_FACTORY_PROVIDED);
    }

    globalThis.__instanceRegistry.set(instanceName, factory());
  }

  return globalThis.__instanceRegistry.get(instanceName) as T;
}
