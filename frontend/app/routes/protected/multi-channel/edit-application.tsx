import { useId } from 'react';

import type { AppLoadContext, RouteHandle } from 'react-router';
import { data, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/edit-application';

import { getLocalizedApplicantGenders } from '~/.server/domain/person-case/services/applicant-gender-service';
import { getLocalizedApplicantSecondaryDocumentChoices } from '~/.server/domain/person-case/services/applicant-secondary-document-service';
import { getLocalizedApplicantHadSinOptions } from '~/.server/domain/person-case/services/applicant-sin-service';
import { getLocalizedApplicantStatusInCanadaChoices } from '~/.server/domain/person-case/services/applicant-status-in-canada-service';
import { getLocalizedApplicantSupportingDocumentType } from '~/.server/domain/person-case/services/applicant-supporting-document-service';
import { getLocalizedApplicationSubmissionScenarios } from '~/.server/domain/person-case/services/application-submission-scenario';
import { getLocalizedTypesOfApplicationToSubmit } from '~/.server/domain/person-case/services/application-type-service';
import { getLocalizedLanguageOfCorrespondence } from '~/.server/domain/person-case/services/language-correspondence-service';
import { LogFactory } from '~/.server/logging';
import { getLocalizedCountries } from '~/.server/shared/services/country-service';
import { getLocalizedProvinces } from '~/.server/shared/services/province-service';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import BirthDetailsForm from '~/routes/protected/sin-application/birth-details-form';
import ContactInformationForm from '~/routes/protected/sin-application/contact-information-form';
import CurrentNameForm from '~/routes/protected/sin-application/current-name-form';
import ParentDetailsForm from '~/routes/protected/sin-application/parent-details-form';
import PersonalInformationForm from '~/routes/protected/sin-application/personal-info-form';
import PreviousSinForm from '~/routes/protected/sin-application/previous-sin-form';
import PrimaryDocsForm from '~/routes/protected/sin-application/primary-docs-form';
import RequestDetailsForm from '~/routes/protected/sin-application/request-details-form';
import SecondaryDocForm from '~/routes/protected/sin-application/secondary-doc-form';
import type { Errors } from '~/routes/protected/sin-application/types';
import type {
  birthDetailsSchema,
  contactInformationSchema,
  currentNameSchema,
  parentDetailsSchema,
  personalInfoSchema,
  previousSinSchema,
  primaryDocumentSchema,
  requestDetailsSchema,
  secondaryDocumentSchema,
} from '~/routes/protected/sin-application/validation.server';
import {
  maxNumberOfParents,
  parseBirthDetails,
  parseContactInformation,
  parseCurrentName,
  parseParentDetails,
  parsePersonalInfo,
  parsePreviousSin,
  parsePrimaryDocument,
  parseRequestDetails,
  parseSecondaryDocument,
} from '~/routes/protected/sin-application/validation.server';

const log = LogFactory.getLogger(import.meta.url);

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export const editSectionIds = {
  primaryDocs: 'pri',
  requestDetails: 'req',
  currentName: 'cur',
  personalInfo: 'per',
  secondaryDoc: 'sec',
  birthDetails: 'bir',
  parentDetails: 'par',
  previousSin: 'pre',
  contactInformation: 'con',
} as const;

function getSectionId(request: Request) {
  const sectionId = new URL(request.url).searchParams.get('section') ?? undefined;
  const validId = Object.values(editSectionIds).some((id) => id === sectionId);
  if (!sectionId || !validId) {
    log.warn('Could not find the section to edit; redirecting to send validation');
    throw i18nRedirect('routes/protected/multi-channel/send-validation.tsx', request);
  }
  return sectionId;
}

function getSinApplication(context: AppLoadContext, request: Request) {
  const sinApplication = context.session.editingSinCase;
  if (!sinApplication) {
    log.warn('Could not find the application to edit; redirecting to send validation');
    throw i18nRedirect('routes/protected/multi-channel/send-validation.tsx', request);
  }
  return sinApplication;
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const sinApplication = getSinApplication(context, request);
  const sectionId = getSectionId(request);
  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      throw i18nRedirect('routes/protected/multi-channel/send-validation.tsx', request);
    }
    case 'confirm': {
      switch (sectionId) {
        case editSectionIds.primaryDocs: {
          const parseResult = parsePrimaryDocument(formData);
          if (!parseResult.success) {
            return data(
              { errors: v.flatten<typeof primaryDocumentSchema>(parseResult.issues).nested },
              { status: HttpStatusCodes.BAD_REQUEST },
            );
          }
          sinApplication.primaryDocuments = parseResult.output;
          break;
        }
        case editSectionIds.secondaryDoc: {
          const parseResult = parseSecondaryDocument(formData);
          if (!parseResult.success) {
            return data(
              { errors: v.flatten<typeof secondaryDocumentSchema>(parseResult.issues).nested },
              { status: HttpStatusCodes.BAD_REQUEST },
            );
          }
          sinApplication.secondaryDocument = parseResult.output;
          break;
        }
        case editSectionIds.requestDetails: {
          const parseResult = parseRequestDetails(formData);
          if (!parseResult.success) {
            return data(
              { errors: v.flatten<typeof requestDetailsSchema>(parseResult.issues).nested },
              { status: HttpStatusCodes.BAD_REQUEST },
            );
          }
          sinApplication.requestDetails = parseResult.output;
          break;
        }
        case editSectionIds.currentName: {
          const parseResult = parseCurrentName(formData);
          if (!parseResult.success) {
            return data(
              { errors: v.flatten<typeof currentNameSchema>(parseResult.issues).nested },
              { status: HttpStatusCodes.BAD_REQUEST },
            );
          }
          sinApplication.currentNameInfo = parseResult.output;
          break;
        }
        case editSectionIds.personalInfo: {
          const parseResult = parsePersonalInfo(formData);
          if (!parseResult.success) {
            return data(
              { errors: v.flatten<typeof personalInfoSchema>(parseResult.issues).nested },
              { status: HttpStatusCodes.BAD_REQUEST },
            );
          }
          sinApplication.personalInformation = parseResult.output;
          break;
        }
        case editSectionIds.birthDetails: {
          const parseResult = parseBirthDetails(formData);
          if (!parseResult.success) {
            return data(
              { errors: v.flatten<typeof birthDetailsSchema>(parseResult.issues).nested },
              { status: HttpStatusCodes.BAD_REQUEST },
            );
          }
          sinApplication.birthDetails = parseResult.output;
          break;
        }
        case editSectionIds.parentDetails: {
          const parseResult = parseParentDetails(formData);
          if (!parseResult.success) {
            return data(
              { errors: v.flatten<typeof parentDetailsSchema>(parseResult.issues).nested },
              { status: HttpStatusCodes.BAD_REQUEST },
            );
          }
          sinApplication.parentDetails = parseResult.output;
          break;
        }
        case editSectionIds.previousSin: {
          const parseResult = parsePreviousSin(formData);
          if (!parseResult.success) {
            return data(
              { errors: v.flatten<typeof previousSinSchema>(parseResult.issues).nested },
              { status: HttpStatusCodes.BAD_REQUEST },
            );
          }
          sinApplication.previousSin = parseResult.output;
          break;
        }
        case editSectionIds.contactInformation: {
          const parseResult = parseContactInformation(formData);
          if (!parseResult.success) {
            return data(
              { errors: v.flatten<typeof contactInformationSchema>(parseResult.issues).nested },
              { status: HttpStatusCodes.BAD_REQUEST },
            );
          }
          sinApplication.contactInformation = parseResult.output;
          break;
        }
        default: {
          throw new AppError(`Unrecognized section: ${sectionId}`, ErrorCodes.UNRECOGNIZED_SECTION);
        }
      }
      throw i18nRedirect('routes/protected/multi-channel/send-validation.tsx', request);
    }
    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
}

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const sectionId = getSectionId(request);
  const { t, lang } = await getTranslation(request, handle.i18nNamespace);
  const sinApplication = getSinApplication(context, request);

  switch (sectionId) {
    case editSectionIds.primaryDocs: {
      return {
        sectionId,
        documentTitle: t('protected:primary-identity-document.page-title'),
        defaultFormValues: sinApplication.primaryDocuments,
        localizedStatusInCanada: getLocalizedApplicantStatusInCanadaChoices(lang),
        localizedGenders: getLocalizedApplicantGenders(lang),
      };
    }
    case editSectionIds.secondaryDoc: {
      return {
        sectionId,
        documentTitle: t('protected:secondary-identity-document.page-title'),
        defaultFormValues: sinApplication.secondaryDocument,
        localizedApplicantSecondaryDocumentChoices: getLocalizedApplicantSecondaryDocumentChoices(lang),
      };
    }
    case editSectionIds.requestDetails: {
      return {
        sectionId,
        documentTitle: t('protected:request-details.page-title'),
        defaultFormValues: sinApplication.requestDetails,
        localizedSubmissionScenarios: getLocalizedApplicationSubmissionScenarios(lang),
        localizedTypeofApplicationToSubmit: getLocalizedTypesOfApplicationToSubmit(lang),
      };
    }
    case editSectionIds.currentName: {
      return {
        sectionId,
        documentTitle: t('protected:current-name.page-title'),
        defaultFormValues: sinApplication.currentNameInfo,
        localizedSupportingDocTypes: getLocalizedApplicantSupportingDocumentType(lang),
        primaryDocName: {
          firstName: sinApplication.primaryDocuments.givenName,
          lastName: sinApplication.primaryDocuments.lastName,
          middleName: '', // TODO: Add middle name
        },
      };
    }
    case editSectionIds.personalInfo: {
      return {
        sectionId,
        documentTitle: t('protected:personal-information.page-title'),
        primaryDocValues: sinApplication.primaryDocuments,
        defaultFormValues: sinApplication.personalInformation,
        genders: getLocalizedApplicantGenders(lang),
      };
    }
    case editSectionIds.birthDetails: {
      return {
        sectionId,
        documentTitle: t('protected:birth-details.page-title'),
        localizedCountries: getLocalizedCountries(lang),
        localizedProvincesTerritoriesStates: getLocalizedProvinces(lang),
        defaultFormValues: sinApplication.birthDetails,
      };
    }
    case editSectionIds.parentDetails: {
      return {
        sectionId,
        documentTitle: t('protected:parent-details.page-title'),
        localizedCountries: getLocalizedCountries(lang),
        localizedProvincesTerritoriesStates: getLocalizedProvinces(lang),
        maxParents: maxNumberOfParents,
        defaultFormValues: sinApplication.parentDetails,
      };
    }
    case editSectionIds.previousSin: {
      return {
        sectionId,
        documentTitle: t('protected:previous-sin.page-title'),
        defaultFormValues: sinApplication.previousSin,
        localizedApplicantHadSinOptions: getLocalizedApplicantHadSinOptions(lang),
      };
    }
    case editSectionIds.contactInformation: {
      return {
        sectionId,
        documentTitle: t('protected:contact-information.page-title'),
        defaultFormValues: sinApplication.contactInformation,
        localizedPreferredLanguages: getLocalizedLanguageOfCorrespondence(lang),
        localizedCountries: getLocalizedCountries(lang),
        localizedProvincesTerritoriesStates: getLocalizedProvinces(lang),
      };
    }
    default: {
      throw new AppError(`Unrecognized section: ${sectionId}`, ErrorCodes.UNRECOGNIZED_SECTION);
    }
  }
}

