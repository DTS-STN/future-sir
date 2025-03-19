import { useState } from 'react';

import type { RouteHandle } from 'react-router';

import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import { Button } from '~/components/button';
import { InputCheckbox } from '~/components/input-checkbox';
import { InputField } from '~/components/input-field';
import { InputSelect } from '~/components/input-select';
import type { Errors, LocalizedLocations, ParentDetailsData } from '~/routes/protected/sin-application/types';
import { getSingleKey } from '~/utils/i18n-utils';

export const handle = {
  i18nNamespace: ['protected'],
} as const satisfies RouteHandle;

interface ParentDetailsFormProps {
  defaultFormValues: ParentDetailsData | undefined;
  localizedCountries: LocalizedLocations;
  localizedProvincesTerritoriesStates: LocalizedLocations;
  maxParents: number;
  errors: Errors;
}

export default function ParentDetailsForm({
  defaultFormValues = [],
  localizedCountries,
  localizedProvincesTerritoriesStates,
  maxParents,
  errors,
}: ParentDetailsFormProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const { idList, addId, removeId } = useIdList(Math.max(defaultFormValues.length, 1));

  const canAddParent = idList.length < maxParents;

  function onAddParent() {
    if (canAddParent) addId();
  }

  function onRemoveParent(index: number) {
    // remove parent data from the form values
    defaultFormValues.splice(index, 1);
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
            defaultFormValues={defaultFormValues}
            localizedCountries={localizedCountries}
            localizedProvincesTerritoriesStates={localizedProvincesTerritoriesStates}
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
  defaultFormValues: ParentDetailsData;
  localizedCountries: LocalizedLocations;
  localizedProvincesTerritoriesStates: LocalizedLocations;
  errors: Errors;
  onRemove?: (index: number) => void;
}

function ParentForm({
  index,
  defaultFormValues,
  localizedCountries,
  localizedProvincesTerritoriesStates,
  errors,
  onRemove,
}: ParentFormProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  const defaultValues = defaultFormValues.at(index);
  const defaultParentAvailable = defaultValues?.unavailable === false;
  const [unavailable, setUnavailable] = useState(defaultValues?.unavailable);
  const [country, setCountry] = useState(defaultParentAvailable ? defaultValues.birthLocation.country : undefined);

  const countryOptions = [{ id: 'select-option', name: '' }, ...localizedCountries].map(({ id, name }) => ({
    value: id === 'select-option' ? '' : id,
    children: id === 'select-option' ? t('protected:parent-details.select-option') : name,
  }));

  const provinceOptions = [{ id: 'select-option', name: '' }, ...localizedProvincesTerritoriesStates].map(({ id, name }) => ({
    value: id === 'select-option' ? '' : id,
    children: id === 'select-option' ? t('protected:parent-details.select-option') : name,
  }));

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
        errorMessage={t(getSingleKey(errors?.[`${index}.unavailable`]))}
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
            errorMessage={t(getSingleKey(errors?.[`${index}.givenName`]))}
            label={t('protected:parent-details.given-name')}
            name={`${index}-given-name`}
            defaultValue={defaultParentAvailable ? defaultValues.givenName : undefined}
            required
            type="text"
            className="w-full rounded-sm sm:w-104"
          />
          <InputField
            errorMessage={t(getSingleKey(errors?.[`${index}.lastName`]))}
            label={t('protected:parent-details.last-name')}
            name={`${index}-last-name`}
            defaultValue={defaultParentAvailable ? defaultValues.lastName : undefined}
            required
            type="text"
            className="w-full rounded-sm sm:w-104"
          />
          <InputSelect
            errorMessage={t(getSingleKey(errors?.[`${index}.birthLocation.country`]))}
            className="w-full rounded-sm sm:w-104"
            id={`${index}-country-id`}
            name={`${index}-country`}
            label={t('protected:parent-details.country')}
            defaultValue={defaultParentAvailable ? defaultValues.birthLocation.country : undefined}
            options={countryOptions}
            onChange={({ target }) => setCountry(target.value)}
          />
          {country === globalThis.__appEnvironment.PP_CANADA_COUNTRY_CODE ? (
            <InputSelect
              errorMessage={t(getSingleKey(errors?.[`${index}.birthLocation.province`]))}
              className="w-full rounded-sm sm:w-104"
              id={`${index}-province-id`}
              name={`${index}-province`}
              label={t('protected:parent-details.province')}
              required
              defaultValue={defaultParentAvailable ? defaultValues.birthLocation.province : undefined}
              options={provinceOptions}
            />
          ) : (
            <InputField
              errorMessage={t(getSingleKey(errors?.[`${index}.birthLocation.province`]))}
              className="w-full rounded-sm sm:w-104"
              label={t('protected:parent-details.province')}
              name={`${index}-province`}
              defaultValue={defaultParentAvailable ? defaultValues.birthLocation.province : undefined}
              type="text"
            />
          )}
          <InputField
            errorMessage={t(getSingleKey(errors?.[`${index}.birthLocation.city`]))}
            className="w-full rounded-sm sm:w-104"
            label={t('protected:parent-details.city')}
            name={`${index}-city`}
            defaultValue={defaultParentAvailable ? defaultValues.birthLocation.city : undefined}
            required={country === globalThis.__appEnvironment.PP_CANADA_COUNTRY_CODE}
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
