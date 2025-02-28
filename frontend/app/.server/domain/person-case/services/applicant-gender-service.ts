import type { ApplicantGender, LocalizedApplicantGender } from '~/.server/domain/person-case/models';
import esdcApplicantGenderData from '~/.server/resources/esdc_applicantgender.json';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * Retrieves a list of applicant genders.
 *
 * @returns An array of applicant gender objects.
 */
export function getApplicantGenders(): readonly ApplicantGender[] {
  return esdcApplicantGenderData.options.map((option) => ({
    id: option.value.toString(),
    nameEn: option.labelEn,
    nameFr: option.labelFr,
  }));
}

/**
 * Retrieves a single applicant gender by its ID.
 *
 * @param id The ID of the applicant gender to retrieve.
 * @returns The applicant gender object if found.
 * @throws {AppError} If the applicant gender is not found.
 */
export function getApplicantGenderById(id: string): ApplicantGender {
  const gender = getApplicantGenders().find((g) => g.id === id);
  if (!gender) {
    throw new AppError(`Applicant gender with ID '${id}' not found.`, ErrorCodes.NO_GENDER_FOUND);
  }
  return gender;
}

/**
 * Retrieves a list of applicant genders localized to the specified language.
 *
 * @param language The language to localize the gender names to.
 * @returns An array of localized applicant gender objects.
 */
export function getLocalizedApplicantGenders(language: Language): LocalizedApplicantGender[] {
  return getApplicantGenders().map((option) => ({
    id: option.id,
    name: language === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized applicant gender by its ID.
 *
 * @param id The ID of the applicant gender to retrieve.
 * @param language The language to localize the gender name to.
 * @returns The localized applicant gender object if found.
 * @throws {AppError} If the applicant gender is not found.
 */
export function getLocalizedApplicantGenderById(id: string, language: Language): LocalizedApplicantGender {
  const gender = getLocalizedApplicantGenders(language).find((g) => g.id === id);
  if (!gender) {
    throw new AppError(`Localized applicant gender with ID '${id}' not found.`, ErrorCodes.NO_GENDER_FOUND);
  }
  return gender;
}
