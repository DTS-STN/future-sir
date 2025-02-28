import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { useFetcher } from 'react-router';

import type { SessionData } from 'express-session';
import type { ResourceKey } from 'i18next';
import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/review';

import { applicantGenderService } from '~/.server/domain/person-case/services';
import { serverEnvironment } from '~/.server/environment';
import { countryService, provinceService } from '~/.server/shared/services';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { DescriptionList, DescriptionListItem } from '~/components/description-list';
import { InlineLink } from '~/components/links';
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

  const { t, lang } = await getTranslation(request, handle.i18nNamespace);
  const inPersonSINCase = validateInPersonSINCaseSession(context.session, tabId, request);

  const { PP_CANADA_COUNTRY_CODE } = serverEnvironment;

  return {
    documentTitle: t('protected:review.page-title'),
    inPersonSINCase: {
      ...inPersonSINCase,
      primaryDocuments: {
        ...inPersonSINCase.primaryDocuments,
        genderName: applicantGenderService.getLocalizedApplicantGenderById(inPersonSINCase.primaryDocuments.gender, lang).name,
      },
      personalInformation: {
        ...inPersonSINCase.personalInformation,
        genderName: applicantGenderService.getLocalizedApplicantGenderById(inPersonSINCase.personalInformation.gender, lang)
          .name,
      },
      birthDetails: {
        ...inPersonSINCase.birthDetails,
        countryName: countryService.getLocalizedCountryById(inPersonSINCase.birthDetails.country, lang).name,
        provinceName: inPersonSINCase.birthDetails.province
          ? inPersonSINCase.birthDetails.country !== PP_CANADA_COUNTRY_CODE
            ? inPersonSINCase.birthDetails.province
            : provinceService.getLocalizedProvinceById(inPersonSINCase.birthDetails.province, lang).name
          : undefined,
      },
    },
    tabId,
  };
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
          <div className="space-y-10">
            {/* Primary identity document */}

            <section className="space-y-6">
              <h2 className="font-lato text-2xl font-bold">{t('protected:primary-identity-document.page-title')}</h2>
              <DescriptionList className="divide-y border-y">
                <DescriptionListItem term={t('protected:primary-identity-document.current-status-in-canada.title')}>
                  <p>
                    {t(
                      `protected:primary-identity-document.current-status-in-canada.options.${inPersonSINCase.primaryDocuments.currentStatusInCanada}` as ResourceKey,
                    )}
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.document-type.title')}>
                  <p>
                    {t(
                      `protected:primary-identity-document.document-type.options.${inPersonSINCase.primaryDocuments.documentType}` as ResourceKey,
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
                  <p>{inPersonSINCase.primaryDocuments.genderName}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:primary-identity-document.citizenship-date.label')}>
                  <p>{inPersonSINCase.primaryDocuments.citizenshipDate}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:review.document-uploaded')}>
                  <p>{t('protected:review.choosen-file')}</p>
                </DescriptionListItem>
              </DescriptionList>
              <InlineLink file="routes/protected/person-case/primary-docs.tsx" search={`tid=${loaderData.tabId}`}>
                {t('protected:review.edit-primary-identity-document')}
              </InlineLink>
            </section>

            {/* Secondary identity document */}

            <section className="space-y-6">
              <h2 className="font-lato text-2xl font-bold">{t('protected:secondary-identity-document.page-title')}</h2>
              <DescriptionList className="divide-y border-y">
                <DescriptionListItem term={t('protected:secondary-identity-document.document-type.title')}>
                  <p>
                    {t(
                      `protected:secondary-identity-document.document-type.options.${inPersonSINCase.secondaryDocument.documentType}` as ResourceKey,
                    )}
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:secondary-identity-document.expiry-date.title')}>
                  <p>{inPersonSINCase.secondaryDocument.expiryDate}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:review.document-uploaded')}>
                  <p>{t('protected:review.choosen-file')}</p>
                </DescriptionListItem>
              </DescriptionList>
              <InlineLink file="routes/protected/person-case/secondary-doc.tsx" search={`tid=${loaderData.tabId}`}>
                {t('protected:review.edit-secondary-identity-document')}
              </InlineLink>
            </section>

            {/* Preferred name */}

            <section className="space-y-6">
              <h2 className="font-lato text-2xl font-bold">{t('protected:review.sub-title-preferred-name')}</h2>
              <DescriptionList className="divide-y border-y">
                <DescriptionListItem term={t('protected:current-name.preferred-name.description')}>
                  <p>
                    {inPersonSINCase.currentNameInfo.preferredSameAsDocumentName
                      ? t('protected:review.yes')
                      : t('protected:review.no')}
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:current-name.preferred-name.first-name')}>
                  <p>
                    {inPersonSINCase.currentNameInfo.preferredSameAsDocumentName
                      ? inPersonSINCase.primaryDocuments.givenName
                      : inPersonSINCase.currentNameInfo.firstName}
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:current-name.preferred-name.middle-name')}>
                  {inPersonSINCase.currentNameInfo.preferredSameAsDocumentName === false &&
                    inPersonSINCase.currentNameInfo.middleName && <p>{inPersonSINCase.currentNameInfo.middleName}</p>}
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:current-name.preferred-name.last-name')}>
                  <p>
                    {inPersonSINCase.currentNameInfo.preferredSameAsDocumentName
                      ? inPersonSINCase.primaryDocuments.lastName
                      : inPersonSINCase.currentNameInfo.lastName}
                  </p>
                </DescriptionListItem>

                <h3 className="font-lato text-2xl font-bold">{t('protected:current-name.supporting-docs.title')}</h3>
                <DescriptionListItem term={t('protected:current-name.supporting-docs.docs-required')}>
                  <p>
                    {inPersonSINCase.currentNameInfo.preferredSameAsDocumentName === false &&
                    inPersonSINCase.currentNameInfo.supportingDocuments.required
                      ? t('protected:review.yes')
                      : t('protected:review.no')}
                  </p>
                </DescriptionListItem>
                {inPersonSINCase.currentNameInfo.preferredSameAsDocumentName === false &&
                  inPersonSINCase.currentNameInfo.supportingDocuments.required && (
                    <DescriptionListItem term={t('protected:current-name.supporting-docs.title')}>
                      {inPersonSINCase.currentNameInfo.supportingDocuments.documentTypes.length > 0 && (
                        <ul className="ml-6 list-disc">
                          {inPersonSINCase.currentNameInfo.supportingDocuments.documentTypes.map((value) => (
                            <li key={value}>{t(`protected:current-name.doc-types.${value}` as ResourceKey)}</li>
                          ))}
                        </ul>
                      )}
                    </DescriptionListItem>
                  )}
              </DescriptionList>
              <InlineLink file="routes/protected/person-case/current-name.tsx" search={`tid=${loaderData.tabId}`}>
                {t('protected:review.edit-current-name')}
              </InlineLink>
            </section>

            {/* Personal details */}

            <section className="space-y-6">
              <h2 className="font-lato text-2xl font-bold">{t('protected:personal-information.page-title')}</h2>
              <DescriptionList className="divide-y border-y">
                <DescriptionListItem term={t('protected:personal-information.first-name-previously-used.label')}>
                  {inPersonSINCase.personalInformation.firstNamePreviouslyUsed &&
                    inPersonSINCase.personalInformation.firstNamePreviouslyUsed.length > 0 && (
                      <ul className="ml-6 list-disc">
                        {inPersonSINCase.personalInformation.firstNamePreviouslyUsed.map(
                          (value, index) => value.length > 0 && <li key={`${index}-${value}`}>{value}</li>,
                        )}
                      </ul>
                    )}
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:personal-information.last-name-at-birth.label')}>
                  <p>{inPersonSINCase.personalInformation.lastNameAtBirth}</p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:personal-information.last-name-previously-used.label')}>
                  {inPersonSINCase.personalInformation.lastNamePreviouslyUsed &&
                    inPersonSINCase.personalInformation.lastNamePreviouslyUsed.length > 0 && (
                      <ul className="ml-6 list-disc">
                        {inPersonSINCase.personalInformation.lastNamePreviouslyUsed.map(
                          (value, index) => value.length > 0 && <li key={`${index}-${value}`}>{value}</li>,
                        )}
                      </ul>
                    )}
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:personal-information.gender.label')}>
                  <p>{inPersonSINCase.personalInformation.gender}</p>
                </DescriptionListItem>
              </DescriptionList>
              <InlineLink file="routes/protected/person-case/personal-info.tsx">
                {t('protected:review.edit-personal-details')}
              </InlineLink>
            </section>

            {/* Birth details */}

            <section className="space-y-6">
              <h2 className="font-lato text-2xl font-bold">{t('protected:birth-details.page-title')}</h2>
              <DescriptionList className="divide-y border-y">
                <DescriptionListItem term={t('protected:review.birth-place')}>
                  <p className="flex space-x-1">
                    <span>{inPersonSINCase.birthDetails.city}</span>
                    <span>{inPersonSINCase.birthDetails.provinceName}</span>
                    <span>{inPersonSINCase.birthDetails.countryName}</span>
                  </p>
                </DescriptionListItem>
                <DescriptionListItem term={t('protected:review.multiple-birth')}>
                  <p>{inPersonSINCase.birthDetails.fromMultipleBirth ? t('protected:review.yes') : t('protected:review.no')}</p>
                </DescriptionListItem>
              </DescriptionList>
              <InlineLink file="routes/protected/person-case/birth-details.tsx">
                {t('protected:review.edit-birth-details')}
              </InlineLink>
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
