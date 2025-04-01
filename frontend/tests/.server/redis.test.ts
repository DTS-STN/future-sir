import Redis from 'ioredis';
import { describe, expect, it, vi } from 'vitest';

import { serverEnvironment } from '~/.server/environment';
import { getRedisClient } from '~/.server/redis';

vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn().mockReturnThis(),
  })),
}));

vi.mock('~/.server/environment', () => ({
  serverEnvironment: {
    REDIS_CONNECTION_TYPE: undefined, // set in each test
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    REDIS_PASSWORD: { value: () => 'password' },
    REDIS_USERNAME: 'user',
    REDIS_SENTINEL_MASTER_NAME: 'mymaster',
    REDIS_COMMAND_TIMEOUT_SECONDS: 10,
  },
}));

vi.mock('~/.server/utils/instance-registry', () => ({
  singleton: vi.fn((_, factory) => factory()),
}));

describe('Redis Client Initialization', () => {
  describe('getRedisClient', () => {
    it('should create a Redis client in standalone mode', () => {
      vi.mocked(serverEnvironment).REDIS_CONNECTION_TYPE = 'standalone';

      const redisClient = getRedisClient();

      expect(Redis).toHaveBeenCalledWith({
        host: 'localhost',
        port: 6379,
        username: 'user',
        password: 'password',
        commandTimeout: 10_000,
        retryStrategy: expect.any(Function),
      });

      expect(redisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(redisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should create a Redis client in sentinel mode', () => {
      vi.mocked(serverEnvironment).REDIS_CONNECTION_TYPE = 'sentinel';

      const redisClient = getRedisClient();

      expect(Redis).toHaveBeenCalledWith({
        name: 'mymaster',
        sentinels: [{ host: 'localhost', port: 6379 }],
        username: 'user',
        password: 'password',
        commandTimeout: 10_000,
        retryStrategy: expect.any(Function),
      });

      expect(redisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(redisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });
});
