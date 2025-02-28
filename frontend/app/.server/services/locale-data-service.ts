import type { ReadonlyDeep } from 'type-fest';

import { serverEnvironment } from '~/.server/environment';
import countriesData from '~/.server/resources/esdc-countries.json';
import globalOptionSetsData from '~/.server/resources/esdc-global-option-sets.json';
import provincesData from '~/.server/resources/esdc-provinces.json';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

type OptionSet = ReadonlyDeep<(typeof globalOptionSetsData)[number]>;

/**
 * Retrieves an option set by its name.
 *
 * @param optionSetName The name of the option set to retrieve.
 * @returns The option set if found.
 * @throws {AppError} If the option set is not found.
 */
function getOptionSet(optionSetName: string): OptionSet {
  const optionSet = globalOptionSetsData.find((os) => os.name === optionSetName);

  if (!optionSet) {
    throw new AppError(`Option set '${optionSetName}' not found.`, ErrorCodes.NO_OPTION_SET_FOUND);
  }

  return optionSet;
}

type Country = Readonly<{
  id: string;
  alphaCode: string;
  nameEn: string;
  nameFr: string;
}>;

/**
 * Retrieves a list of all countries.
 *
 * @returns An array of country objects.
 */
export function getCountries(): readonly Country[] {
  return countriesData.map((country) => ({
    id: country.id,
    alphaCode: country.alphaCode,
    nameEn: country.nameEn,
    nameFr: country.nameFr,
  }));
}

/**
 * Retrieves a single country by its ID.
 *
 * @param id The ID of the country to retrieve.
 * @returns The country object if found.
 * @throws {AppError} If the country is not found.
 */
export function getCountryById(id: string): Country {
  const country = getCountries().find((c) => c.id === id);
  if (!country) {
    throw new AppError(`Country with ID '${id}' not found.`, ErrorCodes.NO_COUNTRY_FOUND);
  }
  return country;
}

type LocalizedCountry = Readonly<{
  id: string;
  alphaCode: string;
  name: string;
}>;

/**
 * Retrieves a list of countries localized to the specified language.
 *
 * @param language The language to localize the country names to (default: 'en').
 * @returns An array of localized country objects.
 */
export function getLocalizedCountries(language: Language = 'en'): readonly LocalizedCountry[] {
  const { PP_CANADA_COUNTRY_CODE } = serverEnvironment;

  const countries = getCountries().map((country) => ({
    id: country.id,
    alphaCode: country.alphaCode,
    name: language === 'fr' ? country.nameFr : country.nameEn,
  }));

  return countries
    .filter((country) => country.id === PP_CANADA_COUNTRY_CODE)
    .concat(
      countries
        .filter((country) => country.id !== PP_CANADA_COUNTRY_CODE)
        .sort((a, b) => a.name.localeCompare(b.name, language, { sensitivity: 'base' })),
    );
}

/**
 * Retrieves a single localized country by its ID.
 *
 * @param id The ID of the country to retrieve.
 * @param language The language to localize the country name to (default: 'en').
 * @returns The localized country object if found.
 * @throws {AppError} If the country is not found.
 */
export function getLocalizedCountryById(id: string, language: Language = 'en'): LocalizedCountry {
  const country = getLocalizedCountries(language).find((c) => c.id === id);
  if (!country) {
    throw new AppError(`Localized country with ID '${id}' not found.`, ErrorCodes.NO_COUNTRY_FOUND);
  }
  return country;
}

type Province = Readonly<{
  id: string;
  alphaCode: string;
  nameEn: string;
  nameFr: string;
}>;

/**
 * Retrieves a list of all provinces.
 *
 * @returns An array of province objects.
 */
export function getProvinces(): readonly Province[] {
  return provincesData.map((province) => ({
    id: province.id,
    alphaCode: province.alphaCode,
    nameEn: province.nameEn,
    nameFr: province.nameFr,
  }));
}

/**
 * Retrieves a single province by its ID.
 *
 * @param id The ID of the province to retrieve.
 * @returns The province object if found.
 * @throws {AppError} If the province is not found.
 */
export function getProvinceById(id: string): Province {
  const province = getProvinces().find((p) => p.id === id);
  if (!province) {
    throw new AppError(`Province with ID '${id}' not found.`, ErrorCodes.NO_PROVINCE_FOUND);
  }
  return province;
}

