import type { JSX } from 'react';
import { useId, useState } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/primary-docs';

import type { LocalizedApplicantGender, LocalizedApplicantStatusInCanadaChoice } from '~/.server/domain/person-case/models';
import { applicantGenderService, applicantStatusInCanadaService } from '~/.server/domain/person-case/services';
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
import { APPLICANT_STATUS_IN_CANADA } from '~/domain/constants';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { getStateRoute, loadMachineActor } from '~/routes/protected/person-case/state-machine.server';
import { primaryDocumentSchema } from '~/routes/protected/person-case/validation.server';
import { toISODateString } from '~/utils/date-utils';
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
      const dateOfBirthYear = Number(formData.get('dateOfBirthYear'));
      const dateOfBirthMonth = Number(formData.get('dateOfBirthMonth'));
      const dateOfBirthDay = Number(formData.get('dateOfBirthDay'));
      const dateOfBirth = toDateString(dateOfBirthYear, dateOfBirthMonth, dateOfBirthDay);

      const citizenshipDateYear = Number(formData.get('citizenshipDateYear'));
      const citizenshipDateMonth = Number(formData.get('citizenshipDateMonth'));
      const citizenshipDateDay = Number(formData.get('citizenshipDateDay'));
      const citizenshipDate = toDateString(citizenshipDateYear, citizenshipDateMonth, citizenshipDateDay);

      const rawFormData = {
        currentStatusInCanada: String(formData.get('currentStatusInCanada')),
        documentType: String(formData.get('documentType')),
        registrationNumber: formData.get('registrationNumber')?.toString() ?? '',
        clientNumber: formData.get('clientNumber')?.toString() ?? '',
        givenName: formData.get('givenName')?.toString() ?? '',
        lastName: formData.get('lastName')?.toString() ?? '',
        dateOfBirthYear: dateOfBirthYear,
        dateOfBirthMonth: dateOfBirthMonth,
        dateOfBirthDay: dateOfBirthDay,
        dateOfBirth: dateOfBirth,
        gender: String(formData.get('gender')),
        citizenshipDateYear: citizenshipDateYear,
        citizenshipDateMonth: citizenshipDateMonth,
        citizenshipDateDay: citizenshipDateDay,
        citizenshipDate: citizenshipDate,
      };
      const parseResult = v.safeParse(primaryDocumentSchema, rawFormData);

      if (!parseResult.success) {
        machineActor.send({
          type: 'setRawDataMap',
          data: { primaryDocuments: { formData: rawFormData, errors: v.flatten(parseResult.issues).nested } },
        });
        return data({ errors: v.flatten(parseResult.issues).nested }, { status: HttpStatusCodes.BAD_REQUEST });
      }

      machineActor.send({ type: 'setRawDataMap', data: { primaryDocuments: undefined } });
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
  requireAuth(context.session, new URL(request.url), ['user']);

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);
  const machineActor = loadMachineActor(context.session, request, 'primary-docs');

  return {
    documentTitle: t('protected:primary-identity-document.page-title'),
    defaultFormValues: machineActor?.getSnapshot().context.primaryDocuments,
    localizedStatusInCanada: applicantStatusInCanadaService.getLocalizedApplicantStatusInCanadaChoices(lang),
    localizedGenders: applicantGenderService.getLocalizedApplicantGenders(lang),
    rawData: machineActor?.getSnapshot().context.rawDataMap?.primaryDocuments,
  };
}

