import countryData from '~/.server/resources/countries.json';
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
  return getCountries().map((country) => ({
    id: country.id,
    name: country[locale === 'en' ? 'nameEn' : 'nameFr'],
  }));
}

type ProvinceTerritoryState = Readonly<{
  id: string;
  countryId: string;
  nameEn: string;
  nameFr: string;
}>;

export function getProvincesTerritoriesStates(): readonly ProvinceTerritoryState[] {
  return provinceTerritoryStateData.value.map((region) => ({
    id: region.esdc_provinceterritorystateid,
    countryId: region._esdc_countryid_value,
    nameEn: region.esdc_nameenglish,
    nameFr: region.esdc_namefrench,
  }));
}

type LocalizedProvinceTerritoryState = Readonly<{
  id: string;
  countryId: string;
  name: string;
}>;

export function getLocalizedProvincesTerritoriesStates(locale: Language = 'en'): readonly LocalizedProvinceTerritoryState[] {
  return getProvincesTerritoriesStates().map((region) => ({
    id: region.id,
    countryId: region.countryId,
    name: region[locale === 'en' ? 'nameEn' : 'nameFr'],
  }));
}
