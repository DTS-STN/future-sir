import type { JSX } from 'react';
import { useId, useState } from 'react';

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

export const handle = parentHandle;

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
      const dateOfBirthYear = formData.get('dateOfBirthYear')?.toString();
      const dateOfBirthMonth = formData.get('dateOfBirthMonth')?.toString();
      const dateOfBirthDay = formData.get('dateOfBirthDay')?.toString();

      const citizenshipDateYear = formData.get('citizenshipDateYear')?.toString();
      const citizenshipDateMonth = formData.get('citizenshipDateMonth')?.toString();
      const citizenshipDateDay = formData.get('citizenshipDateDay')?.toString();

      const formValues = {
        currentStatusInCanada: formData.get('currentStatusInCanada')?.toString(),
        documentType: formData.get('documentType')?.toString(),
        registrationNumber: formData.get('registrationNumber')?.toString(),
        clientNumber: formData.get('clientNumber')?.toString(),
        givenName: formData.get('givenName')?.toString(),
        lastName: formData.get('lastName')?.toString(),
        gender: formData.get('gender')?.toString(),
        dateOfBirthYear: dateOfBirthYear,
        dateOfBirthMonth: dateOfBirthMonth,
        dateOfBirthDay: dateOfBirthDay,
        dateOfBirth: toDateString(dateOfBirthYear, dateOfBirthMonth, dateOfBirthDay),
        citizenshipDateYear: citizenshipDateYear,
        citizenshipDateMonth: citizenshipDateMonth,
        citizenshipDateDay: citizenshipDateDay,
        citizenshipDate: toDateString(citizenshipDateYear, citizenshipDateMonth, citizenshipDateDay),
      };

      const parseResult = v.safeParse(primaryDocumentSchema, formValues);

      if (!parseResult.success) {
        const formErrors = v.flatten(parseResult.issues).nested;

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
  requireAuth(context.session, new URL(request.url), ['user']);

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);
  const machineActor = loadMachineActor(context.session, request, 'primary-docs');
  const machineContext = machineActor?.getSnapshot().context;

  return {
    documentTitle: t('protected:primary-identity-document.page-title'),
    localizedStatusInCanada: applicantStatusInCanadaService.getLocalizedApplicantStatusInCanadaChoices(lang),
    localizedGenders: applicantGenderService.getLocalizedApplicantGenders(lang),
    formValues: machineContext?.formData?.primaryDocuments?.values ?? machineContext?.primaryDocuments,
    formErrors: machineContext?.formData?.primaryDocuments?.errors,
  };
}

