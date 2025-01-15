import type { z } from 'zod';

import { stringSchema } from '~/.server/validation/string-schema';

/**
 * Interface defining customizable error messages for name validation schema.
 */
export interface NameSchemaErrorMessages {
  format_error?: string;
  invalid_type_error?: string;
  max_length_error?: string;
  required_error?: string;
}

/**
 * Configuration options for name validation, including maximum length and error messages.
 */
export interface NameSchemaOptions {
  errorMessages?: NameSchemaErrorMessages;
  maxLength?: number;
}

const DEFAULT_MESSAGES = {
  format_error: 'Name must not contain any digits.',
  invalid_type_error: 'Name must be a string.',
  max_length_error: 'Name must contain at most {maximum} characters.',
  required_error: 'Name is required.',
} as const satisfies Required<NameSchemaErrorMessages>;

/**
 * Creates a Zod schema for validating names with customizable options.
 *
 * @param options - Configuration options for validation.
 * @returns A Zod schema for validating names.
 */
export function nameSchema(options: NameSchemaOptions = {}): z.ZodString {
  const { errorMessages = {}, maxLength = 100 } = options;

  const messages: Required<NameSchemaErrorMessages> = {
    ...DEFAULT_MESSAGES,
    ...errorMessages,
  };

  return stringSchema({
    errorMessages: {
      format_error: messages.format_error,
      invalid_type_error: messages.invalid_type_error,
      max_length_error: messages.max_length_error,
      min_length_error: messages.required_error,
      required_error: messages.required_error,
    },
    format: 'non-digit',
    minLength: 1,
    maxLength,
  });
}
