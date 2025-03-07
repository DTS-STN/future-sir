import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { redirect, useFetcher } from 'react-router';

import type { ResourceKey } from 'i18next';
import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/review';

import {
  applicantGenderService,
  applicantSecondaryDocumentService,
  languageCorrespondenceService,
} from '~/.server/domain/person-case/services';
import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';
import { countryService, provinceService } from '~/.server/shared/services';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Address } from '~/components/address';
import { Button } from '~/components/button';
import { DescriptionList, DescriptionListItem } from '~/components/description-list';
import { InlineLink } from '~/components/links';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { getStateRoute, loadMachineActor } from '~/routes/protected/person-case/state-machine';
import type { InPersonSinApplication } from '~/routes/protected/person-case/types';

const log = LogFactory.getLogger(import.meta.url);

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const machineActor = loadMachineActor(context.session, request, 'review');

  if (!machineActor) {
    log.warn('Could not find a machine snapshot in session; redirecting to start of flow');
    throw i18nRedirect('routes/protected/person-case/privacy-statement.tsx', request);
  }

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      machineActor.send({ type: 'prev' });
      break;
    }

    case 'next': {
      machineActor.send({ type: 'submitReview' });
      break;
    }

    case 'abandon': {
      machineActor.send({ type: 'cancel' });
      break;
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }

  throw redirect(getStateRoute(machineActor, { params, request }));
}

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const tabId = new URL(request.url).searchParams.get('tid') ?? undefined;
  const { lang, t } = await getTranslation(request, handle.i18nNamespace);
  const machineActor = loadMachineActor(context.session, request, 'review');

  const sessionData = machineActor?.getSnapshot().context;
  const inPersonSinApplication = validateInPersonSINCaseSession(sessionData, tabId, request);

  return {
    documentTitle: t('protected:review.page-title'),
    inPersonSINCase: {
      ...inPersonSinApplication,
      primaryDocuments: {
        ...inPersonSinApplication.primaryDocuments,
        genderName: applicantGenderService.getLocalizedApplicantGenderById(inPersonSinApplication.primaryDocuments.gender, lang)
          .name,
      },
      secondaryDocument: {
        ...inPersonSinApplication.secondaryDocument,
        documentTypeName: applicantSecondaryDocumentService.getLocalizedApplicantSecondaryDocumentChoiceById(
          inPersonSinApplication.secondaryDocument.documentType,
          lang,
        ).name,
      },
      personalInformation: {
        ...inPersonSinApplication.personalInformation,
        genderName: applicantGenderService.getLocalizedApplicantGenderById(
          inPersonSinApplication.personalInformation.gender,
          lang,
        ).name,
      },
      birthDetails: {
        ...inPersonSinApplication.birthDetails,
        countryName: countryService.getLocalizedCountryById(inPersonSinApplication.birthDetails.country, lang).name,
        provinceName: inPersonSinApplication.birthDetails.province
          ? inPersonSinApplication.birthDetails.country !== serverEnvironment.PP_CANADA_COUNTRY_CODE
            ? inPersonSinApplication.birthDetails.province
            : provinceService.getLocalizedProvinceById(inPersonSinApplication.birthDetails.province, lang).name
          : undefined,
      },
      parentDetails: sessionData?.parentDetails?.map((parentdetail) =>
        parentdetail.unavailable
          ? { unavailable: true }
          : {
              unavailable: false,
              givenName: parentdetail.givenName,
              lastName: parentdetail.lastName,
              birthLocation: {
                country: parentdetail.birthLocation.country,
                city: parentdetail.birthLocation.city,
                province: parentdetail.birthLocation.province,
              },
              countryName: countryService.getLocalizedCountryById(parentdetail.birthLocation.country, lang).name,
              provinceName: parentdetail.birthLocation.province
                ? parentdetail.birthLocation.country !== serverEnvironment.PP_CANADA_COUNTRY_CODE
                  ? parentdetail.birthLocation.province
                  : provinceService.getLocalizedProvinceById(parentdetail.birthLocation.province, lang).name
                : undefined,
            },
      ),
      contactInformation: {
        ...inPersonSinApplication.contactInformation,
        preferredLanguageName: languageCorrespondenceService.getLocalizedLanguageOfCorrespondenceById(
          inPersonSinApplication.contactInformation.preferredLanguage,
          lang,
        ).name,
        countryName: countryService.getLocalizedCountryById(inPersonSinApplication.contactInformation.country, lang).name,
        provinceName: inPersonSinApplication.contactInformation.province
          ? inPersonSinApplication.contactInformation.country !== serverEnvironment.PP_CANADA_COUNTRY_CODE
            ? inPersonSinApplication.contactInformation.province
            : provinceService.getLocalizedProvinceById(inPersonSinApplication.contactInformation.province, lang).name
          : undefined,
      },
    },
    tabId,
  };
}

