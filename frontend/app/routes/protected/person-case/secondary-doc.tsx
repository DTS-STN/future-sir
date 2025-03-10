import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/secondary-doc';

import { getLocalizedApplicantSecondaryDocumentChoices } from '~/.server/domain/person-case/services/applicant-secondary-document-service';
import { LogFactory } from '~/.server/logging';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { DatePickerField } from '~/components/date-picker-field';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputFile } from '~/components/input-file';
import { InputRadios } from '~/components/input-radios';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { getStateRoute, loadMachineActor } from '~/routes/protected/person-case/state-machine.server';
import { secondaryDocumentSchema } from '~/routes/protected/person-case/validation.server';
import { getSingleKey } from '~/utils/i18n-utils';

const log = LogFactory.getLogger(import.meta.url);

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const machineActor = loadMachineActor(context.session, request, 'secondary-docs');

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
      const expiryYear = Number(formData.get('expiry-year'));
      const expiryMonth = Number(formData.get('expiry-month'));

      const parseResult = v.safeParse(secondaryDocumentSchema, {
        documentType: String(formData.get('document-type')),
        expiryYear: expiryYear,
        expiryMonth: expiryMonth,
      });

      if (!parseResult.success) {
        return data(
          { errors: v.flatten<typeof secondaryDocumentSchema>(parseResult.issues).nested },
          { status: HttpStatusCodes.BAD_REQUEST },
        );
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
  requireAuth(context.session, new URL(request.url), ['user']);

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);
  const machineActor = loadMachineActor(context.session, request, 'secondary-docs');

  return {
    documentTitle: t('protected:secondary-identity-document.page-title'),
    localizedApplicantSecondaryDocumentChoices: getLocalizedApplicantSecondaryDocumentChoices(lang),
    defaultFormValues: machineActor?.getSnapshot().context.secondaryDocument,
  };
}

export default function SecondaryDoc({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  const docOptions = loaderData.localizedApplicantSecondaryDocumentChoices.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === loaderData.defaultFormValues?.documentType,
  }));

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:secondary-identity-document.page-title')}</PageTitle>

      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate encType="multipart/form-data">
          <div className="space-y-10">
            <InputRadios
              id="document-type-id"
              legend={t('protected:secondary-identity-document.document-type.title')}
              name="document-type"
              options={docOptions}
              required
              errorMessage={t(getSingleKey(errors?.documentType))}
            />
            <DatePickerField
              defaultMonth={loaderData.defaultFormValues?.expiryMonth}
              defaultYear={loaderData.defaultFormValues?.expiryYear}
              id="expiry-date-id"
              legend={t('protected:secondary-identity-document.expiry-date.title')}
              required
              names={{
                month: 'expiry-month',
                year: 'expiry-year',
              }}
              errorMessages={{
                year: t(getSingleKey(errors?.expiryYear)),
                month: t(getSingleKey(errors?.expiryMonth)),
              }}
            />
            <InputFile
              disabled
              accept=".jpg,.png,.heic"
              id="document-id"
              name="document"
              label={t('protected:secondary-identity-document.upload-document.title')}
              required
              /*
              TODO: Enable file upload
              errorMessage={t(getSingleKey(errors?.document))}
              */
            />
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
      </FetcherErrorSummary>
    </>
  );
}
