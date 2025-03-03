import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/search-sin';

import { requireAuth } from '~/.server/utils/auth-utils';
import { Button } from '~/components/button';
import { DataTable } from '~/components/data-table';
import { FetcherErrorSummary } from '~/components/error-summary';
import { PageTitle } from '~/components/page-title';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const { t } = await getTranslation(request, handle.i18nNamespace);

  //TODO: fetch and return Interop data (names, dob, etc)
  return {
    documentTitle: t('protected:search-sin.page-title'),
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export function action({ context, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  //TODO: fetch and return mock table result data
  const headers = ['Header 1', 'Header 2', 'Header 3', 'Header 4', 'Header 5'];
  const data = [
    ['Data 1-1', 'Data 1-2', 'Data 1-3', 'Data 1-4', 'Data 1-5'],
    ['Data 2-1', 'Data 2-2', 'Data 2-3', 'Data 2-4', 'Data 2-5'],
    ['Data 3-1', 'Data 3-2', 'Data 3-3', 'Data 3-4', 'Data 3-5'],
    ['Data 4-1', 'Data 4-2', 'Data 4-3', 'Data 4-4', 'Data 4-5'],
  ];
  return {
    tableResults: {
      headers,
      table: { data },
    },
  };
}

export default function SearchSin({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:search-sin.page-title')}</PageTitle>
      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <div className="space-y-6">
            <h2 className="font-lato text-2xl font-semibold">{t('protected:search-sin.search-information')}</h2>
            <div className="bg-slate-100 p-5">
              <h3 className="font-lato mb-4 text-xl font-semibold">John Doe</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="font-semibold">{t('protected:search-sin.other-names')}</dt>
                  <dd className="mt-1">Jon, Johnny</dd>
                </div>
                <div>
                  <dt className="font-semibold">{t('protected:search-sin.date-of-birth')}</dt>
                  <dd className="mt-1">January 1, 1963</dd>
                </div>
                <div>
                  <dt className="font-semibold">{t('protected:search-sin.parents-legal-guardians')}</dt>
                  <dd className="mt-1">Jonathan Doe</dd>
                  <dd className="mt-1">Jane Doe</dd>
                </div>
                <div>
                  <dt className="font-semibold">{t('protected:search-sin.other-last-names')}</dt>
                  <dd className="mt-1">Untel</dd>
                </div>
              </div>
            </div>

            {fetcher.data?.tableResults && (
              <>
                <h3 className="font-lato mb-4 text-xl font-semibold">{t('protected:search-sin.matches')}</h3>
                <DataTable {...fetcher.data.tableResults} />
              </>
            )}
          </div>
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button name="action" value="search" variant="primary" id="search-button" disabled={isSubmitting}>
              {t('protected:search-sin.search')}
            </Button>
          </div>
        </fetcher.Form>
      </FetcherErrorSummary>
    </>
  );
}
