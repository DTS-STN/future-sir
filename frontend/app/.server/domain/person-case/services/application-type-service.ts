import type { LocalizedTypeOfApplicationToSubmit, TypeOfApplicationToSubmit } from '~/.server/domain/person-case/models';
import esdcTypeOfApplicationToSubmitData from '~/.server/resources/esdc_typeofapplicationtosubmit.json';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * Retrieves a list of types of applications to submit.
 *
 * @returns An array of type of application to submit objects.
 */
export function getTypesOfApplicationToSubmit(): readonly TypeOfApplicationToSubmit[] {
  return esdcTypeOfApplicationToSubmitData.options.map((option) => ({
    id: option.value.toString(),
    nameEn: option.labelEn,
    nameFr: option.labelFr,
  }));
}

/**
 * Retrieves a single type of application to submit by its ID.
 *
 * @param id The ID of the type of application to submit to retrieve.
 * @returns The type of application to submit object if found.
 * @throws {AppError} If the type is not found.
 */
export function getTypeOfApplicationToSubmitById(id: string): TypeOfApplicationToSubmit {
  const type = getTypesOfApplicationToSubmit().find((t) => t.id === id);
  if (!type) {
    throw new AppError(
      `Type of application to submit with ID '${id}' not found.`,
      ErrorCodes.NO_TYPE_OF_APPLICATION_TO_SUBMIT_FOUND,
    );
  }
  return type;
}

/**
 * Retrieves a list of types of applications to submit localized to the specified language.
 *
 * @param language The language to localize the type names to.
 * @returns An array of localized type of application to submit objects.
 */
export function getLocalizedTypesOfApplicationToSubmit(language: Language): LocalizedTypeOfApplicationToSubmit[] {
  return getTypesOfApplicationToSubmit().map((option) => ({
    id: option.id,
    name: language === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized type of application to submit by its ID.
 *
 * @param id The ID of the type of application to submit to retrieve.
 * @param language The language to localize the type name to.
 * @returns The localized type of application to submit object if found.
 * @throws {AppError} If the type is not found.
 */
export function getLocalizedTypeOfApplicationToSubmitById(id: string, language: Language): LocalizedTypeOfApplicationToSubmit {
  const type = getLocalizedTypesOfApplicationToSubmit(language).find((t) => t.id === id);
  if (!type) {
    throw new AppError(
      `Localized type of application to submit with ID '${id}' not found.`,
      ErrorCodes.NO_TYPE_OF_APPLICATION_TO_SUBMIT_FOUND,
    );
  }
  return type;
}
