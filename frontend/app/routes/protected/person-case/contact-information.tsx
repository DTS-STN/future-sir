import { useId, useState } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/contact-information';

import { getLocalizedLanguageOfCorrespondence } from '~/.server/domain/person-case/services/language-correspondence-service';
import { getLocalizedCountries } from '~/.server/shared/services/country-service';
import { getLocalizedProvinces } from '~/.server/shared/services/province-service';
import { requireAllRoles } from '~/.server/utils/auth-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputPhoneField } from '~/components/input-phone-field';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { getTabIdOrRedirect, loadMachineActorOrRedirect } from '~/routes/protected/person-case/route-helpers.server';
import { getStateRoute } from '~/routes/protected/person-case/state-machine.server';
import { contactInformationSchema } from '~/routes/protected/person-case/validation.server';
import { getSingleKey } from '~/utils/i18n-utils';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const tabId = getTabIdOrRedirect(request);
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'contact-info' });

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      machineActor.send({ type: 'prev' });
      break;
    }

    case 'next': {
      const parseResult = v.safeParse(contactInformationSchema, {
        preferredLanguage: formData.get('preferredLanguage') as string,
        primaryPhoneNumber: formData.get('primaryPhoneNumber') as string,
        secondaryPhoneNumber: formData.get('secondaryPhoneNumber')
          ? (formData.get('secondaryPhoneNumber') as string)
          : undefined,
        emailAddress: formData.get('emailAddress') ? (formData.get('emailAddress') as string) : undefined,
        country: formData.get('country') as string,
        address: formData.get('address') as string,
        postalCode: formData.get('postalCode') as string,
        city: formData.get('city') as string,
        province: formData.get('province') as string,
      });

      if (!parseResult.success) {
        return data(
          { errors: v.flatten<typeof contactInformationSchema>(parseResult.issues).nested },
          { status: HttpStatusCodes.BAD_REQUEST },
        );
      }

      machineActor.send({ type: 'submitContactInfo', data: parseResult.output });
      break;
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }

  throw redirect(getStateRoute(machineActor, { context, params, request }));
}

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const tabId = getTabIdOrRedirect(request);
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'contact-info' });
  const { contactInformation } = machineActor.getSnapshot().context;

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:contact-information.page-title'),
    defaultFormValues: contactInformation,
    localizedpreferredLanguages: getLocalizedLanguageOfCorrespondence(lang),
    localizedCountries: getLocalizedCountries(lang),
    localizedProvincesTerritoriesStates: getLocalizedProvinces(lang),
  };
}

export default function ContactInformation({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  const [country, setCountry] = useState<string | undefined>(loaderData.defaultFormValues?.country);

  const languageOptions = loaderData.localizedpreferredLanguages.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === loaderData.defaultFormValues?.preferredLanguage,
  }));

  const countryOptions = [{ id: 'select-option', name: '' }, ...loaderData.localizedCountries].map(({ id, name }) => ({
    value: id === 'select-option' ? '' : id,
    children: id === 'select-option' ? t('protected:person-case.select-option') : name,
  }));

  const provinceTerritoryStateOptions = [
    { id: 'select-option', name: '' },
    ...loaderData.localizedProvincesTerritoriesStates,
  ].map(({ id, name }) => ({
    value: id === 'select-option' ? '' : id,
    children: id === 'select-option' ? t('protected:person-case.select-option') : name,
  }));

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:contact-information.page-title')}</PageTitle>
      <div className="max-w-prose">
        <FetcherErrorSummary fetcherKey={fetcherKey}>
          <fetcher.Form method="post" noValidate>
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
                defaultValue={loaderData.defaultFormValues?.primaryPhoneNumber}
                required
              />
              <InputPhoneField
                id="secondary-phone-number"
                label={t('protected:contact-information.secondary-phone-label')}
                name="secondaryPhoneNumber"
                type="tel"
                inputMode="tel"
                errorMessage={t(getSingleKey(errors?.secondaryPhoneNumber))}
                defaultValue={loaderData.defaultFormValues?.secondaryPhoneNumber}
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
                  defaultValue={loaderData.defaultFormValues?.emailAddress}
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
                defaultValue={loaderData.defaultFormValues?.country}
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
                    defaultValue={loaderData.defaultFormValues?.address}
                    required
                  />
                  <InputField
                    id="city"
                    label={t('protected:contact-information.city-label')}
                    name="city"
                    className="w-full"
                    errorMessage={t(getSingleKey(errors?.city))}
                    defaultValue={loaderData.defaultFormValues?.city}
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
                      defaultValue={loaderData.defaultFormValues?.province}
                      required
                    />
                  ) : (
                    <InputField
                      id="province"
                      label={t('protected:contact-information.other-country-province-label')}
                      name="province"
                      className="w-full"
                      errorMessage={t(getSingleKey(errors?.province))}
                      defaultValue={loaderData.defaultFormValues?.province}
                      required
                    />
                  )}
                  <InputField
                    id="postal-code"
                    label={t('protected:contact-information.postal-code-label')}
                    name="postalCode"
                    errorMessage={t(getSingleKey(errors?.postalCode))}
                    defaultValue={loaderData.defaultFormValues?.postalCode}
                    required
                  />
                </>
              )}
            </div>
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Button name="action" value="next" variant="primary" id="continue-button" disabled={isSubmitting}>
                {t('protected:person-case.next')}
              </Button>
              <Button name="action" value="back" id="back-button" disabled={isSubmitting}>
                {t('protected:person-case.previous')}
              </Button>
            </div>
          </fetcher.Form>
        </FetcherErrorSummary>
      </div>
    </>
  );
}
