import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/review';

import { getLocalizedApplicantGenderById } from '~/.server/domain/person-case/services/applicant-gender-service';
import { getLocalizedApplicantSecondaryDocumentChoiceById } from '~/.server/domain/person-case/services/applicant-secondary-document-service';
import { getLocalizedApplicantHadSinOptionById } from '~/.server/domain/person-case/services/applicant-sin-service';
import { getLocalizedApplicantStatusInCanadaChoiceById } from '~/.server/domain/person-case/services/applicant-status-in-canada-service';
import { getLocalizedApplicantSupportingDocumentTypeById } from '~/.server/domain/person-case/services/applicant-supporting-document-service';
import { getLocalizedLanguageOfCorrespondenceById } from '~/.server/domain/person-case/services/language-correspondence-service';
import { submitSinApplication } from '~/.server/domain/person-case/services/sin-application-service';
import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';
import { getLocalizedCountryById } from '~/.server/shared/services/country-service';
import { getLocalizedProvinceById } from '~/.server/shared/services/province-service';
import { mapInPersonSINCaseToSinApplicationRequest } from '~/.server/shared/services/sin-application-service';
import type { InPersonSinApplication } from '~/.server/shared/services/sin-application-service';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { getStateRoute, loadMachineActor } from '~/routes/protected/person-case/state-machine.server';
import { SinApplication } from '~/routes/protected/sin-application';

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

  const tabId = new URL(request.url).searchParams.get('tid') ?? undefined;
  const sessionData = (context.session.inPersonSinApplications ??= {});
  const inPersonSINCase = validateInPersonSINCaseSession(sessionData, tabId, request);
  const sinApplicationRequest = mapInPersonSINCaseToSinApplicationRequest(inPersonSINCase);

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      machineActor.send({ type: 'prev' });
      break;
    }

    case 'next': {
      try {
        const response = await submitSinApplication(sinApplicationRequest);
        //TODO: store the response in session
        console.log('SIN Application submitted successfully:', response);
      } catch (err) {
        console.log('Error submitting SIN application:', err);
      }

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

  throw redirect(getStateRoute(machineActor, { context, params, request }));
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
    tabId,
    inPersonSINCase: {
      ...inPersonSinApplication,
      primaryDocuments: {
        ...inPersonSinApplication.primaryDocuments,
        currentStatusInCanadaName: getLocalizedApplicantStatusInCanadaChoiceById(
          inPersonSinApplication.primaryDocuments.currentStatusInCanada,
          lang,
        ).name,
        genderName: getLocalizedApplicantGenderById(inPersonSinApplication.primaryDocuments.gender, lang).name,
      },
      secondaryDocument: {
        ...inPersonSinApplication.secondaryDocument,
        documentTypeName: getLocalizedApplicantSecondaryDocumentChoiceById(
          inPersonSinApplication.secondaryDocument.documentType,
          lang,
        ).name,
      },
      personalInformation: {
        ...inPersonSinApplication.personalInformation,
        genderName: getLocalizedApplicantGenderById(inPersonSinApplication.personalInformation.gender, lang).name,
      },
      birthDetails: {
        ...inPersonSinApplication.birthDetails,
        countryName: getLocalizedCountryById(inPersonSinApplication.birthDetails.country, lang).name,
        provinceName: inPersonSinApplication.birthDetails.province
          ? inPersonSinApplication.birthDetails.country !== serverEnvironment.PP_CANADA_COUNTRY_CODE
            ? inPersonSinApplication.birthDetails.province
            : getLocalizedProvinceById(inPersonSinApplication.birthDetails.province, lang).name
          : undefined,
      },
      parentDetails: inPersonSinApplication.parentDetails.map((parentdetail) =>
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
              countryName: getLocalizedCountryById(parentdetail.birthLocation.country, lang).name,
              provinceName: parentdetail.birthLocation.province
                ? parentdetail.birthLocation.country !== serverEnvironment.PP_CANADA_COUNTRY_CODE
                  ? parentdetail.birthLocation.province
                  : getLocalizedProvinceById(parentdetail.birthLocation.province, lang).name
                : undefined,
            },
      ),
      contactInformation: {
        ...inPersonSinApplication.contactInformation,
        preferredLanguageName: getLocalizedLanguageOfCorrespondenceById(
          inPersonSinApplication.contactInformation.preferredLanguage,
          lang,
        ).name,
        countryName: getLocalizedCountryById(inPersonSinApplication.contactInformation.country, lang).name,
        provinceName: inPersonSinApplication.contactInformation.province
          ? inPersonSinApplication.contactInformation.country !== serverEnvironment.PP_CANADA_COUNTRY_CODE
            ? inPersonSinApplication.contactInformation.province
            : getLocalizedProvinceById(inPersonSinApplication.contactInformation.province, lang).name
          : undefined,
      },
      previousSin: {
        ...inPersonSinApplication.previousSin,
        hasPreviousSinText: getLocalizedApplicantHadSinOptionById(inPersonSinApplication.previousSin.hasPreviousSin, lang).name,
      },
      currentNameInfo: {
        ...inPersonSinApplication.currentNameInfo,
        firstName:
          inPersonSinApplication.currentNameInfo.preferredSameAsDocumentName === true
            ? inPersonSinApplication.primaryDocuments.givenName
            : inPersonSinApplication.currentNameInfo.firstName,
        lastName:
          inPersonSinApplication.currentNameInfo.preferredSameAsDocumentName === true
            ? inPersonSinApplication.primaryDocuments.lastName
            : inPersonSinApplication.currentNameInfo.lastName,
        supportingDocumentsNames:
          inPersonSinApplication.currentNameInfo.preferredSameAsDocumentName === false &&
          inPersonSinApplication.currentNameInfo.supportingDocuments.required === true
            ? inPersonSinApplication.currentNameInfo.supportingDocuments.documentTypes.map(
                (doc) => getLocalizedApplicantSupportingDocumentTypeById(doc, lang).name,
              )
            : undefined,
      },
    },
  };
}

export default function Review({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const { inPersonSINCase, tabId } = loaderData;

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:review.page-title')}</PageTitle>

      <fetcher.Form className="max-w-prose" method="post" noValidate>
        <p className="mb-8 text-lg">{t('protected:review.read-carefully')}</p>
        <SinApplication inPersonSINCase={inPersonSINCase} tabId={tabId} />
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
