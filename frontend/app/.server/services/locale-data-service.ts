import { serverEnvironment } from '~/.server/environment';
import countryData from '~/.server/resources/countries.json';
import genderData from '~/.server/resources/genders.json';
import preferredLanguageData from '~/.server/resources/preferred-language.json';
import provinceTerritoryStateData from '~/.server/resources/province-territory-state.json';

type Country = Readonly<{
  id: string;
  nameEn: string;
  nameFr: string;
}>;

export function getCountries(): readonly Country[] {
  return countryData.value.map((country) => ({
    id: country.esdc_countryid,
    nameEn: country.esdc_nameenglish,
    nameFr: country.esdc_namefrench,
  }));
}

type LocalizedCountry = Readonly<{
  id: string;
  name: string;
}>;

export function getLocalizedCountries(locale: Language = 'en'): readonly LocalizedCountry[] {
  const { PP_CANADA_COUNTRY_CODE } = serverEnvironment;
  const countries = getCountries().map((country) => ({
    id: country.id,
    name: country[locale === 'en' ? 'nameEn' : 'nameFr'],
  }));
  return countries
    .filter((country) => country.id === PP_CANADA_COUNTRY_CODE)
    .concat(
      countries
        .filter((country) => country.id !== PP_CANADA_COUNTRY_CODE)
        .sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: 'base' })),
    );
}

type ProvinceTerritory = Readonly<{
  id: string;
  nameEn: string;
  nameFr: string;
}>;

export function getProvincesTerritories(): readonly ProvinceTerritory[] {
  const { PP_CANADA_COUNTRY_CODE } = serverEnvironment;
  return provinceTerritoryStateData.value
    .filter((region) => region._esdc_countryid_value === PP_CANADA_COUNTRY_CODE)
    .map((region) => ({
      id: region.esdc_provinceterritorystateid,
      nameEn: region.esdc_nameenglish,
      nameFr: region.esdc_namefrench,
    }));
}

type LocalizedProvinceTerritory = Readonly<{
  id: string;
  name: string;
}>;

export function getLocalizedProvincesTerritoriesStates(locale: Language = 'en'): readonly LocalizedProvinceTerritory[] {
  return getProvincesTerritories()
    .map((region) => ({
      id: region.id,
      name: region[locale === 'en' ? 'nameEn' : 'nameFr'],
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: 'base' }));
}

type PreferredLanguage = Readonly<{
  id: string;
  nameEn: string;
  nameFr: string;
}>;

// TODO: throw AppError if `.find` fails?
export function getPreferredLanguages(): readonly PreferredLanguage[] {
  const { PP_ENGLISH_LANGUAGE_CODE, PP_FRENCH_LANGUAGE_CODE } = serverEnvironment;
  return (
    preferredLanguageData.value.at(0)?.OptionSet.Options.map((obj) => ({
      id: obj.Value.toString(),
      nameEn: obj.Label.LocalizedLabels.find((lbl) => lbl.LanguageCode === PP_ENGLISH_LANGUAGE_CODE)?.Label ?? '',
      nameFr: obj.Label.LocalizedLabels.find((lbl) => lbl.LanguageCode === PP_FRENCH_LANGUAGE_CODE)?.Label ?? '',
    })) ?? []
  );
}

type LocalizedPreferredLanguage = Readonly<{
  id: string;
  name: string;
}>;

export function getLocalizedPreferredLanguages(locale: Language = 'en'): LocalizedPreferredLanguage[] {
  return getPreferredLanguages().map((obj) => ({
    id: obj.id,
    name: obj[locale === 'en' ? 'nameEn' : 'nameFr'],
  }));
}

type Gender = Readonly<{
  id: string;
  nameEn: string;
  nameFr: string;
}>;

// TODO: throw AppError if `.find` fails?
export function getGenders(): readonly Gender[] {
  const { PP_ENGLISH_LANGUAGE_CODE, PP_FRENCH_LANGUAGE_CODE } = serverEnvironment;
  return (
    genderData.value.at(0)?.OptionSet.Options.map((obj) => ({
      id: obj.Value.toString(),
      nameEn: obj.Label.LocalizedLabels.find((lbl) => lbl.LanguageCode === PP_ENGLISH_LANGUAGE_CODE)?.Label ?? '',
      nameFr: obj.Label.LocalizedLabels.find((lbl) => lbl.LanguageCode === PP_FRENCH_LANGUAGE_CODE)?.Label ?? '',
    })) ?? []
  );
}

export type LocalizedGender = Readonly<{
  id: string;
  name: string;
}>;

export function getLocalizedGenders(locale: Language = 'en'): LocalizedGender[] {
  return getGenders().map((obj) => ({
    id: obj.id,
    name: obj[locale === 'en' ? 'nameEn' : 'nameFr'],
  }));
}
