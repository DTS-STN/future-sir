import util from 'node:util';
import type { Logform, Logger } from 'winston';
import winston, { format, transports } from 'winston';
import { fullFormat } from 'winston-error-format';

/**
 * Defines a constant object representing logging levels.
 * This object provides a mapping between string names and their corresponding integer values for logging levels.
 */
export const logLevels = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  audit: 4,
  debug: 5,
  trace: 6,
} as const;

export type LogLevel = keyof typeof logLevels;

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
function asFormattedInfo(transformableInfo: Logform.TransformableInfo): string {
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
