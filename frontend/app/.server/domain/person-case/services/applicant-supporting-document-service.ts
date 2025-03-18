import type {
  ApplicantSupportingDocumentType,
  LocalizedApplicantSupportingDocumentType,
} from '~/.server/domain/person-case/models';
import applicantSupportingDocumentTypesData from '~/.server/resources/fsir_applicantsupportingdocumenttypes.json';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * Retrieves a list of applicant supporting document types.
 *
 * @returns An array of applicant supporting document types objects.
 */
export function getApplicantSupportingDocumentTypes(): readonly ApplicantSupportingDocumentType[] {
  return applicantSupportingDocumentTypesData.options.map((option) => ({
    id: option.value.toString(),
    nameEn: option.labelEn,
    nameFr: option.labelFr,
  }));
}

/**
 * Retrieves a single applicant supporting document type by its ID.
 *
 * @param id The ID of the applicant supporting document type to retrieve.
 * @returns The applicant supporting document type object if found.
 * @throws {AppError} If the type is not found.
 */
export function getApplicantSupportingDocumentTypesById(id: string): ApplicantSupportingDocumentType {
  const applicantSupportingDocumentType = getApplicantSupportingDocumentTypes().find((s) => s.id === id);
  if (!applicantSupportingDocumentType) {
    throw new AppError(
      `Application status in Canada with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICANT_SUPPORTING_DOCUMENT_TYPE_FOUND,
    );
  }
  return applicantSupportingDocumentType;
}

/**
 * Retrieves a list of applicant supporting document types localized to the specified language.
 *
 * @param language The language to localize the scenario names to.
 * @returns An array of localized applicant supporting document type objects.
 */
export function getLocalizedApplicantSupportingDocumentType(language: Language): LocalizedApplicantSupportingDocumentType[] {
  return getApplicantSupportingDocumentTypes().map((option) => ({
    id: option.id,
    name: language === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized applicant supporting document type by its ID.
 *
 * @param id The ID of the applicant supporting document type to retrieve.
 * @param language The language to localize the choice name to.
 * @returns The localized applicant supporting document type object if found.
 * @throws {AppError} If the choice is not found.
 */
export function getLocalizedApplicantSupportingDocumentTypeById(
  id: string,
  language: Language,
): LocalizedApplicantSupportingDocumentType {
  const applicantSupportingDocumentType = getLocalizedApplicantSupportingDocumentType(language).find((s) => s.id === id);
  if (!applicantSupportingDocumentType) {
    throw new AppError(
      `Localized applicant supporting document type with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICANT_SUPPORTING_DOCUMENT_TYPE_FOUND,
    );
  }
  return applicantSupportingDocumentType;
}
