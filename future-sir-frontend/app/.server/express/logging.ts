import util from 'node:util';
import type { Logger } from 'winston';
import winston, { format, transports } from 'winston';
import { fullFormat } from 'winston-error-format';

import { logLevels } from '~/.server/express/environment';

export type GetLoggerFunction = typeof getLogger;

/**
 * Gets a logger instance for the specified category.
 *
 * Creates a new logger instance with a configured format and console transport if it doesn't exist for the provided category.
 * Otherwise, retrieves the existing logger.
 */
export function getLogger(category: string): Logger {
  return winston.loggers.has(category)
    ? winston.loggers.get(category)
    : winston.loggers.add(category, {
        level: process.env.LOG_LEVEL,
        levels: logLevels,
        format: format.combine(
          format.label({ label: category }),
          format.timestamp(),
          format.splat(),
          fullFormat(),
          format.printf((info) => {
            const formatLabel = (label: string, size: number) => {
              const str = label.padStart(size);
              return str.length <= size ? str : `…${str.slice(-size + 1)}`;
            };

            const { label, level, message, timestamp, ...rest } = info;
            let formattedInfo = `${timestamp} ${level.toUpperCase().padStart(7)} --- [${formatLabel(`${label}`, 25)}]: ${message}`;

            if (!isEmpty(rest)) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { LEVEL, MESSAGE, SPLAT, ...stripped } = rest;
              formattedInfo += ` --- ${util.inspect(stripped, false, null, true)}`;
            }

            return formattedInfo;
          }),
        ),
        transports: [new transports.Console()],
      });
}

/**
 * Remaps native console loggers to log through the configured logger for 'console' category.
 * This allows all console output to be captured and formatted by the configured logging system.
 */
export function remapConsoleLoggers(): void {
  const log = getLogger('logging');
  const consoleLog = getLogger('console');

  log.info('  ✓ console.debug()');
  console.debug = (args) => consoleLog.debug(args);
  log.info('  ✓ console.error()');
  console.error = (args) => consoleLog.error(args);
  log.info('  ✓ console.info()');
  console.info = (args) => consoleLog.info(args);
  log.info('  ✓ console.log()');
  console.log = (args) => consoleLog.info(args);
  log.info('  ✓ console.warn()');
  console.warn = (args) => consoleLog.warn(args);
}

function isEmpty(rest: object) {
  return Object.keys(rest).length === 0;
}
