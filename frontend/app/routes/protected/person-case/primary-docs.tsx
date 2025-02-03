import { data, useFetcher } from 'react-router';
import type { RouteHandle } from 'react-router';

import { faExclamationCircle, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Route, Info } from './+types/primary-docs';

import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { ErrorSummary } from '~/components/error-summary';
import { InputSelect } from '~/components/input-select';
import { PageTitle } from '~/components/page-title';
import { Progress } from '~/components/progress';
import { getFixedT } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';
import { getLanguage } from '~/utils/i18n-utils';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const t = await getFixedT(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:primary-identity-document.page-title'),
    defaultFormValues: {
      currentStatusInCanada: context.session.inPersonSINCase?.currentStatusInCanada,
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

  if (formData.get('action') === 'back') {
    throw i18nRedirect('routes/protected/person-case/privacy-statement.tsx', request); //TODO: change it to redirect to file="routes/protected/person-case/request-details.tsx"
  }

  // submit action
  const schema = v.object({
    currentStatusInCanada: v.pipe(
      v.string(t('protected:primary-identity-document.current-status-in-canada.required')),
      v.trim(),
      v.nonEmpty(t('protected:primary-identity-document.current-status-in-canada.required')),
      v.literal(
        'canadian-citizen-born-outside-canada',
        t('protected:primary-identity-document.current-status-in-canada.invalid'),
      ),
    ),
  });

  const input = { currentStatusInCanada: formData.get('currentStatusInCanada') as string };
  const parsedDataResult = v.safeParse(schema, input, { lang });

  if (!parsedDataResult.success) {
    return data({ errors: v.flatten<typeof schema>(parsedDataResult.issues).nested }, { status: 400 });
  }

  context.session.inPersonSINCase = {
    ...(context.session.inPersonSINCase ?? {}),
    ...input,
  };

  throw i18nRedirect('routes/protected/person-case/first-name.tsx', request); //TODO: change it to redirect to file="routes/protected/person-case/secondary-docs.tsx"
}

export default function PrimaryDocs({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcher = useFetcher<Info['actionData']>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  const dummyOption: { label: string; value: string } = {
    label: t('protected:primary-identity-document.please-select'),
    value: '',
  };
  const currentStatusInCanadaOptions: { label: string; value: string }[] = [
    dummyOption,
    {
      label: t('protected:primary-identity-document.current-status-in-canada.options.canadian-citizen-born-in-canada'),
      value: 'canadian-citizen-born-in-canada',
    },
    {
      label: t('protected:primary-identity-document.current-status-in-canada.options.canadian-citizen-born-outside-canada'),
      value: 'canadian-citizen-born-outside-canada',
    },
    {
      label: t('protected:primary-identity-document.current-status-in-canada.options.registered-indian-born-in-canada'),
      value: 'registered-indian-born-in-canada',
    },
    {
      label: t('protected:primary-identity-document.current-status-in-canada.options.registered-indian-born-outside-canada'),
      value: 'registered-indian-born-outside-canada',
    },
    {
      label: t('protected:primary-identity-document.current-status-in-canada.options.permanent-resident'),
      value: 'permanent-resident',
    },
    {
      label: t('protected:primary-identity-document.current-status-in-canada.options.temporary-resident'),
      value: 'temporary-resident',
    },
    {
      label: t('protected:primary-identity-document.current-status-in-canada.options.no-legal-status-in-canada'),
      value: 'no-legal-status-in-canada',
    },
  ];

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

      <fetcher.Form method="post" noValidate>
        <div className="space-y-6">
          <ErrorSummary errors={errors} />

          <InputSelect
            id="currentStatusInCanada"
            name="currentStatusInCanada"
            errorMessage={errors?.currentStatusInCanada?.[0]}
            defaultValue={loaderData.defaultFormValues.currentStatusInCanada}
            required
            options={currentStatusInCanadaOptions}
            label={t('protected:primary-identity-document.current-status-in-canada.title')}
          />
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
    </>
  );
}
