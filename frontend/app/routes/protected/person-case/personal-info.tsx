import { useId, useState } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { faXmark, faXmarkCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ResourceKey } from 'i18next';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/personal-info';

import { applicantGenderService } from '~/.server/domain/person-case/services';
import { LogFactory } from '~/.server/logging';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputRadios } from '~/components/input-radios';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { getStateRoute, loadMachineActor } from '~/routes/protected/person-case/state-machine';
import type { PersonalInfoData } from '~/routes/protected/person-case/types';
import { getSingleKey } from '~/utils/i18n-utils';
import { REGEX_PATTERNS } from '~/utils/regex-utils';

const log = LogFactory.getLogger(import.meta.url);

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const machineActor = loadMachineActor(context.session, request, 'personal-info');

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
      const { lang } = await getTranslation(request, handle.i18nNamespace);

      const schema = v.object({
        firstNamePreviouslyUsed: v.optional(
          v.array(
            v.pipe(
              v.string(),
              v.trim(),
              v.maxLength(100, 'protected:personal-information.first-name-previously-used.max-length'),
              v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:personal-information.first-name-previously-used.format'),
            ),
          ),
        ),
        lastNameAtBirth: v.pipe(
          v.string('protected:personal-information.last-name-at-birth.required'),
          v.trim(),
          v.nonEmpty('protected:personal-information.last-name-at-birth.required'),
          v.maxLength(100, 'protected:personal-information.last-name-at-birth.max-length'),
          v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:personal-information.last-name-at-birth.format'),
        ),
        lastNamePreviouslyUsed: v.optional(
          v.array(
            v.pipe(
              v.string(),
              v.trim(),
              v.maxLength(100, 'protected:personal-information.last-name-previously-used.max-length'),
              v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:personal-information.last-name-previously-used.format'),
            ),
          ),
        ),
        gender: v.picklist(
          applicantGenderService.getApplicantGenders().map(({ id }) => id),
          'protected:personal-information.gender.required',
        ),
      }) satisfies v.GenericSchema<PersonalInfoData>;

      const input = {
        firstNamePreviouslyUsed: formData.getAll('firstNamePreviouslyUsed').map(String).filter(Boolean),
        lastNameAtBirth: String(formData.get('lastNameAtBirth')),
        lastNamePreviouslyUsed: formData.getAll('lastNamePreviouslyUsed').map(String).filter(Boolean),
        gender: String(formData.get('gender')),
      } satisfies Partial<PersonalInfoData>;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: HttpStatusCodes.BAD_REQUEST });
      }

      machineActor.send({ type: 'submitPersonalInfo', data: parseResult.output });
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
  const machineActor = loadMachineActor(context.session, request, 'personal-info');

  const personalInformation = machineActor?.getSnapshot().context.personalInformation;
  const primaryDocuments = machineActor?.getSnapshot().context.primaryDocuments;

  return {
    documentTitle: t('protected:personal-information.page-title'),
    primaryDocValues: {
      lastName: primaryDocuments?.lastName,
      gender: primaryDocuments?.gender,
    },
    defaultFormValues: {
      firstNamePreviouslyUsed: personalInformation?.firstNamePreviouslyUsed ?? [],
      lastNameAtBirth: personalInformation?.lastNameAtBirth,
      lastNamePreviouslyUsed: personalInformation?.lastNamePreviouslyUsed ?? [],
      gender: personalInformation?.gender,
    },
    genders: applicantGenderService.getLocalizedApplicantGenders(lang).map(({ id, name }) => ({
      value: id,
      children: name,
      defaultChecked: id === (personalInformation?.gender ?? primaryDocuments?.gender),
    })),
  };
}

export default function PersonalInformation({ actionData, loaderData, params, matches }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  const [otherFirstName, setOtherFirstName] = useState('');
  const [otherFirstNames, setOtherFirstNames] = useState(loaderData.defaultFormValues.firstNamePreviouslyUsed);
  const [otherLastName, setOtherLastName] = useState('');
  const [otherLastNames, setOtherLastNames] = useState(loaderData.defaultFormValues.lastNamePreviouslyUsed);
  const [srAnnouncement, setSrAnnouncement] = useState('');
  const [firstNameError, setFirstNameError] = useState<ResourceKey | undefined>(undefined);
  const [lastNameError, setLastNameError] = useState<ResourceKey | undefined>(undefined);

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
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:personal-information.page-title')}</PageTitle>

      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate={true}>
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
              defaultValue={loaderData.defaultFormValues.lastNameAtBirth ?? loaderData.primaryDocValues.lastName}
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
              options={loaderData.genders}
              required={true}
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
