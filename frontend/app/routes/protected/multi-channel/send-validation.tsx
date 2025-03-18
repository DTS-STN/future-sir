import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/send-validation';

import { caseApi } from '~/.server/domain/multi-channel/services/case-api-service';
import { getLocalizedApplicantGenderById } from '~/.server/domain/person-case/services/applicant-gender-service';
import { getLocalizedApplicantSecondaryDocumentChoiceById } from '~/.server/domain/person-case/services/applicant-secondary-document-service';
import { getLocalizedLanguageOfCorrespondenceById } from '~/.server/domain/person-case/services/language-correspondence-service';
import { serverEnvironment } from '~/.server/environment';
import { getLocalizedCountryById } from '~/.server/shared/services/country-service';
import { getLocalizedProvinceById } from '~/.server/shared/services/province-service';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { ContextualAlert } from '~/components/contextual-alert';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
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
  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  // TODO: the id will likely come from a path param in the URL?
  const personSinCase = await caseApi.getCaseById('00000000000000');

  return {
    documentTitle: t('protected:send-validation.page-title'),
    caseId: personSinCase.caseId,
    inPersonSINCase: {
      ...personSinCase,
      primaryDocuments: {
        ...personSinCase.primaryDocuments,
        genderName: getLocalizedApplicantGenderById(personSinCase.primaryDocuments.gender, lang).name,
      },
      secondaryDocument: {
        ...personSinCase.secondaryDocument,
        documentTypeName: getLocalizedApplicantSecondaryDocumentChoiceById(personSinCase.secondaryDocument.documentType, lang)
          .name,
      },
      personalInformation: {
        ...personSinCase.personalInformation,
        genderName: getLocalizedApplicantGenderById(personSinCase.personalInformation.gender, lang).name,
      },
      birthDetails: {
        ...personSinCase.birthDetails,
        countryName: getLocalizedCountryById(personSinCase.birthDetails.country, lang).name,
        provinceName: personSinCase.birthDetails.province
          ? personSinCase.birthDetails.country !== serverEnvironment.PP_CANADA_COUNTRY_CODE
            ? personSinCase.birthDetails.province
            : getLocalizedProvinceById(personSinCase.birthDetails.province, lang).name
          : undefined,
      },
      parentDetails: personSinCase.parentDetails.map((parentdetail) =>
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
        ...personSinCase.contactInformation,
        preferredLanguageName: getLocalizedLanguageOfCorrespondenceById(
          personSinCase.contactInformation.preferredLanguage,
          lang,
        ).name,
        countryName: getLocalizedCountryById(personSinCase.contactInformation.country, lang).name,
        provinceName: personSinCase.contactInformation.province
          ? personSinCase.contactInformation.country !== serverEnvironment.PP_CANADA_COUNTRY_CODE
            ? personSinCase.contactInformation.province
            : getLocalizedProvinceById(personSinCase.contactInformation.province, lang).name
          : undefined,
      },
      currentNameInfo: {
        ...personSinCase.currentNameInfo,
        firstName:
          personSinCase.currentNameInfo.preferredSameAsDocumentName === true
            ? personSinCase.primaryDocuments.givenName
            : personSinCase.currentNameInfo.firstName,
        lastName:
          personSinCase.currentNameInfo.preferredSameAsDocumentName === true
            ? personSinCase.primaryDocuments.lastName
            : personSinCase.currentNameInfo.lastName,
      },
    },
  };
}

export default function SendValidation({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const { inPersonSINCase, caseId } = loaderData;

  return (
    <>
      <PageTitle subTitle={t('protected:first-time.title')}>{t('protected:send-validation.page-title')}</PageTitle>
      <ContextualAlert type="info">
        <h3 className="text-lg font-semibold">{t('protected:send-validation.case-created')}</h3>
        <p>{t('protected:send-validation.id-number')}</p>
        <p>{caseId}</p>
      </ContextualAlert>
      <SinApplication inPersonSINCase={inPersonSINCase} />
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
