import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/request-details';

import { getLocalizedApplicationSubmissionScenarios } from '~/.server/domain/person-case/services/application-submission-scenario';
import { getLocalizedTypesOfApplicationToSubmit } from '~/.server/domain/person-case/services/application-type-service';
import { requireAllRoles } from '~/.server/utils/auth-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { LoadingButton } from '~/components/loading-button';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { useFetcherState } from '~/hooks/use-fetcher-state';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { getTabIdOrRedirect, loadMachineActorOrRedirect } from '~/routes/protected/person-case/route-helpers.server';
import { getStateRoute } from '~/routes/protected/person-case/state-machine.server';
import { requestDetailsSchema } from '~/routes/protected/person-case/validation.server';
import { extractValidationKey } from '~/utils/validation-utils';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const tabId = getTabIdOrRedirect(request);
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'request-details' });

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      machineActor.send({ type: 'prev' });
      break;
    }

    case 'next': {
      const formValues = {
        scenario: formData.get('scenario')?.toString(),
        type: formData.get('request-type')?.toString(),
      };

      const parseResult = v.safeParse(requestDetailsSchema, formValues);

      if (!parseResult.success) {
        const formErrors = v.flatten(parseResult.issues).nested;

        machineActor.send({
          type: 'setFormData',
          data: {
            requestDetails: {
              values: formValues,
              errors: formErrors,
            },
          },
        });

        return data({ formValues: formValues, formErrors: formErrors }, { status: HttpStatusCodes.BAD_REQUEST });
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
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const tabId = getTabIdOrRedirect(request);
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'request-details' });
  const { formData, requestDetails } = machineActor.getSnapshot().context;

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:request-details.page-title'),
    localizedSubmissionScenarios: getLocalizedApplicationSubmissionScenarios(lang),
    localizedTypeofApplicationToSubmit: getLocalizedTypesOfApplicationToSubmit(lang),
    formValues: formData?.requestDetails?.values ?? requestDetails,
    formErrors: formData?.requestDetails?.errors,
  };
}

export default function RequestDetails({ actionData, loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const fetcherState = useFetcherState(fetcher);

  const formValues = fetcher.data?.formValues ?? loaderData.formValues;
  const formErrors = fetcher.data?.formErrors ?? loaderData.formErrors;

  const scenarioOptions = loaderData.localizedSubmissionScenarios.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === formValues?.scenario,
  }));

  const requestOptions = [{ id: 'select-option', name: '' }, ...loaderData.localizedTypeofApplicationToSubmit].map(
    ({ id, name }) => ({
      value: id === 'select-option' ? '' : id,
      children: id === 'select-option' ? t('protected:person-case.select-option') : name,
      disabled: id === 'select-option',
    }),
  );

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:request-details.page-title')}</PageTitle>
      <div className="max-w-prose">
        <FetcherErrorSummary fetcherKey={fetcherKey}>
          <fetcher.Form method="post" noValidate>
            <div className="space-y-6">
              <InputRadios
                id="scenario"
                legend={t('protected:request-details.select-scenario')}
                name="scenario"
                options={scenarioOptions}
                required
                errorMessage={t(extractValidationKey(formErrors?.scenario))}
              />
              <InputSelect
                className="w-full"
                id="request-type"
                name="request-type"
                label={t('protected:request-details.type-request')}
                defaultValue={formValues?.type ?? ''}
                options={requestOptions}
                errorMessage={t(extractValidationKey(formErrors?.type))}
                required
              />
            </div>
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                name="action"
                value="next"
                variant="primary"
                id="continue-button"
                disabled={fetcherState.submitting}
                loading={fetcherState.submitting && fetcherState.action === 'next'}
              >
                {t('protected:person-case.next')}
              </LoadingButton>
              <Button name="action" value="back" id="back-button" disabled={fetcherState.submitting}>
                {t('protected:person-case.previous')}
              </Button>
            </div>
          </fetcher.Form>
        </FetcherErrorSummary>
      </div>
    </>
  );
}