export default function EditApplication({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  return (
    <>
      <PageTitle subTitle={t('protected:first-time.title')}>{loaderData.documentTitle}</PageTitle>
      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <ApplicationForm loaderData={loaderData} errors={errors} />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button name="action" value="confirm" variant="primary" id="continue-button" disabled={isSubmitting}>
              {t('protected:send-validation.confirm')}
            </Button>
            <Button name="action" value="back" id="back-button" disabled={isSubmitting}>
              {t('protected:send-validation.back')}
            </Button>
          </div>
        </fetcher.Form>
      </FetcherErrorSummary>
    </>
  );
}

interface ApplicationFormProps {
  loaderData: Route.ComponentProps['loaderData'];
  errors: Errors;
}

function ApplicationForm({ loaderData, errors }: ApplicationFormProps) {
  switch (loaderData.sectionId) {
    case editSectionIds.primaryDocs: {
      return (
        <PrimaryDocsForm
          defaultFormValues={loaderData.defaultFormValues}
          localizedStatusInCanada={loaderData.localizedStatusInCanada}
          localizedGenders={loaderData.localizedGenders}
          errors={errors}
        />
      );
    }
    case editSectionIds.secondaryDoc: {
      return (
        <SecondaryDocForm
          defaultFormValues={loaderData.defaultFormValues}
          localizedApplicantSecondaryDocumentChoices={loaderData.localizedApplicantSecondaryDocumentChoices}
          errors={errors}
        />
      );
    }
    case editSectionIds.requestDetails: {
      return (
        <RequestDetailsForm
          defaultFormValues={loaderData.defaultFormValues}
          localizedSubmissionScenarios={loaderData.localizedSubmissionScenarios}
          localizedTypeofApplicationToSubmit={loaderData.localizedTypeofApplicationToSubmit}
          errors={errors}
        />
      );
    }
    case editSectionIds.currentName: {
      return (
        <CurrentNameForm
          defaultFormValues={loaderData.defaultFormValues}
          localizedSupportingDocTypes={loaderData.localizedSupportingDocTypes}
          primaryDocName={loaderData.primaryDocName}
          errors={errors}
        />
      );
    }
    case editSectionIds.personalInfo: {
      return (
        <PersonalInformationForm
          defaultFormValues={loaderData.defaultFormValues}
          primaryDocValues={loaderData.primaryDocValues}
          genders={loaderData.genders}
          errors={errors}
        />
      );
    }
    case editSectionIds.birthDetails: {
      return (
        <BirthDetailsForm
          defaultFormValues={loaderData.defaultFormValues}
          localizedCountries={loaderData.localizedCountries}
          localizedProvincesTerritoriesStates={loaderData.localizedProvincesTerritoriesStates}
          errors={errors}
        />
      );
    }
    case editSectionIds.parentDetails: {
      return (
        <ParentDetailsForm
          defaultFormValues={loaderData.defaultFormValues}
          localizedCountries={loaderData.localizedCountries}
          localizedProvincesTerritoriesStates={loaderData.localizedProvincesTerritoriesStates}
          maxParents={loaderData.maxParents}
          errors={errors}
        />
      );
    }
    case editSectionIds.previousSin: {
      return (
        <PreviousSinForm
          defaultFormValues={loaderData.defaultFormValues}
          localizedApplicantHadSinOptions={loaderData.localizedApplicantHadSinOptions}
          errors={errors}
        />
      );
    }
    case editSectionIds.contactInformation: {
      return (
        <ContactInformationForm
          defaultFormValues={loaderData.defaultFormValues}
          localizedPreferredLanguages={loaderData.localizedPreferredLanguages}
          localizedCountries={loaderData.localizedCountries}
          localizedProvincesTerritoriesStates={loaderData.localizedProvincesTerritoriesStates}
          errors={errors}
        />
      );
    }
    default: {
      return <></>;
    }
  }
}
