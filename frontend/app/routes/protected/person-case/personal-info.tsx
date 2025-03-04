import { useId, useState } from 'react';

import type { RouteHandle } from 'react-router';
import { data, useFetcher } from 'react-router';

import { faExclamationCircle, faXmark, faXmarkCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { SessionData } from 'express-session';
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
import { REGEX_PATTERNS } from '~/utils/regex-utils';

type PersonalInformationSessionData = NonNullable<SessionData['inPersonSINCase']['personalInformation']>;

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const { t, lang } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:personal-information.page-title'),
    primaryDocValues: {
      lastName: context.session.inPersonSINCase?.primaryDocuments?.lastName,
      gender: context.session.inPersonSINCase?.primaryDocuments?.gender,
    },
    defaultFormValues: {
      firstNamePreviouslyUsed: context.session.inPersonSINCase?.personalInformation?.firstNamePreviouslyUsed ?? [],
      lastNameAtBirth: context.session.inPersonSINCase?.personalInformation?.lastNameAtBirth,
      lastNamePreviouslyUsed: context.session.inPersonSINCase?.personalInformation?.lastNamePreviouslyUsed ?? [],
      gender: context.session.inPersonSINCase?.personalInformation?.gender,
    },
    localizedGenders: applicantGenderService.getLocalizedApplicantGenders(lang),
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const tabId = new URL(request.url).searchParams.get('tid');
  if (!tabId) throw new AppError('Missing tab id', ErrorCodes.MISSING_TAB_ID, { httpStatusCode: 400 });

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
        firstNamePreviouslyUsed: v.optional(v.array(v.string())),
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
        lastNamePreviouslyUsed: v.optional(v.array(v.string())),
        gender: v.picklist(
          applicantGenderService.getApplicantGenders().map(({ id }) => id),
          t('protected:personal-information.gender.required'),
        ),
      }) satisfies v.GenericSchema<PersonalInformationSessionData>;

      const input = {
        firstNamePreviouslyUsed: formData.getAll('firstNamePreviouslyUsed').map(String),
        lastNameAtBirth: String(formData.get('lastNameAtBirth')),
        lastNamePreviouslyUsed: formData.getAll('lastNamePreviouslyUsed').map(String),
        gender: String(formData.get('gender')),
      } satisfies Partial<PersonalInformationSessionData>;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      (context.session.inPersonSINCase ??= {}).personalInformation = parseResult.output;

      throw i18nRedirect('routes/protected/person-case/birth-details.tsx', request, {
        search: new URLSearchParams({ tid: tabId }),
      });
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
}

export default function PersonalInformation({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  const [firstName, setFirstName] = useState<string | undefined>(undefined);
  const [firstNames, setFirstNames] = useState(loaderData.defaultFormValues.firstNamePreviouslyUsed);
  const [lastName, setLastName] = useState<string | undefined>(undefined);
  const [lastNames, setLastNames] = useState(loaderData.defaultFormValues.lastNamePreviouslyUsed);
  const [srAnnouncement, setSrAnnouncement] = useState('');

  const genderId = loaderData.defaultFormValues.gender ?? loaderData.primaryDocValues.gender;

  const genderOptions = loaderData.localizedGenders.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === genderId,
  }));

  function handleAddFirstName() {
    if (firstName?.trim()) {
      setFirstNames((prev) => (!prev.includes(firstName.trim()) ? [...prev, firstName.trim()] : prev));
      setFirstName('');
    }
  }

  function handleRemoveFirstName(name: string) {
    setSrAnnouncement(t(`protected:personal-information.removed-name-sr-message`, { name: name }));
    setFirstNames((prev) => [...prev].filter((n) => n !== name));
  }

  function handleAddLastName() {
    if (lastName?.trim()) {
      setLastNames((prev) => (!prev.includes(lastName.trim()) ? [...prev, lastName.trim()] : prev));
      setLastName('');
    }
  }

  function handleRemoveLastName(name: string) {
    setSrAnnouncement(t(`protected:personal-information.removed-name-sr-message`, { name: name }));
    setLastNames((prev) => [...prev].filter((n) => n !== name));
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
        <fetcher.Form method="post" noValidate>
          <div className="flex flex-col space-y-6">
            <div className="flex space-x-4">
              <InputField
                id="first-name-id"
                className="w-full"
                errorMessage={errors?.firstNamePreviouslyUsed?.at(0)}
                helpMessagePrimary={t('protected:personal-information.first-name-previously-used.help-message-primary')}
                label={t('protected:personal-information.first-name-previously-used.label')}
                name="firstNamePreviouslyUsed"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Button
                className="self-end"
                id="add-first-name-button"
                endIcon={faXmarkCircle}
                variant="link"
                type="button"
                onClick={handleAddFirstName}
              >
                {t('protected:personal-information.add-name')}
              </Button>
            </div>
            <div className="flex space-x-4">
              {firstNames.map(
                (name) =>
                  name.length > 0 && (
                    <div
                      key={name}
                      className="inline-flex items-center justify-center rounded-sm border-blue-100 bg-blue-100 px-2 py-1 align-middle text-gray-900"
                    >
                      <input type="hidden" name="firstNamePreviouslyUsed" value={name} />
                      {name}
                      <button
                        aria-label={t('protected:personal-information.name-added-aria-label', { name: name })}
                        type="button"
                        onClick={() => handleRemoveFirstName(name)}
                      >
                        <FontAwesomeIcon icon={faXmark} className="ml-1" />
                      </button>
                    </div>
                  ),
              )}
            </div>
            <InputField
              id="last-name-at-birth-id"
              defaultValue={loaderData.defaultFormValues.lastNameAtBirth ?? loaderData.primaryDocValues.lastName}
              errorMessage={errors?.lastNameAtBirth?.at(0)}
              label={t('protected:personal-information.last-name-at-birth.label')}
              name="lastNameAtBirth"
              required
              type="text"
            />
            <div className="flex space-x-4">
              <InputField
                id="last-name-id"
                className="w-full"
                errorMessage={errors?.lastNamePreviouslyUsed?.at(0)}
                helpMessagePrimary={t('protected:personal-information.last-name-previously-used.help-message-primary')}
                label={t('protected:personal-information.last-name-previously-used.label')}
                name="lastNamePreviouslyUsed"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <Button
                className="self-end"
                id="add-last-name-button"
                endIcon={faXmarkCircle}
                variant="link"
                type="button"
                onClick={handleAddLastName}
              >
                {t('protected:personal-information.add-name')}
              </Button>
            </div>
            <div className="flex space-x-4">
              {lastNames.map(
                (name) =>
                  name.length > 0 && (
                    <div
                      key={name}
                      className="inline-flex items-center justify-center rounded-sm border-blue-100 bg-blue-100 px-2 py-1 align-middle text-gray-900"
                    >
                      <input type="hidden" name="lastNamePreviouslyUsed" value={name} />
                      {name}
                      <button
                        aria-label={t('protected:personal-information.name-added-aria-label', { name: name })}
                        type="button"
                        onClick={() => handleRemoveLastName(name)}
                      >
                        <FontAwesomeIcon icon={faXmark} className="ml-1" />
                      </button>
                    </div>
                  ),
              )}
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
              options={genderOptions}
              required
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
