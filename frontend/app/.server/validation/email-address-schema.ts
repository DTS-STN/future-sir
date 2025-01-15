import isEmail from 'validator/es/lib/isEmail';
import type { z } from 'zod';

import { stringSchema } from '~/.server/validation/string-schema';

/**
 * Interface defining customizable error messages for email address validation schema.
 */
export interface EmailAddressSchemaErrorMessages {
  /**
   * Error message for when the email address format is invalid.
   * @default 'Email address format is invalid.'
   */
  format_error?: string;

  /**
   * Error message for when the email address is not a string.
   * @default 'Email address must be a string.'
   */
  invalid_type_error?: string;

  /**
   * Error message for when the email address exceeds the maximum length.
   * @default 'Email address must be less than or equal to {maximum} characters
   */
  max_length_error?: string;

  /**
   * Error message for when the email address is required.
   * @default 'Email address is required.'
   */
  required_error?: string;
}

/**
 * Configuration options for email address validation, including maximum length and error messages.
 */
export interface EmailAddressSchemaOptions {
  errorMessages?: EmailAddressSchemaErrorMessages;
  maxLength?: number;
}

const DEFAULT_MESSAGES = {
  format_error: 'Email address format is invalid.',
  invalid_type_error: 'Email address must be a string.',
  max_length_error: 'Email address must be less than or equal to {maximum} characters.',
  required_error: 'Email address is required.',
} as const satisfies Required<EmailAddressSchemaErrorMessages>;

/**
 * Creates a Zod schema for validating names with customizable options.
 *
 * @param options - Configuration options for validation.
 * @returns A Zod schema for validating names.
 */
export function emailAddressSchema(options: EmailAddressSchemaOptions = {}): z.ZodEffects<z.ZodString> {
  const defaultMaxEmailLength = 254; // matches validator.js

  const { errorMessages = {}, maxLength = defaultMaxEmailLength } = options;

  const messages: Required<EmailAddressSchemaErrorMessages> = {
    ...DEFAULT_MESSAGES,
    ...errorMessages,
  };

  return stringSchema({
    errorMessages: {
      invalid_type_error: messages.invalid_type_error,
      max_length_error: messages.max_length_error,
      min_length_error: messages.required_error,
      required_error: messages.required_error,
    },
    minLength: 1,
    maxLength: Math.min(defaultMaxEmailLength, maxLength),
  }).superRefine((email, ctx) => {
    if (!email) return;
    if (isEmail(email)) return;

    ctx.addIssue({
      code: 'custom',
      message: messages.format_error,
      fatal: true,
    });
  });
}
