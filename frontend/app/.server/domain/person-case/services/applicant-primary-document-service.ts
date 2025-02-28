import type {
  ApplicantPrimaryDocumentChoice,
  LocalizedApplicantPrimaryDocumentChoice,
} from '~/.server/domain/person-case/models';
import esdcApplicantPrimaryDocumentChoicesData from '~/.server/resources/esdc_applicantprimarydocumentchoices.json';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * Retrieves a list of applicant primary document choices.
 *
 * @returns An array of applicant primary document choice objects.
 */
export function getApplicantPrimaryDocumentChoices(): readonly ApplicantPrimaryDocumentChoice[] {
  return esdcApplicantPrimaryDocumentChoicesData.options.map((option) => ({
    id: option.value.toString(),
    nameEn: option.labelEn,
    nameFr: option.labelFr,
  }));
}

/**
 * Retrieves a single applicant primary document choice by its ID.
 *
 * @param id The ID of the applicant primary document choice to retrieve.
 * @returns The applicant primary document choice object if found.
 * @throws {AppError} If the choice is not found.
 */
export function getApplicantPrimaryDocumentChoiceById(id: string): ApplicantPrimaryDocumentChoice {
  const choice = getApplicantPrimaryDocumentChoices().find((c) => c.id === id);
  if (!choice) {
    throw new AppError(
      `Applicant primary document choice with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICANT_PRIMARY_DOCUMENT_CHOICE_FOUND,
    );
  }
  return choice;
}

/**
 * Retrieves a list of applicant primary document choices localized to the specified language.
 *
 * @param language The language to localize the choice names to.
 * @returns An array of localized applicant primary document choice objects.
 */
export function getLocalizedApplicantPrimaryDocumentChoices(language: Language): LocalizedApplicantPrimaryDocumentChoice[] {
  return getApplicantPrimaryDocumentChoices().map((option) => ({
    id: option.id,
    name: language === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized applicant primary document choice by its ID.
 *
 * @param id The ID of the applicant primary document choice to retrieve.
 * @param language The language to localize the choice name to.
 * @returns The localized applicant primary document choice object if found.
 * @throws {AppError} If the choice is not found.
 */
export function getLocalizedApplicantPrimaryDocumentChoiceById(
  id: string,
  language: Language,
): LocalizedApplicantPrimaryDocumentChoice {
  const choice = getLocalizedApplicantPrimaryDocumentChoices(language).find((c) => c.id === id);
  if (!choice) {
    throw new AppError(
      `Localized applicant primary document choice with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICANT_PRIMARY_DOCUMENT_CHOICE_FOUND,
    );
  }
  return choice;
}
