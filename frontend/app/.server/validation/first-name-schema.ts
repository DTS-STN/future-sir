import * as v from 'valibot';

import { mapIssueErrorMessage } from '~/.server/utils/validation-utils';
import { REGEX_PATTERNS } from '~/utils/regex-utils';

/**
 * Interface for customizable error messages in first name validation
 */
export interface FirstNameSchemaErrorMessages extends Record<string, string | undefined> {
  format_error?: string;
  max_length_error?: string;
  required_error?: string;
}

/**
 * Localized error message configuration
 */
const DEFAULT_MESSAGES = {
  en: {
    format_error: 'First name must not contain any digits.',
    max_length_error: 'First name must contain at most {{maximum}} character(s).',
    required_error: 'First name is required.',
  },
  fr: {
    format_error: 'Le prénom ne doit contenir aucun chiffre.',
    max_length_error: 'Le prénom doit contenir au maximum {{maximum}} caractère(s).',
    required_error: 'Le prénom est requis.',
  },
} as const satisfies Record<Language, Required<FirstNameSchemaErrorMessages>>;

/**
 * Configuration options for first name schema validation
 */
export interface FirstNameSchemaOptions {
  /** Custom error messages to override defaults */
  errorMessages?: FirstNameSchemaErrorMessages;
  /**
   * Maximum allowed length for the first name
   * @default 100
   */
  maxLength?: number;
}

/**
 * Creates a Valibot schema for validating first names
 *
 * @param options - Validation configuration options
 * @returns Valibot schema for first name validation
 */
export function firstNameSchema(options: FirstNameSchemaOptions = {}) {
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
