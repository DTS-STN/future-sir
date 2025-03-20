import type { JSX } from 'react';
import { useState } from 'react';

import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';

import { DatePickerField } from '~/components/date-picker-field';
import { InputField } from '~/components/input-field';
import { InputFile } from '~/components/input-file';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { APPLICANT_STATUS_IN_CANADA } from '~/domain/constants';
import type { Errors, LocalizedOptions, PrimaryDocumentData } from '~/routes/protected/sin-application/types';
import { getSingleKey } from '~/utils/i18n-utils';

export const handle = {
  i18nNamespace: ['protected'],
} as const satisfies RouteHandle;

interface PrimaryDocsFormProps {
  defaultFormValues: PrimaryDocumentData | undefined;
  localizedStatusInCanada: LocalizedOptions;
  localizedGenders: LocalizedOptions;
  errors: Errors;
}

export default function PrimaryDocsForm({
  defaultFormValues,
  localizedStatusInCanada,
  localizedGenders,
  errors,
}: PrimaryDocsFormProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const [currentStatus, setCurrentStatus] = useState(defaultFormValues?.currentStatusInCanada);
  const [documentType, setDocumentType] = useState(defaultFormValues?.documentType);

  return (
    <div className="space-y-6">
      <CurrentStatusInCanada
        defaultValue={defaultFormValues?.currentStatusInCanada}
        errorMessage={t(getSingleKey(errors?.currentStatusInCanada))}
        onChange={({ target }) => setCurrentStatus(target.value)}
        statusInCanada={localizedStatusInCanada}
      />
      {currentStatus && (
        <DocumentType
          status={currentStatus}
          value={defaultFormValues?.documentType}
          error={t(getSingleKey(errors?.documentType))}
          onChange={({ target }) => setDocumentType(target.value)}
        />
      )}
      {currentStatus && documentType && (
        <PrimaryDocsFields
          genders={localizedGenders}
          status={currentStatus}
          formValues={defaultFormValues}
          documentType={documentType}
          formErrors={errors}
        />
      )}
    </div>
  );
}

interface CurrentStatusInCanadaProps {
  defaultValue?: string;
  errorMessage?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  statusInCanada: LocalizedOptions;
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
  genders: LocalizedOptions;
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
