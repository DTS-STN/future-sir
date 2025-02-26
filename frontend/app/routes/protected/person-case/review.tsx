import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/primary-docs';

import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { DescriptionListItem } from '~/components/description-list-item';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const { t } = await getTranslation(request, handle.i18nNamespace);

  const primaryDocumentInfo = {
    currentStatusInCanada: context.session.inPersonSINCase?.primaryDocuments?.currentStatusInCanada,
    documentType: context.session.inPersonSINCase?.primaryDocuments?.documentType,
    registrationNumber: context.session.inPersonSINCase?.primaryDocuments?.registrationNumber,
    clientNumber: context.session.inPersonSINCase?.primaryDocuments?.clientNumber,
    givenName: context.session.inPersonSINCase?.primaryDocuments?.givenName,
    lastName: context.session.inPersonSINCase?.primaryDocuments?.lastName,
    dateOfBirth: context.session.inPersonSINCase?.primaryDocuments?.dateOfBirth,
    gender: context.session.inPersonSINCase?.primaryDocuments?.gender,
    citizenshipDate: context.session.inPersonSINCase?.primaryDocuments?.citizenshipDate,
  };

  return {
    documentTitle: t('protected:review.page-title'),
    primaryDocumentInfo: context.session.inPersonSINCase?.primaryDocuments ? primaryDocumentInfo : undefined,
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      throw i18nRedirect('routes/protected/person-case/contact-information.tsx', request);
    }

    case 'next': {
      throw i18nRedirect('routes/protected/index.tsx', request);
    }
    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
}

export default function Review({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:review.page-title')}</PageTitle>
      <div className="max-w-prose">
        <fetcher.Form method="post" noValidate>
          <p className="mb-8 text-lg">{t('protected:review.read-carefully')}</p>
          <div className="space-y-10 divide-y border-y">
            <section className="space-y-6">
              <h2 className="font-lato mt-3 text-2xl font-bold">{t('protected:primary-identity-document.page-title')}</h2>
              <dl>
                <DescriptionListItem term={t('protected:primary-identity-document.current-status-in-canada.title')}>
                  <p>
                    {loaderData.primaryDocumentInfo?.currentStatusInCanada
                      ? t(
                          `protected:primary-identity-document.current-status-in-canada.options.${loaderData.primaryDocumentInfo.currentStatusInCanada}` as 'protected:primary-identity-document.current-status-in-canada.options.select-option',
                        )
                      : ''}
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.document-type.title')}>
                  <p>
                    {loaderData.primaryDocumentInfo?.documentType
                      ? t(
                          `protected:primary-identity-document.document-type.options.${loaderData.primaryDocumentInfo.documentType}` as 'protected:primary-identity-document.document-type.options.select-option',
                        )
                      : ''}
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.registration-number.label')}>
                  <p>{loaderData.primaryDocumentInfo?.registrationNumber}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.client-number.label')}>
                  <p>{loaderData.primaryDocumentInfo?.clientNumber}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.given-name.label')}>
                  <p>{loaderData.primaryDocumentInfo?.givenName}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.last-name.label')}>
                  <p>{loaderData.primaryDocumentInfo?.lastName}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.date-of-birth.label')}>
                  <p>{loaderData.primaryDocumentInfo?.dateOfBirth}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.gender.label')}>
                  <p>{loaderData.primaryDocumentInfo?.gender}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.citizenship-date.label')}>
                  <p>{loaderData.primaryDocumentInfo?.citizenshipDate}</p>
                </DescriptionListItem>
              </dl>
            </section>
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
      </div>
    </>
  );
}
