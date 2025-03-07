import type { JSX } from 'react';
import { useId, useState } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/primary-docs';

import type { LocalizedApplicantGender } from '~/.server/domain/person-case/models';
import { applicantGenderService } from '~/.server/domain/person-case/services';
import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { DatePickerField } from '~/components/date-picker-field';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputFile } from '~/components/input-file';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import type { PrimaryDocumentData } from '~/routes/protected/person-case/state-machine';
import { getStateRoute, loadMachineActor } from '~/routes/protected/person-case/state-machine';
import { getStartOfDayInTimezone, isDateInPastOrTodayInTimeZone, isValidDateString, toISODateString } from '~/utils/date-utils';
import { REGEX_PATTERNS } from '~/utils/regex-utils';

const VALID_CURRENT_STATUS = ['canadian-citizen-born-outside-canada'];
const VALID_DOCTYPES = ['certificate-of-canadian-citizenship'];

const log = LogFactory.getLogger(import.meta.url);

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const machineActor = loadMachineActor(context.session, request, 'primary-docs');

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

      const schema = v.intersect([
        v.object({
          currentStatusInCanada: v.pipe(
            v.string(t('protected:primary-identity-document.current-status-in-canada.required')),
            v.trim(),
            v.nonEmpty(t('protected:primary-identity-document.current-status-in-canada.required')),
            v.picklist(VALID_CURRENT_STATUS, t('protected:primary-identity-document.current-status-in-canada.invalid')),
          ),
        }),
        v.variant(
          'documentType',
          [
            v.object({
              documentType: v.picklist(VALID_DOCTYPES, t('protected:primary-identity-document.document-type.invalid')),
              registrationNumber: v.pipe(
                v.string(t('protected:primary-identity-document.registration-number.required')),
                v.trim(),
                v.nonEmpty(t('protected:primary-identity-document.registration-number.required')),
                v.length(8, t('protected:primary-identity-document.registration-number.invalid', { length: 8 })),
                v.regex(
                  REGEX_PATTERNS.DIGIT_ONLY,
                  t('protected:primary-identity-document.registration-number.invalid', { length: 8 }),
                ),
              ),
              clientNumber: v.pipe(
                v.string(t('protected:primary-identity-document.client-number.required')),
                v.trim(),
                v.nonEmpty(t('protected:primary-identity-document.client-number.required')),
                v.length(10, t('protected:primary-identity-document.client-number.invalid', { length: 10 })),
                v.regex(
                  REGEX_PATTERNS.DIGIT_ONLY,
                  t('protected:primary-identity-document.client-number.invalid', { length: 10 }),
                ),
              ),
              givenName: v.pipe(
                v.string(t('protected:primary-identity-document.given-name.required')),
                v.trim(),
                v.nonEmpty(t('protected:primary-identity-document.given-name.required')),
                v.maxLength(100, t('protected:primary-identity-document.given-name.max-length', { maximum: 100 })),
                v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:primary-identity-document.given-name.format')),
              ),
              lastName: v.pipe(
                v.string(t('protected:primary-identity-document.last-name.required')),
                v.trim(),
                v.nonEmpty(t('protected:primary-identity-document.last-name.required')),
                v.maxLength(100, t('protected:primary-identity-document.last-name.max-length', { maximum: 100 })),
                v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:primary-identity-document.last-name.format')),
              ),
              dateOfBirthYear: v.pipe(
                v.number(t('protected:primary-identity-document.date-of-birth.required-year')),
                v.integer(t('protected:primary-identity-document.date-of-birth.invalid-year')),
                v.minValue(1, t('protected:primary-identity-document.date-of-birth.invalid-year')),
                v.maxValue(
                  getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE).getFullYear(),
                  t('protected:primary-identity-document.date-of-birth.invalid-year'),
                ),
              ),
              dateOfBirthMonth: v.pipe(
                v.number(t('protected:primary-identity-document.date-of-birth.required-month')),
                v.integer(t('protected:primary-identity-document.date-of-birth.invalid-month')),
                v.minValue(1, t('protected:primary-identity-document.date-of-birth.invalid-month')),
                v.maxValue(12, t('protected:primary-identity-document.date-of-birth.invalid-month')),
              ),
              dateOfBirthDay: v.pipe(
                v.number(t('protected:primary-identity-document.date-of-birth.required-day')),
                v.integer(t('protected:primary-identity-document.date-of-birth.invalid-day')),
                v.minValue(1, t('protected:primary-identity-document.date-of-birth.invalid-day')),
                v.maxValue(31, t('protected:primary-identity-document.date-of-birth.invalid-day')),
              ),
              dateOfBirth: v.pipe(
                v.string(),
                v.custom(
                  (input) => isValidDateString(input as string),
                  t('protected:primary-identity-document.date-of-birth.invalid'),
                ),
                v.custom(
                  (input) => isDateInPastOrTodayInTimeZone(serverEnvironment.BASE_TIMEZONE, input as string),
                  t('protected:primary-identity-document.date-of-birth.invalid-future-date'),
                ),
              ),
              gender: v.picklist(
                applicantGenderService.getApplicantGenders().map(({ id }) => id),
                t('protected:primary-identity-document.gender.required'),
              ),
              citizenshipDateYear: v.pipe(
                v.number(t('protected:primary-identity-document.citizenship-date.required-year')),
                v.integer(t('protected:primary-identity-document.citizenship-date.invalid-year')),
                v.minValue(1, t('protected:primary-identity-document.citizenship-date.invalid-year')),
                v.maxValue(
                  getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE).getFullYear(),
                  t('protected:primary-identity-document.citizenship-date.invalid-year'),
                ),
              ),
              citizenshipDateMonth: v.pipe(
                v.number(t('protected:primary-identity-document.citizenship-date.required-month')),
                v.integer(t('protected:primary-identity-document.citizenship-date.invalid-month')),
                v.minValue(1, t('protected:primary-identity-document.citizenship-date.invalid-month')),
                v.maxValue(12, t('protected:primary-identity-document.citizenship-date.invalid-month')),
              ),
              citizenshipDateDay: v.pipe(
                v.number(t('protected:primary-identity-document.citizenship-date.required-day')),
                v.integer(t('protected:primary-identity-document.citizenship-date.invalid-day')),
                v.minValue(1, t('protected:primary-identity-document.citizenship-date.invalid-day')),
                v.maxValue(31, t('protected:primary-identity-document.citizenship-date.invalid-day')),
              ),
              citizenshipDate: v.pipe(
                v.string(),
                v.custom(
                  (input) => isValidDateString(input as string),
                  t('protected:primary-identity-document.citizenship-date.invalid'),
                ),
              ),
            }),
          ],
          t('protected:primary-identity-document.document-type.required'),
        ),
      ]) satisfies v.GenericSchema<PrimaryDocumentData>;

      const dateOfBirthYear = Number(formData.get('dateOfBirthYear'));
      const dateOfBirthMonth = Number(formData.get('dateOfBirthMonth'));
      const dateOfBirthDay = Number(formData.get('dateOfBirthDay'));
      const dateOfBirth = toDateString(dateOfBirthYear, dateOfBirthMonth, dateOfBirthDay);

      const citizenshipDateYear = Number(formData.get('citizenshipDateYear'));
      const citizenshipDateMonth = Number(formData.get('citizenshipDateMonth'));
      const citizenshipDateDay = Number(formData.get('citizenshipDateDay'));
      const citizenshipDate = toDateString(citizenshipDateYear, citizenshipDateMonth, citizenshipDateDay);

      const input = {
        currentStatusInCanada: String(formData.get('currentStatusInCanada')),
        documentType: String(formData.get('documentType')),
        registrationNumber: String(formData.get('registrationNumber')),
        clientNumber: String(formData.get('clientNumber')),
        givenName: String(formData.get('givenName')),
        lastName: String(formData.get('lastName')),
        dateOfBirthYear: dateOfBirthYear,
        dateOfBirthMonth: dateOfBirthMonth,
        dateOfBirthDay: dateOfBirthDay,
        dateOfBirth: dateOfBirth,
        gender: String(formData.get('gender')),
        citizenshipDateYear: citizenshipDateYear,
        citizenshipDateMonth: citizenshipDateMonth,
        citizenshipDateDay: citizenshipDateDay,
        citizenshipDate: citizenshipDate,
      } satisfies Partial<v.InferInput<typeof schema>>;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten(parseResult.issues).nested }, { status: 400 });
      }

      machineActor.send({ type: 'submitPrimaryDocuments', data: parseResult.output });
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
  const machineActor = loadMachineActor(context.session, request, 'primary-docs');

  return {
    documentTitle: t('protected:primary-identity-document.page-title'),
    defaultFormValues: machineActor?.getSnapshot().context.primaryDocuments,
    localizedGenders: applicantGenderService.getLocalizedApplicantGenders(lang),
  };
}

