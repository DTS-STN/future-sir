import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/request-details';

import {
  getApplicationSubmissionScenarios,
  getLocalizedApplicationSubmissionScenarios,
} from '~/.server/domain/person-case/services/application-submission-scenario';
import {
  getLocalizedTypesOfApplicationToSubmit,
  getTypesOfApplicationToSubmit,
} from '~/.server/domain/person-case/services/application-type-service';
import { LogFactory } from '~/.server/logging';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { getStateRoute, loadMachineActor } from '~/routes/protected/person-case/state-machine';
import type { RequestDetailsData } from '~/routes/protected/person-case/types';
import { getSingleKey } from '~/utils/i18n-utils';

const log = LogFactory.getLogger(import.meta.url);

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const machineActor = loadMachineActor(context.session, request, 'request-details');

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
      const { lang } = await getTranslation(request, handle.i18nNamespace);

      const schema = v.object({
        scenario: v.picklist(
          getApplicationSubmissionScenarios().map(({ id }) => id),
          'protected:request-details.required-scenario',
        ),
        type: v.picklist(
          getTypesOfApplicationToSubmit().map(({ id }) => id),
          'protected:request-details.required-request',
        ),
      }) satisfies v.GenericSchema<RequestDetailsData>;

      const input = {
        scenario: formData.get('scenario') as string,
        type: formData.get('request-type') as string,
      } satisfies Partial<RequestDetailsData>;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      machineActor.send({ type: 'submitRequestDetails', data: parseResult.output });
      break;
    }

    case 'abandon': {
      machineActor.send({ type: 'cancel' });
      break;
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }

  throw redirect(getStateRoute(machineActor, { context, params, request }));
}

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);
  const machineActor = loadMachineActor(context.session, request, 'request-details');

  return {
    documentTitle: t('protected:request-details.page-title'),
    localizedSubmissionScenarios: getLocalizedApplicationSubmissionScenarios(lang),
    localizedTypeofApplicationToSubmit: getLocalizedTypesOfApplicationToSubmit(lang),
    defaultFormValues: machineActor?.getSnapshot().context.requestDetails,
  };
}

export default function RequestDetails({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  const scenarioOptions = loaderData.localizedSubmissionScenarios.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === loaderData.defaultFormValues?.scenario,
  }));

  const requestOptions = [{ id: 'select-option', name: '' }, ...loaderData.localizedTypeofApplicationToSubmit].map(
    ({ id, name }) => ({
      value: id === 'select-option' ? '' : id,
      children: id === 'select-option' ? t('protected:contact-information.select-option') : name,
    }),
  );

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:request-details.page-title')}</PageTitle>

      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <div className="space-y-6">
            <InputRadios
              id="scenario"
              legend={t('protected:request-details.select-scenario')}
              name="scenario"
              options={scenarioOptions}
              required
              errorMessage={t(getSingleKey(errors?.scenario))}
            />
            <InputSelect
              className="w-max rounded-sm"
              id="request-type"
              name="request-type"
              label={t('protected:request-details.type-request')}
              defaultValue={loaderData.defaultFormValues?.type ?? ''}
              options={requestOptions}
              errorMessage={t(getSingleKey(errors?.type))}
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
    </>
  );
}
