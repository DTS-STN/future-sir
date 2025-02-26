import { useId } from 'react';

import { useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';

import { handle } from '../api/handle';
import type { Info, Route } from '.react-router/types/app/routes/protected/person-case/+types/request-details';

import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { PageTitle } from '~/components/page-title';

export function RequestDetailsPage({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  const scenarioOptions = loaderData.scenarios.map((value) => ({
    value: value,
    children: t(`protected:request-details.scenarios.${value}` as 'protected:request-details.scenarios.for-self'),
    defaultChecked: value === loaderData.defaultFormValues?.scenario,
  }));

  const requestOptions = ['select-option', ...loaderData.requestTypes].map((value) => ({
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
