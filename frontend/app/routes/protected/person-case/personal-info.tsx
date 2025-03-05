import { useId, useState } from 'react';

import type { RouteHandle } from 'react-router';
import { data, useFetcher } from 'react-router';

import { faExclamationCircle, faXmark, faXmarkCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/personal-info';

import { applicantGenderService } from '~/.server/domain/person-case/services';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { InputRadios } from '~/components/input-radios';
import { PageTitle } from '~/components/page-title';
import { Progress } from '~/components/progress';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';
import type { PersonalInfoData } from '~/routes/protected/person-case/@types';
import { REGEX_PATTERNS } from '~/utils/regex-utils';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const tabId = new URL(request.url).searchParams.get('tid') ?? '';
  const sessionData = (context.session.inPersonSinApplications ??= {})[tabId];
  const personalInformation = sessionData?.personalInformation;
  const primaryDocuments = sessionData?.primaryDocuments;

  const { t, lang } = await getTranslation(request, handle.i18nNamespace);

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

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const tabId = new URL(request.url).searchParams.get('tid');
  if (!tabId) throw new AppError('Missing tab id', ErrorCodes.MISSING_TAB_ID, { httpStatusCode: 400 });
  const sessionData = ((context.session.inPersonSinApplications ??= {})[tabId] ??= {});

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  const formData = await request.formData();
  const action = formData.get('action');
  const nameMaxLength = 100;

  switch (action) {
    case 'back': {
      throw i18nRedirect('routes/protected/person-case/current-name.tsx', request, {
        search: new URLSearchParams({ tid: tabId }),
      });
    }

    case 'next': {
      const schema = v.object({
        firstNamePreviouslyUsed: v.optional(v.array(v.pipe(v.string(), v.trim()))),
        lastNameAtBirth: v.pipe(
          v.string(t('protected:personal-information.last-name-at-birth.required')),
          v.trim(),
          v.nonEmpty(t('protected:personal-information.last-name-at-birth.required')),
          v.maxLength(
            nameMaxLength,
            t('protected:personal-information.last-name-at-birth.max-length', { maximum: nameMaxLength }),
          ),
          v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:personal-information.last-name-at-birth.format')),
        ),
        lastNamePreviouslyUsed: v.optional(v.array(v.pipe(v.string(), v.trim()))),
        gender: v.picklist(
          applicantGenderService.getApplicantGenders().map(({ id }) => id),
          t('protected:personal-information.gender.required'),
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
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      sessionData.personalInformation = parseResult.output;

      throw i18nRedirect('routes/protected/person-case/birth-details.tsx', request, {
        search: new URLSearchParams({ tid: tabId }),
      });
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
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

  /**
   * Adds a name to `otherFirstNames` if it doesn't already exist.
   * Clears the `otherFirstName` value upon success.
   */
  function addOtherFirstName(): void {
    const name = otherFirstName.trim();

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
      <div className="flex justify-end">
        <Button id="abandon-button" endIcon={faXmark} variant="link">
          {t('protected:person-case.abandon-button')}
        </Button>
        <Button id="refer-button" endIcon={faExclamationCircle} variant="link">
          {t('protected:person-case.refer-button')}
        </Button>
      </div>

      <Progress className="mt-8" label="" value={30} />
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:personal-information.page-title')}</PageTitle>

      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate={true}>
          <div className="flex flex-col space-y-6">
            <div id="other-first-name-input" className="flex space-x-4">
              <InputField
                id="first-name-id"
                className="w-full"
                errorMessage={errors?.firstNamePreviouslyUsed?.at(0)}
                helpMessagePrimary={t('protected:personal-information.first-name-previously-used.help-message-primary')}
                label={t('protected:personal-information.first-name-previously-used.label')}
                name="firstNamePreviouslyUsed"
                onChange={(e) => setOtherFirstName(e.target.value)}
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
              errorMessage={errors?.lastNameAtBirth?.at(0)}
              label={t('protected:personal-information.last-name-at-birth.label')}
              name="lastNameAtBirth"
              required={true}
            />

            <div id="other-last-name-input" className="flex space-x-4">
              <InputField
                id="last-name-id"
                className="w-full"
                errorMessage={errors?.lastNamePreviouslyUsed?.at(0)}
                helpMessagePrimary={t('protected:personal-information.last-name-previously-used.help-message-primary')}
                label={t('protected:personal-information.last-name-previously-used.label')}
                name="lastNamePreviouslyUsed"
                onChange={(e) => setOtherLastName(e.target.value)}
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
              errorMessage={errors?.gender?.at(0)}
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
