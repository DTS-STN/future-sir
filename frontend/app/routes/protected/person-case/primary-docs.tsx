import { useId, useState } from 'react';

import { data, useFetcher } from 'react-router';
import type { RouteHandle } from 'react-router';

import { faExclamationCircle, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { SessionData } from 'express-session';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Route, Info } from './+types/primary-docs';

import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputSelect } from '~/components/input-select';
import { PageTitle } from '~/components/page-title';
import { Progress } from '~/components/progress';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getFixedT } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';
import { getLanguage } from '~/utils/i18n-utils';

type PrimaryDocumentsSessionData = NonNullable<SessionData['inPersonSINCase']['primaryDocuments']>;

/**
 * Valid current status in Canada for proof of concept
 */
const VALID_CURRENT_STATUS = ['canadian-citizen-born-outside-canada'];
/**
 * Valid document type for proof of concept
 */
const VALID_DOCTYPE = ['certificate-of-canadian-citizenship', 'certificate-of-registration-of-birth-abroad'];

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const t = await getFixedT(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:primary-identity-document.page-title'),
    defaultFormValues: context.session.inPersonSINCase?.primaryDocuments,
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

  switch (action) {
    case 'back': {
      throw i18nRedirect('routes/protected/person-case/request-details.tsx', request);
    }

    case 'next': {
      const schema = v.pipe(
        v.object({
          currentStatusInCanada: v.pipe(
            v.string(t('protected:primary-identity-document.current-status-in-canada.required')),
            v.trim(),
            v.nonEmpty(t('protected:primary-identity-document.current-status-in-canada.required')),
            v.picklist(VALID_CURRENT_STATUS, t('protected:primary-identity-document.current-status-in-canada.invalid')),
          ),
          documentType: v.string(),
        }),
        // Perform an additional check on 'documentType' only when currentStatusInCanada is valid.
        // Otherwise, it incorrectly triggers an error even when 'documentType' is not visible.
        v.forward(
          v.partialCheck(
            [['currentStatusInCanada'], ['documentType']],
            (input) => VALID_DOCTYPE.includes(input.documentType),
            t('protected:primary-identity-document.document-type.required'),
          ),
          ['documentType'],
        ),
      ) satisfies v.GenericSchema<PrimaryDocumentsSessionData>;

      const input = {
        currentStatusInCanada: String(formData.get('currentStatusInCanada')),
        documentType: String(formData.get('documentType')),
      } satisfies Partial<v.InferInput<typeof schema>>;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      context.session.inPersonSINCase ??= {};
      context.session.inPersonSINCase.primaryDocuments = parseResult.output;

      throw i18nRedirect('routes/protected/request.tsx', request); //TODO: change it to redirect to file="routes/protected/person-case/secondary-docs.tsx"
    }
    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
}

export default function PrimaryDocs({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  const [currentStatus, setCurrentStatus] = useState(loaderData.defaultFormValues?.currentStatusInCanada);

  const handleCurrentStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentStatus(event.target.value);
  };

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
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:primary-identity-document.page-title')}</PageTitle>

      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <div className="space-y-6">
            <CurrentStatusInCanada
              defaultValue={loaderData.defaultFormValues?.currentStatusInCanada}
              errorMessage={errors?.currentStatusInCanada?.at(0)}
              onChange={handleCurrentStatusChange}
            />
            {currentStatus && (
              <DocumentType
                currentStatus={currentStatus}
                defaultValue={loaderData.defaultFormValues?.documentType}
                errorMessage={errors?.documentType?.at(0)}
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

interface CurrentStatusInCanadaProps {
  defaultValue?: string;
  errorMessage?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}

function CurrentStatusInCanada({ defaultValue, errorMessage, onChange }: CurrentStatusInCanadaProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const CURRENT_STATUS_IN_CANADA = [
    'canadian-citizen-born-in-canada',
    'canadian-citizen-born-outside-canada',
    'registered-indian-born-in-canada',
    'registered-indian-born-outside-canada',
    'permanent-resident',
    'temporary-resident',
    'no-legal-status-in-canada',
  ] as const;

  const currentStatusInCanadaOptions = [
    {
      children: t('protected:request-details.requests.select-option'),
      value: '',
    },
    ...CURRENT_STATUS_IN_CANADA.map((value) => ({
      value: value,
      children: t(`protected:primary-identity-document.current-status-in-canada.options.${value}` as const),
    })),
  ];

  return (
    <>
      <InputSelect
        id="currentStatusInCanada"
        name="currentStatusInCanada"
        errorMessage={errorMessage}
        defaultValue={defaultValue}
        required
        options={currentStatusInCanadaOptions}
        label={t('protected:primary-identity-document.current-status-in-canada.title')}
        onChange={onChange}
      />
    </>
  );
}

interface DocumentTypeProps {
  currentStatus?: string;
  defaultValue?: string;
  errorMessage?: string;
}

function DocumentType({ currentStatus, defaultValue, errorMessage }: DocumentTypeProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const REGISTERED_CANADAIAN_BORN_OUTSIDE_CANADA_DOCUMENT_TYPE = [
    'certificate-of-canadian-citizenship',
    'certificate-of-registration-of-birth-abroad',
  ] as const;

  const REGISTERED_INDIAN_BORN_IN_CANADA_DOCUMENT_TYPE = [
    'birth-certificate-and-certificate-of-indian-status',
    'certificate-of-canadian-citizenship-and-certificate-of-indian-status',
  ] as const;

  const documentTypeOptions = [
    {
      children: t('protected:request-details.requests.select-option'),
      value: '',
      hidden: true,
    },
    ...(() => {
      switch (currentStatus) {
        case 'canadian-citizen-born-outside-canada':
          return REGISTERED_CANADAIAN_BORN_OUTSIDE_CANADA_DOCUMENT_TYPE.map((value) => ({
            value: value,
            children: t(`protected:primary-identity-document.document-type.options.${value}` as const),
          }));

        case 'registered-indian-born-in-canada':
          return REGISTERED_INDIAN_BORN_IN_CANADA_DOCUMENT_TYPE.map((value) => ({
            value: value,
            children: t(`protected:primary-identity-document.document-type.options.${value}` as const),
          }));

        default:
          return [];
      }
    })(),
  ];

  return (
    <>
      {(currentStatus === 'canadian-citizen-born-outside-canada' || currentStatus === 'registered-indian-born-in-canada') && (
        <InputSelect
          id="documentType"
          name="documentType"
          errorMessage={errorMessage}
          defaultValue={defaultValue}
          required
          options={documentTypeOptions}
          label={t('protected:primary-identity-document.document-type.title')}
        />
      )}
    </>
  );
}
