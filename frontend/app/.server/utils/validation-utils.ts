/**
 * This module provides utility functions for data validation using the Valibot library.
 * It includes functions for mapping validation issues to appropriate error messages,
 * supporting custom error messages and localization. It enhances the validation process
 * by providing a way to customize and format error messages based on the validation
 * issues encountered.
 */
import * as v from 'valibot';

/**
 * Maps validation issue to appropriate error message
 *
 * @param issue - Validation issue
 * @param errorMessages - Custom error messages
 * @param messageKey - Key of the error message to use
 * @param defaultLocalizedErrorMessages - Default localized error messages
 * @returns Formatted error message
 */
export function mapIssueErrorMessage<TMessages extends Record<string, string | undefined>>(
  issue: v.BaseIssue<unknown>,
  errorMessages: TMessages,
  messageKey: keyof TMessages,
  defaultLocalizedErrorMessages?: Record<Language, Required<TMessages>>,
): string {
  // Determine language (default to 'en')
  const lang = v.parse(v.optional(v.picklist<Language[]>(['en', 'fr']), 'en'), issue.lang);

  let message = issue.message;

  // Override with default localized message if exists
  if (defaultLocalizedErrorMessages && defaultLocalizedErrorMessages[lang][messageKey]) {
    message = defaultLocalizedErrorMessages[lang][messageKey];
  }

  // Override with custom message if provided
  if (errorMessages[messageKey]?.trim()) {
    message = errorMessages[messageKey].trim();
  }

  // Replace placeholders for max length
  // TODO ::: GjB ::: this should be removed once we switch to using i18n keys
  if (issue.kind === 'validation' && issue.type === 'max_length') {
    message = message.replace('{{maximum}}', String(issue.requirement));
  }

  // Replace placeholders for min length
  // TODO ::: GjB ::: this should be removed once we switch to using i18n keys
  if (issue.kind === 'validation' && issue.type === 'min_length') {
    message = message.replace('{{minimum}}', String(issue.requirement));
  }

  return message;
}
