import type { RouteHandle } from 'react-router';

import { useTranslation } from 'react-i18next';

import { InputCheckbox } from '~/components/input-checkbox';
import type { Errors } from '~/routes/protected/sin-application/types';
import { getSingleKey } from '~/utils/i18n-utils';

export const handle = {
  i18nNamespace: ['protected'],
} as const satisfies RouteHandle;

interface PrivacyStatementFormProps {
  errors: Errors;
}

export default function PrivacyStatementForm({ errors }: PrivacyStatementFormProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  return (
    <div className="max-w-prose space-y-6">
      <p>{t('protected:privacy-statement.ask-client')}</p>
      <h2 className="font-lato text-2xl font-bold">{t('protected:privacy-statement.privacy-statement')}</h2>
      <p>{t('protected:privacy-statement.personal-info')}</p>
      <p>{t('protected:privacy-statement.participation')}</p>
      <p>{t('protected:privacy-statement.info-and-docs')}</p>
      <p>{t('protected:privacy-statement.your-rights')}</p>
      <InputCheckbox
        id="agreed-to-terms"
        name="agreedToTerms"
        className="h-8 w-8"
        errorMessage={t(getSingleKey(errors?.agreedToTerms))}
        required
      >
        {t('protected:privacy-statement.confirm-privacy-notice-checkbox.title')}
      </InputCheckbox>
    </div>
  );
}
