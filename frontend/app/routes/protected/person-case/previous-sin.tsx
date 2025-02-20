import { useId, useState } from 'react';
import type { ChangeEvent } from 'react';

import { data, useFetcher } from 'react-router';
import type { RouteHandle, SessionData } from 'react-router';

import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/previous-sin';

import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputPatternField } from '~/components/input-pattern-field';
import { InputRadios } from '~/components/input-radios';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { getFixedT } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';
import { getLanguage } from '~/utils/i18n-utils';
import { formatSin, isValidSin, sinInputPatternFormat } from '~/utils/sin-utils';

type PreviousSinSessionData = NonNullable<SessionData['inPersonSINCase']['previousSin']>;

const VALID_HAS_PREVIOUS_SIN_OPTIONS = { yes: 'yes', no: 'no', unknown: 'unknown' } as const;

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const t = await getFixedT(request, handle.i18nNamespace);
  return {
    documentTitle: t('protected:previous-sin.page-title'),
    defaultFormValues: context.session.inPersonSINCase?.previousSin,
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
      //TODO: replace with correct route
      throw i18nRedirect('routes/protected/person-case/privacy-statement.tsx', request);
    }

    case 'next': {
      const schema = v.pipe(
        v.object({
          hasPreviousSin: v.picklist(
            Object.keys(VALID_HAS_PREVIOUS_SIN_OPTIONS),
            t('protected:previous-sin.error-messages.has-previous-sin-required'),
          ),
          socialInsuranceNumber: v.optional(
            v.pipe(
              v.string(),
              v.trim(),
              v.check((sin) => isValidSin(sin), t('protected:previous-sin.error-messages.sin-required')),
              v.transform((sin) => formatSin(sin, '')),
            ),
          ),
        }),
        v.forward(
          v.partialCheck(
            [['hasPreviousSin'], ['socialInsuranceNumber']],
            (input) =>
              input.socialInsuranceNumber === undefined ||
              (input.hasPreviousSin === VALID_HAS_PREVIOUS_SIN_OPTIONS.yes && isValidSin(input.socialInsuranceNumber ?? '')),
            t('protected:previous-sin.error-messages.sin-required'),
          ),
          ['socialInsuranceNumber'],
        ),
      ) satisfies v.GenericSchema<PreviousSinSessionData>;

      const input = {
        hasPreviousSin: formData.get('hasPreviousSin') as string,
        socialInsuranceNumber:
          formData.get('hasPreviousSin') === VALID_HAS_PREVIOUS_SIN_OPTIONS.yes
            ? formData.get('socialInsuranceNumber')
            : undefined,
      } satisfies Partial<PreviousSinSessionData>;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      context.session.inPersonSINCase ??= {};
      context.session.inPersonSINCase.previousSin = parseResult.output;

      throw i18nRedirect('routes/protected/person-case/contact-information.tsx', request);
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`);
    }
  }
}

export default function PreviousSin({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  const [hasPreviousSin, setHasPreviousSin] = useState<string | undefined>(loaderData.defaultFormValues?.hasPreviousSin);
  function handleHasPreviousSinChanged(event: ChangeEvent<HTMLInputElement>) {
    setHasPreviousSin(event.target.value);
  }

  const hasPreviousSinOptions = Object.values(VALID_HAS_PREVIOUS_SIN_OPTIONS).map((value) => ({
    value: value,
    children: t(`protected:previous-sin.has-previous-sin-options.${value}`),
    defaultChecked: value === loaderData.defaultFormValues?.hasPreviousSin,
    onChange: handleHasPreviousSinChanged,
  }));

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:previous-sin.page-title')}</PageTitle>
      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <div className="space-y-6">
            <InputRadios
              id="has-previous-sin"
              legend={t('protected:previous-sin.has-previous-sin-label')}
              name="hasPreviousSin"
              options={hasPreviousSinOptions}
              required
              errorMessage={errors?.hasPreviousSin?.at(0)}
            />
            {hasPreviousSin === VALID_HAS_PREVIOUS_SIN_OPTIONS.yes && (
              <InputPatternField
                defaultValue={loaderData.defaultFormValues?.socialInsuranceNumber ?? ''}
                inputMode="numeric"
                format={sinInputPatternFormat}
                id="social-insurance-number"
                name="socialInsuranceNumber"
                label={t('protected:previous-sin.social-insurance-number-label')}
                errorMessage={errors?.socialInsuranceNumber?.at(0)}
              />
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
    </>
  );
}
