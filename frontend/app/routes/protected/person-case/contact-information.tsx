import { useId } from 'react';

import type { RouteHandle, SessionData } from 'react-router';
import { data, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/contact-information';

import {
  getCountries,
  getLocalizedCountries,
  getLocalizedProvincesTerritoriesStates,
  getProvincesTerritoriesStates,
  getPreferredLanguages,
  getLocalizedPreferredLanguages,
} from '~/.server/services/locale-data-service';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputPhoneField } from '~/components/input-phone-field';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';

type ContactInformationSessionData = NonNullable<SessionData['inPersonSINCase']['contactInformation']>;

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:contact-information.page-title'),
    defaultFormValues: context.session.inPersonSINCase?.contactInformation,
    localizedpreferredLanguages: getLocalizedPreferredLanguages(lang),
    localizedCountries: getLocalizedCountries(lang),
    localizedProvincesTerritoriesStates: getLocalizedProvincesTerritoriesStates(lang),
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);
  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      throw i18nRedirect('routes/protected/person-case/previous-sin.tsx', request);
    }

    case 'next': {
      // TODO beef up validation
      const schema = v.object({
        preferredLanguage: v.picklist(
          getPreferredLanguages().map(({ id }) => id),
          t('protected:contact-information.error-messages.preferred-language-required'),
        ),
        primaryPhoneNumber: v.pipe(
          v.string(),
          v.trim(),
          v.nonEmpty(t('protected:contact-information.error-messages.primary-phone-required')),
        ),
        secondaryPhoneNumber: v.optional(v.pipe(v.string(), v.trim())),
        emailAddress: v.optional(
          v.pipe(v.string(), v.trim(), v.email(t('protected:contact-information.error-messages.email-address-invalid-format'))),
        ),
        country: v.picklist(
          getCountries().map(({ id }) => id),
          t('protected:contact-information.error-messages.country-required'),
        ),
        address: v.pipe(v.string(), v.trim(), v.nonEmpty(t('protected:contact-information.error-messages.address-required'))),
        postalCode: v.pipe(
          v.string(),
          v.trim(),
          v.nonEmpty(t('protected:contact-information.error-messages.postal-code-required')),
        ),
        city: v.pipe(v.string(), v.trim(), v.nonEmpty(t('protected:contact-information.error-messages.city-required'))),
        province: v.picklist(
          getProvincesTerritoriesStates().map(({ id }) => id),
          t('protected:contact-information.error-messages.province-required'),
        ),
      }) satisfies v.GenericSchema<ContactInformationSessionData>;

      const input = {
        preferredLanguage: formData.get('preferredLanguage') as string,
        primaryPhoneNumber: formData.get('primaryPhoneNumber') as string,
        secondaryPhoneNumber: formData.get('secondaryPhoneNumber') ? formData.get('secondaryPhoneNumber') : undefined,
        emailAddress: formData.get('emailAddress') ? formData.get('emailAddress') : undefined,
        country: formData.get('country') as string,
        address: formData.get('address') as string,
        postalCode: formData.get('postalCode') as string,
        city: formData.get('city') as string,
        province: formData.get('province') as string,
      } satisfies Partial<ContactInformationSessionData>;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      context.session.inPersonSINCase ??= {};
      context.session.inPersonSINCase.contactInformation = parseResult.output;

      // TODO: change to proper route
      throw i18nRedirect('routes/protected/person-case/primary-docs.tsx', request);
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`);
    }
  }
}

export default function ContactInformation({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  const languageOptions = loaderData.localizedpreferredLanguages.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === loaderData.defaultFormValues?.preferredLanguage,
  }));

  const countryOptions = [{ id: 'select-option', name: '' }, ...loaderData.localizedCountries].map(({ id, name }) => ({
    value: id === 'select-option' ? '' : id,
    children: id === 'select-option' ? t('protected:contact-information.select-option') : name,
  }));

  const provinceTerritoryStateOptions = [
    { id: 'select-option', name: '' },
    ...loaderData.localizedProvincesTerritoriesStates,
  ].map(({ id, name }) => ({
    value: id === 'select-option' ? '' : id,
    children: id === 'select-option' ? t('protected:contact-information.select-option') : name,
  }));

  // TODO conditionally render different address fields if Canada is selected as a country
  return (
    <div className="max-w-prose">
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:contact-information.page-title')}</PageTitle>
      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <div className="space-y-6">
            <h2 className="font-lato text-2xl font-bold">{t('protected:contact-information.correspondence')}</h2>
            <InputRadios
              id="preferred-language"
              legend={t('protected:contact-information.preferred-language-label')}
              name="preferredLanguage"
              options={languageOptions}
              errorMessage={errors?.preferredLanguage?.at(0)}
              required
            />
            <InputPhoneField
              id="primary-phone-number"
              label={t('protected:contact-information.primary-phone-label')}
              name="primaryPhoneNumber"
              type="tel"
              inputMode="tel"
              errorMessage={errors?.primaryPhoneNumber?.at(0)}
              defaultValue={loaderData.defaultFormValues?.primaryPhoneNumber}
              required
            />
            <InputPhoneField
              id="secondary-phone-number"
              label={t('protected:contact-information.secondary-phone-label')}
              name="secondaryPhoneNumber"
              type="tel"
              inputMode="tel"
              errorMessage={errors?.secondaryPhoneNumber?.at(0)}
              defaultValue={loaderData.defaultFormValues?.secondaryPhoneNumber}
            />
            <InputField
              id="email-address"
              type="email"
              inputMode="email"
              label={t('protected:contact-information.email-label')}
              name="emailAddress"
              className="w-full"
              errorMessage={errors?.emailAddress?.at(0)}
              defaultValue={loaderData.defaultFormValues?.emailAddress}
            />
            <h2 className="font-lato text-2xl font-bold">{t('protected:contact-information.mailing-address')}</h2>
            <InputSelect
              className="w-max rounded-sm"
              id="country"
              name="country"
              label={t('protected:contact-information.country-select-label')}
              options={countryOptions}
              errorMessage={errors?.country?.at(0)}
              defaultValue={loaderData.defaultFormValues?.country}
              required
            />
            <InputField
              id="address"
              label={t('protected:contact-information.address-label')}
              helpMessagePrimary={t('protected:contact-information.address-help-message')}
              name="address"
              className="w-full"
              errorMessage={errors?.address?.at(0)}
              defaultValue={loaderData.defaultFormValues?.address}
            />
            <InputField
              id="postal-code"
              label={t('protected:contact-information.postal-code-label')}
              name="postalCode"
              errorMessage={errors?.postalCode?.at(0)}
              defaultValue={loaderData.defaultFormValues?.postalCode}
            />
            <InputField
              id="city"
              label={t('protected:contact-information.city-label')}
              name="city"
              className="w-full"
              errorMessage={errors?.city?.at(0)}
              defaultValue={loaderData.defaultFormValues?.city}
            />
            <InputSelect
              className="w-max rounded-sm"
              id="province"
              label={t('protected:contact-information.province-label')}
              name="province"
              options={provinceTerritoryStateOptions}
              errorMessage={errors?.province?.at(0)}
              defaultValue={loaderData.defaultFormValues?.province}
              required
            />
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
  );
}
