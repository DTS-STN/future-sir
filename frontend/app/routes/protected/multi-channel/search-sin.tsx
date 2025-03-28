import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/search-sin';

import { getSinCaseService } from '~/.server/domain/multi-channel/case-api-service';
import { getSinSearchService } from '~/.server/domain/multi-channel/search-api-service';
import { requireAllRoles } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { DataTable } from '~/components/data-table';
import { FetcherErrorSummary } from '~/components/error-summary';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';

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
    fullName: `${personSinCase.currentNameInfo.firstName} ${personSinCase.currentNameInfo.lastName}`,
    firstNamesPreviouslyUsed: personSinCase.personalInformation.firstNamePreviouslyUsed?.join(', '),
    dob: personSinCase.primaryDocuments.dateOfBirth,
    parents: personSinCase.parentDetails.filter((p) => !p.unavailable).map((p) => `${p.givenName} ${p.lastName}`),
    otherLastNames: personSinCase.personalInformation.lastNamePreviouslyUsed?.join(','),
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
  const { lang } = await getTranslation(request, handle.i18nNamespace);

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
      const searchResults = await sinSearchService.getSearchResults(caseId);

      return {
        tableData: {
          rows: searchResults.map(
            ({ firstName, lastName, yearOfBirth, monthOfBirth, dayOfBirth, parentSurname, partialSIN, score }) => [
              `${firstName} ${lastName}`,
              `${yearOfBirth}-${monthOfBirth}-${dayOfBirth}`.replace(/\d?\d/g, (s) => s.padStart(2, '0')),
              parentSurname,
              `*** *** ${partialSIN}`,
              `${new Intl.NumberFormat(`${lang}-CA`, { style: 'percent', maximumFractionDigits: 2 }).format(score)}`, //score is out of 10 (i.e. 2.5 corresponds to 2.5/10 or 25%)
            ],
          ),
        },
      };
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
}

export default function SearchSin({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';

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
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button name="action" value="next" variant="primary" id="continue-button" disabled={isSubmitting}>
              {t('protected:search-sin.next')}
            </Button>
            <Button name="action" value="back" id="back-button" disabled={isSubmitting}>
              {t('protected:search-sin.previous')}
            </Button>
          </div>
        </fetcher.Form>
      </FetcherErrorSummary>
    </>
  );
}
