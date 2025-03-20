import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';

import { DatePickerField } from '~/components/date-picker-field';
import { InputFile } from '~/components/input-file';
import { InputRadios } from '~/components/input-radios';
import type { Errors, LocalizedOptions, SecondaryDocumentData } from '~/routes/protected/sin-application/types';
import { getSingleKey } from '~/utils/i18n-utils';

export const handle = {
  i18nNamespace: ['protected'],
} as const satisfies RouteHandle;

interface SecondaryDocFormProps {
  defaultFormValues: SecondaryDocumentData | undefined;
  localizedApplicantSecondaryDocumentChoices: LocalizedOptions;
  errors: Errors;
}

export default function SecondaryDocForm({
  defaultFormValues,
  localizedApplicantSecondaryDocumentChoices,
  errors,
}: SecondaryDocFormProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const docOptions = localizedApplicantSecondaryDocumentChoices.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === defaultFormValues?.documentType,
  }));

  return (
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
        defaultMonth={Number(defaultFormValues?.expiryMonth)}
        defaultYear={Number(defaultFormValues?.expiryYear)}
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
      />
    </div>
  );
}
