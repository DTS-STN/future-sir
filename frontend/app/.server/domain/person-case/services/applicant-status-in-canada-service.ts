import type {
  ApplicantStatusInCanadaChoice,
  LocalizedApplicantStatusInCanadaChoice,
} from '~/.server/domain/person-case/models';
import applicantStatusInCanadaChoicesData from '~/.server/resources/fsir_applicantstatusincanada.json';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * Retrieves a list of applicant status in Canada choices.
 *
 * @returns An array of applicant status in Canada choice objects.
 */
export function getApplicantStatusInCanadaChoices(): readonly ApplicantStatusInCanadaChoice[] {
  return applicantStatusInCanadaChoicesData.options.map((option) => ({
    id: option.value.toString(),
    nameEn: option.labelEn,
    nameFr: option.labelFr,
  }));
}

/**
 * Retrieves a single applicant status in Canada choice by its ID.
 *
 * @param id The ID of the applicant status in Canada choice to retrieve.
 * @returns Theapplicant status in Canada choice object if found.
 * @throws {AppError} If the choice is not found.
 */
export function getApplicantStatusInCanadaChoicesById(id: string): ApplicantStatusInCanadaChoice {
  const applicantStatusInCanadaChoice = getApplicantStatusInCanadaChoices().find((s) => s.id === id);
  if (!applicantStatusInCanadaChoice) {
    throw new AppError(
      `Application status in Canada with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICANT_STATUS_IN_CANADA_CHOICE_FOUND,
    );
  }
  return applicantStatusInCanadaChoice;
}

/**
 * Retrieves a list of applicant status in Canada choices localized to the specified language.
 *
 * @param language The language to localize the scenario names to.
 * @returns An array of localized applicant status in Canada choice objects.
 */
export function getLocalizedApplicantStatusInCanadaChoices(language: Language): LocalizedApplicantStatusInCanadaChoice[] {
  return getApplicantStatusInCanadaChoices().map((option) => ({
    id: option.id,
    name: language === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized applicant status in Canada choice by its ID.
 *
 * @param id The ID of the applicant status in Canada choice to retrieve.
 * @param language The language to localize the choice name to.
 * @returns The localized applicant status in Canada choice object if found.
 * @throws {AppError} If the choice is not found.
 */
export function getLocalizedApplicantStatusInCanadaChoiceById(
  id: string,
  language: Language,
): LocalizedApplicantStatusInCanadaChoice {
  const applicantStatusInCanadaChoice = getLocalizedApplicantStatusInCanadaChoices(language).find((s) => s.id === id);
  if (!applicantStatusInCanadaChoice) {
    throw new AppError(
      `Localized applicant status in Canada choice with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICANT_STATUS_IN_CANADA_CHOICE_FOUND,
    );
  }
  return applicantStatusInCanadaChoice;
}
