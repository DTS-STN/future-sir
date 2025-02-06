import * as v from 'valibot';
import isEmail from 'validator/es/lib/isEmail';

import { mapIssueErrorMessage } from '~/.server/utils/validation-utils';

/**
 * Interface for customizable error messages in email address validation
 */
export interface EmailAddressSchemaErrorMessages extends Record<string, string | undefined> {
  format_error?: string;
  max_length_error?: string;
  required_error?: string;
}

/**
 * Localized error message configuration
 */
const DEFAULT_MESSAGES = {
  en: {
    format_error: 'Email address format is invalid.',
    max_length_error: 'Email address must contain at most {{maximum}} character(s).',
    required_error: 'Email address is required.',
  },
  fr: {
    format_error: "Le format de l'adresse courriel est invalide.",
    max_length_error: "L'adresse courriel doit contenir au maximum {{maximum}} caractère(s).",
    required_error: "L'adresse courriel est requise.",
  },
} as const satisfies Record<Language, Required<EmailAddressSchemaErrorMessages>>;

/**
 * Configuration options for email address schema validation
 */
export interface EmailAddressSchemaOptions {
  /** Custom error messages to override defaults */
  errorMessages?: EmailAddressSchemaErrorMessages;
  /**
   * Maximum allowed length for the email address
   * @default 254
   */
  maxLength?: number;
}

/**
 * Creates a Valibot schema for validating email addresses
 *
 * @param options - Validation configuration options
 * @returns Valibot schema for email address validation
 */
export function emailAddressSchema(options: EmailAddressSchemaOptions = {}) {
  const validatorMaxLength = 254; // matches validator.js
  const { errorMessages = {}, maxLength = validatorMaxLength } = options;

  return v.pipe(
    // Base string validation with required error
    v.string((issue) => mapIssueErrorMessage(issue, errorMessages, 'required_error', DEFAULT_MESSAGES)),
    // Trim whitespace
    v.trim(),
    // Ensure non-empty
    v.nonEmpty((issue) => mapIssueErrorMessage(issue, errorMessages, 'required_error', DEFAULT_MESSAGES)),
    // Maximum length validation
    v.maxLength(
      Math.min(validatorMaxLength, maxLength), //
      (issue) => mapIssueErrorMessage(issue, errorMessages, 'max_length_error', DEFAULT_MESSAGES),
    ),
    // Email address format validation
    v.check(
      (input) => isEmail(input),
      (issue) => mapIssueErrorMessage(issue, errorMessages, 'format_error', DEFAULT_MESSAGES),
    ),
  );
}
