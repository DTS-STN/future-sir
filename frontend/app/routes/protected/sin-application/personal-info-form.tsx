import { useState } from 'react';

import type { RouteHandle } from 'react-router';

import { faXmark, faXmarkCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ResourceKey } from 'i18next';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import { Button } from '~/components/button';
import { InputField } from '~/components/input-field';
import { InputRadios } from '~/components/input-radios';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import type { Errors, LocalizedOptions, PersonalInfoData, PrimaryDocumentData } from '~/routes/protected/sin-application/types';
import { getSingleKey } from '~/utils/i18n-utils';
import { REGEX_PATTERNS } from '~/utils/regex-utils';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

interface PersonalInformationFormProps {
  defaultFormValues: PersonalInfoData | undefined;
  primaryDocValues: PrimaryDocumentData | undefined;
  genders: LocalizedOptions;
  errors: Errors;
}

export default function PersonalInformationForm({
  defaultFormValues,
  primaryDocValues,
  genders,
  errors,
}: PersonalInformationFormProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const [otherFirstName, setOtherFirstName] = useState('');
  const [otherFirstNames, setOtherFirstNames] = useState(defaultFormValues?.firstNamePreviouslyUsed ?? []);
  const [otherLastName, setOtherLastName] = useState('');
  const [otherLastNames, setOtherLastNames] = useState(defaultFormValues?.lastNamePreviouslyUsed ?? []);
  const [srAnnouncement, setSrAnnouncement] = useState('');
  const [firstNameError, setFirstNameError] = useState<ResourceKey | undefined>(undefined);
  const [lastNameError, setLastNameError] = useState<ResourceKey | undefined>(undefined);
  const genderOptions = genders.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === (defaultFormValues?.gender ?? primaryDocValues?.gender),
  }));

  function getErrorMessage(fieldName: string, errors?: Record<string, [string, ...string[]] | undefined>): ResourceKey {
    if (!errors) return '';

    const directError = errors[fieldName]?.[0];
    if (directError) return directError;

    const indexedErrorKey = Object.keys(errors).find((key) => key.startsWith(`${fieldName}.`));
    return (indexedErrorKey && errors[indexedErrorKey]?.[0]) ?? '';
  }

  /**
   * Adds a name to `otherFirstNames` if it doesn't already exist.
   * Clears the `otherFirstName` value upon success.
   */
  function addOtherFirstName(): void {
    const name = otherFirstName.trim();

    const firstNameSchema = v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(100, 'protected:personal-information.first-name-previously-used.max-length'),
      v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:personal-information.first-name-previously-used.format'),
    );

    const result = v.safeParse(firstNameSchema, name);

    if (!result.success) {
      setFirstNameError(result.issues[0].message);
      return;
    } else {
      setFirstNameError(undefined);
    }

    if (name) {
      setOtherFirstNames((prev) => {
        const alreadyExists = prev.find((val) => val.toLowerCase() === name.toLowerCase());

        if (alreadyExists) {
          return prev;
        }

        setOtherFirstName('');
        return [...prev, name];
      });
    }
  }

  /**
   * Removes a name from `otherFirstNames` and announces the removal to screen readers.
   */
  function removeOtherFirstName(name: string): void {
    setSrAnnouncement(t('protected:personal-information.removed-name-sr-message', { name }));
    setOtherFirstNames((prev) => prev.filter((val) => val !== name));
  }

  /**
   * Adds a name to `otherLastNames` if it doesn't already exist.
   * Clears the `otherLastName` value upon success.
   */
  function addOtherLastName(): void {
    const name = otherLastName.trim();

    const lastNameSchema = v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(100, 'protected:personal-information.last-name-previously-used.max-length'),
      v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:personal-information.last-name-previously-used.format'),
    );

    const result = v.safeParse(lastNameSchema, name);

    if (!result.success) {
      setLastNameError(result.issues[0].message);
      return;
    } else {
      setLastNameError(undefined);
    }

    if (name) {
      setOtherLastNames((prev) => {
        const alreadyExists = prev.find((val) => val.toLowerCase() === name.toLowerCase());

        if (alreadyExists) {
          return prev;
        }

        setOtherLastName('');
        return [...prev, name];
      });
    }
  }

  /**
   * Removes a name from `otherLastNames` and announces the removal to screen readers.
   */
  function removeOtherLastName(name: string): void {
    setSrAnnouncement(t('protected:personal-information.removed-name-sr-message', { name }));
    setOtherLastNames((prev) => prev.filter((val) => val !== name));
  }

  return (
    <div className="flex flex-col space-y-6">
      <div id="other-first-name-input" className="flex space-x-4">
        <InputField
          id="first-name-id"
          className="w-full"
          errorMessage={t(firstNameError ?? getErrorMessage('firstNamePreviouslyUsed', errors), { maximum: 100 })}
          helpMessagePrimary={t('protected:personal-information.first-name-previously-used.help-message-primary')}
          label={t('protected:personal-information.first-name-previously-used.label')}
          name="firstNamePreviouslyUsed"
          onChange={({ target }) => setOtherFirstName(target.value)}
          value={otherFirstName}
        />
        <Button
          id="add-first-name-button"
          className="self-end"
          endIcon={faXmarkCircle}
          onClick={addOtherFirstName}
          type="button"
          variant="link"
        >
          {t('protected:personal-information.add-name')}
        </Button>
      </div>

      <div id="other-first-names" className="flex space-x-4">
        {otherFirstNames.map((name) => (
          <div
            key={name}
            className="inline-flex items-center justify-center rounded-sm border-blue-100 bg-blue-100 px-2 py-1 align-middle text-gray-900"
          >
            <span>{name}</span>
            <button
              aria-label={t('protected:personal-information.name-added-aria-label', { name })}
              onClick={() => removeOtherFirstName(name)}
              type="button"
            >
              <FontAwesomeIcon icon={faXmark} className="ml-1" />
            </button>

            <input type="hidden" name="firstNamePreviouslyUsed" value={name} />
          </div>
        ))}
      </div>

      <InputField
        id="last-name-at-birth-id"
        defaultValue={defaultFormValues?.lastNameAtBirth ?? primaryDocValues?.lastName}
        errorMessage={t(getSingleKey(errors?.lastNameAtBirth), { maximum: 100 })}
        label={t('protected:personal-information.last-name-at-birth.label')}
        name="lastNameAtBirth"
        required={true}
      />

      <div id="other-last-name-input" className="flex space-x-4">
        <InputField
          id="last-name-id"
          className="w-full"
          errorMessage={t(lastNameError ?? getErrorMessage('lastNamePreviouslyUsed', errors), { maximum: 100 })}
          helpMessagePrimary={t('protected:personal-information.last-name-previously-used.help-message-primary')}
          label={t('protected:personal-information.last-name-previously-used.label')}
          name="lastNamePreviouslyUsed"
          onChange={({ target }) => setOtherLastName(target.value)}
          value={otherLastName}
        />
        <Button
          id="add-last-name-button"
          className="self-end"
          endIcon={faXmarkCircle}
          onClick={addOtherLastName}
          type="button"
          variant="link"
        >
          {t('protected:personal-information.add-name')}
        </Button>
      </div>

      <div id="other-last-names" className="flex space-x-4">
        {otherLastNames.map((name) => (
          <div
            key={name}
            className="inline-flex items-center justify-center rounded-sm border-blue-100 bg-blue-100 px-2 py-1 align-middle text-gray-900"
          >
            <span>{name}</span>
            <button
              aria-label={t('protected:personal-information.name-added-aria-label', { name })}
              onClick={() => removeOtherLastName(name)}
              type="button"
            >
              <FontAwesomeIcon icon={faXmark} className="ml-1" />
            </button>

            <input type="hidden" name="lastNamePreviouslyUsed" value={name} />
          </div>
        ))}
      </div>

      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {srAnnouncement}
      </span>

      <InputRadios
        id="gender-id"
        errorMessage={t(getSingleKey(errors?.gender))}
        helpMessagePrimary={t('protected:personal-information.gender.help-message-primary')}
        legend={t('protected:personal-information.gender.label')}
        name="gender"
        options={genderOptions}
        required={true}
      />
    </div>
  );
}
