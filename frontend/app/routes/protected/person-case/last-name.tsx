import { data, useFetcher } from 'react-router';
import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Route } from './+types/last-name';

import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { lastNameSchema } from '~/.server/validation';
import { Button } from '~/components/button';
import { ButtonLink } from '~/components/button-link';
import { ErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import { PageTitle } from '~/components/page-title';
import { getFixedT } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';
import { getLanguage } from '~/utils/i18n-utils';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const t = await getFixedT(request, handle.i18nNamespace);
  return { documentTitle: t('protected:person-case.page-title') };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  // Validation schema
  const schema = v.object({
    lastName: lastNameSchema(),
  });

  // Form data input
  const input = {
    lastName: formData.get('last-name'),
  };

  // Safe-parse form data input
  const lang = getLanguage(request);
  const parsedDataResult = v.safeParse(schema, input, { lang });

  if (!parsedDataResult.success) {
    return data({ errors: v.flatten<typeof schema>(parsedDataResult.issues).nested }, { status: 400 });
  }

  return i18nRedirect('routes/protected/request.tsx', request);
}

export default function LastName({ actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcher = useFetcher<typeof actionData>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  return (
    <>
      <PageTitle className="mb-8">{t('protected:person-case.page-title')}</PageTitle>
      <ErrorSummary errors={errors} />
      <fetcher.Form method="post" noValidate>
        <div className="space-y-6">
          <InputField
            id="last-name-id"
            label={t('protected:person-case.last-name')}
            name="last-name"
            required
            type="text"
            errorMessage={errors?.lastName?.at(0)}
          />
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink
            id="back-button"
            file="routes/protected/person-case/first-name.tsx"
            params={params}
            disabled={isSubmitting}
          >
            {t('protected:person-case.previous')}
          </ButtonLink>
          <Button variant="primary" type="submit" id="continue-button" disabled={isSubmitting}>
            {t('protected:person-case.next')}
          </Button>
        </div>
      </fetcher.Form>
    </>
  );
}
