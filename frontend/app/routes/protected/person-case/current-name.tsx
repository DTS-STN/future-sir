import type { ChangeEvent } from 'react';
import { useId, useState } from 'react';

import { data, useFetcher } from 'react-router';
import type { RouteHandle } from 'react-router';

import { faExclamationCircle, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { SessionData } from 'express-session';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Route, Info } from './+types/current-name';

import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputCheckboxes } from '~/components/input-checkboxes';
import { InputField } from '~/components/input-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { PageTitle } from '~/components/page-title';
import { Progress } from '~/components/progress';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getFixedT } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';
import { getLanguage } from '~/utils/i18n-utils';
import { REGEX_PATTERNS } from '~/utils/regex-utils';

type CurrentNameSessionData = NonNullable<SessionData['inPersonSINCase']['currentNameInfo']>;

const REQUIRE_OPTIONS = { yes: 'Yes', no: 'No' } as const;

const VALID_DOC_TYPES: string[] = [
  'marriage-document',
  'divorce-decree',
  'name-change',
  'adoption-order',
  'notarial-certificate',
  'resident-record',
  'replace-imm1442',
  'birth-certificate',
  'citizenship-certificate',
] as const;

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const t = await getFixedT(request, handle.i18nNamespace);
  const supportingDocumentsRequired = context.session.inPersonSINCase?.currentNameInfo?.supportingDocumentsRequired;
  return {
    documentTitle: t('protected:primary-identity-document.page-title'),
    defaultFormValues: {
      firstName: context.session.inPersonSINCase?.currentNameInfo?.firstName,
      middleName: context.session.inPersonSINCase?.currentNameInfo?.middleName,
      lastName: context.session.inPersonSINCase?.currentNameInfo?.lastName,
      supportingDocumentsRequired: supportingDocumentsRequired,
      supportingDocumentTypes: supportingDocumentsRequired
        ? context.session.inPersonSINCase?.currentNameInfo?.supportingDocumentTypes
        : undefined,
    },
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const lang = getLanguage(request);
  const t = await getFixedT(request, handle.i18nNamespace);

  const formData = await request.formData();
  const action = formData.get('action');
  const nameMaxLength = 100;

  switch (action) {
    case 'back': {
      throw i18nRedirect('routes/protected/index.tsx', request);
    }

    case 'next': {
      const schema = v.intersect([
        v.object({
          firstName: v.pipe(
            v.string(t('protected:current-name.first-name-error.required-error')),
            v.trim(),
            v.nonEmpty(t('protected:current-name.first-name-error.required-error')),
            v.maxLength(nameMaxLength, t('protected:current-name.first-name-error.max-length-error')),
            v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:current-name.first-name-error.format-error')),
          ),
          middleName: v.optional(
            v.pipe(
              v.string(t('protected:current-name.middle-name-error.required-error')),
              v.trim(),
              v.maxLength(nameMaxLength, t('protected:current-name.middle-name-error.max-length-error')),
              v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:current-name.middle-name-error.format-error')),
            ),
          ),
          lastName: v.pipe(
            v.string(t('protected:current-name.last-name-error.required-error')),
            v.trim(),
            v.nonEmpty(t('protected:current-name.last-name-error.required-error')),
            v.maxLength(nameMaxLength, t('protected:current-name.last-name-error.max-length-error')),
            v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:current-name.last-name-error.format-error')),
          ),
        }),
        v.variant(
          'supportingDocumentsRequired',
          [
            v.object({
              supportingDocumentsRequired: v.literal(false),
            }),
            v.object({
              supportingDocumentsRequired: v.literal(true),
              supportingDocumentTypes: v.pipe(
                v.array(v.string(), t('protected:current-name.supporting-error.required-error')),
                v.nonEmpty(t('protected:current-name.supporting-error.required-error')),
                v.checkItems(
                  (item, index, array) => array.indexOf(item) === index && VALID_DOC_TYPES.includes(item),
                  t('protected:current-name.supporting-error.invalid-error'),
                ),
              ),
            }),
          ],
          t('protected:current-name.supporting-error.required-error'),
        ),
      ]) satisfies v.GenericSchema<CurrentNameSessionData>;

      const input = {
        firstName: String(formData.get('first-name')),
        middleName: String(formData.get('middle-name')),
        lastName: String(formData.get('last-name')),
        supportingDocumentsRequired: formData.get('docs-required')
          ? formData.get('docs-required') === REQUIRE_OPTIONS.yes
          : undefined,
        supportingDocumentTypes: formData.getAll('doc-type') as string[],
      } satisfies Partial<v.InferInput<typeof schema>>;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      context.session.inPersonSINCase ??= {};
      context.session.inPersonSINCase.currentNameInfo = parseResult.output;

      throw i18nRedirect('routes/protected/request.tsx', request);
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
}

export default function CurrentName({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const [requireDoc, setRequireDoc] = useState<boolean | undefined>(loaderData.defaultFormValues.supportingDocumentsRequired);
  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  function handleRequireDocChanged(event: ChangeEvent<HTMLInputElement>) {
    setRequireDoc(event.target.value === REQUIRE_OPTIONS.yes);
  }

  const requireOptions: InputRadiosProps['options'] = [
    {
      children: t('gcweb:input-option.yes'),
      value: REQUIRE_OPTIONS.yes,
      defaultChecked: requireDoc === true,
      onChange: handleRequireDocChanged,
    },
    {
      children: t('gcweb:input-option.no'),
      value: REQUIRE_OPTIONS.no,
      defaultChecked: requireDoc === false,
      onChange: handleRequireDocChanged,
    },
  ];

  const docTypes = VALID_DOC_TYPES.map((value) => ({
    value: value,
    children: t(`protected:current-name.doc-types.${value}` as 'protected:current-name.doc-types.marriage-document'),
    defaultChecked: loaderData.defaultFormValues.supportingDocumentTypes?.includes(value),
  }));

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
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:current-name.page-title')}</PageTitle>
      <p className="mb-8">{t('protected:current-name.page-description')}</p>
      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <div className="space-y-6">
            <InputField
              id="first-name-id"
              errorMessage={errors?.firstName?.at(0)}
              label={t('protected:current-name.first-name')}
              name="first-name"
              defaultValue={loaderData.defaultFormValues.firstName}
              required
              type="text"
              className="w-full rounded-sm sm:w-104"
            />
            <InputField
              id="middle-name-id"
              errorMessage={errors?.middleName?.at(0)}
              label={t('protected:current-name.middle-name')}
              name="middle-name"
              defaultValue={loaderData.defaultFormValues.middleName}
              type="text"
              className="w-full rounded-sm sm:w-104"
            />
            <InputField
              id="last-name-id"
              errorMessage={errors?.lastName?.at(0)}
              label={t('protected:current-name.last-name')}
              name="last-name"
              defaultValue={loaderData.defaultFormValues.lastName}
              required
              type="text"
              className="w-full rounded-sm sm:w-104"
            />
            <h2 className="font-lato mt-12 text-2xl font-bold">{t('protected:current-name.supporting-docs.title')}</h2>
            <p>{t('protected:current-name.supporting-docs.description')}</p>
            <InputRadios
              id="docs-required-id"
              legend={t('protected:current-name.supporting-docs.docs-required')}
              name="docs-required"
              options={requireOptions}
              required
            />
            {requireDoc && (
              <InputCheckboxes
                id="doc-type-id"
                errorMessage={errors?.supportingDocumentTypes?.at(0)}
                legend={t('protected:current-name.supporting-docs.doc-type')}
                name="doc-type"
                options={docTypes}
                required
              />
            )}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button name="action" value="back" id="back-button" disabled={isSubmitting}>
              {t('protected:person-case.previous')}
            </Button>
            <Button name="action" value="next" variant="primary" id="continue-button" disabled={isSubmitting}>
              {t('protected:person-case.next')}
            </Button>
          </div>
        </fetcher.Form>
      </FetcherErrorSummary>
    </>
  );
}
