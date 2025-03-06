import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { faExclamationCircle, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/secondary-doc';

import {
  getApplicantSecondaryDocumentChoices,
  getLocalizedApplicantSecondaryDocumentChoices,
} from '~/.server/domain/person-case/services/applicant-secondary-document-service';
import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { DatePickerField } from '~/components/date-picker-field';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputFile } from '~/components/input-file';
import { InputRadios } from '~/components/input-radios';
import { PageTitle } from '~/components/page-title';
import { Progress } from '~/components/progress';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';
import type { SecondaryDocumentData } from '~/routes/protected/person-case/state-machine';
import { getStateRoute, loadMachineActor } from '~/routes/protected/person-case/state-machine';
import { getStartOfDayInTimezone } from '~/utils/date-utils';

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
      const { lang, t } = await getTranslation(request, handle.i18nNamespace);
      const currentDate = getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE);
      const schema = v.pipe(
        v.object({
          documentType: v.picklist(
            getApplicantSecondaryDocumentChoices().map(({ id }) => id),
            t('protected:secondary-identity-document.document-type.invalid'),
          ),
          /*
        TODO: Enable file upload
        document: v.pipe(
          v.file(t('protected:secondary-identity-document.upload-document.required')),
          v.mimeType(
            ['image/jpeg', 'image/png', 'image/heic'],
            t('protected:secondary-identity-document.upload-document.invalid'),
          ),
          v.maxSize(maxImageSizeBits),
        ),
        */
          expiryYear: v.pipe(
            v.number(t('protected:secondary-identity-document.expiry-date.required-year')),
            v.integer(t('protected:secondary-identity-document.expiry-date.invalid-year')),
            v.minValue(currentDate.getFullYear(), t('protected:secondary-identity-document.expiry-date.invalid-year')),
          ),
          expiryMonth: v.pipe(
            v.number(t('protected:secondary-identity-document.expiry-date.required-month')),
            v.integer(t('protected:secondary-identity-document.expiry-date.invalid-month')),
            v.minValue(1, t('protected:secondary-identity-document.expiry-date.invalid-month')),
            v.maxValue(12, t('protected:secondary-identity-document.expiry-date.invalid-month')),
          ),
        }),
        v.forward(
          v.partialCheck(
            [['expiryYear'], ['expiryMonth']],
            (input) =>
              input.expiryYear > currentDate.getFullYear() ||
              (input.expiryYear === currentDate.getFullYear() && input.expiryMonth >= currentDate.getMonth()),
            t('protected:secondary-identity-document.expiry-date.invalid'),
          ),
          ['expiryMonth'],
        ),
      ) satisfies v.GenericSchema<SecondaryDocumentData>;

      const expiryYear = Number(formData.get('expiry-year'));
      const expiryMonth = Number(formData.get('expiry-month'));

      const input = {
        documentType: String(formData.get('document-type')),
        expiryYear: expiryYear,
        expiryMonth: expiryMonth,
      } satisfies Partial<v.InferInput<typeof schema>>;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      machineActor.send({ type: 'submitSecondaryDocuments', data: parseResult.output });
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
      <div className="flex justify-end">
        <Button id="abandon-button" endIcon={faXmark} variant="link">
          {t('protected:person-case.abandon-button')}
        </Button>
        <Button id="refer-button" endIcon={faExclamationCircle} variant="link">
          {t('protected:person-case.refer-button')}
        </Button>
      </div>
      <Progress className="mt-8" label="" value={30} />
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
              errorMessage={errors?.documentType?.at(0)}
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
                year: errors?.expiryYear?.at(0),
                month: errors?.expiryMonth?.at(0),
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
              errorMessage={errors?.document?.at(0)}
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
