import type { LanguageOfCorrespondence, LocalizedPreferredLanguage } from '~/.server/domain/person-case/models';
import { getOptionSet } from '~/.server/domain/person-case/services/data-service';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * Retrieves a list of languages of correspondence.
 *
 * @returns An array of language of correspondence objects.
 */
export function getLanguagesOfCorrespondence(): readonly LanguageOfCorrespondence[] {
  const optionSet = getOptionSet('esdc_languageofcorrespondence');
  return optionSet.options.map((option) => ({
    id: option.value.toString(),
    nameEn: option.labelEn,
    nameFr: option.labelFr,
  }));
}

/**
 * Retrieves a single language of correspondence by its ID.
 *
 * @param id The ID of the language of correspondence to retrieve.
 * @returns The language of correspondence object if found.
 * @throws {AppError} If the language of correspondence is not found.
 */
export function getLanguageOfCorrespondenceById(id: string): LanguageOfCorrespondence {
  const languagesOfCorrespondence = getLanguagesOfCorrespondence().find((l) => l.id === id);
  if (!languagesOfCorrespondence) {
    throw new AppError(`Language of correspondence with ID '${id}' not found.`, ErrorCodes.NO_LANGUAGE_FOUND);
  }
  return languagesOfCorrespondence;
}

/**
 * Retrieves a list of languages of correspondence localized to the specified language.
 *
 * @param language The language to localize the language names to.
 * @returns An array of localized language of correspondence objects.
 */
export function getLocalizedLanguageOfCorrespondence(language: Language): LocalizedPreferredLanguage[] {
  return getLanguagesOfCorrespondence().map((option) => ({
    id: option.id,
    name: language === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized language of correspondence by its ID.
 *
 * @param id The ID of the language of correspondence to retrieve.
 * @param language The language to localize the language name to.
 * @returns The localized language of correspondence object if found.
 * @throws {AppError} If the language of correspondence is not found.
 */
export function getLocalizedLanguageOfCorrespondenceById(id: string, language: Language): LocalizedPreferredLanguage {
  const languagesOfCorrespondence = getLocalizedLanguageOfCorrespondence(language).find((l) => l.id === id);
  if (!languagesOfCorrespondence) {
    throw new AppError(`Localized language of correspondence with ID '${id}' not found.`, ErrorCodes.NO_LANGUAGE_FOUND);
  }
  return languagesOfCorrespondence;
}
