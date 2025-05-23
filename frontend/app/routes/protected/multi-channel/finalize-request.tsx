import { useId } from 'react';

import type { RouteHandle } from 'react-router';
import { data, useFetcher } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/finalize-request';

import { getSinCaseService } from '~/.server/domain/multi-channel/case-api-service';
import { serverEnvironment } from '~/.server/environment';
import { getLocalizedProvinceByAlphaCode } from '~/.server/shared/services/province-service';
import { requireAllRoles } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { stringToIntegerSchema } from '~/.server/validation/string-to-integer-schema';
import { Button } from '~/components/button';
import { ContextualAlert } from '~/components/contextual-alert';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputSelect } from '~/components/input-select';
import { InlineLink } from '~/components/links';
import { LoadingButton } from '~/components/loading-button';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { useFetcherState } from '~/hooks/use-fetcher-state';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, params, request }: Route.LoaderArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  // TODO ::: GjB ::: the data returned by the following call should be checked to ensure the logged-in user has permissions to view it
  const personSinCase = await getSinCaseService().findSinCaseById(params.caseId);

  if (personSinCase === undefined) {
    throw new Response(JSON.stringify({ status: HttpStatusCodes.NOT_FOUND, message: 'Case not found' }), {
      status: HttpStatusCodes.NOT_FOUND,
    });
  }

  const { t, lang } = await getTranslation(request, handle.i18nNamespace);

  //TODO: Update with the province of the office that is in the session
  const officeProvinceCode = 'ON';

  return {
    documentTitle: t('protected:finalize-request.page-title'),
    localizedRcCodeData: serverEnvironment.RC_CODES.map(({ RC_CODE, alphaCode }) => ({
      RC_CODE,
      province: getLocalizedProvinceByAlphaCode(alphaCode, lang).name,
    })),
    defaultFormValues: {
      originOfSin: serverEnvironment.RC_CODES.find(({ alphaCode }) => alphaCode === officeProvinceCode)?.RC_CODE,
      declaration: undefined,
    },
    fromMultipleBirth: personSinCase.birthDetails.fromMultipleBirth,
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAllRoles(context.session, new URL(request.url), ['user']);

  // TODO ::: GjB ::: the data returned by the following call should be checked to ensure the logged-in user has permissions to view it
  const personSinCase = await getSinCaseService().findSinCaseById(params.caseId);

  if (personSinCase === undefined) {
    throw new Response(JSON.stringify({ status: HttpStatusCodes.NOT_FOUND, message: 'Case not found' }), {
      status: HttpStatusCodes.NOT_FOUND,
    });
  }

  const { t } = await getTranslation(request, handle.i18nNamespace);

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      throw i18nRedirect('routes/protected/multi-channel/search-sin.tsx', request, { params });
    }

    case 'next': {
      const schema = v.object({
        originOfSin: v.pipe(
          stringToIntegerSchema(),
          v.picklist(
            serverEnvironment.RC_CODES.map(({ RC_CODE }) => RC_CODE),
            t('protected:finalize-request.error-messages.origin-of-sin-required'),
          ),
        ),
        declaration: v.literal(true, t('protected:finalize-request.error-messages.declaration-required')),
      });

      const input = {
        originOfSin: formData.get('originOfSin'),
        declaration: formData.get('declaration') ? true : undefined,
      };

      const parseResult = v.safeParse(schema, input);

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: HttpStatusCodes.BAD_REQUEST });
      }

      throw i18nRedirect('routes/protected/multi-channel/sin-confirmation.tsx', request, { params });
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
  const fetcherState = useFetcherState(fetcher);
  const errors = fetcher.data?.errors;

  return (
    <>
      <PageTitle subTitle={t('protected:first-time.title')}>{t('protected:finalize-request.page-title')}</PageTitle>
      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <div className="max-w-prose space-y-6">
            <InputSelect
              className="w-full sm:w-3/5"
              id="origin-of-sin"
              name="originOfSin"
              label={t('protected:finalize-request.origin-of-sin-label')}
              options={loaderData.localizedRcCodeData.map(({ RC_CODE, province }) => ({
                value: RC_CODE,
                children: `${province} - ${RC_CODE}`,
              }))}
              errorMessage={errors?.originOfSin?.at(0)}
              defaultValue={loaderData.defaultFormValues.originOfSin}
              required
            />
            <h2 className="font-lato text-2xl font-semibold">{t('protected:finalize-request.final-check')}</h2>
            <p>{t('protected:finalize-request.first-time')}</p>
            <p>
              <Trans
                i18nKey="protected:finalize-request.before-processing"
                components={{
                  sarpLink: (
                    <InlineLink to={t('protected:finalize-request.sarp-link')} className="external-link" newTabIndicator />
                  ),
                }}
              />
            </p>
            {loaderData.fromMultipleBirth && (
              <>
                <h3 className="font-lato text-lg font-semibold">{t('protected:finalize-request.warnings.heading')}</h3>
                <p>{t('protected:finalize-request.warnings.following-warnings')}</p>
                <ContextualAlert type={'warning'}>
                  <p>{t('protected:finalize-request.warnings.multiple-births')}</p>
                </ContextualAlert>
              </>
            )}
            <h3 className="font-lato text-lg font-semibold">{t('protected:finalize-request.declaration')}</h3>
            <p>{t('protected:finalize-request.all-transactions')}</p>
            <InputCheckbox
              id="declaration"
              name="declaration"
              errorMessage={errors?.declaration?.at(0)}
              defaultValue={loaderData.defaultFormValues.declaration}
              required
            >
              {t('protected:finalize-request.declaration-checkbox-label')}
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
              {t('protected:finalize-request.next')}
            </LoadingButton>
            <Button name="action" value="back" id="back-button" disabled={fetcherState.submitting}>
              {t('protected:finalize-request.previous')}
            </Button>
          </div>
        </fetcher.Form>
      </FetcherErrorSummary>
    </>
  );
}
