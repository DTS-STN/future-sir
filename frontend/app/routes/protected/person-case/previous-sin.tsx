import type { ChangeEvent } from 'react';
import { useId, useState } from 'react';

import type { RouteHandle } from 'react-router';
import { data, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/previous-sin';

import {
  getApplicantHadSinOptions,
  getLocalizedApplicantHadSinOptions,
} from '~/.server/domain/person-case/services/applicant-sin-service';
import { serverEnvironment } from '~/.server/environment';
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
import type { PreviousSinData } from '~/routes/protected/person-case/@types';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const tabId = new URL(request.url).searchParams.get('tid') ?? '';
  const previousSin = (context.session.inPersonSinApplications ??= {})[tabId]?.previousSin;

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:previous-sin.page-title'),
    defaultFormValues: previousSin,
    localizedApplicantHadSinOptions: getLocalizedApplicantHadSinOptions(lang),
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const tabId = new URL(request.url).searchParams.get('tid');
  if (!tabId) throw new AppError('Missing tab id', ErrorCodes.MISSING_TAB_ID, { httpStatusCode: 400 });
  const sessionData = ((context.session.inPersonSinApplications ??= {})[tabId] ??= {});

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      throw i18nRedirect('routes/protected/person-case/parent-details.tsx', request, {
        search: new URLSearchParams({ tid: tabId }),
      });
    }

    case 'next': {
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

      sessionData.previousSin = parseResult.output;

      throw i18nRedirect('routes/protected/person-case/contact-information.tsx', request, {
        search: new URLSearchParams({ tid: tabId }),
      });
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
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
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:previous-sin.page-title')}</PageTitle>
      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
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
