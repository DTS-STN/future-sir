import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/privacy-statement';

import { requireAllRoles } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { LoadingButton } from '~/components/loading-button';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { useFetcherState } from '~/hooks/use-fetcher-state';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import { getTabIdOrRedirect, loadMachineActorOrRedirect } from '~/routes/protected/person-case/route-helpers.server';
import { createMachineActor, getStateRoute } from '~/routes/protected/person-case/state-machine.server';
import { privacyStatementSchema } from '~/routes/protected/person-case/validation.server';
import { extractValidationKey } from '~/utils/validation-utils';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const tabId = getTabIdOrRedirect(request);
  const machineActor = loadMachineActorOrRedirect(context.session, request, tabId, { stateName: 'privacy-statement' });

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      machineActor.send({ type: 'exit' });
      throw i18nRedirect('routes/protected/index.tsx', request);
    }

    case 'next': {
      const parseResult = v.safeParse(privacyStatementSchema, {
        agreedToTerms: formData.get('agreedToTerms')?.toString() === 'on',
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
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const tabId = new URL(request.url).searchParams.get('tid');

  if (tabId) {
    // we can create the machine actor only when a tab id exists
    createMachineActor(context.session, tabId);
  }

  const { t } = await getTranslation(request, handle.i18nNamespace);
  return { documentTitle: t('protected:privacy-statement.page-title') };
}

export default function PrivacyStatement({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const fetcherState = useFetcherState(fetcher);
  const errors = fetcher.data?.errors;

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:privacy-statement.page-title')}</PageTitle>
      <div className="max-w-prose">
        <FetcherErrorSummary fetcherKey={fetcherKey}>
          <fetcher.Form method="post" noValidate>
            <div className="space-y-6">
              <p>{t('protected:privacy-statement.ask-client')}</p>
              <h2 className="font-lato text-2xl font-bold">{t('protected:privacy-statement.privacy-statement')}</h2>
              <div className="space-y-3">
                <p>{t('protected:privacy-statement.personal-info')}</p>
                <p>{t('protected:privacy-statement.participation')}</p>
                <p>{t('protected:privacy-statement.info-and-docs')}</p>
                <p>{t('protected:privacy-statement.your-rights')}</p>
              </div>
              <InputCheckbox
                id="agreed-to-terms"
                name="agreedToTerms"
                errorMessage={t(extractValidationKey(errors?.agreedToTerms))}
                required
              >
                {t('protected:privacy-statement.confirm-privacy-notice-checkbox.title')}
              </InputCheckbox>
            </div>
            <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
              <LoadingButton
                name="action"
                value="next"
                variant="primary"
                id="continue-button"
                disabled={fetcherState.submitting}
                loading={fetcherState.submitting && fetcherState.action === 'next'}
              >
                {t('protected:person-case.next')}
              </LoadingButton>
              <Button name="action" value="back" id="back-button" disabled={fetcherState.submitting}>
                {t('protected:person-case.previous')}
              </Button>
            </div>
          </fetcher.Form>
        </FetcherErrorSummary>
      </div>
    </>
  );
}
