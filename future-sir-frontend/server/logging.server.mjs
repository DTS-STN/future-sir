import { isEmpty, omit } from 'moderndash';
import util from 'node:util';
import { LEVEL, MESSAGE, SPLAT } from 'triple-beam';
import winston, { format, transports } from 'winston';
import { fullFormat } from 'winston-error-format';

import { logLevels } from './environment.server.mjs';

/**
 * Gets a logger instance for the specified category.
 *
 * Creates a new logger instance with a configured format and console transport if it doesn't exist for the provided category.
 * Otherwise, retrieves the existing logger.
 *
 * @param {string} category The category name for the logger.
 * @returns {winston.Logger} The winston logger instance for the category.
 */
export function getLogger(category) {
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
            /**
             * @param {string} label
             * @param {number} size
             */
            const formatLabel = (label, size) => {
              const str = label.padStart(size);
              return str.length <= size ? str : `…${str.slice(-size + 1)}`;
            };

            const { label, level, message, timestamp, ...rest } = info;
            let formattedInfo = `${timestamp} ${level.toUpperCase().padStart(7)} --- [${formatLabel(`${label}`, 25)}]: ${message}`;

            if (!isEmpty(rest)) {
              const stripped = omit(rest, [LEVEL, MESSAGE, SPLAT]);
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
 *
 * @returns {void}
 */
export function remapConsoleLoggers() {
  const log = getLogger('logging.server.mjs');
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