export default function Review({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const { inPersonSINCase } = loaderData;

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:review.page-title')}</PageTitle>

      <fetcher.Form className="max-w-prose" method="post" noValidate>
        <p className="mb-8 text-lg">{t('protected:review.read-carefully')}</p>
        <div className="space-y-10">
          <PrimaryDocumentData data={inPersonSINCase.primaryDocuments} tabId={loaderData.tabId} />
          <SecondayDocumentData data={inPersonSINCase.secondaryDocument} tabId={loaderData.tabId} />
          <PreferredNameData
            data={{
              ...inPersonSINCase.currentNameInfo,
              firstName: inPersonSINCase.currentNameInfo.preferredSameAsDocumentName
                ? inPersonSINCase.primaryDocuments.givenName
                : inPersonSINCase.currentNameInfo.firstName,
              lastName: inPersonSINCase.currentNameInfo.preferredSameAsDocumentName
                ? inPersonSINCase.primaryDocuments.lastName
                : inPersonSINCase.currentNameInfo.lastName,
            }}
            tabId={loaderData.tabId}
          />
          <PersonalDetailsData data={inPersonSINCase.personalInformation} tabId={loaderData.tabId} />
          <BirthDetailsData data={inPersonSINCase.birthDetails} tabId={loaderData.tabId} />
          <ParentDetailsData data={inPersonSINCase.parentDetails ?? []} tabId={loaderData.tabId} />
          <PreviousSinData data={inPersonSINCase.previousSin} tabId={loaderData.tabId} />
          <ContactInformationData data={inPersonSINCase.contactInformation} tabId={loaderData.tabId} />
        </div>
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <Button name="action" value="next" variant="primary" id="continue-button" disabled={isSubmitting}>
            {t('protected:person-case.create-case-button')}
          </Button>
          <Button name="action" value="back" id="back-button" disabled={isSubmitting}>
            {t('protected:person-case.previous')}
          </Button>
        </div>
      </fetcher.Form>
    </>
  );
}

interface DataProps {
  data: Record<string, string | undefined>;
  tabId?: string;
}

function PrimaryDocumentData({ data, tabId }: DataProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <section className="space-y-6">
      <h2 className="font-lato text-2xl font-bold">{t('protected:primary-identity-document.page-title')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem term={t('protected:primary-identity-document.current-status-in-canada.title')}>
          <p>
            {t(
              `protected:primary-identity-document.current-status-in-canada.options.${data.currentStatusInCanada}` as ResourceKey,
            )}
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:primary-identity-document.document-type.title')}>
          <p>{t(`protected:primary-identity-document.document-type.options.${data.documentType}` as ResourceKey)}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:primary-identity-document.registration-number.label')}>
          <p>{data.registrationNumber}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:primary-identity-document.client-number.label')}>
          <p>{data.clientNumber}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:primary-identity-document.given-name.label')}>
          <p>{data.givenName}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:primary-identity-document.last-name.label')}>
          <p>{data.lastName}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:primary-identity-document.date-of-birth.label')}>
          <p>{data.dateOfBirth}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:primary-identity-document.gender.label')}>
          <p>{data.genderName}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:primary-identity-document.citizenship-date.label')}>
          <p>{data.citizenshipDate}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:review.document-uploaded')}>
          <p>{t('protected:review.choosen-file')}</p>
        </DescriptionListItem>
      </DescriptionList>
      <InlineLink file="routes/protected/person-case/primary-docs.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-primary-identity-document')}
      </InlineLink>
    </section>
  );
}

