import { useId, useState } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/current-name';

import { getLocalizedApplicantSupportingDocumentType } from '~/.server/domain/person-case/services/applicant-supporting-document-service';
import { requireAllRoles } from '~/.server/utils/auth-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputCheckboxes } from '~/components/input-checkboxes';
import { InputField } from '~/components/input-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { getTabIdOrRedirect, loadMachineActorOrRedirect } from '~/routes/protected/person-case/route-helpers.server';
import type { CurrentNameData } from '~/routes/protected/person-case/state-machine-models';
import { getStateRoute } from '~/routes/protected/person-case/state-machine.server';
import { currentNameSchema } from '~/routes/protected/person-case/validation.server';
import { getSingleKey } from '~/utils/i18n-utils';
import { trimToUndefined } from '~/utils/string-utils';

const REQUIRE_OPTIONS = {
  yes: 'Yes', //
  no: 'No',
} as const;

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const tabId = getTabIdOrRedirect(request);
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'name-info' });

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      machineActor.send({ type: 'prev' });
      break;
    }

    case 'next': {
      const formValues = {
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
      };
      const parseResult = v.safeParse(currentNameSchema, formValues);

      if (!parseResult.success) {
        const formErrors = v.flatten(parseResult.issues).nested;

        machineActor.send({
          type: 'setFormData',
          data: {
            currentNameInfo: {
              values: formValues as CurrentNameData,
              errors: formErrors,
            },
          },
        });

        return data({ formValues: formValues, formErrors: formErrors }, { status: HttpStatusCodes.BAD_REQUEST });
      }

      machineActor.send({ type: 'submitCurrentName', data: parseResult.output });
      break;
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }

  throw redirect(getStateRoute(machineActor, { context, params, request }));
}

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const tabId = getTabIdOrRedirect(request);
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'name-info' });
  const { formData, currentNameInfo, primaryDocuments } = machineActor.getSnapshot().context;

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:primary-identity-document.page-title'),
    localizedSupportingDocTypes: getLocalizedApplicantSupportingDocumentType(lang),
    formValues: formData?.currentNameInfo?.values ?? currentNameInfo,
    formErrors: formData?.currentNameInfo?.errors,
    primaryDocName: {
      firstName: primaryDocuments?.givenName,
      lastName: primaryDocuments?.lastName,
      middleName: '', // primaryDocuments?.middleName
    },
  };
}

export default function CurrentName({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';

  const formValues = fetcher.data?.formValues ?? loaderData.formValues;
  const formErrors = fetcher.data?.formErrors ?? loaderData.formErrors;

  const [sameName, setSameName] = useState(formValues?.preferredSameAsDocumentName);
  const [requireDoc, setRequireDoc] = useState(formValues?.supportingDocuments?.required);

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

  const docTypes = loaderData.localizedSupportingDocTypes.map((doc) => ({
    value: doc.id,
    children: doc.name,
    defaultChecked: formValues?.supportingDocuments?.documentTypes?.includes(doc.id) ?? false,
  }));

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:current-name.page-title')}</PageTitle>
      <div className="max-w-prose">
        <div className="mb-8 space-y-3">
          <p>{t('protected:current-name.recorded-name.description')}</p>
          <dl>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
              <dt className="font-bold">{t('protected:current-name.recorded-name.first-name')}</dt>
              <dd>{loaderData.primaryDocName.firstName}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
              <dt className="font-bold">{t('protected:current-name.recorded-name.middle-name')}</dt>
              <dd>{loaderData.primaryDocName.middleName}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
              <dt className="font-bold">{t('protected:current-name.recorded-name.last-name')}</dt>
              <dd>{loaderData.primaryDocName.lastName}</dd>
            </div>
          </dl>
        </div>
        <FetcherErrorSummary fetcherKey={fetcherKey}>
          <fetcher.Form method="post" noValidate>
            <div className="space-y-6">
              <InputRadios
                errorMessage={t(getSingleKey(formErrors?.preferredSameAsDocumentName))}
                id="same-name-id"
                legend={t('protected:current-name.preferred-name.description')}
                name="same-name"
                options={nameOptions}
                required
              />
              {sameName === false && (
                <>
                  <InputField
                    errorMessage={t(getSingleKey(formErrors?.firstName), { maximum: 100 })}
                    label={t('protected:current-name.preferred-name.first-name')}
                    name="first-name"
                    defaultValue={formValues?.firstName}
                    required
                    className="w-full"
                  />
                  <InputField
                    errorMessage={t(getSingleKey(formErrors?.middleName), { maximum: 100 })}
                    label={t('protected:current-name.preferred-name.middle-name')}
                    name="middle-name"
                    defaultValue={formValues?.middleName}
                    className="w-full"
                  />
                  <InputField
                    errorMessage={t(getSingleKey(formErrors?.lastName), { maximum: 100 })}
                    label={t('protected:current-name.preferred-name.last-name')}
                    name="last-name"
                    defaultValue={formValues?.lastName}
                    required
                    className="w-full"
                  />
                  <fieldset className="space-y-6">
                    <legend className="font-lato text-2xl font-bold">
                      {t('protected:current-name.supporting-docs.title')}
                    </legend>
                    <p>{t('protected:current-name.supporting-docs.description')}</p>
                    <InputRadios
                      id="docs-required-id"
                      errorMessage={t(getSingleKey(formErrors?.['supportingDocuments.required']))}
                      legend={t('protected:current-name.supporting-docs.docs-required')}
                      name="docs-required"
                      options={requireOptions}
                      required
                    />
                    {requireDoc === true && (
                      <InputCheckboxes
                        id="doc-type-id"
                        errorMessage={t(getSingleKey(formErrors?.['supportingDocuments.documentTypes']))}
                        legend={t('protected:current-name.supporting-docs.doc-type')}
                        name="doc-type"
                        options={docTypes}
                        required
                      />
                    )}
                  </fieldset>
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
      </div>
    </>
  );
}
