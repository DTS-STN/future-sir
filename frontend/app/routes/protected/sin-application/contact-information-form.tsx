import { useState } from 'react';

import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';

import { InputField } from '~/components/input-field';
import { InputPhoneField } from '~/components/input-phone-field';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import type {
  ContactInformationData,
  Errors,
  LocalizedLocations,
  LocalizedOptions,
} from '~/routes/protected/sin-application/types';
import { getSingleKey } from '~/utils/i18n-utils';

export const handle = {
  i18nNamespace: ['protected'],
} as const satisfies RouteHandle;

interface ContactInformationFormProps {
  localizedPreferredLanguages: LocalizedOptions;
  localizedCountries: LocalizedLocations;
  localizedProvincesTerritoriesStates: LocalizedLocations;
  defaultFormValues: ContactInformationData | undefined;
  errors: Errors;
}

export default function ContactInformationForm({
  localizedPreferredLanguages,
  localizedCountries,
  localizedProvincesTerritoriesStates,
  defaultFormValues,
  errors,
}: ContactInformationFormProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const [country, setCountry] = useState<string | undefined>(defaultFormValues?.country);

  const languageOptions = localizedPreferredLanguages.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === defaultFormValues?.preferredLanguage,
  }));

  const countryOptions = [{ id: 'select-option', name: '' }, ...localizedCountries].map(({ id, name }) => ({
    value: id === 'select-option' ? '' : id,
    children: id === 'select-option' ? t('protected:contact-information.select-option') : name,
  }));

  const provinceTerritoryStateOptions = [{ id: 'select-option', name: '' }, ...localizedProvincesTerritoriesStates].map(
    ({ id, name }) => ({
      value: id === 'select-option' ? '' : id,
      children: id === 'select-option' ? t('protected:contact-information.select-option') : name,
    }),
  );

  return (
    <div className="space-y-6">
      <h2 className="font-lato text-2xl font-bold">{t('protected:contact-information.correspondence')}</h2>
      <InputRadios
        id="preferred-language"
        legend={t('protected:contact-information.preferred-language-label')}
        name="preferredLanguage"
        options={languageOptions}
        errorMessage={t(getSingleKey(errors?.preferredLanguage))}
        required
      />
      <InputPhoneField
        id="primary-phone-number"
        label={t('protected:contact-information.primary-phone-label')}
        name="primaryPhoneNumber"
        type="tel"
        inputMode="tel"
        errorMessage={t(getSingleKey(errors?.primaryPhoneNumber))}
        defaultValue={defaultFormValues?.primaryPhoneNumber}
        required
      />
      <InputPhoneField
        id="secondary-phone-number"
        label={t('protected:contact-information.secondary-phone-label')}
        name="secondaryPhoneNumber"
        type="tel"
        inputMode="tel"
        errorMessage={t(getSingleKey(errors?.secondaryPhoneNumber))}
        defaultValue={defaultFormValues?.secondaryPhoneNumber}
      />
      <div className="max-w-prose">
        <InputField
          id="email-address"
          type="email"
          inputMode="email"
          label={t('protected:contact-information.email-label')}
          name="emailAddress"
          className="w-full"
          errorMessage={t(getSingleKey(errors?.emailAddress))}
          defaultValue={defaultFormValues?.emailAddress}
        />
      </div>
      <h2 className="font-lato text-2xl font-bold">{t('protected:contact-information.mailing-address')}</h2>
      <InputSelect
        className="w-max rounded-sm"
        id="country"
        name="country"
        label={t('protected:contact-information.country-select-label')}
        options={countryOptions}
        errorMessage={t(getSingleKey(errors?.country))}
        defaultValue={defaultFormValues?.country}
        onChange={({ target }) => setCountry(target.value)}
        required
      />
      {country && (
        <>
          <InputField
            id="address"
            label={t('protected:contact-information.address-label')}
            helpMessagePrimary={t('protected:contact-information.address-help-message')}
            name="address"
            className="w-full"
            errorMessage={t(getSingleKey(errors?.address))}
            defaultValue={defaultFormValues?.address}
            required
          />
          <InputField
            id="postal-code"
            label={t('protected:contact-information.postal-code-label')}
            name="postalCode"
            errorMessage={t(getSingleKey(errors?.postalCode))}
            defaultValue={defaultFormValues?.postalCode}
            required
          />
          <InputField
            id="city"
            label={t('protected:contact-information.city-label')}
            name="city"
            className="w-full"
            errorMessage={t(getSingleKey(errors?.city))}
            defaultValue={defaultFormValues?.city}
            required
          />
          {country === globalThis.__appEnvironment.PP_CANADA_COUNTRY_CODE ? (
            <InputSelect
              className="w-max rounded-sm"
              id="province"
              label={t('protected:contact-information.canada-province-label')}
              name="province"
              options={provinceTerritoryStateOptions}
              errorMessage={t(getSingleKey(errors?.province))}
              defaultValue={defaultFormValues?.province}
              required
            />
          ) : (
            <InputField
              id="province"
              label={t('protected:contact-information.other-country-province-label')}
              name="province"
              className="w-full"
              errorMessage={t(getSingleKey(errors?.province))}
              defaultValue={defaultFormValues?.province}
              required
            />
          )}
        </>
      )}
    </div>
  );
}
