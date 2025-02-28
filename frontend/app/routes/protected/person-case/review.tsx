import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { useFetcher } from 'react-router';

import type { SessionData } from 'express-session';
import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/review';

import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { ButtonLink } from '~/components/button-link';
import { DescriptionList, DescriptionListItem } from '~/components/description-list';
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

  const tabId = new URL(request.url).searchParams.get('tid');
  if (!tabId) throw new AppError('Missing tab id', ErrorCodes.MISSING_TAB_ID, { httpStatusCode: 400 });

  const { t } = await getTranslation(request, handle.i18nNamespace);
  const inPersonSINCase = validateInPersonSINCaseSession(context.session, tabId, request);

  return { documentTitle: t('protected:review.page-title'), inPersonSINCase, tabId };
}

function validateInPersonSINCaseSession(
  session: AppSession,
  tabId: string,
  request: Request,
): Required<NonNullable<SessionData['inPersonSINCase']>> {
  const inPersonSINCase = session.inPersonSINCase;

  if (inPersonSINCase === undefined) {
    throw i18nRedirect('routes/protected/person-case/privacy-statement.tsx', request, {
      search: new URLSearchParams({ tid: tabId }),
    });
  }

  const {
    birthDetails,
    contactInformation,
    currentNameInfo,
    parentDetails,
    personalInformation,
    previousSin,
    primaryDocuments,
    privacyStatement,
    requestDetails,
    secondaryDocument,
  } = inPersonSINCase;

  if (privacyStatement === undefined) {
    throw i18nRedirect('routes/protected/index.tsx', request, {
      search: new URLSearchParams({ tid: tabId }),
    });
  }

  if (requestDetails === undefined) {
    throw i18nRedirect('routes/protected/person-case/request-details.tsx', request, {
      search: new URLSearchParams({ tid: tabId }),
    });
  }

  if (primaryDocuments === undefined) {
    throw i18nRedirect('routes/protected/person-case/primary-docs.tsx', request, {
      search: new URLSearchParams({ tid: tabId }),
    });
  }

  if (secondaryDocument === undefined) {
    throw i18nRedirect('routes/protected/person-case/secondary-doc.tsx', request, {
      search: new URLSearchParams({ tid: tabId }),
    });
  }

  if (currentNameInfo === undefined) {
    throw i18nRedirect('routes/protected/person-case/current-name.tsx', request, {
      search: new URLSearchParams({ tid: tabId }),
    });
  }

  if (personalInformation === undefined) {
    throw i18nRedirect('routes/protected/person-case/personal-info.tsx', request, {
      search: new URLSearchParams({ tid: tabId }),
    });
  }

  if (birthDetails === undefined) {
    throw i18nRedirect('routes/protected/person-case/birth-details.tsx', request, {
      search: new URLSearchParams({ tid: tabId }),
    });
  }

  if (parentDetails === undefined) {
    throw i18nRedirect('routes/protected/person-case/parent-details.tsx', request, {
      search: new URLSearchParams({ tid: tabId }),
    });
  }

  if (previousSin === undefined) {
    throw i18nRedirect('routes/protected/person-case/previous-sin.tsx', request, {
      search: new URLSearchParams({ tid: tabId }),
    });
  }

  if (contactInformation === undefined) {
    throw i18nRedirect('routes/protected/person-case/contact-information.tsx', request, {
      search: new URLSearchParams({ tid: tabId }),
    });
  }

  return {
    birthDetails,
    contactInformation,
    currentNameInfo,
    parentDetails,
    personalInformation,
    previousSin,
    primaryDocuments,
    privacyStatement,
    requestDetails,
    secondaryDocument,
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const tabId = new URL(request.url).searchParams.get('tid');
  if (!tabId) throw new AppError('Missing tab id', ErrorCodes.MISSING_TAB_ID, { httpStatusCode: 400 });

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      throw i18nRedirect('routes/protected/person-case/contact-information.tsx', request, {
        search: new URLSearchParams({ tid: tabId }),
      });
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
  const { inPersonSINCase } = loaderData;
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
              <DescriptionList>
                <DescriptionListItem term={t('protected:primary-identity-document.current-status-in-canada.title')}>
                  <p>
                    {/* TODO: Code Table Value  */}
                    {t(
                      `protected:primary-identity-document.current-status-in-canada.options.${inPersonSINCase.primaryDocuments.currentStatusInCanada}` as 'protected:primary-identity-document.current-status-in-canada.options.select-option',
                    )}
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.document-type.title')}>
                  <p>
                    {/* TODO: Code Table Value  */}
                    {t(
                      `protected:primary-identity-document.document-type.options.${inPersonSINCase.primaryDocuments.documentType}` as 'protected:primary-identity-document.document-type.options.select-option',
                    )}
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.registration-number.label')}>
                  <p>{inPersonSINCase.primaryDocuments.registrationNumber}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.client-number.label')}>
                  <p>{inPersonSINCase.primaryDocuments.clientNumber}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.given-name.label')}>
                  <p>{inPersonSINCase.primaryDocuments.givenName}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.last-name.label')}>
                  <p>{inPersonSINCase.primaryDocuments.lastName}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.date-of-birth.label')}>
                  <p>{inPersonSINCase.primaryDocuments.dateOfBirth}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.gender.label')}>
                  <p>{inPersonSINCase.primaryDocuments.gender}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.citizenship-date.label')}>
                  <p>{inPersonSINCase.primaryDocuments.citizenshipDate}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:review.document-uploaded')}>
                  <p>{t('protected:review.choosen-file')}</p>
                </DescriptionListItem>
              </DescriptionList>
              <ButtonLink
                file="routes/protected/person-case/primary-docs.tsx"
                variant="link"
                size="lg"
                search={`tid=${loaderData.tabId}`}
              >
                {t('protected:review.edit-primary-identity-document')}
              </ButtonLink>
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
