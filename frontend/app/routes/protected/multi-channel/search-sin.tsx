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

  //TODO: fetch and return mock table data
  return {
    tableData: {
      rows: [
        ['John Doe', 'January 1, 1980', 'Doe', '*** *** 000', '98%'],
        ['Johnathan Doe', 'February 10, 1985', 'Doe', '*** *** 000', '95%'],
        ['John D', 'March 15, 1990', 'N/A', '*** *** 000', '88%'],
        ['Johnny Doe', 'April 20, 1978', 'Doe', '*** *** 000', '92%'],
        ['J. Doe', 'May 25, 1992', 'Doe', '*** *** 000', '90%'],
      ],
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

            {fetcher.data?.tableData && (
              <>
                <h3 className="font-lato mb-4 text-xl font-semibold">{t('protected:search-sin.matches')}</h3>
                <DataTable
                  headers={[
                    t('protected:search-sin.table.headers.full-name'),
                    t('protected:search-sin.table.headers.date-of-birth'),
                    t('protected:search-sin.table.headers.parent-surname'),
                    t('protected:search-sin.table.headers.sin'),
                    t('protected:search-sin.table.headers.match'),
                  ]}
                  rows={fetcher.data.tableData.rows}
                />
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
