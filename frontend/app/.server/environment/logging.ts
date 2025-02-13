import chalk from 'chalk';
import * as v from 'valibot';

import { asFormattedInfo, LOG_LEVELS } from '~/.server/logging';
import type { LogLevel } from '~/.server/logging';

/**
 * Type representing the validated logging configuration.
 */
export type Logging = Readonly<v.InferOutput<typeof logging>>;

// Determine if the application is running in production mode.
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Default logging configuration.
 */
export const defaults = {
  LOG_LEVEL: (isProduction ? 'info' : 'debug') satisfies LogLevel,
} as const;

/**
 * Validation schema for logging configuration.
 *
 * Ensures that the log level is one of the predefined valid levels.
 * If validation fails, it falls back to the defined default instead of throwing an exception.
 *
 * @remark
 * The logger is responsible for capturing unhandled errors. If we throw an exception
 * before the logger is created, and the error-handling mechanism attempts to log that error,
 * the application will crash without anything being logged.
 * Using a fallback ensures the application remains operational and logs the issue safely.
 */
export const logging = v.object({
  LOG_LEVEL: v.fallback(v.picklist(LOG_LEVELS), logLevelFallback),
});

/**
 * Fallback function for handling invalid log levels.
 *
 * This function is called when the provided log level is invalid.
 * It logs a warning and falls back to the default log level.
 *
 * @param input - The validation result containing potential issues.
 * @returns The valid log level or the default if validation fails.
 */
function logLevelFallback(input: v.OutputDataset<LogLevel, v.PicklistIssue> | undefined): v.MaybeReadonly<LogLevel> {
  const fallback = defaults.LOG_LEVEL;

  // Extract validation issues, if any
  const issues = input?.issues ? v.flatten(input.issues).root : [];

  // Format a warning message to indicate fallback usage
  const formattedInfo = asFormattedInfo({
    timestamp: new Date().toISOString(),
    label: '.server/environment/logging.ts',
    level: 'warn' satisfies LogLevel,
    message: `${issues}; Falling back to "${fallback}"`,
  });

  // Display a warning in the console about the fallback
  console.warn(chalk.yellow(formattedInfo));

  return fallback;
}
