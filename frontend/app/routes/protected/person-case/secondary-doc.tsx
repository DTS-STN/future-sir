import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { data, useFetcher } from 'react-router';

import { faExclamationCircle, faXmark } from '@fortawesome/free-solid-svg-icons';
import { isBefore } from 'date-fns';
import type { SessionData } from 'express-session';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/secondary-doc';

import {
  getApplicantSecondaryDocumentChoices,
  getLocalizedApplicantSecondaryDocumentChoices,
} from '~/.server/domain/person-case/services/applicant-secondary-document-service';
import { serverEnvironment } from '~/.server/environment';
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
import { getStartOfDayInTimezone, toISODateString } from '~/utils/date-utils';

type PrimaryDocumentsSessionData = NonNullable<SessionData['inPersonSINCase']['secondaryDocument']>;

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const { t, lang } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:secondary-identity-document.page-title'),
    localizedApplicantSecondaryDocumentChoices: getLocalizedApplicantSecondaryDocumentChoices(lang),
    defaultFormValues: context.session.inPersonSINCase?.secondaryDocument,
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const tabId = new URL(request.url).searchParams.get('tid');
  if (!tabId) throw new AppError('Missing tab id', ErrorCodes.MISSING_TAB_ID, { httpStatusCode: 400 });

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  const formData = await request.formData();
  const action = formData.get('action');
  /*
  TODO: Enable file upload
  const maxImageSizeBits = 1024 * 1024 * 15; //Max image size is 15 MB
  */

  switch (action) {
    case 'back': {
      throw i18nRedirect('routes/protected/person-case/primary-docs.tsx', request, {
        search: new URLSearchParams({ tid: tabId }),
      });
    }

    case 'next': {
      const currentDate = getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE);

      const schema = v.object({
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
        expiryDay: v.pipe(
          v.number(t('protected:secondary-identity-document.expiry-date.required-day')),
          v.integer(t('protected:secondary-identity-document.expiry-date.invalid-day')),
          v.minValue(1, t('protected:secondary-identity-document.expiry-date.invalid-day')),
          v.maxValue(31, t('protected:secondary-identity-document.expiry-date.invalid-day')),
        ),
        expiryDate: v.pipe(
          v.string(t('protected:secondary-identity-document.expiry-date.required')),
          v.custom(
            (expiryDate) => isBefore(currentDate, getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE, String(expiryDate))),
            t('protected:secondary-identity-document.expiry-date.invalid'),
          ),
        ),
      }) satisfies v.GenericSchema<PrimaryDocumentsSessionData>;

      const expiryYear = Number(formData.get('expiry-year'));
      const expiryMonth = Number(formData.get('expiry-month'));
      const expiryDay = Number(formData.get('expiry-day'));
      const input = {
        /*
        TODO: Enable file upload
        document: formData.get('document') as File,
        */
        documentType: String(formData.get('document-type')),
        expiryYear: expiryYear,
        expiryMonth: expiryMonth,
        expiryDay: expiryDay,
        expiryDate: toISODateString(expiryYear, expiryMonth, expiryDay),
      } satisfies Partial<v.InferInput<typeof schema>>;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      (context.session.inPersonSINCase ??= {}).secondaryDocument = {
        /*
        TODO: Enable file upload
        document: parseResult.output.document,
        */
        documentType: parseResult.output.documentType,
        expiryDate: parseResult.output.expiryDate,
      };

      throw i18nRedirect('routes/protected/person-case/current-name.tsx', request, {
        search: new URLSearchParams({ tid: tabId }),
      });
    }
    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
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
              defaultValue={loaderData.defaultFormValues?.expiryDate}
              id="expiry-date-id"
              legend={t('protected:secondary-identity-document.expiry-date.title')}
              required
              names={{
                day: 'expiry-day',
                month: 'expiry-month',
                year: 'expiry-year',
              }}
              errorMessages={{
                all: errors?.expiryDate?.at(0),
                year: errors?.expiryYear?.at(0),
                month: errors?.expiryMonth?.at(0),
                day: errors?.expiryDay?.at(0),
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
