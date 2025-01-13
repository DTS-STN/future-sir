import { z } from 'zod';

import { firstNameValidationSchema } from '~/.server/validation/validation-schemas';
import type { FirstNameValidationSchemaErrorMessages } from '~/.server/validation/validation-schemas';
import type { Validator } from '~/.server/validation/validator-types';
import { transformFlattenedError } from '~/utils/zod-utils';

/**
 * Type representing the structure of first name validation data.
 */
type FirstNameValidatorDataSchema = {
  firstName: string;
};

// Cache for storing validators by language.
const VALIDATOR_CACHE = new Map<Language, Validator<FirstNameValidatorDataSchema>>();

/**
 * Retrieves a cached FirstNameValidator for the specified language or creates one if not available.
 * @param language - The language for which to retrieve or create the validator.
 * @returns The FirstNameValidator instance for the specified language.
 */
export function firstNameValidator(language: Language): Validator<FirstNameValidatorDataSchema> {
  const cachedValidator = VALIDATOR_CACHE.get(language);

  if (cachedValidator) {
    return cachedValidator;
  }

  const newValidator = createFirstNameValidator({
    hasDigits: 'First name cannot contain digits.',
    maxLength: 'First name cannot exceed 100 characters.',
    required: 'First name is required.',
  });

  VALIDATOR_CACHE.set(language, newValidator);

  return newValidator;
}

/**
 * Creates a new FirstNameValidator with the specified error messages.
 * @param errorMessages - Error messages to use for validation.
 * @returns The new FirstNameValidator instance.
 */
export function createFirstNameValidator(
  errorMessages: FirstNameValidationSchemaErrorMessages,
): Validator<FirstNameValidatorDataSchema> {
  const validationSchema = z.object({
    firstName: firstNameValidationSchema(errorMessages),
  });

  return {
    validate(data) {
      const result = validationSchema.safeParse(data);

      if (result.success) {
        return {
          success: true,
          data: result.data,
        };
      }

      return {
        success: false,
        errors: transformFlattenedError(result.error.flatten()),
      };
    },
  };
}
