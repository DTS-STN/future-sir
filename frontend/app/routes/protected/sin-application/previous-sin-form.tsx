import type { ChangeEvent } from 'react';
import { useState } from 'react';

import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';

import { InputPatternField } from '~/components/input-pattern-field';
import { InputRadios } from '~/components/input-radios';
import type { Errors, LocalizedOptions, PreviousSinData } from '~/routes/protected/sin-application/types';
import { getSingleKey } from '~/utils/i18n-utils';
import { sinInputPatternFormat } from '~/utils/sin-utils';

export const handle = {
  i18nNamespace: ['protected'],
} as const satisfies RouteHandle;

interface PreviousSinFormProps {
  defaultFormValues: PreviousSinData | undefined;
  localizedApplicantHadSinOptions: LocalizedOptions;
  errors: Errors;
}

export default function PreviousSinForm({ defaultFormValues, localizedApplicantHadSinOptions, errors }: PreviousSinFormProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  const [hasPreviousSin, setHasPreviousSin] = useState(defaultFormValues?.hasPreviousSin);

  const hasPreviousSinOptions = localizedApplicantHadSinOptions.map(({ id, name }) => ({
    value: id,
    children: name,
    defaultChecked: id === defaultFormValues?.hasPreviousSin,
    onChange: ({ target }: ChangeEvent<HTMLInputElement>) => setHasPreviousSin(target.value),
  }));

  return (
    <div className="space-y-6">
      <InputRadios
        id="has-previous-sin"
        legend={t('protected:previous-sin.has-previous-sin-label')}
        name="hasPreviousSin"
        options={hasPreviousSinOptions}
        required
        errorMessage={t(getSingleKey(errors?.hasPreviousSin))}
      />
      {hasPreviousSin === globalThis.__appEnvironment.PP_HAS_HAD_PREVIOUS_SIN_CODE && (
        <InputPatternField
          defaultValue={defaultFormValues?.socialInsuranceNumber ?? ''}
          inputMode="numeric"
          format={sinInputPatternFormat}
          id="social-insurance-number"
          name="socialInsuranceNumber"
          label={t('protected:previous-sin.social-insurance-number-label')}
          errorMessage={t(getSingleKey(errors?.socialInsuranceNumber))}
        />
      )}
    </div>
  );
}