export default function PrimaryDocs({ actionData, loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';

  const formValues = fetcher.data?.formValues ?? loaderData.formValues;
  const formErrors = fetcher.data?.formErrors ?? loaderData.formErrors;

  const [currentStatus, setCurrentStatus] = useState(formValues?.currentStatusInCanada);
  const [documentType, setDocumentType] = useState(formValues?.documentType);

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:primary-identity-document.page-title')}</PageTitle>

      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate encType="multipart/form-data">
          <div className="space-y-6">
            <CurrentStatusInCanada
              defaultValue={formValues?.currentStatusInCanada}
              errorMessage={t(getSingleKey(formErrors?.currentStatusInCanada))}
              onChange={({ target }) => setCurrentStatus(target.value)}
              statusInCanada={loaderData.localizedStatusInCanada}
            />
            {currentStatus && (
              <DocumentType
                status={currentStatus}
                value={formValues?.documentType}
                error={t(getSingleKey(formErrors?.documentType))}
                onChange={({ target }) => setDocumentType(target.value)}
              />
            )}
            {currentStatus && documentType && (
              <PrimaryDocsFields
                genders={loaderData.localizedGenders}
                status={currentStatus}
                formValues={formValues}
                documentType={documentType}
                formErrors={formErrors}
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

type DocumentTypeProps = {
  error?: string;
  status?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
};

function DocumentType({ error, status, value, onChange }: DocumentTypeProps) {
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
      switch (status) {
        case APPLICANT_STATUS_IN_CANADA.canadianCitizenBornOutsideCanada:
          return canadianCitizenBornOutsideCanadaDocumentType.map((value) => ({
            value: value,
            children: t(`protected:primary-identity-document.document-type.options.${value}` as const),
            disabled: value !== 'certificate-of-canadian-citizenship',
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
      {(status === APPLICANT_STATUS_IN_CANADA.canadianCitizenBornOutsideCanada ||
        status === APPLICANT_STATUS_IN_CANADA.registeredIndianBornInCanada) && (
        <InputSelect
          id="documentType"
          name="documentType"
          errorMessage={error}
          defaultValue={value}
          required
          options={documentTypeOptions}
          label={t('protected:primary-identity-document.document-type.title')}
          onChange={onChange}
        />
      )}
    </>
  );
}

type PrimaryDocsFieldsProps = {
  documentType?: string;
  formErrors?: Record<string, [string, ...string[]] | undefined>;
  formValues?: Record<string, string | undefined>;
  genders: LocalizedApplicantGender[];
  status?: string;
};

function PrimaryDocsFields({ documentType, formErrors, formValues, genders, status }: PrimaryDocsFieldsProps): JSX.Element {
  const { t } = useTranslation(handle.i18nNamespace);

  const genderOptions = genders.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === formValues?.gender,
  }));

  return (
    <>
      {status === APPLICANT_STATUS_IN_CANADA.canadianCitizenBornOutsideCanada &&
        documentType === 'certificate-of-canadian-citizenship' && (
          <>
            <InputField
              id="registration-number-id"
              defaultValue={formValues?.registrationNumber}
              errorMessage={t(getSingleKey(formErrors?.registrationNumber), { length: 8 })}
              label={t('protected:primary-identity-document.registration-number.label')}
              name="registrationNumber"
              required
              type="text"
            />
            <InputField
              id="client-number-id"
              defaultValue={formValues?.clientNumber}
              errorMessage={t(getSingleKey(formErrors?.clientNumber), { length: 10 })}
              label={t('protected:primary-identity-document.client-number.label')}
              name="clientNumber"
              required
              type="text"
            />
            <InputField
              id="given-name-id"
              defaultValue={formValues?.givenName}
              errorMessage={t(getSingleKey(formErrors?.givenName), { maximum: 100 })}
              helpMessagePrimary={t('protected:primary-identity-document.given-name.help-message-primary')}
              label={t('protected:primary-identity-document.given-name.label')}
              name="givenName"
              required
              type="text"
            />
            <InputField
              id="last-name-id"
              defaultValue={formValues?.lastName}
              errorMessage={t(getSingleKey(formErrors?.lastName), { maximum: 100 })}
              helpMessagePrimary={t('protected:primary-identity-document.last-name.help-message-primary')}
              label={t('protected:primary-identity-document.last-name.label')}
              name="lastName"
              required
              type="text"
            />
            <DatePickerField
              defaultValue={formValues?.dateOfBirth ?? ''}
              id="date-of-birth-id"
              legend={t('protected:primary-identity-document.date-of-birth.label')}
              required
              names={{ day: 'dateOfBirthDay', month: 'dateOfBirthMonth', year: 'dateOfBirthYear' }}
              errorMessages={{
                all: t(getSingleKey(formErrors?.dateOfBirth)),
                year: t(getSingleKey(formErrors?.dateOfBirthYear)),
                month: t(getSingleKey(formErrors?.dateOfBirthMonth)),
                day: t(getSingleKey(formErrors?.dateOfBirthDay)),
              }}
            />
            <InputRadios
              id="gender-id"
              errorMessage={t(getSingleKey(formErrors?.gender))}
              legend={t('protected:primary-identity-document.gender.label')}
              name="gender"
              options={genderOptions}
              required
            />
            <DatePickerField
              defaultValue={formValues?.citizenshipDate ?? ''}
              id="citizenship-date-id"
              legend={t('protected:primary-identity-document.citizenship-date.label')}
              required
              names={{ day: 'citizenshipDateDay', month: 'citizenshipDateMonth', year: 'citizenshipDateYear' }}
              errorMessages={{
                all: t(getSingleKey(formErrors?.citizenshipDate)),
                year: t(getSingleKey(formErrors?.citizenshipDateYear)),
                month: t(getSingleKey(formErrors?.citizenshipDateMonth)),
                day: t(getSingleKey(formErrors?.citizenshipDateDay)),
              }}
            />
            <InputFile
              disabled
              accept=".jpg,.png,.heic"
              id="primary-document-id"
              name="document"
              label={t('protected:primary-identity-document.upload-document.label')}
              required
            />
          </>
        )}
    </>
  );
}

function toDateString(year?: string, month?: string, day?: string): string {
  try {
    return toISODateString(Number(year), Number(month), Number(day));
  } catch {
    return '';
  }
}
