import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/privacy-statement';

import { LogFactory } from '~/.server/logging';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { createMachineActor, getStateRoute, loadMachineActor } from '~/routes/protected/person-case/state-machine.server';
import { privacyStatementSchema } from '~/routes/protected/person-case/validation.server';
import { getSingleKey } from '~/utils/i18n-utils';

const log = LogFactory.getLogger(import.meta.url);

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const machineActor = loadMachineActor(context.session, request, 'privacy-statement');

  if (!machineActor) {
    log.warn('Could not find a machine snapshot in session; redirecting to start of flow');
    throw i18nRedirect('routes/protected/person-case/privacy-statement.tsx', request);
  }

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'next': {
      const parseResult = v.safeParse(privacyStatementSchema, {
        agreedToTerms: formData.get('agreedToTerms') ? true : undefined,
      });

      if (!parseResult.success) {
        return data(
          { errors: v.flatten<typeof privacyStatementSchema>(parseResult.issues).nested },
          { status: HttpStatusCodes.BAD_REQUEST },
        );
      }

      machineActor.send({ type: 'submitPrivacyStatement', data: parseResult.output });
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

  if (new URL(request.url).searchParams.get('tid')) {
    // we can create the machine actor only when a tab id exists
    createMachineActor(context.session, request);
  }

  const { t } = await getTranslation(request, handle.i18nNamespace);
  return { documentTitle: t('protected:privacy-statement.page-title') };
}

export default function PrivacyStatement({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:privacy-statement.page-title')}</PageTitle>
      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <div className="max-w-prose space-y-6">
            <p>{t('protected:privacy-statement.ask-client')}</p>
            <h2 className="font-lato text-2xl font-bold">{t('protected:privacy-statement.privacy-statement')}</h2>
            <p>{t('protected:privacy-statement.personal-info')}</p>
            <p>{t('protected:privacy-statement.participation')}</p>
            <p>{t('protected:privacy-statement.info-and-docs')}</p>
            <p>{t('protected:privacy-statement.your-rights')}</p>
            <InputCheckbox
              id="agreed-to-terms"
              name="agreedToTerms"
              className="h-8 w-8"
              errorMessage={t(getSingleKey(errors?.agreedToTerms))}
              required
            >
              {t('protected:privacy-statement.confirm-privacy-notice-checkbox.title')}
            </InputCheckbox>
          </div>
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button name="action" value="next" variant="primary" id="continue-button" disabled={isSubmitting}>
              {t('protected:person-case.next')}
            </Button>
          </div>
        </fetcher.Form>
      </FetcherErrorSummary>
    </>
  );
}
