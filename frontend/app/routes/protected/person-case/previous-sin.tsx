import type { ChangeEvent } from 'react';
import { useId, useState } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/previous-sin';

import {
  getApplicantHadSinOptions,
  getLocalizedApplicantHadSinOptions,
} from '~/.server/domain/person-case/services/applicant-sin-service';
import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputRadios } from '~/components/input-radios';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';
import type { PreviousSinData } from '~/routes/protected/person-case/state-machine';
import { getStateRoute, loadMachineActor } from '~/routes/protected/person-case/state-machine';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';

const log = LogFactory.getLogger(import.meta.url);

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const machineActor = loadMachineActor(context.session, request, 'previous-sin-info');

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
      const { lang, t } = await getTranslation(request, handle.i18nNamespace);

      const schema = v.pipe(
        v.object({
          hasPreviousSin: v.picklist(
            getApplicantHadSinOptions().map(({ id }) => id),
            t('protected:previous-sin.error-messages.has-previous-sin-required'),
          ),
          socialInsuranceNumber: v.optional(
            v.pipe(
              v.string(),
              v.trim(),
              v.check((sin) => isValidSin(sin), t('protected:previous-sin.error-messages.sin-required')),
              v.transform((sin) => formatSin(sin, '')),
            ),
          ),
        }),
        v.forward(
          v.partialCheck(
            [['hasPreviousSin'], ['socialInsuranceNumber']],
            (input) =>
              input.socialInsuranceNumber === undefined ||
              (input.hasPreviousSin === serverEnvironment.PP_HAS_HAD_PREVIOUS_SIN_CODE &&
                isValidSin(input.socialInsuranceNumber ?? '')),
            t('protected:previous-sin.error-messages.sin-required'),
          ),
          ['socialInsuranceNumber'],
        ),
      ) satisfies v.GenericSchema<PreviousSinData>;

      const input = {
        hasPreviousSin: formData.get('hasPreviousSin') as string,
        socialInsuranceNumber:
          formData.get('hasPreviousSin') === serverEnvironment.PP_HAS_HAD_PREVIOUS_SIN_CODE
            ? (formData.get('socialInsuranceNumber') as string)
            : undefined,
      } satisfies Partial<PreviousSinData>;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      machineActor.send({ type: 'submitPreviousSin', data: parseResult.output });
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

  throw redirect(getStateRoute(machineActor, { params, request }));
}

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);
  const machineActor = loadMachineActor(context.session, request, 'previous-sin-info');

  return {
    documentTitle: t('protected:previous-sin.page-title'),
    defaultFormValues: machineActor?.getSnapshot().context.previousSin,
    localizedApplicantHadSinOptions: getLocalizedApplicantHadSinOptions(lang),
  };
}

export default function PreviousSin({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const [hasPreviousSin, setHasPreviousSin] = useState(loaderData.defaultFormValues?.hasPreviousSin);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  const hasPreviousSinOptions = loaderData.localizedApplicantHadSinOptions.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === loaderData.defaultFormValues?.hasPreviousSin,
    onChange: ({ target }: ChangeEvent<HTMLInputElement>) => setHasPreviousSin(target.value),
  }));

  return (
    <>
      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <div className="flex justify-end">
            <Button name="action" value="abandon" id="abandon-button" endIcon={faXmark} variant="link">
              {t('protected:person-case.abandon-button')}
            </Button>
          </div>
          <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:previous-sin.page-title')}</PageTitle>

          <div className="space-y-6">
            <InputRadios
              id="has-previous-sin"
              legend={t('protected:previous-sin.has-previous-sin-label')}
              name="hasPreviousSin"
              options={hasPreviousSinOptions}
              required
              errorMessage={errors?.hasPreviousSin?.at(0)}
            />
            {hasPreviousSin === globalThis.__appEnvironment.PP_HAS_HAD_PREVIOUS_SIN_CODE && (
              <InputPatternField
                defaultValue={loaderData.defaultFormValues?.socialInsuranceNumber ?? ''}
                inputMode="numeric"
                format={sinInputPatternFormat}
                id="social-insurance-number"
                name="socialInsuranceNumber"
                label={t('protected:previous-sin.social-insurance-number-label')}
                errorMessage={errors?.socialInsuranceNumber?.at(0)}
              />
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
    </>
  );
}
