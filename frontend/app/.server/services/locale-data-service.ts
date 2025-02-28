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
 * @param locale The language to localize the country names to (default: 'en').
 * @returns An array of localized country objects.
 */
export function getLocalizedCountries(locale: Language = 'en'): readonly LocalizedCountry[] {
  const { PP_CANADA_COUNTRY_CODE } = serverEnvironment;

  const countries = getCountries().map((country) => ({
    id: country.id,
    alphaCode: country.alphaCode,
    name: locale === 'fr' ? country.nameFr : country.nameEn,
  }));

  return countries
    .filter((country) => country.id === PP_CANADA_COUNTRY_CODE)
    .concat(
      countries
        .filter((country) => country.id !== PP_CANADA_COUNTRY_CODE)
        .sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: 'base' })),
    );
}

/**
 * Retrieves a single localized country by its ID.
 *
 * @param id The ID of the country to retrieve.
 * @param locale The language to localize the country name to (default: 'en').
 * @returns The localized country object if found.
 * @throws {AppError} If the country is not found.
 */
export function getLocalizedCountryById(id: string, locale: Language = 'en'): LocalizedCountry {
  const country = getLocalizedCountries(locale).find((c) => c.id === id);
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
 * @param locale The language to localize the province names to (default: 'en').
 * @returns An array of localized province objects.
 */
export function getLocalizedProvinces(locale: Language = 'en'): readonly LocalizedProvince[] {
  return getProvinces()
    .map((province) => ({
      id: province.id,
      alphaCode: province.alphaCode,
      name: locale === 'fr' ? province.nameFr : province.nameEn,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: 'base' }));
}

/**
 * Retrieves a single localized province by its ID.
 *
 * @param id The ID of the province to retrieve.
 * @param locale The language to localize the province name to (default: 'en').
 * @returns The localized province object if found.
 * @throws {AppError} If the province is not found.
 */
export function getLocalizedProvinceById(id: string, locale: Language = 'en'): LocalizedProvince {
  const province = getLocalizedProvinces(locale).find((p) => p.id === id);
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
 * @param locale The language to localize the language names to (default: 'en').
 * @returns An array of localized language of correspondence objects.
 */
export function getLocalizedLanguageOfCorrespondence(locale: Language = 'en'): LocalizedPreferredLanguage[] {
  return getLanguagesOfCorrespondence().map((option) => ({
    id: option.id,
    name: locale === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized language of correspondence by its ID.
 *
 * @param id The ID of the language of correspondence to retrieve.
 * @param locale The language to localize the language name to (default: 'en').
 * @returns The localized language of correspondence object if found.
 * @throws {AppError} If the language of correspondence is not found.
 */
export function getLocalizedLanguageOfCorrespondenceById(id: string, locale: Language = 'en'): LocalizedPreferredLanguage {
  const language = getLocalizedLanguageOfCorrespondence(locale).find((l) => l.id === id);
  if (!language) {
    throw new AppError(`Localized language of correspondence with ID '${id}' not found.`, ErrorCodes.NO_LANGUAGE_FOUND);
  }
  return language;
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
 * @param locale The language to localize the gender names to (default: 'en').
 * @returns An array of localized applicant gender objects.
 */
export function getLocalizedApplicantGenders(locale: Language = 'en'): LocalizedApplicantGender[] {
  return getApplicantGenders().map((option) => ({
    id: option.id,
    name: locale === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized applicant gender by its ID.
 *
 * @param id The ID of the applicant gender to retrieve.
 * @param locale The language to localize the gender name to (default: 'en').
 * @returns The localized applicant gender object if found.
 * @throws {AppError} If the applicant gender is not found.
 */
export function getLocalizedApplicantGenderById(id: string, locale: Language = 'en'): LocalizedApplicantGender {
  const gender = getLocalizedApplicantGenders(locale).find((g) => g.id === id);
  if (!gender) {
    throw new AppError(`Localized applicant gender with ID '${id}' not found.`, ErrorCodes.NO_GENDER_FOUND);
  }
  return gender;
}

type ApplicationSubmissionScenario = Readonly<{
  id: string;
  nameEn: string | null;
  nameFr: string | null;
}>;

/**
 * Retrieves a list of application submission scenarios.
 *
 * @returns An array of application submission scenario objects.
 */
export function getApplicationSubmissionScenarios(): readonly ApplicationSubmissionScenario[] {
  const optionSet = getOptionSet('esdc_applicationsubmissionscenarios');
  return optionSet.options.map((option) => ({
    id: option.value.toString(),
    nameEn: option.labelEn,
    nameFr: option.labelFr,
  }));
}

/**
 * Retrieves a single application submission scenario by its ID.
 *
 * @param id The ID of the application submission scenario to retrieve.
 * @returns The application submission scenario object if found.
 * @throws {AppError} If the scenario is not found.
 */
export function getApplicationSubmissionScenarioById(id: string): ApplicationSubmissionScenario {
  const scenario = getApplicationSubmissionScenarios().find((s) => s.id === id);
  if (!scenario) {
    throw new AppError(
      `Application submission scenario with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICATION_SUBMISSION_SCENARIO_FOUND,
    );
  }
  return scenario;
}

export type LocalizedApplicationSubmissionScenario = Readonly<{
  id: string;
  name: string | null;
}>;

/**
 * Retrieves a list of application submission scenarios localized to the specified language.
 *
 * @param locale The language to localize the scenario names to (default: 'en').
 * @returns An array of localized application submission scenario objects.
 */
export function getLocalizedApplicationSubmissionScenarios(locale: Language = 'en'): LocalizedApplicationSubmissionScenario[] {
  return getApplicationSubmissionScenarios().map((option) => ({
    id: option.id,
    name: locale === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized application submission scenario by its ID.
 *
 * @param id The ID of the application submission scenario to retrieve.
 * @param locale The language to localize the scenario name to (default: 'en').
 * @returns The localized application submission scenario object if found.
 * @throws {AppError} If the scenario is not found.
 */
export function getLocalizedApplicationSubmissionScenarioById(
  id: string,
  locale: Language = 'en',
): LocalizedApplicationSubmissionScenario {
  const scenario = getLocalizedApplicationSubmissionScenarios(locale).find((s) => s.id === id);
  if (!scenario) {
    throw new AppError(
      `Localized application submission scenario with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICATION_SUBMISSION_SCENARIO_FOUND,
    );
  }
  return scenario;
}

type TypeOfApplicationToSubmit = Readonly<{
  id: string;
  nameEn: string | null;
  nameFr: string | null;
}>;

/**
 * Retrieves a list of types of applications to submit.
 *
 * @returns An array of type of application to submit objects.
 */
export function getTypesOfApplicationToSubmit(): readonly TypeOfApplicationToSubmit[] {
  const optionSet = getOptionSet('esdc_typeofapplicationtosubmit');
  return optionSet.options.map((option) => ({
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

export type LocalizedTypeOfApplicationToSubmit = Readonly<{
  id: string;
  name: string | null;
}>;

/**
 * Retrieves a list of types of applications to submit localized to the specified language.
 *
 * @param locale The language to localize the type names to (default: 'en').
 * @returns An array of localized type of application to submit objects.
 */
export function getLocalizedTypesOfApplicationToSubmit(locale: Language = 'en'): LocalizedTypeOfApplicationToSubmit[] {
  return getTypesOfApplicationToSubmit().map((option) => ({
    id: option.id,
    name: locale === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized type of application to submit by its ID.
 *
 * @param id The ID of the type of application to submit to retrieve.
 * @param locale The language to localize the type name to (default: 'en').
 * @returns The localized type of application to submit object if found.
 * @throws {AppError} If the type is not found.
 */
export function getLocalizedTypeOfApplicationToSubmitById(
  id: string,
  locale: Language = 'en',
): LocalizedTypeOfApplicationToSubmit {
  const type = getLocalizedTypesOfApplicationToSubmit(locale).find((t) => t.id === id);
  if (!type) {
    throw new AppError(
      `Localized type of application to submit with ID '${id}' not found.`,
      ErrorCodes.NO_TYPE_OF_APPLICATION_TO_SUBMIT_FOUND,
    );
  }
  return type;
}

type ApplicantPrimaryDocumentChoice = Readonly<{
  id: string;
  nameEn: string | null;
  nameFr: string | null;
}>;

/**
 * Retrieves a list of applicant primary document choices.
 *
 * @returns An array of applicant primary document choice objects.
 */
export function getApplicantPrimaryDocumentChoices(): readonly ApplicantPrimaryDocumentChoice[] {
  const optionSet = getOptionSet('esdc_applicantprimarydocumentchoices');
  return optionSet.options.map((option) => ({
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

export type LocalizedApplicantPrimaryDocumentChoice = Readonly<{
  id: string;
  name: string | null;
}>;

/**
 * Retrieves a list of applicant primary document choices localized to the specified language.
 *
 * @param locale The language to localize the choice names to (default: 'en').
 * @returns An array of localized applicant primary document choice objects.
 */
export function getLocalizedApplicantPrimaryDocumentChoices(
  locale: Language = 'en',
): LocalizedApplicantPrimaryDocumentChoice[] {
  return getApplicantPrimaryDocumentChoices().map((option) => ({
    id: option.id,
    name: locale === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized applicant primary document choice by its ID.
 *
 * @param id The ID of the applicant primary document choice to retrieve.
 * @param locale The language to localize the choice name to (default: 'en').
 * @returns The localized applicant primary document choice object if found.
 * @throws {AppError} If the choice is not found.
 */
export function getLocalizedApplicantPrimaryDocumentChoiceById(
  id: string,
  locale: Language = 'en',
): LocalizedApplicantPrimaryDocumentChoice {
  const choice = getLocalizedApplicantPrimaryDocumentChoices(locale).find((c) => c.id === id);
  if (!choice) {
    throw new AppError(
      `Localized applicant primary document choice with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICANT_PRIMARY_DOCUMENT_CHOICE_FOUND,
    );
  }
  return choice;
}

type ApplicantSecondaryDocumentChoice = Readonly<{
  id: string;
  nameEn: string | null;
  nameFr: string | null;
}>;

/**
 * Retrieves a list of applicant secondary document choices.
 *
 * @returns An array of applicant secondary document choice objects.
 */
export function getApplicantSecondaryDocumentChoices(): readonly ApplicantSecondaryDocumentChoice[] {
  const optionSet = getOptionSet('esdc_applicantsecondarydocumentchoices');
  return optionSet.options.map((option) => ({
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

export type LocalizedApplicantSecondaryDocumentChoice = Readonly<{
  id: string;
  name: string | null;
}>;

/**
 * Retrieves a list of applicant secondary document choices localized to the specified language.
 *
 * @param locale The language to localize the choice names to (default: 'en').
 * @returns An array of localized applicant secondary document choice objects.
 */
export function getLocalizedApplicantSecondaryDocumentChoices(
  locale: Language = 'en',
): LocalizedApplicantSecondaryDocumentChoice[] {
  return getApplicantSecondaryDocumentChoices().map((option) => ({
    id: option.id,
    name: locale === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized applicant secondary document choice by its ID.
 *
 * @param id The ID of the applicant secondary document choice to retrieve.
 * @param locale The language to localize the choice name to (default: 'en').
 * @returns The localized applicant secondary document choice object if found.
 * @throws {AppError} If the choice is not found.
 */
export function getLocalizedApplicantSecondaryDocumentChoiceById(
  id: string,
  locale: Language = 'en',
): LocalizedApplicantSecondaryDocumentChoice {
  const choice = getLocalizedApplicantSecondaryDocumentChoices(locale).find((c) => c.id === id);
  if (!choice) {
    throw new AppError(
      `Localized applicant secondary document choice with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICANT_SECONDARY_DOCUMENT_CHOICE_FOUND,
    );
  }
  return choice;
}

type ApplicantHadSinOption = Readonly<{
  id: string;
  nameEn: string | null;
  nameFr: string | null;
}>;

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

export type LocalizedApplicantHadSinOption = Readonly<{
  id: string;
  name: string | null;
}>;

/**
 * Retrieves a list of applicant had SIN options localized to the specified language.
 *
 * @param locale The language to localize the option names to (default: 'en').
 * @returns An array of localized applicant had SIN option objects.
 */
export function getLocalizedApplicantHadSinOptions(locale: Language = 'en'): LocalizedApplicantHadSinOption[] {
  return getApplicantHadSinOptions().map((option) => ({
    id: option.id,
    name: locale === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized applicant had SIN option by its ID.
 *
 * @param id The ID of the applicant had SIN option to retrieve.
 * @param locale The language to localize the option name to (default: 'en').
 * @returns The localized applicant had SIN option object if found.
 * @throws {AppError} If the option is not found.
 */
export function getLocalizedApplicantHadSinOptionById(id: string, locale: Language = 'en'): LocalizedApplicantHadSinOption {
  const option = getLocalizedApplicantHadSinOptions(locale).find((o) => o.id === id);
  if (!option) {
    throw new AppError(
      `Localized applicant had SIN option with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICANT_HAD_SIN_OPTION_FOUND,
    );
  }
  return option;
}
