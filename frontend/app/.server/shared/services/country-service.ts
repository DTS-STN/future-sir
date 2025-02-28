import { serverEnvironment } from '~/.server/environment';
import esdcCountriesData from '~/.server/resources/esdc_countries.json';
import type { Country, LocalizedCountry } from '~/.server/shared/models';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * Retrieves a list of all countries.
 *
 * @returns An array of country objects.
 */
export function getCountries(): readonly Country[] {
  return esdcCountriesData.map((country) => ({
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

/**
 * Retrieves a list of countries localized to the specified language.
 *
 * @param language The language to localize the country names to.
 * @returns An array of localized country objects.
 */
export function getLocalizedCountries(language: Language): readonly LocalizedCountry[] {
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
 * @param language The language to localize the country name to.
 * @returns The localized country object if found.
 * @throws {AppError} If the country is not found.
 */
export function getLocalizedCountryById(id: string, language: Language): LocalizedCountry {
  const country = getLocalizedCountries(language).find((c) => c.id === id);
  if (!country) {
    throw new AppError(`Localized country with ID '${id}' not found.`, ErrorCodes.NO_COUNTRY_FOUND);
  }
  return country;
}
