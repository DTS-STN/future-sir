import { useId, useState } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import type { ResourceKey } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { PartialDeep } from 'type-fest';
import * as v from 'valibot';

import type { Info, Route } from './+types/current-name';

import { LogFactory } from '~/.server/logging';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputCheckboxes } from '~/components/input-checkboxes';
import { InputField } from '~/components/input-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { getStateRoute, loadMachineActor } from '~/routes/protected/person-case/state-machine';
import type { CurrentNameData } from '~/routes/protected/person-case/types';
import { REGEX_PATTERNS } from '~/utils/regex-utils';
import { trimToUndefined } from '~/utils/string-utils';

const REQUIRE_OPTIONS = {
  yes: 'Yes', //
  no: 'No',
} as const;

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

const log = LogFactory.getLogger(import.meta.url);

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const machineActor = loadMachineActor(context.session, request, 'name-info');

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
      const { lang, t } = await getTranslation(request, handle.i18nNamespace);

      const schema = v.variant(
        'preferredSameAsDocumentName',
        [
          v.object({ preferredSameAsDocumentName: v.literal(true) }),
          v.object({
            preferredSameAsDocumentName: v.literal(false),
            firstName: v.pipe(
              v.string(t('protected:current-name.first-name-error.required-error')),
              v.trim(),
              v.nonEmpty(t('protected:current-name.first-name-error.required-error')),
              v.maxLength(100, t('protected:current-name.first-name-error.max-length-error')),
              v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:current-name.first-name-error.format-error')),
            ),
            middleName: v.optional(
              v.pipe(
                v.string(t('protected:current-name.middle-name-error.required-error')),
                v.trim(),
                v.maxLength(100, t('protected:current-name.middle-name-error.max-length-error')),
                v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:current-name.middle-name-error.format-error')),
              ),
            ),
            lastName: v.pipe(
              v.string(t('protected:current-name.last-name-error.required-error')),
              v.trim(),
              v.nonEmpty(t('protected:current-name.last-name-error.required-error')),
              v.maxLength(100, t('protected:current-name.last-name-error.max-length-error')),
              v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:current-name.last-name-error.format-error')),
            ),
            supportingDocuments: v.variant(
              'required',
              [
                v.object({ required: v.literal(false) }),
                v.object({
                  required: v.literal(true),
                  documentTypes: v.pipe(
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
          }),
        ],
        t('protected:current-name.preferred-name.required-error'),
      ) satisfies v.GenericSchema<CurrentNameData>;

      const input = {
        preferredSameAsDocumentName: formData.get('same-name')
          ? formData.get('same-name') === REQUIRE_OPTIONS.yes //
          : undefined,
        firstName: String(formData.get('first-name')),
        middleName: trimToUndefined(String(formData.get('middle-name'))),
        lastName: String(formData.get('last-name')),
        supportingDocuments: {
          required: formData.get('docs-required')
            ? formData.get('docs-required') === REQUIRE_OPTIONS.yes //
            : undefined,
          documentTypes: formData.getAll('doc-type').map(String),
        },
      } satisfies PartialDeep<v.InferInput<typeof schema>>;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      machineActor.send({ type: 'submitCurrentName', data: parseResult.output });
      break;
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }

  throw redirect(getStateRoute(machineActor, { params, request }));
}

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const { t } = await getTranslation(request, handle.i18nNamespace);
  const machineActor = loadMachineActor(context.session, request, 'name-info');

  return {
    documentTitle: t('protected:primary-identity-document.page-title'),
    defaultFormValues: machineActor?.getSnapshot().context.currentNameInfo,
    primaryDocName: {
      firstName: machineActor?.getSnapshot().context.primaryDocuments?.givenName,
      lastName: machineActor?.getSnapshot().context.primaryDocuments?.lastName,
      middleName: '', // machineActor?.getSnapshot().context.primaryDocuments?.middleName
    },
  };
}

export default function CurrentName({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const [sameName, setSameName] = useState(loaderData.defaultFormValues?.preferredSameAsDocumentName);
  const [requireDoc, setRequireDoc] = useState(
    loaderData.defaultFormValues?.preferredSameAsDocumentName === false &&
      loaderData.defaultFormValues.supportingDocuments.required,
  );

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

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

  const docTypes = VALID_DOC_TYPES.map((value) => ({
    value: value,
    children: t(`protected:current-name.doc-types.${value}` as ResourceKey),
    defaultChecked:
      (loaderData.defaultFormValues?.preferredSameAsDocumentName === false &&
        loaderData.defaultFormValues.supportingDocuments.required &&
        loaderData.defaultFormValues.supportingDocuments.documentTypes.includes(value)) ||
      false,
  }));

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:current-name.page-title')}</PageTitle>

      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <p className="mb-4">{t('protected:current-name.recorded-name.description')}</p>
          <ul className="mb-8 list-disc pl-5 font-bold">
            <li>
              {t('protected:current-name.recorded-name.first-name')}
              <span className="ml-[1ch] font-normal">{loaderData.primaryDocName.firstName}</span>
            </li>
            <li>
              {t('protected:current-name.recorded-name.middle-name')}
              <span className="ml-[1ch] font-normal">{loaderData.primaryDocName.middleName}</span>
            </li>
            <li>
              {t('protected:current-name.recorded-name.last-name')}
              <span className="ml-[1ch] font-normal">{loaderData.primaryDocName.lastName}</span>
            </li>
          </ul>

          <div className="space-y-6">
            <InputRadios
              errorMessage={errors?.preferredSameAsDocumentName?.at(0)}
              id="same-name-id"
              legend={t('protected:current-name.preferred-name.description')}
              name="same-name"
              options={nameOptions}
              required
            />
            {sameName === false && (
              <>
                <InputField
                  errorMessage={errors?.firstName?.at(0)}
                  label={t('protected:current-name.preferred-name.first-name')}
                  name="first-name"
                  defaultValue={
                    (loaderData.defaultFormValues?.preferredSameAsDocumentName === false &&
                      loaderData.defaultFormValues.firstName) ||
                    ''
                  }
                  required
                  type="text"
                  className="w-full rounded-sm sm:w-104"
                />
                <InputField
                  errorMessage={errors?.middleName?.at(0)}
                  label={t('protected:current-name.preferred-name.middle-name')}
                  name="middle-name"
                  defaultValue={
                    ((loaderData.defaultFormValues?.preferredSameAsDocumentName === false &&
                      loaderData.defaultFormValues.middleName) ??
                      '') ||
                    ''
                  }
                  type="text"
                  className="w-full rounded-sm sm:w-104"
                />
                <InputField
                  errorMessage={errors?.lastName?.at(0)}
                  label={t('protected:current-name.preferred-name.last-name')}
                  name="last-name"
                  defaultValue={
                    (loaderData.defaultFormValues?.preferredSameAsDocumentName === false &&
                      loaderData.defaultFormValues.lastName) ||
                    ''
                  }
                  required
                  type="text"
                  className="w-full rounded-sm sm:w-104"
                />
                <h2 className="font-lato mt-12 text-2xl font-bold">{t('protected:current-name.supporting-docs.title')}</h2>
                <p>{t('protected:current-name.supporting-docs.description')}</p>
                <InputRadios
                  id="docs-required-id"
                  errorMessage={errors?.['supportingDocuments.required']?.at(0)}
                  legend={t('protected:current-name.supporting-docs.docs-required')}
                  name="docs-required"
                  options={requireOptions}
                  required
                />
                {requireDoc && (
                  <InputCheckboxes
                    id="doc-type-id"
                    errorMessage={errors?.['supportingDocuments.documentTypes']?.at(0)}
                    legend={t('protected:current-name.supporting-docs.doc-type')}
                    name="doc-type"
                    options={docTypes}
                    required
                  />
                )}
              </>
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
