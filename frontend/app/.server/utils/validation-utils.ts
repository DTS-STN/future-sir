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
  // Start with default issue message
  let message = issue.message;

  // Determine language (default to 'en')
  const lang = v.parse(v.optional(v.picklist<Language[]>(['en', 'fr']), 'en'), issue.lang);

  // Override with default localized message if exists
  if (defaultLocalizedErrorMessages && defaultLocalizedErrorMessages[lang][messageKey]) {
    message = defaultLocalizedErrorMessages[lang][messageKey];
  }

  // Override with custom message if provided
  if (errorMessages[messageKey]?.trim()) {
    message = errorMessages[messageKey].trim();
  }

  // Replace placeholders for max length
  if (issue.kind === 'validation' && issue.type === 'max_length') {
    message = message.replace('{{maximum}}', String(issue.requirement));
  }

  // Replace placeholders for min length
  if (issue.kind === 'validation' && issue.type === 'min_length') {
    message = message.replace('{{minimum}}', String(issue.requirement));
  }

  return message;
}
