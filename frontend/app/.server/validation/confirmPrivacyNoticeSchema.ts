import * as v from 'valibot';

import { mapIssueErrorMessage } from '~/.server/utils/validation-utils';

/**
 * Interface for customizable error messages in first name validation
 */
export interface ConfirmPrivacyNoticeSchemaErrorMessages extends Record<string, string | undefined> {
  required_error?: string;
}

/**
 * Localized error message configuration
 */
const DEFAULT_MESSAGES = {
  en: {
    required_error: 'Privacy notice statement is required.',
  },
  fr: {
    required_error: 'Un avis de confidentialité est requis.',
  },
} as const satisfies Record<Language, Required<ConfirmPrivacyNoticeSchemaErrorMessages>>;

/**
 * Configuration options for first name schema validation
 */
export interface ConfirmPrivacyNoticeSchemaOptions {
  /** Custom error messages to override defaults */
  errorMessages?: ConfirmPrivacyNoticeSchemaErrorMessages;
}

/**
 * Creates a Valibot schema for validating first names
 *
 * @param options - Validation configuration options
 * @returns Valibot schema for first name validation
 */
export function confirmPrivacyNoticeSchema(options: ConfirmPrivacyNoticeSchemaOptions = {}) {
  const { errorMessages = {} } = options;

  return v.pipe(
    // Base string validation with required error
    v.string((issue) => mapIssueErrorMessage(issue, errorMessages, 'required_error', DEFAULT_MESSAGES)),
    v.trim(),
    v.nonEmpty((issue) => mapIssueErrorMessage(issue, errorMessages, 'required_error', DEFAULT_MESSAGES)),
  );
}
