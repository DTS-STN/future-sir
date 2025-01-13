import { z } from 'zod';

export interface FirstNameValidationSchemaErrorMessages {
  hasDigits: string;
  maxLength: string;
  required: string;
}

/**
 * Constructs the Zod validation schema for first name validation.
 * @param errorMessages - Error messages to use in the schema.
 * @returns The constructed Zod validation schema.
 */
export function firstNameValidationSchema(errorMessages: FirstNameValidationSchemaErrorMessages): z.ZodString {
  return z
    .string({ errorMap: () => ({ message: errorMessages.required }) })
    .trim()
    .min(1, { message: errorMessages.required })
    .max(100, { message: errorMessages.maxLength })
    .regex(/^[^\d]*$/, { message: errorMessages.hasDigits });
}