interface SecondayDocumentDataProps {
  data: {
    documentTypeName: string;
    documentType: string;
    expiryMonth: number;
    expiryYear: number;
  };
  tabId?: string;
}

function SecondayDocumentData({ data, tabId }: SecondayDocumentDataProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <section className="space-y-6">
      <h2 className="font-lato text-2xl font-bold">{t('protected:secondary-identity-document.page-title')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem term={t('protected:secondary-identity-document.document-type.title')}>
          <p>{data.documentTypeName}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:secondary-identity-document.expiry-date.title')}>
          <p>
            {data.expiryMonth} {data.expiryYear}
          </p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:review.document-uploaded')}>
          <p>{t('protected:review.choosen-file')}</p>
        </DescriptionListItem>
      </DescriptionList>
      <InlineLink file="routes/protected/person-case/secondary-doc.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-secondary-identity-document')}
      </InlineLink>
    </section>
  );
}

interface PreferredNameDataProps {
  data: {
    preferredSameAsDocumentName: boolean;
    firstName: string;
    middleName?: string;
    lastName: string;
    supportingDocuments?: { required: boolean; documentTypes?: string[] };
  };
  tabId?: string;
}

function PreferredNameData({ data, tabId }: PreferredNameDataProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <section className="space-y-6">
      <h2 className="font-lato text-2xl font-bold">{t('protected:review.sub-title-preferred-name')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem term={t('protected:current-name.preferred-name.description')}>
          <p>{data.preferredSameAsDocumentName ? t('protected:review.yes') : t('protected:review.no')}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:current-name.preferred-name.first-name')}>
          <p>{data.firstName}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:current-name.preferred-name.middle-name')}>
          {data.preferredSameAsDocumentName === false && data.middleName && <p>{data.middleName}</p>}
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:current-name.preferred-name.last-name')}>
          <p>{data.lastName}</p>
        </DescriptionListItem>

        <h3 className="font-lato text-2xl font-bold">{t('protected:current-name.supporting-docs.title')}</h3>
        <DescriptionListItem term={t('protected:current-name.supporting-docs.docs-required')}>
          <p>
            {data.preferredSameAsDocumentName === false && data.supportingDocuments?.required
              ? t('protected:review.yes')
              : t('protected:review.no')}
          </p>
        </DescriptionListItem>
        {data.preferredSameAsDocumentName === false && data.supportingDocuments?.required && (
          <DescriptionListItem term={t('protected:current-name.supporting-docs.title')}>
            {data.supportingDocuments.documentTypes && data.supportingDocuments.documentTypes.length > 0 && (
              <ul className="ml-6 list-disc">
                {data.supportingDocuments.documentTypes.map((value) => (
                  <li key={value}>{t(`protected:current-name.doc-types.${value}` as ResourceKey)}</li>
                ))}
              </ul>
            )}
          </DescriptionListItem>
        )}
      </DescriptionList>
      <InlineLink file="routes/protected/person-case/current-name.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-current-name')}
      </InlineLink>
    </section>
  );
}

interface PersonalDetailsDataProps {
  data: {
    firstNamePreviouslyUsed?: string[];
    lastNameAtBirth: string;
    lastNamePreviouslyUsed?: string[];
    gender: string;
    genderName: string;
  };
  tabId?: string;
}

