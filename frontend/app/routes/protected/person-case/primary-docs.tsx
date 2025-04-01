import type { JSX } from 'react';
import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/primary-docs';

import { getLocalizedApplicantGenders } from '~/.server/domain/person-case/services/applicant-gender-service';
import { getLocalizedApplicantPrimaryDocumentChoices } from '~/.server/domain/person-case/services/applicant-primary-document-service';
import { getLocalizedApplicantStatusInCanadaChoices } from '~/.server/domain/person-case/services/applicant-status-in-canada-service';
import { requireAllRoles } from '~/.server/utils/auth-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { LoadingButton } from '~/components/loading-button';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { useFetcherState } from '~/hooks/use-fetcher-state';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { getTabIdOrRedirect, loadMachineActorOrRedirect } from '~/routes/protected/person-case/route-helpers.server';
import { getStateRoute } from '~/routes/protected/person-case/state-machine.server';
import type { primaryDocumentSchema } from '~/routes/protected/person-case/validation.server';
import { parsePrimaryDocument } from '~/routes/protected/person-case/validation.server';
import PrimaryDocsForm from '~/routes/protected/sin-application/primary-docs-form';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const tabId = getTabIdOrRedirect(request);
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'primary-docs' });

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      machineActor.send({ type: 'prev' });
      break;
    }

    case 'next': {
      const { parseResult, formValues } = parsePrimaryDocument(formData);
      if (!parseResult.success) {
        const formErrors = v.flatten<typeof primaryDocumentSchema>(parseResult.issues).nested;

        machineActor.send({
          type: 'setFormData',
          data: {
            primaryDocuments: {
              values: formValues,
              errors: formErrors,
            },
          },
        });

        return data({ formValues: formValues, formErrors: formErrors }, { status: HttpStatusCodes.BAD_REQUEST });
      }

      machineActor.send({ type: 'submitPrimaryDocuments', data: parseResult.output });
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
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'primary-docs' });
  const { formData, primaryDocuments } = machineActor.getSnapshot().context;

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:primary-identity-document.page-title'),
    localizedStatusInCanada: getLocalizedApplicantStatusInCanadaChoices(lang),
    localizedPrimaryDocumentChoices: getLocalizedApplicantPrimaryDocumentChoices(lang),
    localizedGenders: getLocalizedApplicantGenders(lang),
    formValues: formData?.primaryDocuments?.values ?? primaryDocuments,
    formErrors: formData?.primaryDocuments?.errors,
  };
}

export default function PrimaryDocs({ actionData, loaderData, params }: Route.ComponentProps): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const fetcherState = useFetcherState(fetcher);

  const formValues = fetcher.data?.formValues ?? loaderData.formValues;
  const formErrors = fetcher.data?.formErrors ?? loaderData.formErrors;

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
            <LoadingButton
              name="action"
              value="next"
              variant="primary"
              id="continue-button"
              disabled={fetcherState.submitting}
              loading={fetcherState.submitting && fetcherState.action === 'next'}
            >
              {t('protected:person-case.next')}
            </LoadingButton>
            <Button name="action" value="back" id="back-button" disabled={fetcherState.submitting}>
              {t('protected:person-case.previous')}
            </Button>
          </div>
        </fetcher.Form>
      </FetcherErrorSummary>
    </>
  );
}
