import countryData from '~/.server/resources/countries.json';

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
