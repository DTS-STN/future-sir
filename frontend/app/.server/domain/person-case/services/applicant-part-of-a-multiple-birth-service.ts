import type {
  ApplicantPartOfAMultipleBirthOption,
  LocalizedApplicantPartOfAMultipleBirthOption,
} from '~/.server/domain/person-case/models';
import fsirApplicantPartOfAMultipleBirthData from '~/.server/resources/fsir_applicantpartofamultiplebirth.json';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * Retrieves a list of applicant part of a multiple birth option.
 *
 * @returns An array of applicant part of a multiple birth option objects.
 */
export function getApplicantPartOfAMultipleBirthOptions(): readonly ApplicantPartOfAMultipleBirthOption[] {
  return fsirApplicantPartOfAMultipleBirthData.options.map((option) => ({
    id: option.value.toString(),
    nameEn: option.labelEn,
    nameFr: option.labelFr,
  }));
}

/**
 * Retrieves a single applicant part of a multiple birth option by its ID.
 *
 * @param id The ID of the applicant part of a multiple birth option to retrieve.
 * @returns The applicant part of a multiple birth option object if found.
 * @throws {AppError} If the option is not found.
 */
export function getApplicantPartOfAMultipleBirthOptionById(id: string): ApplicantPartOfAMultipleBirthOption {
  const option = getApplicantPartOfAMultipleBirthOptions().find((o) => o.id === id);
  if (!option) {
    throw new AppError(
      `Applicant part of a multiple birth option with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICANT_PART_OF_A_MULTIPLE_BIRTH_OPTION_FOUND,
    );
  }
  return option;
}

/**
 * Retrieves a list of applicant part of a multiple birth option localized to the specified language.
 *
 * @param language The language to localize the option names to.
 * @returns An array of localized applicant part of a multiple birth option objects.
 */
export function getLocalizedApplicantPartOfAMultipleBirthOptions(
  language: Language,
): LocalizedApplicantPartOfAMultipleBirthOption[] {
  return getApplicantPartOfAMultipleBirthOptions().map((option) => ({
    id: option.id,
    name: language === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized applicant part of a multiple birth option by its ID.
 *
 * @param id The ID of the applicant part of a multiple birth option to retrieve.
 * @param language The language to localize the option name to.
 * @returns The localized applicant part of a multiple birth option object if found.
 * @throws {AppError} If the option is not found.
 */
export function getLocalizedApplicantPartOfAMultipleBirthOptionById(
  id: string,
  language: Language,
): LocalizedApplicantPartOfAMultipleBirthOption {
  const option = getLocalizedApplicantPartOfAMultipleBirthOptions(language).find((o) => o.id === id);
  if (!option) {
    throw new AppError(
      `Localized applicant part of a multiple birth option with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICANT_PART_OF_A_MULTIPLE_BIRTH_OPTION_FOUND,
    );
  }
  return option;
}
