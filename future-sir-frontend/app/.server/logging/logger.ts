/**
 * Type definitions for logger.
 * This file defines the types and interfaces used for logging in the application.  It includes types for logging levels, leveled log methods, and the logger object itself.
 */
export type LogLevel = keyof typeof logLevels;

/**
 * Defines a constant object representing logging levels. Higher numbers represent more verbose logging.
 * The keys of this object are used as the `LogLevel` type.
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

/**
 *  Interface for a logging method.  Accepts a message and optional metadata.
 *  The method returns the logger instance to allow for chaining of logging calls.
 *
 * @param message - The message to log.  Can be a string or any other object.  If an object is provided, it will be stringified.
 * @param meta - Optional metadata to include with the log message.
 */
export interface LogMethod {
  /** Logs a message with optional metadata. */
  (message: string, ...meta: unknown[]): Logger;
  /** Logs a message. */
  (message: unknown): Logger;
  /** Logs an object. */
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  (infoObject: object): Logger;
}

/**
 * Interface for a logger object.
 * Includes methods for logging messages at different levels.  Each method accepts a message and optional metadata.
 */
export interface Logger extends Record<LogLevel, LogMethod> {}