export default function PrimaryDocs({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors ?? loaderData.rawData?.errors;
  const defaultFormValues = loaderData.defaultFormValues ?? loaderData.rawData?.formData;

  const [currentStatus, setCurrentStatus] = useState(defaultFormValues?.currentStatusInCanada);
  const [documentType, setDocumentType] = useState(defaultFormValues?.documentType);

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:primary-identity-document.page-title')}</PageTitle>

      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate encType="multipart/form-data">
          <div className="space-y-6">
            <CurrentStatusInCanada
              defaultValue={defaultFormValues?.currentStatusInCanada}
              errorMessage={t(getSingleKey(errors?.currentStatusInCanada))}
              onChange={({ target }) => setCurrentStatus(target.value)}
              statusInCanada={loaderData.localizedStatusInCanada}
            />
            {currentStatus && (
              <DocumentType
                currentStatus={currentStatus}
                defaultValue={defaultFormValues?.documentType}
                errorMessage={t(getSingleKey(errors?.documentType))}
                onChange={({ target }) => setDocumentType(target.value)}
              />
            )}
            {currentStatus && documentType && (
              <PrimaryDocsFields
                genders={loaderData.localizedGenders}
                currentStatus={currentStatus}
                defaultValues={defaultFormValues}
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
  statusInCanada: LocalizedApplicantStatusInCanadaChoice[];
}

function CurrentStatusInCanada({ defaultValue, errorMessage, onChange, statusInCanada }: CurrentStatusInCanadaProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const currentStatusInCanadaOptions = [{ id: 'select-option', name: '' }, ...statusInCanada].map(({ id, name }) => ({
    value: id === 'select-option' ? '' : id,
    children: id === 'select-option' ? t('protected:request-details.select-option') : name,
    disabled: id !== APPLICANT_STATUS_IN_CANADA.canadianCitizenBornOutsideCanada,
  }));

  return (
    <>
      <InputSelect
        id="currentStatusInCanada"
        name="currentStatusInCanada"
        errorMessage={errorMessage}
        defaultValue={defaultValue ?? ''}
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
        case APPLICANT_STATUS_IN_CANADA.canadianCitizenBornOutsideCanada:
          return canadianCitizenBornOutsideCanadaDocumentType.map((value) => ({
            value: value,
            children: t(`protected:primary-identity-document.document-type.options.${value}` as const),
            disabled: value != 'certificate-of-canadian-citizenship',
          }));

        case APPLICANT_STATUS_IN_CANADA.registeredIndianBornInCanada:
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
      {(currentStatus === APPLICANT_STATUS_IN_CANADA.canadianCitizenBornOutsideCanada ||
        currentStatus === APPLICANT_STATUS_IN_CANADA.registeredIndianBornInCanada) && (
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
      {currentStatus === APPLICANT_STATUS_IN_CANADA.canadianCitizenBornOutsideCanada &&
        documentType === 'certificate-of-canadian-citizenship' && (
          <>
            <InputField
              id="registration-number-id"
              defaultValue={defaultValues?.registrationNumber}
              errorMessage={t(getSingleKey(errors?.registrationNumber), { length: 8 })}
              label={t('protected:primary-identity-document.registration-number.label')}
              name="registrationNumber"
              required
              type="text"
            />
            <InputField
              id="client-number-id"
              defaultValue={defaultValues?.clientNumber}
              errorMessage={t(getSingleKey(errors?.clientNumber), { length: 10 })}
              label={t('protected:primary-identity-document.client-number.label')}
              name="clientNumber"
              required
              type="text"
            />
            <InputField
              id="given-name-id"
              defaultValue={defaultValues?.givenName}
              errorMessage={t(getSingleKey(errors?.givenName), { maximum: 100 })}
              helpMessagePrimary={t('protected:primary-identity-document.given-name.help-message-primary')}
              label={t('protected:primary-identity-document.given-name.label')}
              name="givenName"
              required
              type="text"
            />
            <InputField
              id="last-name-id"
              defaultValue={defaultValues?.lastName}
              errorMessage={t(getSingleKey(errors?.lastName), { maximum: 100 })}
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
                all: t(getSingleKey(errors?.dateOfBirth)),
                year: t(getSingleKey(errors?.dateOfBirthYear)),
                month: t(getSingleKey(errors?.dateOfBirthMonth)),
                day: t(getSingleKey(errors?.dateOfBirthDay)),
              }}
            />
            <InputRadios
              id="gender-id"
              errorMessage={t(getSingleKey(errors?.gender))}
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
                all: t(getSingleKey(errors?.citizenshipDate)),
                year: t(getSingleKey(errors?.citizenshipDateYear)),
                month: t(getSingleKey(errors?.citizenshipDateMonth)),
                day: t(getSingleKey(errors?.citizenshipDateDay)),
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
            errorMessage={t(getSingleKey(errors?.document))}
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
