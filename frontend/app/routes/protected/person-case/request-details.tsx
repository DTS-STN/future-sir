import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { data, useFetcher } from 'react-router';

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
import { handle as parentHandle } from '~/routes/protected/layout';
import type { RequestDetailsData } from '~/routes/protected/person-case/@types';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const tabId = new URL(request.url).searchParams.get('tid') ?? '';
  const requestDetails = (context.session.inPersonSinApplications ??= {})[tabId]?.requestDetails;

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:request-details.page-title'),
    localizedSubmissionScenarios: getLocalizedApplicationSubmissionScenarios(lang),
    localizedTypeofApplicationToSubmit: getLocalizedTypesOfApplicationToSubmit(lang),
    defaultFormValues: requestDetails,
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
      throw i18nRedirect('routes/protected/person-case/privacy-statement.tsx', request, {
        search: new URLSearchParams({ tid: tabId }),
      });
    }

    case 'next': {
      const schema = v.object({
        scenario: v.picklist(
          getApplicationSubmissionScenarios().map(({ id }) => id),
          t('protected:request-details.required-scenario'),
        ),
        type: v.picklist(
          getTypesOfApplicationToSubmit().map(({ id }) => id),
          t('protected:request-details.required-request'),
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

      sessionData.requestDetails = parseResult.output;

      throw i18nRedirect('routes/protected/person-case/primary-docs.tsx', request, {
        search: new URLSearchParams({ tid: tabId }),
      });
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
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
