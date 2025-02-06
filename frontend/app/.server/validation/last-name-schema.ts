import * as v from 'valibot';

import { mapIssueErrorMessage } from '~/.server/utils/validation-utils';
import { REGEX_PATTERNS } from '~/utils/regex-utils';

/**
 * Interface for customizable error messages in last name validation
 */
export interface LastNameSchemaErrorMessages extends Record<string, string | undefined> {
  format_error?: string;
  max_length_error?: string;
  required_error?: string;
}

/**
 * Localized error message configuration
 */
const DEFAULT_MESSAGES = {
  en: {
    format_error: 'Last name must not contain any digits.',
    max_length_error: 'Last name must contain at most {{maximum}} character(s).',
    required_error: 'Last name is required.',
  },
  fr: {
    format_error: 'Le nom de famille ne doit contenir aucun chiffre.',
    max_length_error: 'Le nom de famille doit contenir au maximum {{maximum}} caractère(s).',
    required_error: 'Le nom de famille est requis.',
  },
} as const satisfies Record<Language, Required<LastNameSchemaErrorMessages>>;

/**
 * Configuration options for last name schema validation
 */
export interface LastNameSchemaOptions {
  /** Custom error messages to override defaults */
  errorMessages?: LastNameSchemaErrorMessages;
  /** Maximum allowed length for the last name */
  maxLength?: number;
}

/**
 * Creates a Valibot schema for validating last names
 *
 * @param options - Validation configuration options
 * @returns Valibot schema for last name validation
 */
export function lastNameSchema(options: LastNameSchemaOptions = {}) {
  const { errorMessages = {}, maxLength = 100 } = options;

  return v.pipe(
    // Base string validation with required error
    v.string((issue) => mapIssueErrorMessage(issue, errorMessages, 'required_error', DEFAULT_MESSAGES)),
    // Trim whitespace
    v.trim(),
    // Ensure non-empty
    v.nonEmpty((issue) => mapIssueErrorMessage(issue, errorMessages, 'required_error', DEFAULT_MESSAGES)),
    // Maximum length validation
    v.maxLength(
      maxLength, //
      (issue) => mapIssueErrorMessage(issue, errorMessages, 'max_length_error', DEFAULT_MESSAGES),
    ),
    // Regex to prevent digits
    v.regex(
      REGEX_PATTERNS.NON_DIGIT, //
      (issue) => mapIssueErrorMessage(issue, errorMessages, 'format_error', DEFAULT_MESSAGES),
    ),
  );
}
