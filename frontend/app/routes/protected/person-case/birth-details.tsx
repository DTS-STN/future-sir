import { useId, useState } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/birth-details';

import { getLocalizedCountries } from '~/.server/shared/services/country-service';
import { getLocalizedProvinces } from '~/.server/shared/services/province-service';
import { requireAllRoles } from '~/.server/utils/auth-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import type { InputRadiosProps } from '~/components/input-radios';
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
import { birthDetailsSchema } from '~/routes/protected/person-case/validation.server';
import { getSingleKey } from '~/utils/i18n-utils';
import { trimToUndefined } from '~/utils/string-utils';

const REQUIRE_OPTIONS = { yes: 'Yes', no: 'No' } as const;

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const tabId = getTabIdOrRedirect(request);
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'birth-info' });

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      machineActor.send({ type: 'prev' });
      break;
    }

    case 'next': {
      const parseResult = v.safeParse(birthDetailsSchema, {
        country: formData.get('country') as string,
        province: trimToUndefined(formData.get('province') as string),
        city: trimToUndefined(formData.get('city') as string),
        fromMultipleBirth: formData.get('from-multiple')
          ? formData.get('from-multiple') === REQUIRE_OPTIONS.yes //
          : undefined,
      });

      if (!parseResult.success) {
        return data(
          { errors: v.flatten<typeof birthDetailsSchema>(parseResult.issues).nested },
          { status: HttpStatusCodes.BAD_REQUEST },
        );
      }

      machineActor.send({ type: 'submitBirthDetails', data: parseResult.output });
      break;
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }

  throw redirect(getStateRoute(machineActor, { context, params, request }));
}

export async function loader({ context, params, request }: Route.LoaderArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const tabId = getTabIdOrRedirect(request);
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'birth-info' });
  const { birthDetails } = machineActor.getSnapshot().context;

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:birth-details.page-title'),
    localizedCountries: getLocalizedCountries(lang),
    localizedProvincesTerritoriesStates: getLocalizedProvinces(lang),
    defaultFormValues: birthDetails,
  };
}

export default function BirthDetails({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const [country, setCountry] = useState(loaderData.defaultFormValues?.country);
  const [fromMultipleBirth, setFromMultipleBirth] = useState(loaderData.defaultFormValues?.fromMultipleBirth);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  const countryOptions = [{ id: 'select-option', name: '' }, ...loaderData.localizedCountries].map(({ id, name }) => ({
    value: id === 'select-option' ? '' : id,
    children: id === 'select-option' ? t('protected:person-case.select-option') : name,
    disabled: id === 'select-option',
  }));

  const provinceTerritoryStateOptions = [
    { id: 'select-option', name: '' },
    ...loaderData.localizedProvincesTerritoriesStates,
  ].map(({ id, name }) => ({
    value: id === 'select-option' ? '' : id,
    children: id === 'select-option' ? t('protected:person-case.select-option') : name,
  }));

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
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:birth-details.page-title')}</PageTitle>
      <div className="max-w-prose">
        <FetcherErrorSummary fetcherKey={fetcherKey}>
          <fetcher.Form method="post" noValidate>
            <div className="space-y-6">
              <InputSelect
                id="country-id"
                name="country"
                errorMessage={t(getSingleKey(errors?.country))}
                defaultValue={loaderData.defaultFormValues?.country ?? ''}
                required
                options={countryOptions}
                label={t('protected:birth-details.country.label')}
                onChange={({ target }) => setCountry(target.value)}
                className="w-full sm:w-1/2"
              />
              {country && (
                <>
                  {country === globalThis.__appEnvironment.PP_CANADA_COUNTRY_CODE ? (
                    <InputSelect
                      className="w-full sm:w-1/2"
                      id="province"
                      label={t('protected:birth-details.province.label')}
                      name="province"
                      options={provinceTerritoryStateOptions}
                      errorMessage={t(getSingleKey(errors?.province))}
                      defaultValue={loaderData.defaultFormValues?.province}
                      required
                    />
                  ) : (
                    <InputField
                      errorMessage={t(getSingleKey(errors?.province))}
                      label={t('protected:birth-details.province.label')}
                      name="province"
                      defaultValue={loaderData.defaultFormValues?.province}
                      required={country === globalThis.__appEnvironment.PP_CANADA_COUNTRY_CODE}
                      type="text"
                      className="w-full"
                    />
                  )}
                  <InputField
                    errorMessage={t(getSingleKey(errors?.city))}
                    label={t('protected:birth-details.city.label')}
                    name="city"
                    defaultValue={loaderData.defaultFormValues?.city}
                    required={country === globalThis.__appEnvironment.PP_CANADA_COUNTRY_CODE}
                    type="text"
                    className="w-full"
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