function PersonalDetailsData({ data, tabId }: PersonalDetailsDataProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <section className="space-y-6">
      <h2 className="font-lato text-2xl font-bold">{t('protected:personal-information.page-title')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem term={t('protected:personal-information.first-name-previously-used.label')}>
          {data.firstNamePreviouslyUsed && data.firstNamePreviouslyUsed.length > 0 && (
            <ul className="ml-6 list-disc">
              {data.firstNamePreviouslyUsed.map((value, index) => (
                <li key={`${index}-${value}`}>{value}</li>
              ))}
            </ul>
          )}
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:personal-information.last-name-at-birth.label')}>
          <p>{data.lastNameAtBirth}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:personal-information.last-name-previously-used.label')}>
          {data.lastNamePreviouslyUsed && data.lastNamePreviouslyUsed.length > 0 && (
            <ul className="ml-6 list-disc">
              {data.lastNamePreviouslyUsed.map((value, index) => (
                <li key={`${index}-${value}`}>{value}</li>
              ))}
            </ul>
          )}
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:personal-information.gender.label')}>
          <p>{data.genderName}</p>
        </DescriptionListItem>
      </DescriptionList>
      <InlineLink file="routes/protected/person-case/personal-info.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-personal-details')}
      </InlineLink>
    </section>
  );
}

interface BirthDetailsDataProps {
  data: {
    city?: string;
    province?: string;
    provinceName?: string;
    country: string;
    countryName: string;
    fromMultipleBirth: boolean;
  };
  tabId?: string;
}

function BirthDetailsData({ data, tabId }: BirthDetailsDataProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <section className="space-y-6">
      <h2 className="font-lato text-2xl font-bold">{t('protected:birth-details.page-title')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem term={t('protected:review.birth-place')}>
          <Address
            address={{
              city: data.city,
              provinceState: data.provinceName,
              country: data.countryName,
            }}
          />
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:review.multiple-birth')}>
          <p>{data.fromMultipleBirth ? t('protected:review.yes') : t('protected:review.no')}</p>
        </DescriptionListItem>
      </DescriptionList>
      <InlineLink file="routes/protected/person-case/birth-details.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-birth-details')}
      </InlineLink>
    </section>
  );
}

interface ParentDetailsDataProps {
  data: (
    | {
        unavailable: boolean;
        givenName?: string;
        lastName?: string;
        birthLocation?: { country: string; city?: string; province?: string };
        countryName?: string;
        provinceName?: string;
      }
    | undefined
  )[];
  tabId?: string;
}

function ParentDetailsData({ data, tabId }: ParentDetailsDataProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <section className="space-y-6">
      <h2 className="font-lato text-2xl font-bold">{t('protected:parent-details.page-title')}</h2>
      <DescriptionList className="divide-y border-y">
        <ul>
          {Array.isArray(data) &&
            data.map((parentDetail, index) => (
              <li key={`parent-${index + 1}`} className="divide-y border-y">
                <h3 className="font-lato text-2xl font-bold">
                  {t('protected:parent-details.section-title')}
                  <span className="ml-[0.5ch]">{index + 1}</span>
                </h3>
                {parentDetail?.unavailable ? (
                  <DescriptionListItem term={t('protected:parent-details.details-unavailable')}>
                    {t('protected:review.yes')}
                  </DescriptionListItem>
                ) : (
                  <>
                    <DescriptionListItem term={t('protected:parent-details.given-name')}>
                      {parentDetail?.givenName}
                    </DescriptionListItem>
                    <DescriptionListItem term={t('protected:parent-details.last-name')}>
                      {parentDetail?.lastName}
                    </DescriptionListItem>
                    <DescriptionListItem term={t('protected:review.birth-place')}>
                      {parentDetail?.countryName && (
                        <Address
                          address={{
                            city: parentDetail.birthLocation?.city,
                            provinceState: parentDetail.provinceName,
                            country: parentDetail.countryName,
                          }}
                        />
                      )}
                    </DescriptionListItem>
                  </>
                )}
              </li>
            ))}
        </ul>
      </DescriptionList>
      <InlineLink file="routes/protected/person-case/parent-details.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-parent-details')}
      </InlineLink>
    </section>
  );
}

function PreviousSinData({ data, tabId }: DataProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <section className="space-y-6">
      <h2 className="font-lato text-2xl font-bold">{t('protected:previous-sin.page-title')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem term={t('protected:previous-sin.has-previous-sin-label')}>
          <p>{data.hasPreviousSin}</p>
        </DescriptionListItem>
        {data.socialInsuranceNumber && (
          <DescriptionListItem term={t('protected:previous-sin.social-insurance-number-label')}>
            <p>{data.socialInsuranceNumber}</p>
          </DescriptionListItem>
        )}
      </DescriptionList>
      <InlineLink file="routes/protected/person-case/previous-sin.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-previous-sin')}
      </InlineLink>
    </section>
  );
}