type LocalizedProvince = Readonly<{
  id: string;
  alphaCode: string;
  name: string;
}>;

/**
 * Retrieves a list of provinces localized to the specified language.
 *
 * @param language The language to localize the province names to (default: 'en').
 * @returns An array of localized province objects.
 */
export function getLocalizedProvinces(language: Language = 'en'): readonly LocalizedProvince[] {
  return getProvinces()
    .map((province) => ({
      id: province.id,
      alphaCode: province.alphaCode,
      name: language === 'fr' ? province.nameFr : province.nameEn,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, language, { sensitivity: 'base' }));
}

/**
 * Retrieves a single localized province by its ID.
 *
 * @param id The ID of the province to retrieve.
 * @param language The language to localize the province name to (default: 'en').
 * @returns The localized province object if found.
 * @throws {AppError} If the province is not found.
 */
export function getLocalizedProvinceById(id: string, language: Language = 'en'): LocalizedProvince {
  const province = getLocalizedProvinces(language).find((p) => p.id === id);
  if (!province) {
    throw new AppError(`Localized province with ID '${id}' not found.`, ErrorCodes.NO_PROVINCE_FOUND);
  }
  return province;
}

type LanguageOfCorrespondence = Readonly<{
  id: string;
  nameEn: string | null;
  nameFr: string | null;
}>;

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
  const language = getLanguagesOfCorrespondence().find((l) => l.id === id);
  if (!language) {
    throw new AppError(`Language of correspondence with ID '${id}' not found.`, ErrorCodes.NO_LANGUAGE_FOUND);
  }
  return language;
}

type LocalizedPreferredLanguage = Readonly<{
  id: string;
  name: string | null;
}>;

/**
 * Retrieves a list of languages of correspondence localized to the specified language.
 *
 * @param language The language to localize the language names to (default: 'en').
 * @returns An array of localized language of correspondence objects.
 */
export function getLocalizedLanguageOfCorrespondence(language: Language = 'en'): LocalizedPreferredLanguage[] {
  return getLanguagesOfCorrespondence().map((option) => ({
    id: option.id,
    name: language === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized language of correspondence by its ID.
 *
 * @param id The ID of the language of correspondence to retrieve.
 * @param language The language to localize the language name to (default: 'en').
 * @returns The localized language of correspondence object if found.
 * @throws {AppError} If the language of correspondence is not found.
 */
export function getLocalizedLanguageOfCorrespondenceById(id: string, language: Language = 'en'): LocalizedPreferredLanguage {
  const languageOfCorrespondence = getLocalizedLanguageOfCorrespondence(language).find((l) => l.id === id);
  if (!languageOfCorrespondence) {
    throw new AppError(
      `Localized language of correspondence with ID '${id}' not found.`,
      ErrorCodes.NO_LANGUAGE_OF_CORRESPONDENCE_FOUND,
    );
  }
  return languageOfCorrespondence;
}

type ApplicantGender = Readonly<{
  id: string;
  nameEn: string | null;
  nameFr: string | null;
}>;

/**
 * Retrieves a list of applicant genders.
 *
 * @returns An array of applicant gender objects.
 */
export function getApplicantGenders(): readonly ApplicantGender[] {
  const optionSet = getOptionSet('esdc_applicantgender');
  return optionSet.options.map((option) => ({
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

export type LocalizedApplicantGender = Readonly<{
  id: string;
  name: string | null;
}>;

/**
 * Retrieves a list of applicant genders localized to the specified language.
 *
 * @param language The language to localize the gender names to (default: 'en').
 * @returns An array of localized applicant gender objects.
 */
export function getLocalizedApplicantGenders(language: Language = 'en'): LocalizedApplicantGender[] {
  return getApplicantGenders().map((option) => ({
    id: option.id,
    name: language === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized applicant gender by its ID.
 *
 * @param id The ID of the applicant gender to retrieve.
 * @param language The language to localize the gender name to (default: 'en').
 * @returns The localized applicant gender object if found.
 * @throws {AppError} If the applicant gender is not found.
 */
export function getLocalizedApplicantGenderById(id: string, language: Language = 'en'): LocalizedApplicantGender {
  const gender = getLocalizedApplicantGenders(language).find((g) => g.id === id);
  if (!gender) {
    throw new AppError(`Localized applicant gender with ID '${id}' not found.`, ErrorCodes.NO_GENDER_FOUND);
  }
  return gender;
}
