import type { JSX } from 'react';
import { useState } from 'react';

import { useTranslation } from 'react-i18next';

import type {
  LocalizedApplicantGender,
  LocalizedApplicantPrimaryDocumentChoice,
  LocalizedApplicantStatusInCanadaChoice,
} from '~/.server/domain/person-case/models';
import { DatePickerField } from '~/components/date-picker-field';
import { InputField } from '~/components/input-field';
import { InputFile } from '~/components/input-file';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { APPLICANT_PRIMARY_DOCUMENT_CHOICE, APPLICANT_STATUS_IN_CANADA } from '~/domain/constants';
import type { Errors, PrimaryDocumentData } from '~/routes/protected/person-case/state-machine-models';
import { getSingleKey } from '~/utils/i18n-utils';

interface PrimaryDocsFormProps {
  formValues: Partial<PrimaryDocumentData> | undefined;
  formErrors: Errors;
  localizedPrimaryDocumentChoices: LocalizedApplicantPrimaryDocumentChoice[];
  localizedStatusInCanada: LocalizedApplicantStatusInCanadaChoice[];
  localizedGenders: LocalizedApplicantGender[];
}

export default function PrimaryDocsForm({
  formValues,
  localizedPrimaryDocumentChoices,
  localizedStatusInCanada,
  localizedGenders,
  formErrors,
}: PrimaryDocsFormProps): JSX.Element {
  const { t } = useTranslation(['protected']);

  const [currentStatus, setCurrentStatus] = useState(formValues?.currentStatusInCanada);
  const [documentType, setDocumentType] = useState(formValues?.documentType);

  function onCurrenStatusChange(currentStatusName: string): void {
    setCurrentStatus(currentStatusName);
    //TODO: remove setting the state for documentType when other options for document type are enabled
    setDocumentType(
      localizedPrimaryDocumentChoices.find((c) => c.id === APPLICANT_PRIMARY_DOCUMENT_CHOICE.certificateOfCanadianCitizenship)
        ?.id,
    );
  }

  return (
    <div className="space-y-6">
      <CurrentStatusInCanada
        defaultValue={formValues?.currentStatusInCanada}
        errorMessage={t(getSingleKey(formErrors?.currentStatusInCanada))}
        onChange={({ target }) => onCurrenStatusChange(target.value)}
        statusInCanada={localizedStatusInCanada}
      />
      {currentStatus && (
        <DocumentType
          status={currentStatus}
          value={formValues?.documentType}
          error={t(getSingleKey(formErrors?.documentType))}
          onChange={({ target }) => setDocumentType(target.value)}
          documentTypeChoices={localizedPrimaryDocumentChoices.filter((c) => c.applicantStatusInCanadaId === currentStatus)}
        />
      )}
      {currentStatus && documentType && (
        <PrimaryDocsFields
          genders={localizedGenders}
          status={currentStatus}
          formValues={formValues}
          documentType={documentType}
          formErrors={formErrors}
        />
      )}
    </div>
  );
}
interface CurrentStatusInCanadaProps {
  defaultValue?: string;
  errorMessage?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  statusInCanada: LocalizedApplicantStatusInCanadaChoice[];
}

function CurrentStatusInCanada({ defaultValue, errorMessage, onChange, statusInCanada }: CurrentStatusInCanadaProps) {
  const { t } = useTranslation(['protected']);

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
  const { t } = useTranslation(['protected']);

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
  const { t } = useTranslation(['protected']);

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
