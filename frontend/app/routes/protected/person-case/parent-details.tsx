import { useId, useState } from 'react';

import type { RouteHandle } from 'react-router';
import { data, redirect, useFetcher } from 'react-router';

import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

import type { Info, Route } from './+types/parent-details';

import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';
import { countryService, provinceService } from '~/.server/shared/services';
import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { Button } from '~/components/button';
import { FetcherErrorSummary } from '~/components/error-summary';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputField } from '~/components/input-field';
import { InputSelect } from '~/components/input-select';
import { PageTitle } from '~/components/page-title';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getTranslation } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/person-case/layout';
import type { ParentDetailsData } from '~/routes/protected/person-case/state-machine';
import { getStateRoute, loadMachineActor } from '~/routes/protected/person-case/state-machine';
import { REGEX_PATTERNS } from '~/utils/regex-utils';
import { trimToUndefined } from '~/utils/string-utils';

const MAX_PARENTS = 4;

const log = LogFactory.getLogger(import.meta.url);

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data.documentTitle }];
}

export async function action({ context, params, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const machineActor = loadMachineActor(context.session, request, 'parent-info');

  if (!machineActor) {
    log.warn('Could not find a machine snapshot in session; redirecting to start of flow');
    throw i18nRedirect('routes/protected/person-case/privacy-statement.tsx', request);
  }

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      machineActor.send({ type: 'prev' });
      break;
    }

    case 'next': {
      const { lang, t } = await getTranslation(request, handle.i18nNamespace);

      const schema = v.pipe(
        v.array(
          v.variant(
            'unavailable',
            [
              v.object({
                unavailable: v.literal(true),
              }),
              v.object({
                unavailable: v.literal(false),
                givenName: v.pipe(
                  v.string(t('protected:parent-details.given-name-error.required-error')),
                  v.trim(),
                  v.nonEmpty(t('protected:parent-details.given-name-error.required-error')),
                  v.maxLength(100, t('protected:parent-details.given-name-error.max-length-error')),
                  v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:parent-details.given-name-error.format-error')),
                ),
                lastName: v.pipe(
                  v.string(t('protected:parent-details.last-name-error.required-error')),
                  v.trim(),
                  v.nonEmpty(t('protected:parent-details.last-name-error.required-error')),
                  v.maxLength(100, t('protected:parent-details.last-name-error.max-length-error')),
                  v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:parent-details.last-name-error.format-error')),
                ),
                birthLocation: v.variant(
                  'country',
                  [
                    v.object({
                      country: v.literal(
                        serverEnvironment.PP_CANADA_COUNTRY_CODE,
                        t('protected:parent-details.country-error.invalid-country'),
                      ),
                      province: v.picklist(
                        provinceService.getProvinces().map(({ id }) => id),
                        t('protected:parent-details.province-error.required-province'),
                      ),
                      city: v.pipe(
                        v.string(t('protected:parent-details.city-error.required-city')),
                        v.trim(),
                        v.nonEmpty(t('protected:parent-details.city-error.required-city')),
                        v.maxLength(100, t('protected:parent-details.city-error.invalid-city')),
                        v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:parent-details.city-error.invalid-city')),
                      ),
                    }),
                    v.object({
                      country: v.pipe(
                        v.string(t('protected:parent-details.country-error.required-country')),
                        v.nonEmpty(t('protected:parent-details.country-error.required-country')),
                        v.excludes(
                          serverEnvironment.PP_CANADA_COUNTRY_CODE,
                          t('protected:parent-details.country-error.invalid-country'),
                        ),
                        v.picklist(
                          countryService.getCountries().map(({ id }) => id),
                          t('protected:parent-details.country-error.invalid-country'),
                        ),
                      ),
                      province: v.optional(
                        v.pipe(
                          v.string(t('protected:parent-details.province-error.required-province')),
                          v.trim(),
                          v.nonEmpty(t('protected:parent-details.province-error.required-province')),
                          v.maxLength(100, t('protected:parent-details.province-error.invalid-province')),
                          v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:parent-details.province-error.invalid-province')),
                        ),
                      ),
                      city: v.optional(
                        v.pipe(
                          v.string(t('protected:parent-details.city-error.required-city')),
                          v.trim(),
                          v.nonEmpty(t('protected:parent-details.city-error.required-city')),
                          v.maxLength(100, t('protected:parent-details.city-error.invalid-city')),
                          v.regex(REGEX_PATTERNS.NON_DIGIT, t('protected:parent-details.city-error.invalid-city')),
                        ),
                      ),
                    }),
                  ],
                  t('protected:parent-details.country-error.required-country'),
                ),
              }),
            ],
            t('protected:parent-details.details-unavailable'),
          ),
          t('protected:parent-details.details-unavailable'),
        ),
        v.minLength(1),
        v.maxLength(MAX_PARENTS),
      ) satisfies v.GenericSchema<ParentDetailsData>;

      const parentAmount = Number(formData.get('parent-amount')) || 0;
      const inputLength = Math.min(parentAmount, MAX_PARENTS);

      const input = Array.from({ length: inputLength }).map((_, i) => ({
        unavailable: Boolean(formData.get(`${i}-unavailable`)),
        givenName: String(formData.get(`${i}-given-name`)),
        lastName: String(formData.get(`${i}-last-name`)),
        birthLocation: {
          country: String(formData.get(`${i}-country`)),
          province: trimToUndefined(String(formData.get(`${i}-province`))),
          city: trimToUndefined(String(formData.get(`${i}-city`))),
        },
      })) satisfies ParentDetailsData;

      const parseResult = v.safeParse(schema, input, { lang });

      if (!parseResult.success) {
        return data({ errors: v.flatten<typeof schema>(parseResult.issues).nested }, { status: 400 });
      }

      machineActor.send({ type: 'submitParentDetails', data: parseResult.output });
      break;
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }

  throw redirect(getStateRoute(machineActor, { params, request }));
}

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const { lang, t } = await getTranslation(request, handle.i18nNamespace);
  const machineActor = loadMachineActor(context.session, request, 'parent-info');
  const parentDetails = machineActor?.getSnapshot().context.parentDetails ?? [];

  return {
    documentTitle: t('protected:parent-details.page-title'),
    localizedCountries: countryService.getLocalizedCountries(lang),
    localizedProvincesTerritoriesStates: provinceService.getLocalizedProvinces(lang),
    defaultFormValues: parentDetails.map((details) =>
      details.unavailable
        ? { unavailable: true }
        : {
            unavailable: false,
            givenName: details.givenName,
            lastName: details.lastName,
            country: details.birthLocation.country,
            province: details.birthLocation.province,
            city: details.birthLocation.city,
          },
    ),
  };
}

