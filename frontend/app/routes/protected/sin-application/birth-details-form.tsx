import { useState } from 'react';

import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';

import { InputField } from '~/components/input-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import type { BirthDetailsData, Errors, LocalizedLocations } from '~/routes/protected/sin-application/types';
import { getSingleKey } from '~/utils/i18n-utils';

const REQUIRE_OPTIONS = { yes: 'Yes', no: 'No' } as const;

export const handle = {
  i18nNamespace: ['gcweb', 'protected'],
} as const satisfies RouteHandle;

interface BirthDetailsFormProps {
  localizedCountries: LocalizedLocations;
  localizedProvincesTerritoriesStates: LocalizedLocations;
  defaultFormValues: BirthDetailsData | undefined;
  errors: Errors;
}

export default function BirthDetailsForm({
  localizedCountries,
  localizedProvincesTerritoriesStates,
  defaultFormValues,
  errors,
}: BirthDetailsFormProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const [country, setCountry] = useState(defaultFormValues?.country);
  const [fromMultipleBirth, setFromMultipleBirth] = useState(defaultFormValues?.fromMultipleBirth);

  const countryOptions = [{ id: 'select-option', name: '' }, ...localizedCountries].map(({ id, name }) => ({
    value: id === 'select-option' ? '' : id,
    children: id === 'select-option' ? t('protected:birth-details.select-option') : name,
  }));

  const provinceTerritoryStateOptions = [{ id: 'select-option', name: '' }, ...localizedProvincesTerritoriesStates].map(
    ({ id, name }) => ({
      value: id === 'select-option' ? '' : id,
      children: id === 'select-option' ? t('protected:contact-information.select-option') : name,
    }),
  );

  const fromMultipleBirthOptions: InputRadiosProps['options'] = [
    {
      children: t('gcweb:input-option.yes'),
      value: REQUIRE_OPTIONS.yes,
      defaultChecked: fromMultipleBirth === true,
      onChange: ({ target }) => setFromMultipleBirth(target.value === REQUIRE_OPTIONS.yes),
    },
    {
      children: t('gcweb:input-option.no'),
      value: REQUIRE_OPTIONS.no,
      defaultChecked: fromMultipleBirth === false,
      onChange: ({ target }) => setFromMultipleBirth(target.value === REQUIRE_OPTIONS.yes),
    },
  ];

  return (
    <div className="space-y-6">
      <InputSelect
        id="country-id"
        name="country"
        errorMessage={t(getSingleKey(errors?.country))}
        defaultValue={defaultFormValues?.country ?? ''}
        required
        options={countryOptions}
        label={t('protected:birth-details.country.label')}
        onChange={({ target }) => setCountry(target.value)}
        className="w-full rounded-sm sm:w-104"
      />
      {country && (
        <>
          {country === globalThis.__appEnvironment.PP_CANADA_COUNTRY_CODE ? (
            <InputSelect
              className="w-max rounded-sm"
              id="province"
              label={t('protected:birth-details.province.label')}
              name="province"
              options={provinceTerritoryStateOptions}
              errorMessage={t(getSingleKey(errors?.province))}
              defaultValue={defaultFormValues?.province}
              required
            />
          ) : (
            <InputField
              errorMessage={t(getSingleKey(errors?.province))}
              label={t('protected:birth-details.province.label')}
              name="province"
              defaultValue={defaultFormValues?.province}
              required={country === globalThis.__appEnvironment.PP_CANADA_COUNTRY_CODE}
              type="text"
              className="w-full rounded-sm sm:w-104"
            />
          )}
          <InputField
            errorMessage={t(getSingleKey(errors?.city))}
            label={t('protected:birth-details.city.label')}
            name="city"
            defaultValue={defaultFormValues?.city}
            required={country === globalThis.__appEnvironment.PP_CANADA_COUNTRY_CODE}
            type="text"
            className="w-full rounded-sm sm:w-104"
          />
          <InputRadios
            id="from-multiple-id"
            legend={t('protected:birth-details.from-multiple.label')}
            name="from-multiple"
            options={fromMultipleBirthOptions}
            required
            errorMessage={t(getSingleKey(errors?.fromMultipleBirth))}
          />
        </>
      )}
    </div>
  );
}
