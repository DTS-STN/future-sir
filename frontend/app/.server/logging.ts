import util from 'node:util';
import * as v from 'valibot';
import type { Logform, Logger } from 'winston';
import winston, { format, transports } from 'winston';
import { fullFormat } from 'winston-error-format';

import { logging } from './environment/logging';
import { singleton } from './utils/instance-registry';

import { preprocess } from '~/utils/validation-utils';

export const LOG_LEVELS = ['audit', 'debug', 'error', 'info', 'none', 'trace', 'warn'] as const;

export type LogLevels = typeof LOG_LEVELS;
export type LogLevel = LogLevels[number];

/**
 * Defines a constant object representing logging levels.
 * This object provides a mapping between string names and their corresponding integer values for logging levels.
 */
const logLevels = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  audit: 4,
  debug: 5,
  trace: 6,
} as const satisfies Record<LogLevel, number>;

const consoleTransport = new transports.Console({
  handleExceptions: true,
  handleRejections: true,
});

export const LogFactory = {
  /**
   * Gets a logger instance for the specified category.
   *
   * Creates a new logger instance with a configured format and console transport if it doesn't exist for the provided category.
   * Otherwise, retrieves the existing logger.
   */
  getLogger: (category: string): Logger => {
    if (winston.loggers.has(category)) {
      return winston.loggers.get(category);
    }

    return winston.loggers.add(category, {
      level: getLogLevel(),
      levels: logLevels,
      format: format.combine(
        format.label({ label: category }),
        format.timestamp(),
        format.splat(),
        fullFormat({ stack: true }),
        format.printf(asFormattedInfo),
      ),
      transports: [consoleTransport],
    });
  },
};

/**
 * Formats a log message for output.
 *
 * This function takes a Logform.TransformableInfo object and returns a formatted string.
 * The formatted string includes the timestamp, level, label, message, and any additional metadata.
 */
export function asFormattedInfo(transformableInfo: Logform.TransformableInfo): string {
  const { label, level, message, timestamp, ...rest } = transformableInfo;
  const formattedInfo = `${timestamp} ${level.toUpperCase().padStart(7)} --- [${formatLabel(`${label}`, 25)}]: ${message}`;
  const sanitizedRest = Object.fromEntries(Object.entries(rest).filter(([key]) => typeof key !== 'symbol'));
  return isEmpty(sanitizedRest) ? formattedInfo : `${formattedInfo} --- ${util.inspect(sanitizedRest, false, null, true)}`;
}

/**
 * Checks if an object is empty.
 *
 * @param obj - The object to check.
 * @returns `true` if the object is empty, `false` otherwise.
 */
function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Formats a label string to a specified size.
 * If the label is longer than the specified size, it truncates the label and adds an ellipsis (...) at the beginning.
 */
function formatLabel(label: string, size: number): string {
  return label.length > size ? `…${label.slice(-size + 1)}` : label.padStart(size);
}

/**
 * Retrieves the log level from the environment variables.
 */
function getLogLevel() {
  return singleton('logLevel', () => {
    return v.parse(logging, preprocess(process.env)).LOG_LEVEL;
  });
}
