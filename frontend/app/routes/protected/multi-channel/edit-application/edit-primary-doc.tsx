import type { JSX } from 'react';
import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { data, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/edit-primary-doc';

import { getLocalizedApplicantGenders } from '~/.server/domain/person-case/services/applicant-gender-service';
import { getLocalizedApplicantPrimaryDocumentChoices } from '~/.server/domain/person-case/services/applicant-primary-document-service';
import { getLocalizedApplicantStatusInCanadaChoices } from '~/.server/domain/person-case/services/applicant-status-in-canada-service';
import { requireAllRoles } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { getTranslation } from '~/i18n-config.server';
import { getEditingSinCase } from '~/routes/protected/multi-channel/edit-application/edit-application.server';
import type { primaryDocumentSchema } from '~/routes/protected/multi-channel/edit-application/validation.server';
import { parsePrimaryDocument } from '~/routes/protected/multi-channel/edit-application/validation.server';
import { handle as parentHandle } from '~/routes/protected/multi-channel/layout';
import PrimaryDocsForm from '~/routes/protected/sin-application/primary-docs-form';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const sinCase = getEditingSinCase(request, context.session, params.caseId);
  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      break;
    }
    case 'confirm': {
      const { parseResult, formValues } = parsePrimaryDocument(formData);
      if (!parseResult.success) {
        const formErrors = v.flatten<typeof primaryDocumentSchema>(parseResult.issues).nested;
        return data({ formValues: formValues, formErrors: formErrors }, { status: HttpStatusCodes.BAD_REQUEST });
      }
      sinCase.primaryDocuments = parseResult.output;
      break;
    }
    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
  throw i18nRedirect('routes/protected/multi-channel/send-validation.tsx', request, {
    params: { caseId: params.caseId },
  });
}

export async function loader({ context, request, params }: Route.LoaderArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const { primaryDocuments } = getEditingSinCase(request, context.session, params.caseId);
  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:primary-identity-document.page-title'),
    localizedStatusInCanada: getLocalizedApplicantStatusInCanadaChoices(lang),
    localizedPrimaryDocumentChoices: getLocalizedApplicantPrimaryDocumentChoices(lang),
    localizedGenders: getLocalizedApplicantGenders(lang),
    formValues: primaryDocuments,
  };
}

export default function EditPrimaryDoc({ actionData, loaderData, params }: Route.ComponentProps): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';

  const formValues = fetcher.data?.formValues ?? loaderData.formValues;
  const formErrors = fetcher.data?.formErrors;

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:primary-identity-document.page-title')}</PageTitle>

      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate encType="multipart/form-data">
          <PrimaryDocsForm
            formValues={formValues}
            formErrors={formErrors}
            localizedPrimaryDocumentChoices={loaderData.localizedPrimaryDocumentChoices}
            localizedStatusInCanada={loaderData.localizedStatusInCanada}
            localizedGenders={loaderData.localizedGenders}
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button name="action" value="confirm" variant="primary" id="confirm-button" disabled={isSubmitting}>
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
