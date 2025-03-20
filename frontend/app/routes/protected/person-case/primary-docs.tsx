import type { JSX } from 'react';
import { useId, useState } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/primary-docs';

import type {
  LocalizedApplicantGender,
  LocalizedApplicantPrimaryDocumentChoice,
  LocalizedApplicantStatusInCanadaChoice,
} from '~/.server/domain/person-case/models';
import { getLocalizedApplicantGenders } from '~/.server/domain/person-case/services/applicant-gender-service';
import { getLocalizedApplicantPrimaryDocumentChoices } from '~/.server/domain/person-case/services/applicant-primary-document-service';
import { getLocalizedApplicantStatusInCanadaChoices } from '~/.server/domain/person-case/services/applicant-status-in-canada-service';
import { requireAllRoles } from '~/.server/utils/auth-utils';
import { Button } from '~/components/button';
import { DatePickerField } from '~/components/date-picker-field';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputFile } from '~/components/input-file';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { PageTitle } from '~/components/page-title';
import { APPLICANT_PRIMARY_DOCUMENT_CHOICE, APPLICANT_STATUS_IN_CANADA } from '~/domain/constants';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { loadMachineContextOrRedirect } from '~/routes/protected/person-case/route-helpers.server';
import { getStateRoute } from '~/routes/protected/person-case/state-machine.server';
import { primaryDocumentSchema } from '~/routes/protected/person-case/validation.server';
import { toISODateString } from '~/utils/date-utils';
import { getSingleKey } from '~/utils/i18n-utils';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const { machineActor } = loadMachineContextOrRedirect({ session: context.session, request, stateName: 'primary-docs' });

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

  const { machineActor } = loadMachineContextOrRedirect({ session: context.session, request, stateName: 'primary-docs' });
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

export default function PrimaryDocs({ actionData, loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';

  const formValues = fetcher.data?.formValues ?? loaderData.formValues;
  const formErrors = fetcher.data?.formErrors ?? loaderData.formErrors;

  const [currentStatus, setCurrentStatus] = useState(formValues?.currentStatusInCanada);
  const [documentType, setDocumentType] = useState(formValues?.documentType);

  function onCurrenStatusChange(currentStatusName: string): void {
    setCurrentStatus(currentStatusName);
    //TODO: remove setting the state for documentType when other options for document type are enabled
    setDocumentType(
      loaderData.localizedPrimaryDocumentChoices.find(
        (c) => c.id === APPLICANT_PRIMARY_DOCUMENT_CHOICE.certificateOfCanadianCitizenship,
      )?.id,
    );
  }

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:primary-identity-document.page-title')}</PageTitle>

      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate encType="multipart/form-data">
          <div className="space-y-6">
            <CurrentStatusInCanada
              defaultValue={formValues?.currentStatusInCanada}
              errorMessage={t(getSingleKey(formErrors?.currentStatusInCanada))}
              onChange={({ target }) => onCurrenStatusChange(target.value)}
              statusInCanada={loaderData.localizedStatusInCanada}
            />
            {currentStatus && (
              <DocumentType
                status={currentStatus}
                value={formValues?.documentType}
                error={t(getSingleKey(formErrors?.documentType))}
                onChange={({ target }) => setDocumentType(target.value)}
                documentTypeChoices={loaderData.localizedPrimaryDocumentChoices.filter(
                  (c) => c.applicantStatusInCanadaId === currentStatus,
                )}
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
    children: id === 'select-option' ? t('protected:person-case.select-option') : name,
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
  documentTypeChoices: LocalizedApplicantPrimaryDocumentChoice[];
  status?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
};

function DocumentType({ error, documentTypeChoices, status, value, onChange }: DocumentTypeProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const documentTypeOptions = [{ id: 'select-option', name: '' }, ...documentTypeChoices].map(({ id, name }) => ({
    value: id === 'select-option' ? '' : id,
    children: id === 'select-option' ? t('protected:person-case.select-option') : name,
    disabled: id !== APPLICANT_PRIMARY_DOCUMENT_CHOICE.certificateOfCanadianCitizenship,
  }));
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
        documentType === APPLICANT_PRIMARY_DOCUMENT_CHOICE.certificateOfCanadianCitizenship && (
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
