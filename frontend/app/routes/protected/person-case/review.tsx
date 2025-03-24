import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/review';

import { getLocalizedApplicantGenderById } from '~/.server/domain/person-case/services/applicant-gender-service';
import { getLocalizedApplicantPrimaryDocumentChoiceById } from '~/.server/domain/person-case/services/applicant-primary-document-service';
import { getLocalizedApplicantSecondaryDocumentChoiceById } from '~/.server/domain/person-case/services/applicant-secondary-document-service';
import { getLocalizedApplicantHadSinOptionById } from '~/.server/domain/person-case/services/applicant-sin-service';
import { getLocalizedApplicantStatusInCanadaChoiceById } from '~/.server/domain/person-case/services/applicant-status-in-canada-service';
import { getLocalizedApplicantSupportingDocumentTypeById } from '~/.server/domain/person-case/services/applicant-supporting-document-service';
import { getLocalizedLanguageOfCorrespondenceById } from '~/.server/domain/person-case/services/language-correspondence-service';
import { getSinApplicationService } from '~/.server/domain/sin-application/sin-application-service';
import { serverEnvironment } from '~/.server/environment';
import { getLocalizedCountryById } from '~/.server/shared/services/country-service';
import { getLocalizedProvinceById } from '~/.server/shared/services/province-service';
import { requireAllRoles } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { InlineLink } from '~/components/links';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { getTabIdOrRedirect, loadMachineActorOrRedirect } from '~/routes/protected/person-case/route-helpers.server';
import type { InPersonSinApplication } from '~/routes/protected/person-case/state-machine-models';
import { getStateRoute } from '~/routes/protected/person-case/state-machine.server';
import { ReviewBirthDetails } from '~/routes/protected/sin-application/review-birth-details';
import { ReviewContactInformation } from '~/routes/protected/sin-application/review-contact-information';
import { ReviewCurrentName } from '~/routes/protected/sin-application/review-current-name';
import { ReviewParentDetails } from '~/routes/protected/sin-application/review-parent-details';
import { ReviewPersonalInfo } from '~/routes/protected/sin-application/review-personal-info';
import { ReviewPreviousSin } from '~/routes/protected/sin-application/review-previous-sin';
import { ReviewPrimaryDocs } from '~/routes/protected/sin-application/review-primary-docs';
import { ReviewSecondaryDoc } from '~/routes/protected/sin-application/review-secondary-doc';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const tabId = getTabIdOrRedirect(request);
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'review' });
  const machineContext = machineActor.getSnapshot().context;

  const inPersonSinApplication = validateMachineContextData(machineContext, tabId, request);

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      machineActor.send({ type: 'prev' });
      break;
    }

    case 'next': {
      const sinApplicationService = getSinApplicationService();
      const response = await sinApplicationService.submitSinApplication(inPersonSinApplication);

      if (response.identificationId === undefined) {
        throw new AppError(`Failed to submit SIN application: ${action}`, ErrorCodes.SUBMIT_SIN_APPLICATION_FAILED);
      }

      const createdCase = { caseId: response.identificationId, ...inPersonSinApplication };
      context.session.createdCases = {
        ...(context.session.createdCases ?? {}),
        [createdCase.caseId]: createdCase,
      };

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
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const tabId = getTabIdOrRedirect(request);
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'review' });
  const machineContext = machineActor.getSnapshot().context;

  const {
    birthDetails,
    contactInformation,
    currentNameInfo,
    parentDetails,
    personalInformation,
    previousSin,
    primaryDocuments,
    // TODO - Check why request details is not displayed
    // requestDetails,
    secondaryDocument,
  } = validateMachineContextData(machineContext, tabId, request);

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:review.page-title'),
    tabId,
    inPersonSINCase: {
      primaryDocuments: {
        ...primaryDocuments,
        currentStatusInCanadaName: getLocalizedApplicantStatusInCanadaChoiceById(primaryDocuments.currentStatusInCanada, lang)
          .name,
        documentTypeName: getLocalizedApplicantPrimaryDocumentChoiceById(primaryDocuments.documentType, lang).name,
        genderName: getLocalizedApplicantGenderById(primaryDocuments.gender, lang).name,
      },
      secondaryDocument: {
        ...secondaryDocument,
        documentTypeName: getLocalizedApplicantSecondaryDocumentChoiceById(secondaryDocument.documentType, lang).name,
      },
      personalInformation: {
        ...personalInformation,
        genderName: getLocalizedApplicantGenderById(personalInformation.gender, lang).name,
      },
      birthDetails: {
        ...birthDetails,
        countryName: getLocalizedCountryById(birthDetails.country, lang).name,
        provinceName: birthDetails.province
          ? birthDetails.country === serverEnvironment.PP_CANADA_COUNTRY_CODE
            ? getLocalizedProvinceById(birthDetails.province, lang).name
            : birthDetails.province
          : undefined,
      },
      parentDetails: parentDetails.map((parentdetail) => ({
        ...parentdetail,
        countryName: parentdetail.unavailable
          ? undefined
          : parentdetail.birthLocation.country && getLocalizedCountryById(parentdetail.birthLocation.country, lang).name,
        provinceName: parentdetail.unavailable
          ? undefined
          : parentdetail.birthLocation.province
            ? parentdetail.birthLocation.country === serverEnvironment.PP_CANADA_COUNTRY_CODE
              ? getLocalizedProvinceById(parentdetail.birthLocation.province, lang).name
              : parentdetail.birthLocation.province
            : undefined,
      })),
      contactInformation: {
        ...contactInformation,
        preferredLanguageName: getLocalizedLanguageOfCorrespondenceById(contactInformation.preferredLanguage, lang).name,
        countryName: getLocalizedCountryById(contactInformation.country, lang).name,
        provinceName:
          contactInformation.country === serverEnvironment.PP_CANADA_COUNTRY_CODE
            ? getLocalizedProvinceById(contactInformation.province, lang).name
            : contactInformation.province,
      },
      previousSin: {
        ...previousSin,
        hasPreviousSinText: getLocalizedApplicantHadSinOptionById(previousSin.hasPreviousSin, lang).name,
      },
      currentNameInfo: {
        ...currentNameInfo,
        firstName: currentNameInfo.preferredSameAsDocumentName ? primaryDocuments.givenName : currentNameInfo.firstName,
        lastName: currentNameInfo.preferredSameAsDocumentName ? primaryDocuments.lastName : currentNameInfo.lastName,
        supportingDocumentsNames: currentNameInfo.preferredSameAsDocumentName
          ? undefined
          : currentNameInfo.supportingDocuments.required
            ? currentNameInfo.supportingDocuments.documentTypes.map(
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
  const {
    birthDetails,
    contactInformation,
    currentNameInfo,
    parentDetails,
    personalInformation,
    previousSin,
    primaryDocuments,
    secondaryDocument,
  } = inPersonSINCase;

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:review.page-title')}</PageTitle>
      <div className="max-w-prose">
        <fetcher.Form method="post" noValidate>
          <p className="mb-8 text-lg">{t('protected:review.read-carefully')}</p>
          <div className="mt-12 space-y-15">
            <ReviewPrimaryDocs
              currentStatusInCanadaName={primaryDocuments.currentStatusInCanadaName}
              documentTypeName={primaryDocuments.documentTypeName}
              registrationNumber={primaryDocuments.registrationNumber}
              clientNumber={primaryDocuments.clientNumber}
              givenName={primaryDocuments.givenName}
              lastName={primaryDocuments.lastName}
              dateOfBirth={primaryDocuments.dateOfBirth}
              genderName={primaryDocuments.genderName}
              citizenshipDate={primaryDocuments.citizenshipDate}
            >
              <InlineLink file="routes/protected/person-case/primary-docs.tsx" search={`tid=${tabId}`}>
                {t('protected:review.edit-primary-identity-document')}
              </InlineLink>
            </ReviewPrimaryDocs>
            <ReviewSecondaryDoc
              documentTypeName={secondaryDocument.documentTypeName}
              expiryMonth={secondaryDocument.expiryMonth}
              expiryYear={secondaryDocument.expiryYear}
            >
              <InlineLink file="routes/protected/person-case/secondary-doc.tsx" search={`tid=${tabId}`}>
                {t('protected:review.edit-secondary-identity-document')}
              </InlineLink>
            </ReviewSecondaryDoc>
            <ReviewCurrentName
              preferredSameAsDocumentName={currentNameInfo.preferredSameAsDocumentName}
              firstName={currentNameInfo.firstName}
              middleName={currentNameInfo.middleName}
              lastName={currentNameInfo.lastName}
              supportingDocuments={currentNameInfo.supportingDocuments}
              supportingDocumentsNames={currentNameInfo.supportingDocumentsNames}
            >
              <InlineLink file="routes/protected/person-case/current-name.tsx" search={`tid=${tabId}`}>
                {t('protected:review.edit-current-name')}
              </InlineLink>
            </ReviewCurrentName>
            <ReviewPersonalInfo
              firstNamePreviouslyUsed={personalInformation.firstNamePreviouslyUsed}
              lastNameAtBirth={personalInformation.lastNameAtBirth}
              lastNamePreviouslyUsed={personalInformation.lastNamePreviouslyUsed}
              genderName={personalInformation.genderName}
            >
              <InlineLink file="routes/protected/person-case/personal-info.tsx" search={`tid=${tabId}`}>
                {t('protected:review.edit-personal-details')}
              </InlineLink>
            </ReviewPersonalInfo>
            <ReviewBirthDetails
              city={birthDetails.city}
              provinceName={birthDetails.provinceName}
              countryName={birthDetails.countryName}
              fromMultipleBirth={birthDetails.fromMultipleBirth}
            >
              <InlineLink file="routes/protected/person-case/birth-details.tsx" search={`tid=${tabId}`}>
                {t('protected:review.edit-birth-details')}
              </InlineLink>
            </ReviewBirthDetails>
            <ReviewParentDetails parentDetails={parentDetails}>
              <InlineLink file="routes/protected/person-case/parent-details.tsx" search={`tid=${tabId}`}>
                {t('protected:review.edit-parent-details')}
              </InlineLink>
            </ReviewParentDetails>
            <ReviewPreviousSin
              hasPreviousSinText={previousSin.hasPreviousSinText}
              socialInsuranceNumber={previousSin.socialInsuranceNumber}
            >
              <InlineLink file="routes/protected/person-case/previous-sin.tsx" search={`tid=${tabId}`}>
                {t('protected:review.edit-previous-sin')}
              </InlineLink>
            </ReviewPreviousSin>
            <ReviewContactInformation
              preferredLanguageName={contactInformation.preferredLanguageName}
              primaryPhoneNumber={contactInformation.primaryPhoneNumber}
              secondaryPhoneNumber={contactInformation.secondaryPhoneNumber}
              emailAddress={contactInformation.emailAddress}
              countryName={contactInformation.countryName}
              address={contactInformation.address}
              postalCode={contactInformation.postalCode}
              city={contactInformation.city}
              provinceName={contactInformation.provinceName}
            >
              <InlineLink file="routes/protected/person-case/contact-information.tsx" search={`tid=${tabId}`}>
                {t('protected:review.edit-contact-information')}
              </InlineLink>
            </ReviewContactInformation>
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
      </div>
    </>
  );
}

function validateMachineContextData(
  machineContext: Partial<InPersonSinApplication>,
  tabId: string,
  request: Request,
): Required<InPersonSinApplication> {
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
  } = machineContext;

  const search = new URLSearchParams({ tid: tabId });

  if (privacyStatement === undefined) {
    throw i18nRedirect('routes/protected/person-case/privacy-statement.tsx', request, { search });
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
