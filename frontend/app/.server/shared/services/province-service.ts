import esdcProvincesData from '~/.server/resources/esdc_provinces.json';
import type { LocalizedProvince, Province } from '~/.server/shared/models';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * Retrieves a list of all provinces.
 *
 * @returns An array of province objects.
 */
export function getProvinces(): readonly Province[] {
  return esdcProvincesData.map((province) => ({
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

/**
 * Retrieves a list of provinces localized to the specified language.
 *
 * @param language The language to localize the province names to.
 * @returns An array of localized province objects.
 */
export function getLocalizedProvinces(language: Language): readonly LocalizedProvince[] {
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
 * @param language The language to localize the province name to.
 * @returns The localized province object if found.
 * @throws {AppError} If the province is not found.
 */
export function getLocalizedProvinceById(id: string, language: Language): LocalizedProvince {
  const province = getLocalizedProvinces(language).find((p) => p.id === id);
  if (!province) {
    throw new AppError(`Localized province with ID '${id}' not found.`, ErrorCodes.NO_PROVINCE_FOUND);
  }
  return province;
}
