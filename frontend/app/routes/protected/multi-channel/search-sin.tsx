import { useId, useMemo } from 'react';

import type { RouteHandle } from 'react-router';
import { useFetcher } from 'react-router';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/search-sin';

import { getSinCaseService } from '~/.server/domain/multi-channel/case-api-service';
import { getSinSearchService } from '~/.server/domain/multi-channel/search-api-service';
import { requireAllRoles } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { DataTable } from '~/components/data-table';
import { FetcherErrorSummary } from '~/components/error-summary';
import { LoadingButton } from '~/components/loading-button';
import { PageTitle } from '~/components/page-title';
import { SPECIAL_CHARACTERS } from '~/domain/constants';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { useFetcherState } from '~/hooks/use-fetcher-state';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';
import { padWithZero } from '~/utils/string-utils';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, params, request }: Route.LoaderArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  // TODO ::: GjB ::: the data returned by the following call should be checked to ensure the logged-in user has permissions to view it
  const personSinCase = await getSinCaseService().findSinCaseById(params.caseId);

  if (personSinCase === undefined) {
    throw new Response(JSON.stringify({ status: HttpStatusCodes.NOT_FOUND, message: 'Case not found' }), {
      status: HttpStatusCodes.NOT_FOUND,
    });
  }

  const { t } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:search-sin.page-title'),
    fullName: `${personSinCase.currentNameInfo.firstName ?? personSinCase.primaryDocuments.givenName} ${personSinCase.currentNameInfo.lastName ?? personSinCase.primaryDocuments.lastName}`,
    firstNamesPreviouslyUsed: personSinCase.personalInformation.firstNamePreviouslyUsed?.join(', '),
    dob: personSinCase.primaryDocuments.dateOfBirth,
    parents: personSinCase.parentDetails.filter((p) => !p.unavailable).map((p) => `${p.givenName} ${p.lastName}`),
    otherLastNames: personSinCase.personalInformation.lastNamePreviouslyUsed?.join(', '),
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  // TODO ::: GjB ::: the data returned by the following call should be checked to ensure the logged-in user has permissions to view it
  const personSinCase = await getSinCaseService().findSinCaseById(params.caseId);

  if (personSinCase === undefined) {
    throw new Response(JSON.stringify({ status: HttpStatusCodes.NOT_FOUND, message: 'Case not found' }), {
      status: HttpStatusCodes.NOT_FOUND,
    });
  }

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      throw i18nRedirect('routes/protected/multi-channel/pid-verification.tsx', request, { params });
    }

    case 'next': {
      throw i18nRedirect('routes/protected/multi-channel/finalize-request.tsx', request, { params });
    }

    case 'search': {
      const { caseId } = params;
      const sinSearchService = getSinSearchService();
      const searchResults =
        (await sinSearchService.getSearchResults(caseId)).results
          ?.filter((result) => result.id)
          .sort((a, b) => b.score - a.score) ?? [];

      return {
        tableData: searchResults.map(
          ({ dateOfBirth, firstName, lastName, monthOfBirth, parentSurname, partialSIN, score, yearOfBirth }) => ({
            dateOfBirth: [padWithZero(yearOfBirth, 4), padWithZero(monthOfBirth, 2), padWithZero(dateOfBirth, 2)].join(
              SPECIAL_CHARACTERS.nonBreakingHyphen,
            ),
            firstName,
            lastName,
            parentSurname,
            partialSIN: ['***', '***', partialSIN].join(SPECIAL_CHARACTERS.nonBreakingSpace),
            score,
          }),
        ),
      };
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
}

export default function SearchSin({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t, i18n } = useTranslation(handle.i18nNamespace);
  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const fetcherState = useFetcherState(fetcher);

  type TableRowData = NonNullable<typeof actionData>['tableData'][number];

  const columns = useMemo<ColumnDef<TableRowData>[]>(() => {
    const percentFormatter = new Intl.NumberFormat(`${i18n.language}-CA`, { style: 'percent', maximumFractionDigits: 2 });
    return [
      {
        header: t('protected:search-sin.table.headers.full-name'),
        cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`.trim(),
      },
      {
        header: t('protected:search-sin.table.headers.date-of-birth'),
        accessorKey: 'dateOfBirth',
        meta: {
          cellClassName: 'text-nowrap',
        },
      },
      {
        accessorKey: 'parentSurname',
        header: t('protected:search-sin.table.headers.parent-surname'),
      },
      {
        header: t('protected:search-sin.table.headers.sin'),
        accessorKey: 'partialSIN',
        meta: {
          cellClassName: 'text-nowrap',
        },
      },
      {
        header: t('protected:search-sin.table.headers.match'),
        cell: (props) => percentFormatter.format(props.row.original.score / 10),
        meta: {
          cellClassName: 'text-right text-nowrap',
          headerClassName: 'text-right',
        },
      },
    ];
  }, [i18n.language, t]);

  return (
    <>
      <PageTitle subTitle={t('protected:first-time.title')}>{t('protected:search-sin.page-title')}</PageTitle>
      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <div className="space-y-6">
            <h2 className="font-lato text-2xl font-semibold">{t('protected:search-sin.search-information')}</h2>
            <div className="bg-slate-100 p-5">
              <h3 className="font-lato mb-4 text-xl font-semibold">{loaderData.fullName}</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="font-semibold">{t('protected:search-sin.other-names')}</dt>
                  <dd className="mt-1">{loaderData.firstNamesPreviouslyUsed}</dd>
                </div>
                <div>
                  <dt className="font-semibold">{t('protected:search-sin.date-of-birth')}</dt>
                  <dd className="mt-1">{loaderData.dob}</dd>
                </div>
                <div>
                  <dt className="font-semibold">{t('protected:search-sin.parents-legal-guardians')}</dt>
                  {loaderData.parents.map((parent, i) => (
                    <dd className="mt-1" key={`${parent}-${i}`}>
                      {parent}
                    </dd>
                  ))}
                </div>
                <div>
                  <dt className="font-semibold">{t('protected:search-sin.other-last-names')}</dt>
                  <dd className="mt-1">{loaderData.otherLastNames}</dd>
                </div>
              </div>
            </div>

            {fetcher.data?.tableData && (
              <>
                <h3 className="font-lato mb-4 text-xl font-semibold">{t('protected:search-sin.matches')}</h3>
                <DataTable columns={columns} data={fetcher.data.tableData} />
              </>
            )}
          </div>
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <LoadingButton
              name="action"
              value="search"
              variant="primary"
              id="search-button"
              disabled={fetcherState.submitting}
              loading={fetcherState.submitting && fetcherState.action === 'search'}
            >
              {t('protected:search-sin.search')}
            </LoadingButton>
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
              {t('protected:search-sin.next')}
            </LoadingButton>
            <Button name="action" value="back" id="back-button" disabled={fetcherState.submitting}>
              {t('protected:search-sin.previous')}
            </Button>
          </div>
        </fetcher.Form>
      </FetcherErrorSummary>
    </>
  );
}
