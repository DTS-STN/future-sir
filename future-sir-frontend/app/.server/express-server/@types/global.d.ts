import type { ServerEnvironment } from '../environment.server';

/* eslint-disable no-var */

declare global {
  var __appEnvironment: ServerEnvironment;
}

export {};
