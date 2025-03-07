import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { data, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/finalize-request';

import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { stringToIntegerSchema } from '~/.server/validation/string-to-integer-schema';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputSelect } from '~/components/input-select';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';

// TODO: make codes configurable
const RC_CODES = [5013, 4613, 4313, 4013, 3013, 2013, 1213, 1713, 1013, 1913, 4913];

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const { t } = await getTranslation(request, handle.i18nNamespace);

  return {
    documentTitle: t('protected:finalize-request.page-title'),
    defaultFormValues: {
      originOfSin: undefined,
      declaration: undefined,
    },
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      throw i18nRedirect('routes/protected/multi-channel/search-sin.tsx', request);
    }

    case 'next': {
      const schema = v.object({
        originOfSin: v.pipe(
          stringToIntegerSchema(),
          v.picklist(RC_CODES, t('protected:finalize-request.error-messages.origin-of-sin-required')),
        ),
        declaration: v.literal(true, t('protected:finalize-request.error-messages.declaration-required')),
      });

      const input = {
        originOfSin: formData.get('originOfSin'),
        declaration: formData.get('declaration') ? true : undefined,
      };

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      throw i18nRedirect('routes/protected/multi-channel/sin-confirmation.tsx', request);
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
  const errors = fetcher.data?.errors;

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:finalize-request.page-title')}</PageTitle>
      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <div className="max-w-prose space-y-6">
            <InputSelect
              className="w-max rounded-sm"
              id="origin-of-sin"
              name="originOfSin"
              label={t('protected:finalize-request.origin-of-sin-label')}
              options={RC_CODES.map((code) => ({ value: code, children: code }))}
              errorMessage={errors?.originOfSin?.at(0)}
              defaultValue={loaderData.defaultFormValues.originOfSin}
              required
            />
            <h2 className="font-lato text-2xl font-semibold">{t('protected:finalize-request.final-check')}</h2>
            <p>{t('protected:finalize-request.first-time')}</p>
            <p>{t('protected:finalize-request.before-processing')}</p>
            {/* TODO: add 'warning' section if multiple births are part of record*/}
            <h3 className="font-lato text-lg font-semibold">{t('protected:finalize-request.declaration')}</h3>
            <p>{t('protected:finalize-request.all-transactions')}</p>
            <InputCheckbox
              id="declaration"
              name="declaration"
              errorMessage={errors?.declaration?.at(0)}
              defaultValue={loaderData.defaultFormValues.declaration}
              required
              className="h-8 w-8"
            >
              {t('protected:finalize-request.declaration-checkbox-label')}
            </InputCheckbox>
          </div>
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button name="action" value="next" variant="primary" id="continue-button" disabled={isSubmitting}>
              {t('protected:finalize-request.next')}
            </Button>
            <Button name="action" value="back" id="back-button" disabled={isSubmitting}>
              {t('protected:finalize-request.previous')}
            </Button>
          </div>
        </fetcher.Form>
      </FetcherErrorSummary>
    </>
  );
}
