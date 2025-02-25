import { useId } from 'react';

import type { RouteHandle, SessionData } from 'react-router';
import { data, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/request-details';

import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';

type RequestDetailsSessionData = NonNullable<SessionData['inPersonSINCase']['privacyStatement']>;

const VALID_REQUESTS = [
  'first-time',
  'record-confirmation',
  'name-change',
  'expiry-extension',
  'change-status',
  'sin-confirmation',
  'new-sin',
] as const;

const VALID_SCENARIOS = [
  'for-self', //
  'legal-guardian',
  'legal-representative',
  'as-employee',
  'estate-representative',
] as const;

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const { t } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:request-details.page-title'),
    defaultFormValues: context.session.inPersonSINCase?.requestDetails,
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
      throw i18nRedirect('routes/protected/person-case/privacy-statement.tsx', request);
    }

    case 'next': {
      const schema = v.object({
        scenario: v.picklist(VALID_SCENARIOS, t('protected:request-details.required-scenario')),
        type: v.picklist(VALID_REQUESTS, t('protected:request-details.required-request')),
      }) satisfies v.GenericSchema<RequestDetailsSessionData>;

      const input = {
        scenario: formData.get('scenario') as string,
        type: formData.get('request-type') as string,
      } satisfies Partial<RequestDetailsSessionData>;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      (context.session.inPersonSINCase ??= {}).requestDetails = parseResult.output;
      throw i18nRedirect('routes/protected/person-case/primary-docs.tsx', request);
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`);
    }
  }
}

export default function CreateRequest({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  const scenarioOptions = VALID_SCENARIOS.map((value) => ({
    value: value,
    children: t(`protected:request-details.scenarios.${value}` as 'protected:request-details.scenarios.for-self'),
    defaultChecked: value === loaderData.defaultFormValues?.scenario,
  }));

  const requestOptions = ['select-option', ...VALID_REQUESTS].map((value) => ({
    value: value === 'select-option' ? '' : value,
    children: t(`protected:request-details.requests.${value}` as 'protected:request-details.requests.select-option'),
  }));

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
              errorMessage={errors?.scenario?.at(0)}
            />
            <InputSelect
              className="w-max rounded-sm"
              id="request-type"
              name="request-type"
              label={t('protected:request-details.type-request')}
              defaultValue={loaderData.defaultFormValues?.type ?? ''}
              options={requestOptions}
              errorMessage={errors?.type?.at(0)}
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