export default function CreateRequest({ loaderData, actionData, params }: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const fetcherKey = useId();
  const fetcher = useFetcher<Info['actionData']>({ key: fetcherKey });

  const isSubmitting = fetcher.state !== 'idle';
  const errors = fetcher.data?.errors;

  return (
    <>
      <PageTitle subTitle={t('protected:in-person.title')}>{t('protected:parent-details.page-title')}</PageTitle>

      <FetcherErrorSummary fetcherKey={fetcherKey}>
        <fetcher.Form method="post" noValidate>
          <ParentInformation errors={errors} loaderData={loaderData} />
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

interface ParentInformationProps {
  loaderData: Route.ComponentProps['loaderData'];
  errors?: Record<string, [string, ...string[]] | undefined>;
}

function ParentInformation({ loaderData, errors }: ParentInformationProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const { idList, addId, removeId } = useIdList(Math.max(loaderData.defaultFormValues.length, 1));

  const canAddParent = idList.length < MAX_PARENTS;

  function onAddParent() {
    if (canAddParent) addId();
  }

  function onRemoveParent(index: number) {
    // remove parent data from the form values
    loaderData.defaultFormValues.splice(index, 1);
    removeId(index);
  }

  return (
    <>
      <input type="hidden" name="parent-amount" value={idList.length} />
      <div className="space-y-10">
        {idList.map((id, index) => (
          <ParentForm
            key={id}
            index={index}
            loaderData={loaderData}
            errors={errors}
            onRemove={idList.length > 1 ? onRemoveParent : undefined}
          />
        ))}
      </div>
      {canAddParent && (
        <Button size="lg" type="button" variant="link" endIcon={faPlus} className="mt-3 px-3" onClick={onAddParent}>
          {t('protected:parent-details.add-parent')}
        </Button>
      )}
    </>
  );
}

interface ParentFormProps {
  index: number;
  loaderData: Route.ComponentProps['loaderData'];
  errors?: Record<string, [string, ...string[]] | undefined>;
  onRemove?: (index: number) => void;
}

function ParentForm({ index, loaderData, errors, onRemove }: ParentFormProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const defaultValues = loaderData.defaultFormValues.at(index);

  const [unavailable, setUnavailable] = useState(defaultValues?.unavailable);
  const [country, setCountry] = useState(defaultValues?.country);

  const countryOptions = [{ id: 'select-option', name: '' }, ...loaderData.localizedCountries].map(({ id, name }) => ({
    value: id === 'select-option' ? '' : id,
    children: id === 'select-option' ? t('protected:parent-details.select-option') : name,
  }));

  const provinceOptions = [{ id: 'select-option', name: '' }, ...loaderData.localizedProvincesTerritoriesStates].map(
    ({ id, name }) => ({
      value: id === 'select-option' ? '' : id,
      children: id === 'select-option' ? t('protected:parent-details.select-option') : name,
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex w-full items-center justify-between sm:w-150">
        <h2 className="font-lato text-2xl font-bold">
          {t('protected:parent-details.section-title')}
          <span className="ml-[0.5ch]">{index + 1}</span>
        </h2>
        {onRemove && (
          <Button size="lg" type="button" variant="link" endIcon={faXmark} className="px-3" onClick={() => onRemove(index)}>
            {t('protected:parent-details.remove')}
          </Button>
        )}
      </div>
      <InputCheckbox
        errorMessage={errors?.[`${index}.unavailable`]?.at(0)}
        id={`${index}-unavailable-id`}
        name={`${index}-unavailable`}
        defaultChecked={unavailable}
        required
        onChange={({ target }) => setUnavailable(target.checked)}
        labelClassName="text-lg"
      >
        {t('protected:parent-details.details-unavailable')}
      </InputCheckbox>
      {!unavailable && (
        <>
          <InputField
            errorMessage={errors?.[`${index}.givenName`]?.at(0)}
            label={t('protected:parent-details.given-name')}
            name={`${index}-given-name`}
            defaultValue={defaultValues?.givenName}
            required
            type="text"
            className="w-full rounded-sm sm:w-104"
          />
          <InputField
            errorMessage={errors?.[`${index}.lastName`]?.at(0)}
            label={t('protected:parent-details.last-name')}
            name={`${index}-last-name`}
            defaultValue={defaultValues?.lastName}
            required
            type="text"
            className="w-full rounded-sm sm:w-104"
          />
          <InputSelect
            errorMessage={errors?.[`${index}.birthLocation.country`]?.at(0)}
            className="w-full rounded-sm sm:w-104"
            id={`${index}-country-id`}
            name={`${index}-country`}
            label={t('protected:parent-details.country')}
            defaultValue={defaultValues?.country}
            options={countryOptions}
            onChange={({ target }) => setCountry(target.value)}
          />
          {country == globalThis.__appEnvironment.PP_CANADA_COUNTRY_CODE ? (
            <InputSelect
              errorMessage={errors?.[`${index}.birthLocation.province`]?.at(0)}
              className="w-full rounded-sm sm:w-104"
              id={`${index}-province-id`}
              name={`${index}-province`}
              label={t('protected:parent-details.province')}
              required
              defaultValue={defaultValues?.province}
              options={provinceOptions}
            />
          ) : (
            <InputField
              errorMessage={errors?.[`${index}.birthLocation.province`]?.at(0)}
              className="w-full rounded-sm sm:w-104"
              label={t('protected:parent-details.province')}
              name={`${index}-province`}
              defaultValue={defaultValues?.province}
              type="text"
            />
          )}
          <InputField
            errorMessage={errors?.[`${index}.birthLocation.city`]?.at(0)}
            className="w-full rounded-sm sm:w-104"
            label={t('protected:parent-details.city')}
            name={`${index}-city`}
            defaultValue={defaultValues?.city}
            required={country == globalThis.__appEnvironment.PP_CANADA_COUNTRY_CODE}
            type="text"
          />
        </>
      )}
    </div>
  );
}

/**
 * A custom hook that manages a collection of unique numeric IDs.
 *
 * Useful for dynamically adding/removing form elements or list items with stable identifiers.
 *
 * @param initialSize - The initial number of IDs to generate in the collection. Must be a non-negative integer.
 *
 * @returns An object containing:
 *   - idList: An array of unique numeric IDs
 *   - addId: Function that appends a new unique ID to the list
 *   - removeId: Function that removes an ID at the specified index
 */
function useIdList(initialSize: number) {
  const [idList, setIdList] = useState(Array.from({ length: initialSize }, (_, index) => index + 1));

  return {
    /**
     * The list of current ids
     */
    idList: idList,

    /**
     * Adds a new id to the id list
     */
    addId: () => {
      setIdList((prev) => {
        const nextId = (prev[prev.length - 1] ?? 0) + 1;
        return [...prev, nextId];
      });
    },

    /**
     * Removes an id at the specified index.
     *
     * @param index - The index of the id to remove.
     */
    removeId: (index: number) => {
      if (index < idList.length) {
        setIdList((prev) => prev.filter((_, i) => i !== index));
      }
    },
  };
}
