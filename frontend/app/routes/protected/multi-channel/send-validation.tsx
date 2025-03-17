import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/send-validation';

import {
  applicantGenderService,
  applicantSecondaryDocumentService,
  languageCorrespondenceService,
} from '~/.server/domain/person-case/services';
import { serverEnvironment } from '~/.server/environment';
import { countryService, provinceService } from '~/.server/shared/services';
import type { InPersonSinApplication } from '~/.server/shared/services/sin-application-service';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { ContextualAlert } from '~/components/contextual-alert';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { createMachineActor } from '~/routes/protected/person-case/state-machine.server';
import { SinApplication } from '~/routes/protected/sin-application';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'send': {
      throw i18nRedirect('routes/protected/multi-channel/pid-verification.tsx', request);
    }
    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
}

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const tabId = new URL(request.url).searchParams.get('tid') ?? undefined;
  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  // TODO: Update with the actual fetch method
  const { inPersonSinApplication, caseId } = fetchInPersonSinApplication();

  if (tabId) {
    createMachineActor(context.session, request).send({ type: 'setSinApplication', data: inPersonSinApplication });
  }

  return {
    documentTitle: t('protected:send-validation.page-title'),
    caseId,
    tabId,
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
      },
    },
  };
}

export default function SendValidation({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const { inPersonSINCase, caseId, tabId } = loaderData;

  return (
    <>
      <PageTitle subTitle={t('protected:first-time.title')}>{t('protected:send-validation.page-title')}</PageTitle>
      <ContextualAlert type="info">
        <h3 className="text-lg font-semibold">{t('protected:send-validation.case-created')}</h3>
        <p>{t('protected:send-validation.id-number')}</p>
        <p>{caseId}</p>
      </ContextualAlert>
      <SinApplication inPersonSINCase={inPersonSINCase} tabId={tabId} />
      <fetcher.Form className="max-w-prose" method="post" noValidate>
        <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
          <Button name="action" value="send" variant="primary" id="send-for-validation" disabled={isSubmitting}>
            {t('protected:send-validation.send-for-validation')}
          </Button>
        </div>
      </fetcher.Form>
    </>
  );
}

function fetchInPersonSinApplication(): {
  inPersonSinApplication: Required<InPersonSinApplication>;
  caseId: string;
} {
  const birthDetails = {
    country: 'f8914e7c-2c95-ea11-a812-000d3a0c2b5d',
    province: '845808d0-3195-ea11-a812-000d3a0c2b5d',
    city: 'CityOfBirth',
    fromMultipleBirth: false,
  };

  const contactInformation = {
    preferredLanguage: '564190000',
    primaryPhoneNumber: '+1780111111',
    secondaryPhoneNumber: undefined,
    emailAddress: undefined,
    country: 'f8914e7c-2c95-ea11-a812-000d3a0c2b5d',
    address: '1111 111 Ave NW',
    postalCode: 'T2Y 2H2',
    city: 'ContactCity',
    province: '845808d0-3195-ea11-a812-000d3a0c2b5d',
  };

  const currentNameInfo = {
    preferredSameAsDocumentName: true as const,
  };

  const parentDetails = [
    {
      unavailable: false,
      givenName: 'ParentName',
      lastName: 'ParentLastName',
      birthLocation: {
        country: 'f8914e7c-2c95-ea11-a812-000d3a0c2b5d',
        province: '845808d0-3195-ea11-a812-000d3a0c2b5d',
        city: 'ParentCity',
      },
    },
    {
      unavailable: false,
      givenName: 'ParentName',
      lastName: 'ParentLastName',
      birthLocation: {
        country: 'f8914e7c-2c95-ea11-a812-000d3a0c2b5d',
        province: '845808d0-3195-ea11-a812-000d3a0c2b5d',
        city: 'ParentCity',
      },
    },
  ];

  const personalInformation = {
    firstNamePreviouslyUsed: ['PreviousFirstName'],
    lastNameAtBirth: 'LastNameAtBirth',
    lastNamePreviouslyUsed: ['PreviousLastName'],
    gender: '564190002',
  };

  const previousSin = {
    hasPreviousSin: '564190000',
    socialInsuranceNumber: '123456789',
  };

  const primaryDocuments = {
    citizenshipDate: '2000-01-01',
    clientNumber: '1000000',
    currentStatusInCanada: 'canadian-citizen-born-outside-canada',
    dateOfBirth: '1999-01-01',
    documentType: 'certificate-of-canadian-citizenship',
    gender: '564190002',
    givenName: 'GivenName',
    lastName: 'LastName',
    registrationNumber: '1000000000',
  };

  const privacyStatement = {
    agreedToTerms: true as const,
  };

  const requestDetails = {
    type: '564190000',
    scenario: '564190000',
  };

  const secondaryDocument = {
    documentType: '564190000',
    expiryMonth: 1,
    expiryYear: 3000,
  };

  return {
    inPersonSinApplication: {
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
    },
    caseId: '1234567890123',
  };
}
