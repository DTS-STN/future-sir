import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/birth-details';

import { LogFactory } from '~/.server/logging';
import { getLocalizedCountries } from '~/.server/shared/services/country-service';
import { getLocalizedProvinces } from '~/.server/shared/services/province-service';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { getStateRoute, loadMachineActor } from '~/routes/protected/person-case/state-machine.server';
import BirthDetailsForm from '~/routes/protected/sin-application/birth-details-form';
import type { birthDetailsSchema } from '~/routes/protected/sin-application/validation.server';
import { parseBirthDetails } from '~/routes/protected/sin-application/validation.server';

const log = LogFactory.getLogger(import.meta.url);

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const machineActor = loadMachineActor(context.session, request, 'birth-info');

  if (!machineActor) {
    log.warn('Could not find a machine snapshot in session; redirecting to start of flow');
    throw i18nRedirect('routes/protected/person-case/privacy-statement.tsx', request);
  }

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      machineActor.send({ type: 'prev' });
      break;
    }

    case 'next': {
      const parseResult = parseBirthDetails(formData);

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
  requireAuth(context.session, new URL(request.url), ['user']);

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);
  const machineActor = loadMachineActor(context.session, request, 'birth-info');

  return {
    documentTitle: t('protected:birth-details.page-title'),
    localizedCountries: getLocalizedCountries(lang),
    localizedProvincesTerritoriesStates: getLocalizedProvinces(lang),
    defaultFormValues: machineActor?.getSnapshot().context.birthDetails,
  };
}

export default function BirthDetails({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:birth-details.page-title')}</PageTitle>

      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <BirthDetailsForm
            defaultFormValues={loaderData.defaultFormValues}
            localizedCountries={loaderData.localizedCountries}
            localizedProvincesTerritoriesStates={loaderData.localizedProvincesTerritoriesStates}
            errors={errors}
          />
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
    </>
  );
}
