import type { ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { DescriptionList, DescriptionListItem } from '~/components/description-list';

interface ReviewSecondaryDocProps {
  documentTypeName: string;
  expiryMonth: string;
  expiryYear: string;
  children: ReactNode;
}

export function ReviewSecondaryDoc({ documentTypeName, expiryMonth, expiryYear, children }: ReviewSecondaryDocProps) {
  const { t } = useTranslation(['protected']);

  return (
    <section className="space-y-3">
      <h2 className="font-lato text-2xl font-bold">{t('protected:secondary-identity-document.page-title')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem className="py-3" term={t('protected:secondary-identity-document.document-type.title')}>
          <p>{documentTypeName}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:secondary-identity-document.expiry-date.title')}>
          <p>
            {expiryMonth} {expiryYear}
          </p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:review.document-uploaded')}>
          <p>{t('protected:review.choosen-file')}</p>
        </DescriptionListItem>
      </DescriptionList>
      {children}
    </section>
  );
}
