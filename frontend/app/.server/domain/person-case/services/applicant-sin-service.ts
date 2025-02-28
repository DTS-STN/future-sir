import type { ApplicantHadSinOption, LocalizedApplicantHadSinOption } from '~/.server/domain/person-case/models';
import { getOptionSet } from '~/.server/domain/person-case/services/data-service';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * Retrieves a list of applicant had SIN options.
 *
 * @returns An array of applicant had SIN option objects.
 */
export function getApplicantHadSinOptions(): readonly ApplicantHadSinOption[] {
  const optionSet = getOptionSet('esdc_didtheapplicanteverhadasinnumber');
  return optionSet.options.map((option) => ({
    id: option.value.toString(),
    nameEn: option.labelEn,
    nameFr: option.labelFr,
  }));
}

/**
 * Retrieves a single applicant had SIN option by its ID.
 *
 * @param id The ID of the applicant had SIN option to retrieve.
 * @returns The applicant had SIN option object if found.
 * @throws {AppError} If the option is not found.
 */
export function getApplicantHadSinOptionById(id: string): ApplicantHadSinOption {
  const option = getApplicantHadSinOptions().find((o) => o.id === id);
  if (!option) {
    throw new AppError(`Applicant had SIN option with ID '${id}' not found.`, ErrorCodes.NO_APPLICANT_HAD_SIN_OPTION_FOUND);
  }
  return option;
}

/**
 * Retrieves a list of applicant had SIN options localized to the specified language.
 *
 * @param language The language to localize the option names to.
 * @returns An array of localized applicant had SIN option objects.
 */
export function getLocalizedApplicantHadSinOptions(language: Language): LocalizedApplicantHadSinOption[] {
  return getApplicantHadSinOptions().map((option) => ({
    id: option.id,
    name: language === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized applicant had SIN option by its ID.
 *
 * @param id The ID of the applicant had SIN option to retrieve.
 * @param language The language to localize the option name to.
 * @returns The localized applicant had SIN option object if found.
 * @throws {AppError} If the option is not found.
 */
export function getLocalizedApplicantHadSinOptionById(id: string, language: Language): LocalizedApplicantHadSinOption {
  const option = getLocalizedApplicantHadSinOptions(language).find((o) => o.id === id);
  if (!option) {
    throw new AppError(
      `Localized applicant had SIN option with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICANT_HAD_SIN_OPTION_FOUND,
    );
  }
  return option;
}
