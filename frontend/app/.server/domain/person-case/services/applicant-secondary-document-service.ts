import type {
  ApplicantSecondaryDocumentChoice,
  LocalizedApplicantSecondaryDocumentChoice,
} from '~/.server/domain/person-case/models';
import esdcApplicantSecondaryDocumentChoicesData from '~/.server/resources/esdc_applicantsecondarydocumentchoices.json';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * Retrieves a list of applicant secondary document choices.
 *
 * @returns An array of applicant secondary document choice objects.
 */
export function getApplicantSecondaryDocumentChoices(): readonly ApplicantSecondaryDocumentChoice[] {
  return esdcApplicantSecondaryDocumentChoicesData.options.map((option) => ({
    id: option.value.toString(),
    nameEn: option.labelEn,
    nameFr: option.labelFr,
  }));
}

/**
 * Retrieves a single applicant secondary document choice by its ID.
 *
 * @param id The ID of the applicant secondary document choice to retrieve.
 * @returns The applicant secondary document choice object if found.
 * @throws {AppError} If the choice is not found.
 */
export function getApplicantSecondaryDocumentChoiceById(id: string): ApplicantSecondaryDocumentChoice {
  const choice = getApplicantSecondaryDocumentChoices().find((c) => c.id === id);
  if (!choice) {
    throw new AppError(
      `Applicant secondary document choice with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICANT_SECONDARY_DOCUMENT_CHOICE_FOUND,
    );
  }
  return choice;
}

/**
 * Retrieves a list of applicant secondary document choices localized to the specified language.
 *
 * @param language The language to localize the choice names to.
 * @returns An array of localized applicant secondary document choice objects.
 */
export function getLocalizedApplicantSecondaryDocumentChoices(language: Language): LocalizedApplicantSecondaryDocumentChoice[] {
  return getApplicantSecondaryDocumentChoices().map((option) => ({
    id: option.id,
    name: language === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized applicant secondary document choice by its ID.
 *
 * @param id The ID of the applicant secondary document choice to retrieve.
 * @param language The language to localize the choice name to.
 * @returns The localized applicant secondary document choice object if found.
 * @throws {AppError} If the choice is not found.
 */
export function getLocalizedApplicantSecondaryDocumentChoiceById(
  id: string,
  language: Language,
): LocalizedApplicantSecondaryDocumentChoice {
  const choice = getLocalizedApplicantSecondaryDocumentChoices(language).find((c) => c.id === id);
  if (!choice) {
    throw new AppError(
      `Localized applicant secondary document choice with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICANT_SECONDARY_DOCUMENT_CHOICE_FOUND,
    );
  }
  return choice;
}
