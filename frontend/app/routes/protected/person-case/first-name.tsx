import { data, useFetcher } from 'react-router';
import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Route, Info } from './+types/first-name';

import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { firstNameSchema } from '~/.server/validation';
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

  return {
    documentTitle: t('protected:person-case.page-title'),
    defaultValue: {
      firstName: context.session.inPersonSINCase?.firstName,
    },
  };
}

export const meta: Route.MetaFunction = ({ data }) => {
  return [{ title: data.documentTitle }];
};

export async function action({ context, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const lang = getLanguage(request);

  const formData = await request.formData();
  const input = { firstName: formData.get('first-name') as string };

  // Validation schema
  const schema = v.object({ firstName: firstNameSchema() });

  // Safe-parse form data input
  const parsedDataResult = v.safeParse(schema, input, { lang });

  if (!parsedDataResult.success) {
    return data({ errors: v.flatten<typeof schema>(parsedDataResult.issues).nested }, { status: 400 });
  }
  // If the first name is valid, store it in the session and redirect to the next page

  context.session.inPersonSINCase = {
    ...(context.session.inPersonSINCase ?? {}),
    ...input,
  };
  return i18nRedirect('routes/protected/person-case/last-name.tsx', request);
}

export default function FirstName({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcher = useFetcher<Info['actionData']>();
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  return (
    <>
      <PageTitle className="mb-8">{t('protected:person-case.page-title')}</PageTitle>
      <ErrorSummary errors={errors} />
      <fetcher.Form method="post" noValidate>
        <InputField
          id="first-name-id"
          errorMessage={errors?.firstName?.at(0)}
          label={t('protected:person-case.first-name')}
          name="first-name"
          defaultValue={loaderData.defaultValue.firstName}
          required
          type="text"
        />
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink id="back-button" file="routes/protected/index.tsx" params={params} disabled={isSubmitting}>
            {t('protected:person-case.previous')}
          </ButtonLink>
          <Button variant="primary" type="submit" id="continue-first-name-button" disabled={isSubmitting}>
            {t('protected:person-case.next')}
          </Button>
        </div>
      </fetcher.Form>
    </>
  );
}
