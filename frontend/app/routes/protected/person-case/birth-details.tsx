import { useId, useState } from 'react';

import { data, useFetcher } from 'react-router';
import type { RouteHandle } from 'react-router';

import { faExclamationCircle, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { SessionData } from 'express-session';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Route, Info } from './+types/birth-details';

import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputField } from '~/components/input-field';
import type { InputRadiosProps } from '~/components/input-radios';
import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import { PageTitle } from '~/components/page-title';
import { Progress } from '~/components/progress';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getFixedT } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';
import { getLanguage } from '~/utils/i18n-utils';
import { REGEX_PATTERNS } from '~/utils/regex-utils';
import { trimToUndefined } from '~/utils/string-utils';

type BirthDetailsSessionData = NonNullable<SessionData['inPersonSINCase']['birthDetails']>;

const REQUIRE_OPTIONS = { yes: 'Yes', no: 'No' } as const;
const COUNTRIES = ['CAN', 'FRA'] as const;

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const t = await getFixedT(request, handle.i18nNamespace);
  const birthDetails = context.session.inPersonSINCase?.birthDetails;

  return {
    documentTitle: t('protected:primary-identity-document.page-title'),
    defaultFormValues: {
      country: birthDetails?.country,
      province: birthDetails?.province,
      city: birthDetails?.city,
      fromMultipleBirth: birthDetails?.fromMultipleBirth,
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
  const action = formData.get('action');
  const maxStringLength = 100;
  const canadaCountryCode = 'CAN';

  switch (action) {
    case 'back': {
      throw i18nRedirect('routes/protected/index.tsx', request);
    }

    case 'next': {
      const schema = v.variant(
        'country',
        [
          v.object({
            country: v.literal(canadaCountryCode, t('protected:birth-details.country.invalid-country')),
            province: v.pipe(
              v.string(t('protected:birth-details.province.required-province')),
              v.trim(),
              v.nonEmpty(t('protected:birth-details.province.required-province')),
              v.maxLength(maxStringLength, t('protected:birth-details.province.invalid-province')),
              v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:birth-details.province.invalid-province')),
            ),
            city: v.pipe(
              v.string(t('protected:birth-details.city.required-city')),
              v.trim(),
              v.nonEmpty(t('protected:birth-details.city.required-city')),
              v.maxLength(maxStringLength, t('protected:birth-details.city.invalid-city')),
              v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:birth-details.city.invalid-city')),
            ),
            fromMultipleBirth: v.boolean(t('protected:birth-details.from-multiple.required-from-multiple')),
          }),
          v.object({
            country: v.pipe(
              v.string(t('protected:birth-details.country.required-country')),
              v.nonEmpty(t('protected:birth-details.country.required-country')),
              v.excludes(canadaCountryCode, t('protected:birth-details.country.invalid-country')),
              v.picklist(COUNTRIES, t('protected:birth-details.country.invalid-country')),
            ),
            province: v.optional(
              v.pipe(
                v.string(t('protected:birth-details.province.required-province')),
                v.trim(),
                v.nonEmpty(t('protected:birth-details.province.required-province')),
                v.maxLength(maxStringLength, t('protected:birth-details.province.invalid-province')),
                v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:birth-details.province.invalid-province')),
              ),
            ),
            city: v.optional(
              v.pipe(
                v.string(t('protected:birth-details.city.required-city')),
                v.trim(),
                v.nonEmpty(t('protected:birth-details.city.required-city')),
                v.maxLength(maxStringLength, t('protected:birth-details.city.invalid-city')),
                v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:birth-details.city.invalid-city')),
              ),
            ),
            fromMultipleBirth: v.boolean(t('protected:birth-details.from-multiple.required-from-multiple')),
          }),
        ],
        t('protected:birth-details.country.required-country'),
      ) satisfies v.GenericSchema<BirthDetailsSessionData>;

      const input = {
        country: formData.get('country') as string,
        province: trimToUndefined(formData.get('province') as string),
        city: trimToUndefined(formData.get('city') as string),
        fromMultipleBirth: formData.get('from-multiple') ? formData.get('from-multiple') === REQUIRE_OPTIONS.yes : undefined,
      } satisfies Partial<v.InferInput<typeof schema>>;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      context.session.inPersonSINCase ??= {};
      context.session.inPersonSINCase.birthDetails = parseResult.output;

      throw i18nRedirect('routes/protected/request.tsx', request);
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
}

export default function BirthDetails({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const [country, setCountry] = useState<string | undefined>(loaderData.defaultFormValues.country);
  const [fromMultipleBirth, setFromMultipleBirth] = useState<boolean | undefined>(
    loaderData.defaultFormValues.fromMultipleBirth,
  );
  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });
  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;
  const canadaCountryCode = 'CAN';

  const countryOptions = (['select-option', ...COUNTRIES] as const).map((value) => ({
    value: value === 'select-option' ? '' : value,
    children: t(`protected:birth-details.countries.${value}`),
  }));

  const fromMultipleBirthOptions: InputRadiosProps['options'] = [
    {
      children: t('gcweb:input-option.yes'),
      value: REQUIRE_OPTIONS.yes,
      defaultChecked: fromMultipleBirth === true,
      onChange: ({ target }) => setFromMultipleBirth(target.value === REQUIRE_OPTIONS.yes),
    },
    {
      children: t('gcweb:input-option.no'),
      value: REQUIRE_OPTIONS.no,
      defaultChecked: fromMultipleBirth === false,
      onChange: ({ target }) => setFromMultipleBirth(target.value === REQUIRE_OPTIONS.yes),
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
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:birth-details.page-title')}</PageTitle>
      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <div className="space-y-6">
            <InputSelect
              id="country-id"
              name="country"
              errorMessage={errors?.country?.at(0)}
              defaultValue={loaderData.defaultFormValues.country ?? ''}
              required
              options={countryOptions}
              label={t('protected:birth-details.country.label')}
              onChange={({ target }) => setCountry(target.value)}
              className="w-full rounded-sm sm:w-104"
            />
            {country && (
              <>
                <InputField
                  errorMessage={errors?.province?.at(0)}
                  label={t('protected:birth-details.province.label')}
                  name="province"
                  defaultValue={loaderData.defaultFormValues.province}
                  required={country == canadaCountryCode}
                  type="text"
                  className="w-full rounded-sm sm:w-104"
                />
                <InputField
                  errorMessage={errors?.city?.at(0)}
                  label={t('protected:birth-details.city.label')}
                  name="city"
                  defaultValue={loaderData.defaultFormValues.city}
                  required={country == canadaCountryCode}
                  type="text"
                  className="w-full rounded-sm sm:w-104"
                />
                <InputRadios
                  id="from-multiple-id"
                  legend={t('protected:birth-details.from-multiple.label')}
                  name="from-multiple"
                  options={fromMultipleBirthOptions}
                  required
                  errorMessage={errors?.fromMultipleBirth?.at(0)}
                />
              </>
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
