import type { ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { DescriptionList, DescriptionListItem } from '~/components/description-list';

interface ReviewPreviousSinProps {
  hasPreviousSinText: string;
  socialInsuranceNumber: string | undefined;
  children: ReactNode;
}

export function ReviewPreviousSin({ hasPreviousSinText, socialInsuranceNumber, children }: ReviewPreviousSinProps) {
  const { t } = useTranslation(['protected']);

  return (
    <section>
      <h2 className="font-lato text-2xl font-bold">{t('protected:previous-sin.page-title')}</h2>
      <DescriptionList className="mt-6 divide-y border-y">
        <DescriptionListItem term={t('protected:previous-sin.has-previous-sin-label')}>
          <p>{hasPreviousSinText}</p>
        </DescriptionListItem>
        {socialInsuranceNumber && (
          <DescriptionListItem term={t('protected:previous-sin.social-insurance-number-label')}>
            <p>{socialInsuranceNumber}</p>
          </DescriptionListItem>
        )}
      </DescriptionList>
      {children}
    </section>
  );
}
