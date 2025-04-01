import type { ChangeEvent } from 'react';
import { useId, useState } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/previous-sin';

import { getLocalizedApplicantHadSinOptions } from '~/.server/domain/person-case/services/applicant-sin-service';
import { serverEnvironment } from '~/.server/environment';
import { requireAllRoles } from '~/.server/utils/auth-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputRadios } from '~/components/input-radios';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { useFetcherState } from '~/hooks/use-fetcher-state';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { getTabIdOrRedirect, loadMachineActorOrRedirect } from '~/routes/protected/person-case/route-helpers.server';
import { getStateRoute } from '~/routes/protected/person-case/state-machine.server';
import { previousSinSchema } from '~/routes/protected/person-case/validation.server';
import { sinInputPatternFormat } from '~/utils/sin-utils';
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
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'previous-sin-info' });

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      machineActor.send({ type: 'prev' });
      break;
    }

    case 'next': {
      const parseResult = v.safeParse(previousSinSchema, {
        hasPreviousSin: formData.get('hasPreviousSin') as string,
        socialInsuranceNumber:
          formData.get('hasPreviousSin') === serverEnvironment.PP_HAS_HAD_PREVIOUS_SIN_CODE
            ? (formData.get('socialInsuranceNumber') as string)
            : undefined,
      });

      if (!parseResult.success) {
        return data(
          { errors: v.flatten<typeof previousSinSchema>(parseResult.issues).nested },
          { status: HttpStatusCodes.BAD_REQUEST },
        );
      }

      machineActor.send({ type: 'submitPreviousSin', data: parseResult.output });
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
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'previous-sin-info' });
  const { previousSin } = machineActor.getSnapshot().context;

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:previous-sin.page-title'),
    defaultFormValues: previousSin,
    localizedApplicantHadSinOptions: getLocalizedApplicantHadSinOptions(lang),
  };
}

export default function PreviousSin({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const [hasPreviousSin, setHasPreviousSin] = useState(loaderData.defaultFormValues?.hasPreviousSin);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const fetcherState = useFetcherState(fetcher);
  const errors = fetcher.data?.errors;

  const hasPreviousSinOptions = loaderData.localizedApplicantHadSinOptions.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === loaderData.defaultFormValues?.hasPreviousSin,
    onChange: ({ target }: ChangeEvent<HTMLInputElement>) => setHasPreviousSin(target.value),
  }));

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:previous-sin.page-title')}</PageTitle>
      <div className="max-w-prose">
        <FetcherErrorSummary fetcherKey={fetcherKey}>
          <fetcher.Form method="post" noValidate>
            <div className="space-y-6">
              <InputRadios
                id="has-previous-sin"
                legend={t('protected:previous-sin.has-previous-sin-label')}
                name="hasPreviousSin"
                options={hasPreviousSinOptions}
                required
                errorMessage={t(extractValidationKey(errors?.hasPreviousSin))}
              />
              {hasPreviousSin === globalThis.__appEnvironment.PP_HAS_HAD_PREVIOUS_SIN_CODE && (
                <InputPatternField
                  defaultValue={loaderData.defaultFormValues?.socialInsuranceNumber ?? ''}
                  inputMode="numeric"
                  format={sinInputPatternFormat}
                  id="social-insurance-number"
                  name="socialInsuranceNumber"
                  label={t('protected:previous-sin.social-insurance-number-label')}
                  errorMessage={t(extractValidationKey(errors?.socialInsuranceNumber))}
                  required
                />
              )}
            </div>
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <Button name="action" value="next" variant="primary" id="continue-button" disabled={fetcherState.submitting}>
                {t('protected:person-case.next')}
              </Button>
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