export default function PrimaryDocs({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  const [currentStatus, setCurrentStatus] = useState(loaderData.defaultFormValues?.currentStatusInCanada);
  const [documentType, setDocumentType] = useState(loaderData.defaultFormValues?.documentType);

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:primary-identity-document.page-title')}</PageTitle>

      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate encType="multipart/form-data">
          <div className="space-y-6">
            <CurrentStatusInCanada
              defaultValue={loaderData.defaultFormValues?.currentStatusInCanada}
              errorMessage={errors?.currentStatusInCanada?.at(0)}
              onChange={({ target }) => setCurrentStatus(target.value)}
            />
            {currentStatus && (
              <DocumentType
                currentStatus={currentStatus}
                defaultValue={loaderData.defaultFormValues?.documentType}
                errorMessage={errors?.documentType?.at(0)}
                onChange={({ target }) => setDocumentType(target.value)}
              />
            )}
            {currentStatus && documentType && (
              <PrimaryDocsFields
                genders={loaderData.localizedGenders}
                currentStatus={currentStatus}
                defaultValues={loaderData.defaultFormValues}
                documentType={documentType}
                errors={errors}
              />
            )}
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

interface CurrentStatusInCanadaProps {
  defaultValue?: string;
  errorMessage?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}

function CurrentStatusInCanada({ defaultValue, errorMessage, onChange }: CurrentStatusInCanadaProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const CurrentStatusInCanada = [
    'canadian-citizen-born-in-canada',
    'canadian-citizen-born-outside-canada',
    'registered-indian-born-in-canada',
    'registered-indian-born-outside-canada',
    'permanent-resident',
    'temporary-resident',
    'no-legal-status-in-canada',
  ] as const;

  const currentStatusInCanadaOptions = [
    {
      children: t('protected:request-details.select-option'),
      value: '',
    },
    ...CurrentStatusInCanada.map((value) => ({
      value: value,
      children: t(`protected:primary-identity-document.current-status-in-canada.options.${value}` as const),
      disabled: value != 'canadian-citizen-born-outside-canada',
    })),
  ];

  return (
    <>
      <InputSelect
        id="currentStatusInCanada"
        name="currentStatusInCanada"
        errorMessage={errorMessage}
        defaultValue={defaultValue}
        required
        options={currentStatusInCanadaOptions}
        label={t('protected:primary-identity-document.current-status-in-canada.title')}
        onChange={onChange}
      />
    </>
  );
}

interface DocumentTypeProps {
  currentStatus?: string;
  defaultValue?: string;
  errorMessage?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}

function DocumentType({ currentStatus, defaultValue, errorMessage, onChange }: DocumentTypeProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const canadianCitizenBornOutsideCanadaDocumentType = [
    'certificate-of-canadian-citizenship',
    'certificate-of-registration-of-birth-abroad',
  ] as const;

  const registeredIndianBornInCanadaDocumentType = [
    'birth-certificate-and-certificate-of-indian-status',
    'certificate-of-canadian-citizenship-and-certificate-of-indian-status',
  ] as const;

  const documentTypeOptions = [
    {
      children: t('protected:request-details.select-option'),
      value: '',
      hidden: true,
    },
    ...(() => {
      switch (currentStatus) {
        case 'canadian-citizen-born-outside-canada':
          return canadianCitizenBornOutsideCanadaDocumentType.map((value) => ({
            value: value,
            children: t(`protected:primary-identity-document.document-type.options.${value}` as const),
            disabled: value != 'certificate-of-canadian-citizenship',
          }));

        case 'registered-indian-born-in-canada':
          return registeredIndianBornInCanadaDocumentType.map((value) => ({
            value: value,
            children: t(`protected:primary-identity-document.document-type.options.${value}` as const),
          }));

        default:
          return [];
      }
    })(),
  ];

  return (
    <>
      {(currentStatus === 'canadian-citizen-born-outside-canada' || currentStatus === 'registered-indian-born-in-canada') && (
        <InputSelect
          id="documentType"
          name="documentType"
          errorMessage={errorMessage}
          defaultValue={defaultValue}
          required
          options={documentTypeOptions}
          label={t('protected:primary-identity-document.document-type.title')}
          onChange={onChange}
        />
      )}
    </>
  );
}

interface PrimaryDocsFieldsProps {
  genders: LocalizedApplicantGender[];
  currentStatus?: string;
  defaultValues?: {
    citizenshipDate: string;
    clientNumber: string;
    dateOfBirth: string;
    gender: string;
    givenName: string;
    lastName: string;
    registrationNumber: string;
  };
  documentType?: string;
  errors?: Record<string, [string, ...string[]] | undefined>;
}

function PrimaryDocsFields({
  genders,
  currentStatus,
  defaultValues,
  errors,
  documentType,
}: PrimaryDocsFieldsProps): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespace);

  const genderOptions = genders.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === defaultValues?.gender,
  }));

  return (
    <>
      {currentStatus === 'canadian-citizen-born-outside-canada' && documentType === 'certificate-of-canadian-citizenship' && (
        <>
          <InputField
            id="registration-number-id"
            defaultValue={defaultValues?.registrationNumber}
            errorMessage={errors?.registrationNumber?.at(0)}
            label={t('protected:primary-identity-document.registration-number.label')}
            name="registrationNumber"
            required
            type="text"
          />
          <InputField
            id="client-number-id"
            defaultValue={defaultValues?.clientNumber}
            errorMessage={errors?.clientNumber?.at(0)}
            label={t('protected:primary-identity-document.client-number.label')}
            name="clientNumber"
            required
            type="text"
          />
          <InputField
            id="given-name-id"
            defaultValue={defaultValues?.givenName}
            errorMessage={errors?.givenName?.at(0)}
            helpMessagePrimary={t('protected:primary-identity-document.given-name.help-message-primary')}
            label={t('protected:primary-identity-document.given-name.label')}
            name="givenName"
            required
            type="text"
          />
          <InputField
            id="last-name-id"
            defaultValue={defaultValues?.lastName}
            errorMessage={errors?.lastName?.at(0)}
            helpMessagePrimary={t('protected:primary-identity-document.last-name.help-message-primary')}
            label={t('protected:primary-identity-document.last-name.label')}
            name="lastName"
            required
            type="text"
          />
          <DatePickerField
            defaultValue={defaultValues?.dateOfBirth ?? ''}
            id="date-of-birth-id"
            legend={t('protected:primary-identity-document.date-of-birth.label')}
            required
            names={{
              day: 'dateOfBirthDay',
              month: 'dateOfBirthMonth',
              year: 'dateOfBirthYear',
            }}
            errorMessages={{
              all: errors?.dateOfBirth?.at(0),
              year: errors?.dateOfBirthYear?.at(0),
              month: errors?.dateOfBirthMonth?.at(0),
              day: errors?.dateOfBirthDay?.at(0),
            }}
          />
          <InputRadios
            id="gender-id"
            errorMessage={errors?.gender?.at(0)}
            legend={t('protected:primary-identity-document.gender.label')}
            name="gender"
            options={genderOptions}
            required
          />
          <DatePickerField
            defaultValue={defaultValues?.citizenshipDate ?? ''}
            id="citizenship-date-id"
            legend={t('protected:primary-identity-document.citizenship-date.label')}
            required
            names={{
              day: 'citizenshipDateDay',
              month: 'citizenshipDateMonth',
              year: 'citizenshipDateYear',
            }}
            errorMessages={{
              all: errors?.citizenshipDate?.at(0),
              year: errors?.citizenshipDateYear?.at(0),
              month: errors?.citizenshipDateMonth?.at(0),
              day: errors?.citizenshipDateDay?.at(0),
            }}
          />
          <InputFile
            disabled
            accept=".jpg,.png,.heic"
            id="primary-document-id"
            name="document"
            label={t('protected:primary-identity-document.upload-document.label')}
            required
            /*
            TODO: Enable file upload
            errorMessage={errors?.document?.at(0)}
            */
          />
        </>
      )}
    </>
  );
}

function toDateString(year: number, month: number, day: number): string {
  try {
    return toISODateString(year, month, day);
  } catch {
    return '';
  }
}
