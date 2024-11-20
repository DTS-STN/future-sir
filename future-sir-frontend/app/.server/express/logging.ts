import util from 'node:util';
import type { Logform, Logger } from 'winston';
import winston, { format, transports } from 'winston';
import { fullFormat } from 'winston-error-format';

export type GetLoggerFunction = typeof getLogger;

/**
 * Defines a constant object representing logging levels.
 * This object provides a mapping between string names and their corresponding integer values for logging levels.
 */
export const logLevels = { error: 0, warn: 1, info: 2, audit: 3, debug: 4, trace: 5 } as const;

const consoleTransport = new transports.Console();
const loggers = winston.loggers;

/**
 * Gets a logger instance for the specified category.
 *
 * Creates a new logger instance with a configured format and console transport if it doesn't exist for the provided category.
 * Otherwise, retrieves the existing logger.
 */
export function getLogger(category: string): Logger {
  if (loggers.has(category)) {
    return loggers.get(category);
  }

  return loggers.add(category, {
    level: getLogLevel(),
    levels: logLevels,
    format: format.combine(
      format.label({ label: category }),
      format.timestamp(),
      format.splat(),
      fullFormat(),
      format.printf(asFormattedInfo),
    ),
    transports: [consoleTransport],
  });
}

/**
 * Formats a log message for output.
 *
 * This function takes a Logform.TransformableInfo object and returns a formatted string.
 * The formatted string includes the timestamp, level, label, message, and any additional metadata.
 */
function asFormattedInfo(transformableInfo: Logform.TransformableInfo): string {
  const { label, level, message, timestamp, ...rest } = transformableInfo;
  const formattedInfo = `${timestamp} ${level.toUpperCase().padStart(7)} --- [${formatLabel(`${label}`, 25)}]: ${message}`;
  return isEmpty(rest) ? formattedInfo : `${formattedInfo} --- ${util.inspect(rest, false, null, true)}`;
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
 * This function checks the `LOG_LEVEL` environment variable. If it's undefined
 * or empty, it defaults to 'info' in production and 'debug' in other
 * environments.
 */
function getLogLevel(): string {
  const { LOG_LEVEL } = process.env;

  if (LOG_LEVEL === undefined || LOG_LEVEL === '') {
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  }

  return LOG_LEVEL;
}
