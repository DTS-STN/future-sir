import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { useFetcher } from 'react-router';

import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

import type { Info, Route } from './+types/pid-verification';

import { requireAllRoles } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InlineLink } from '~/components/links';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const { t } = await getTranslation(request, handle.i18nNamespace);

  // TODO: fetch the verifiction status and send in order to display correct status message
  return {
    validationSuccess: true,
    documentTitle: t('protected:pid-verification.page-title'),
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, request }: Route.ActionArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      throw i18nRedirect('routes/protected/multi-channel/send-validation.tsx', request);
    }

    case 'next': {
      throw i18nRedirect('routes/protected/multi-channel/search-sin.tsx', request);
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
}

export default function PidVerification({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <>
      <PageTitle subTitle={t('protected:first-time.title')}>{t('protected:pid-verification.page-title')}</PageTitle>
      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          {loaderData.validationSuccess && <ValidationSuccess />}
          {!loaderData.validationSuccess && <ValidationFailure />}
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button name="action" value="next" variant="primary" id="continue-button" disabled={isSubmitting}>
              {t('protected:pid-verification.next')}
            </Button>
            <Button name="action" value="back" id="back-button" disabled={isSubmitting}>
              {t('protected:pid-verification.previous')}
            </Button>
          </div>
        </fetcher.Form>
      </FetcherErrorSummary>
    </>
  );
}

function ValidationSuccess() {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <>
      <div
        id="status-id"
        role="status"
        aria-live="polite"
        className="flex max-w-fit items-center gap-1 rounded-full bg-green-600 px-2 py-1 text-xs text-white"
      >
        <FontAwesomeIcon aria-hidden="true" focusable="false" icon={faCheck} />
        <span>{t('protected:pid-verification.status-passed')}</span>
      </div>
      <h2 className="font-lato mt-2 mb-6 text-2xl font-semibold" aria-describedby="status-id">
        {t('protected:pid-verification.validation-passed')}
      </h2>
      <p>{t('protected:pid-verification.input-successful')}</p>
    </>
  );
}

function ValidationFailure() {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <>
      <div
        id="status-id"
        role="status"
        aria-live="polite"
        className="flex max-w-fit items-center gap-1 rounded-full bg-red-600 px-2 py-1 text-xs text-white"
      >
        <FontAwesomeIcon aria-hidden="true" focusable="false" icon={faXmark} />
        <span>{t('protected:pid-verification.status-failed')}</span>
      </div>
      <h2 className="font-lato mt-2 mb-6 text-2xl font-semibold" aria-describedby="status-id">
        {t('protected:pid-verification.validation-failed')}
      </h2>
      <p className="mb-6">{t('protected:pid-verification.input-failure')}</p>
      <InlineLink file="routes/protected/multi-channel/send-validation.tsx">{t('protected:pid-verification.edit')}</InlineLink>
    </>
  );
}
