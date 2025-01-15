import type { z } from 'zod';

import { nameSchema } from '~/.server/validation/name-schema';

/**
 * Interface defining customizable error messages for firstName validation schema.
 */
export interface FirstNameSchemaErrorMessages {
  /**
   * Error message for when the first name contains digits.
   * @default 'First name must not contain any digits.'
   */
  format_error?: string;

  /**
   * Error message for when the first name is not a string.
   * @default 'First name must be a string.'
   */
  invalid_type_error?: string;

  /**
   * Error message for when the first name exceeds the maximum length.
   * @default 'First name must contain at most {maximum} characters.'
   */
  max_length_error?: string;

  /**
   * Error message for when the first name is required.
   * @default 'First name is required.'
   */
  required_error?: string;
}

/**
 * Configuration options for firstName validation, including maximum length and error messages.
 */
export interface FirstNameSchemaOptions {
  errorMessages?: FirstNameSchemaErrorMessages;
  maxLength?: number;
}

const DEFAULT_MESSAGES = {
  format_error: 'First name must not contain any digits.',
  invalid_type_error: 'First name must be a string.',
  max_length_error: 'First name must contain at most {maximum} characters.',
  required_error: 'First name is required.',
} as const satisfies Required<FirstNameSchemaErrorMessages>;

/**
 * Creates a Zod schema for validating firstNames with customizable options.
 *
 * @param options - Configuration options for validation.
 * @returns A Zod schema for validating firstNames.
 */
export function firstNameSchema(options: FirstNameSchemaOptions = {}): z.ZodString {
  const { errorMessages = {}, maxLength = 100 } = options;

  const messages: Required<FirstNameSchemaErrorMessages> = {
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
