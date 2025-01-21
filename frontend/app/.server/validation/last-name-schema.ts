import type { z } from 'zod';

import { nameSchema } from '~/.server/validation/name-schema';

/**
 * Interface defining customizable error messages for last name validation schema.
 */
export interface LastNameSchemaErrorMessages {
  /**
   * Error message for when the last name contains digits.
   * @default 'Last name must not contain any digits.'
   */
  format_error?: string;

  /**
   * Error message for when the last name is not a string.
   * @default 'Last name must be a string.'
   */
  invalid_type_error?: string;

  /**
   * Error message for when the last name exceeds the maximum length.
   * @default 'Last name must contain at most {maximum} characters.'
   */
  max_length_error?: string;

  /**
   * Error message for when the last name is required.
   * @default 'Last name is required.'
   */
  required_error?: string;
}

/**
 * Configuration options for last name validation, including maximum length and error messages.
 */
export interface LastNameSchemaOptions {
  errorMessages?: LastNameSchemaErrorMessages;
  maxLength?: number;
}

const DEFAULT_MESSAGES = {
  format_error: 'Last name must not contain any digits.',
  invalid_type_error: 'Last name must be a string.',
  max_length_error: 'Last name must contain at most {maximum} characters.',
  required_error: 'Last name is required.',
} as const satisfies Required<LastNameSchemaErrorMessages>;

/**
 * Creates a Zod schema for validating last names with customizable options.
 *
 * @param options - Configuration options for validation.
 * @returns A Zod schema for validating last names.
 */
export function lastNameSchema(options: LastNameSchemaOptions = {}): z.ZodString {
  const { errorMessages = {}, maxLength = 100 } = options;

  const messages: Required<LastNameSchemaErrorMessages> = {
    ...DEFAULT_MESSAGES,
    ...errorMessages,
  };

  return nameSchema({
    errorMessages: {
      format_error: messages.format_error,
      invalid_type_error: messages.invalid_type_error,
      max_length_error: messages.max_length_error,
      required_error: messages.required_error,
    },
    maxLength,
  });
}
