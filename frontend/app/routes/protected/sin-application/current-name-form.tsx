import { useState } from 'react';

import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';

import { InputCheckboxes } from '~/components/input-checkboxes';
import { InputField } from '~/components/input-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { UnorderedList } from '~/components/lists';
import type { CurrentNameData, Errors, LocalizedOptions } from '~/routes/protected/sin-application/types';
import { getSingleKey } from '~/utils/i18n-utils';

const REQUIRE_OPTIONS = { yes: 'Yes', no: 'No' } as const;

export const handle = {
  i18nNamespace: ['gcweb', 'protected'],
} as const satisfies RouteHandle;

interface CurrentNameFormProps {
  localizedSupportingDocTypes: LocalizedOptions;
  primaryDocName: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
  };
  defaultFormValues: CurrentNameData | undefined;
  errors: Errors;
}

export default function CurrentNameForm({
  localizedSupportingDocTypes,
  primaryDocName,
  defaultFormValues,
  errors,
}: CurrentNameFormProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const [sameName, setSameName] = useState(defaultFormValues?.preferredSameAsDocumentName);
  const [requireDoc, setRequireDoc] = useState(
    defaultFormValues && defaultFormValues.preferredSameAsDocumentName === false
      ? defaultFormValues.supportingDocuments.required
      : false,
  );

  const nameOptions: InputRadiosProps['options'] = [
    {
      children: t('gcweb:input-option.yes'),
      value: REQUIRE_OPTIONS.yes,
      defaultChecked: sameName === true,
      onChange: ({ target }) => setSameName(target.value === REQUIRE_OPTIONS.yes),
    },
    {
      children: t('gcweb:input-option.no'),
      value: REQUIRE_OPTIONS.no,
      defaultChecked: sameName === false,
      onChange: ({ target }) => setSameName(target.value === REQUIRE_OPTIONS.yes),
    },
  ];

  const requireOptions: InputRadiosProps['options'] = [
    {
      children: t('gcweb:input-option.yes'),
      value: REQUIRE_OPTIONS.yes,
      defaultChecked: requireDoc === true,
      onChange: ({ target }) => setRequireDoc(target.value === REQUIRE_OPTIONS.yes),
    },
    {
      children: t('gcweb:input-option.no'),
      value: REQUIRE_OPTIONS.no,
      defaultChecked: requireDoc === false,
      onChange: ({ target }) => setRequireDoc(target.value === REQUIRE_OPTIONS.yes),
    },
  ];

  const docTypes = localizedSupportingDocTypes.map((doc) => ({
    value: doc.id,
    children: doc.name,
    defaultChecked:
      defaultFormValues &&
      defaultFormValues.preferredSameAsDocumentName === false &&
      defaultFormValues.supportingDocuments.required === true
        ? defaultFormValues.supportingDocuments.documentTypes.includes(doc.id)
        : false,
  }));

  return (
    <>
      <p className="mb-4">{t('protected:current-name.recorded-name.description')}</p>
      <UnorderedList className="mb-8 font-bold">
        <li>
          {t('protected:current-name.recorded-name.first-name')}
          <span className="ml-[1ch] font-normal">{primaryDocName.firstName}</span>
        </li>
        <li>
          {t('protected:current-name.recorded-name.middle-name')}
          <span className="ml-[1ch] font-normal">{primaryDocName.middleName}</span>
        </li>
        <li>
          {t('protected:current-name.recorded-name.last-name')}
          <span className="ml-[1ch] font-normal">{primaryDocName.lastName}</span>
        </li>
      </UnorderedList>

      <div className="space-y-6">
        <InputRadios
          errorMessage={t(getSingleKey(errors?.preferredSameAsDocumentName))}
          id="same-name-id"
          legend={t('protected:current-name.preferred-name.description')}
          name="same-name"
          options={nameOptions}
          required
        />
        {sameName === false && (
          <>
            <InputField
              errorMessage={t(getSingleKey(errors?.firstName), { maximum: 100 })}
              label={t('protected:current-name.preferred-name.first-name')}
              name="first-name"
              defaultValue={
                defaultFormValues && defaultFormValues.preferredSameAsDocumentName === false ? defaultFormValues.firstName : ''
              }
              required
              type="text"
              className="w-full rounded-sm sm:w-104"
            />
            <InputField
              errorMessage={t(getSingleKey(errors?.middleName), { maximum: 100 })}
              label={t('protected:current-name.preferred-name.middle-name')}
              name="middle-name"
              defaultValue={
                defaultFormValues && defaultFormValues.preferredSameAsDocumentName === false
                  ? (defaultFormValues.middleName ?? '')
                  : ''
              }
              type="text"
              className="w-full rounded-sm sm:w-104"
            />
            <InputField
              errorMessage={t(getSingleKey(errors?.lastName), { maximum: 100 })}
              label={t('protected:current-name.preferred-name.last-name')}
              name="last-name"
              defaultValue={
                defaultFormValues && defaultFormValues.preferredSameAsDocumentName === false ? defaultFormValues.lastName : ''
              }
              required
              type="text"
              className="w-full rounded-sm sm:w-104"
            />
            <h2 className="font-lato mt-12 text-2xl font-bold">{t('protected:current-name.supporting-docs.title')}</h2>
            <p>{t('protected:current-name.supporting-docs.description')}</p>
            <InputRadios
              id="docs-required-id"
              errorMessage={t(getSingleKey(errors?.['supportingDocuments.required']))}
              legend={t('protected:current-name.supporting-docs.docs-required')}
              name="docs-required"
              options={requireOptions}
              required
            />
            {requireDoc && (
              <InputCheckboxes
                id="doc-type-id"
                errorMessage={t(getSingleKey(errors?.['supportingDocuments.documentTypes']))}
                legend={t('protected:current-name.supporting-docs.doc-type')}
                name="doc-type"
                options={docTypes}
                required
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