interface ContactInformationDataProps {
  data: {
    preferredLanguage: string;
    preferredLanguageName: string;
    primaryPhoneNumber: string;
    secondaryPhoneNumber?: string;
    emailAddress?: string;
    country: string;
    countryName: string;
    address: string;
    postalCode: string;
    city: string;
    province: string;
    provinceName?: string;
  };
  tabId?: string;
}

function ContactInformationData({ data, tabId }: ContactInformationDataProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <section className="space-y-6">
      <h2 className="font-lato text-2xl font-bold">{t('protected:contact-information.page-title')}</h2>
      <DescriptionList className="divide-y border-y">
        <h3 className="font-lato text-2xl font-bold">{t('protected:contact-information.correspondence')}</h3>
        <DescriptionListItem term={t('protected:contact-information.preferred-language-label')}>
          <p>{data.preferredLanguageName}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:contact-information.primary-phone-label')}>
          <p>{data.primaryPhoneNumber}</p>
        </DescriptionListItem>
        {data.secondaryPhoneNumber && (
          <DescriptionListItem term={t('protected:contact-information.secondary-phone-label')}>
            <p>{data.secondaryPhoneNumber}</p>
          </DescriptionListItem>
        )}
        {data.emailAddress && (
          <DescriptionListItem term={t('protected:contact-information.email-label')}>
            <p>{data.emailAddress}</p>
          </DescriptionListItem>
        )}
        <h3 className="font-lato text-2xl font-bold">{t('protected:contact-information.mailing-address')}</h3>
        <DescriptionListItem term={t('protected:contact-information.address-label')}>
          <Address
            address={{
              addressLine1: data.address,
              city: data.city,
              provinceState: data.provinceName,
              postalZipCode: data.postalCode,
              country: data.countryName,
            }}
          />
        </DescriptionListItem>
      </DescriptionList>
      <InlineLink file="routes/protected/person-case/contact-information.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-contact-information')}
      </InlineLink>
    </section>
  );
}

function validateInPersonSINCaseSession(
  sessionData: Partial<InPersonSinApplication> | undefined,
  tabId: string | undefined,
  request: Request,
): Required<InPersonSinApplication> {
  const search = tabId ? new URLSearchParams({ tid: tabId }) : undefined;

  if (sessionData === undefined) {
    throw i18nRedirect('routes/protected/person-case/privacy-statement.tsx', request, { search });
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
  } = sessionData;

  if (privacyStatement === undefined) {
    throw i18nRedirect('routes/protected/index.tsx', request, { search });
  }

  if (requestDetails === undefined) {
    throw i18nRedirect('routes/protected/person-case/request-details.tsx', request, { search });
  }

  if (primaryDocuments === undefined) {
    throw i18nRedirect('routes/protected/person-case/primary-docs.tsx', request, { search });
  }

  if (secondaryDocument === undefined) {
    throw i18nRedirect('routes/protected/person-case/secondary-doc.tsx', request, { search });
  }

  if (currentNameInfo === undefined) {
    throw i18nRedirect('routes/protected/person-case/current-name.tsx', request, { search });
  }

  if (personalInformation === undefined) {
    throw i18nRedirect('routes/protected/person-case/personal-info.tsx', request, { search });
  }

  if (birthDetails === undefined) {
    throw i18nRedirect('routes/protected/person-case/birth-details.tsx', request, { search });
  }

  if (parentDetails === undefined) {
    throw i18nRedirect('routes/protected/person-case/parent-details.tsx', request, { search });
  }

  if (previousSin === undefined) {
    throw i18nRedirect('routes/protected/person-case/previous-sin.tsx', request, { search });
  }

  if (contactInformation === undefined) {
    throw i18nRedirect('routes/protected/person-case/contact-information.tsx', request, { search });
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
