import type { ServerEnvironment } from '../server/environment.server.js';

/* eslint-disable no-var */

declare global {
  var __appEnvironment: ServerEnvironment;
}

export {};
