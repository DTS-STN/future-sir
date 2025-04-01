import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/secondary-doc';

import { getLocalizedApplicantSecondaryDocumentChoices } from '~/.server/domain/person-case/services/applicant-secondary-document-service';
import { requireAllRoles } from '~/.server/utils/auth-utils';
import { Button } from '~/components/button';
import { DatePickerField } from '~/components/date-picker-field';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputFile } from '~/components/input-file';
import { InputRadios } from '~/components/input-radios';
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
import { secondaryDocumentSchema } from '~/routes/protected/person-case/validation.server';
import { extractValidationKey } from '~/utils/validation-utils';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const tabId = getTabIdOrRedirect(request);
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'secondary-docs' });

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      machineActor.send({ type: 'prev' });
      break;
    }

    case 'next': {
      const formValues = {
        documentType: formData.get('document-type')?.toString(),
        expiryYear: formData.get('expiry-year')?.toString(),
        expiryMonth: formData.get('expiry-month')?.toString(),
      };

      const parseResult = v.safeParse(secondaryDocumentSchema, formValues);

      if (!parseResult.success) {
        const formErrors = v.flatten<typeof secondaryDocumentSchema>(parseResult.issues).nested;

        machineActor.send({
          type: 'setFormData',
          data: {
            secondaryDocument: {
              values: formValues,
              errors: formErrors,
            },
          },
        });

        return data({ formValues: formValues, formErrors: formErrors }, { status: HttpStatusCodes.BAD_REQUEST });
      }

      machineActor.send({ type: 'submitSecondaryDocuments', data: parseResult.output });
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
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'secondary-docs' });
  const { formData, secondaryDocument } = machineActor.getSnapshot().context;

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:secondary-identity-document.page-title'),
    localizedApplicantSecondaryDocumentChoices: getLocalizedApplicantSecondaryDocumentChoices(lang),
    formValues: formData?.secondaryDocument?.values ?? secondaryDocument,
    formErrors: formData?.secondaryDocument?.errors,
  };
}

export default function SecondaryDoc({ actionData, loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const fetcherState = useFetcherState(fetcher);

  const formValues = fetcher.data?.formValues ?? loaderData.formValues;
  const formErrors = fetcher.data?.formErrors ?? loaderData.formErrors;

  const docOptions = loaderData.localizedApplicantSecondaryDocumentChoices.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === loaderData.formValues?.documentType,
  }));

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:secondary-identity-document.page-title')}</PageTitle>
      <div className="max-w-prose">
        <FetcherErrorSummary fetcherKey={fetcherKey}>
          <fetcher.Form method="post" noValidate encType="multipart/form-data">
            <div className="space-y-6">
              <InputRadios
                id="document-type-id"
                legend={t('protected:secondary-identity-document.document-type.title')}
                name="document-type"
                options={docOptions}
                required
                errorMessage={t(extractValidationKey(formErrors?.documentType))}
              />
              <DatePickerField
                defaultValue={{
                  year: formValues?.expiryYear,
                  month: formValues?.expiryMonth,
                }}
                id="expiry-date-id"
                legend={t('protected:secondary-identity-document.expiry-date.title')}
                required
                names={{
                  month: 'expiry-month',
                  year: 'expiry-year',
                }}
                errorMessages={{
                  year: t(extractValidationKey(formErrors?.expiryYear)),
                  month: t(extractValidationKey(formErrors?.expiryMonth)),
                }}
              />
              <InputFile
                disabled
                accept=".jpg,.png,.heic"
                id="document-id"
                name="document"
                label={t('protected:secondary-identity-document.upload-document.title')}
                required
              />
            </div>
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
      </div>
    </>
  );
}
