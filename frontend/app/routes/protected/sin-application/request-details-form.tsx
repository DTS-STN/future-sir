import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';

import { InputRadios } from '~/components/input-radios';
import { InputSelect } from '~/components/input-select';
import type { Errors, LocalizedOptions, RequestDetailsData } from '~/routes/protected/sin-application/types';
import { getSingleKey } from '~/utils/i18n-utils';

export const handle = {
  i18nNamespace: ['protected'],
} as const satisfies RouteHandle;

interface RequestDetailsFormProps {
  defaultFormValues: RequestDetailsData | undefined;
  localizedSubmissionScenarios: LocalizedOptions;
  localizedTypeofApplicationToSubmit: LocalizedOptions;
  errors: Errors;
}

export default function RequestDetailsForm({
  defaultFormValues,
  localizedSubmissionScenarios,
  localizedTypeofApplicationToSubmit,
  errors,
}: RequestDetailsFormProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const scenarioOptions = localizedSubmissionScenarios.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === defaultFormValues?.scenario,
  }));

  const requestOptions = [{ id: 'select-option', name: '' }, ...localizedTypeofApplicationToSubmit].map(({ id, name }) => ({
    value: id === 'select-option' ? '' : id,
    children: id === 'select-option' ? t('protected:contact-information.select-option') : name,
  }));

  return (
    <div className="space-y-6">
      <InputRadios
        id="scenario"
        legend={t('protected:request-details.select-scenario')}
        name="scenario"
        options={scenarioOptions}
        required
        errorMessage={t(getSingleKey(errors?.scenario))}
      />
      <InputSelect
        className="w-max rounded-sm"
        id="request-type"
        name="request-type"
        label={t('protected:request-details.type-request')}
        defaultValue={defaultFormValues?.type ?? ''}
        options={requestOptions}
        errorMessage={t(getSingleKey(errors?.type))}
      />
    </div>
  );
}
