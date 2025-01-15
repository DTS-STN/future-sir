import { z } from 'zod';

/**
 * String format options for validation
 */
type StringFormat = 'alpha-only' | 'alphanumeric' | 'digit-only' | 'non-digit' | RegExp;

/**
 * Custom error messages for the validator
 */
export interface StringSchemaErrorMessages {
  format_error?: string;
  invalid_type_error?: string;
  max_length_error?: string;
  min_length_error?: string;
  required_error?: string;
}

/**
 * Configuration options for the string validator
 */
export interface StringSchemaOptions {
  /**
   * Custom error messages for different validation rules
   */
  errorMessages?: StringSchemaErrorMessages;

  /**
   * String format validation
   * @default undefined (any)
   */
  format?: StringFormat;

  /**
   * Maximum allowed length of the string
   * @default undefined (no maximum length)
   */
  maxLength?: number;

  /**
   * Miminum allowed length of the string
   * @default undefined (no minimum length)
   */
  minLength?: number;

  /**
   * Whether the string should be trimmed before validation
   * @default true
   */
  trim?: boolean;
}

/**
 * Predefined regex patterns for different string formats
 */
const FORMAT_PATTERNS = {
  'alpha-only': /^[a-zA-Z]+$/,
  'alphanumeric': /^[a-zA-Z0-9]+$/,
  'digit-only': /^\d+$/,
  'non-digit': /^\D+$/,
} as const;

/**
 * Default error messages
 */
const DEFAULT_MESSAGES = {
  format_error: 'Invalid format',
  invalid_type_error: 'Expected string, received {received}',
  max_length_error: 'String must contain at most {maximum} characters',
  min_length_error: 'String must contain at least {minimum} characters',
  required_error: 'Required',
} as const satisfies Required<StringSchemaErrorMessages>;

/**
 * Creates a Zod string validator with enhanced character validation
 *
 * @param options - Configuration options for the validator
 * @returns  A Zod string schema that always trims input
 */
export function stringSchema(options: StringSchemaOptions = {}): z.ZodString {
  const { errorMessages = {}, format, maxLength, minLength, trim = true } = options;

  const messages: Required<StringSchemaErrorMessages> = {
    ...DEFAULT_MESSAGES,
    ...errorMessages,
  };

  let schema = z.string({
    errorMap: (issue, ctx) => {
      const inputData = String(ctx.data);

      if (inputData === z.ZodParsedType.undefined) {
        return { message: messages.required_error };
      }

      if (issue.code === 'invalid_type') {
        return { message: messages.invalid_type_error.replace('{received}', inputData) };
      }

      return { message: ctx.defaultError };
    },
  });

  // trim whitespace
  if (trim) {
    schema = schema.trim();
  }

  // mininum length
  if (typeof minLength === 'number') {
    schema = schema.min(minLength, messages.min_length_error.replace('{minimum}', minLength.toString()));
  }

  // maximum length
  if (typeof maxLength === 'number') {
    schema = schema.max(maxLength, messages.max_length_error.replace('{maximum}', maxLength.toString()));
  }

  // format validation
  if (format) {
    const pattern = format instanceof RegExp ? format : FORMAT_PATTERNS[format];
    schema = schema.regex(pattern, messages.format_error);
  }

  return schema;
}
