import type { ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { DescriptionList, DescriptionListItem } from '~/components/description-list';
import { UnorderedList } from '~/components/lists';

interface ReviewCurrentNameProps {
  preferredSameAsDocumentName: boolean;
  firstName: string;
  middleName: string | undefined;
  lastName: string;
  supportingDocuments: { required: boolean; documentTypes?: string[] } | undefined;
  supportingDocumentsNames: string[] | undefined;
  children: ReactNode;
}

export function ReviewCurrentName({
  preferredSameAsDocumentName,
  firstName,
  middleName,
  lastName,
  supportingDocuments,
  supportingDocumentsNames,
  children,
}: ReviewCurrentNameProps) {
  const { t } = useTranslation(['protected']);

  return (
    <section className="space-y-3">
      <h2 className="font-lato text-2xl font-bold">{t('protected:review.sub-title-preferred-name')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem className="py-3" term={t('protected:current-name.preferred-name.description')}>
          <p>{preferredSameAsDocumentName ? t('protected:review.yes') : t('protected:review.no')}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:current-name.preferred-name.first-name')}>
          <p>{firstName}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:current-name.preferred-name.middle-name')}>
          {preferredSameAsDocumentName === false && middleName && <p>{middleName}</p>}
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:current-name.preferred-name.last-name')}>
          <p>{lastName}</p>
        </DescriptionListItem>
        <div className="mt-3">
          <h3 className="font-lato text-xl font-bold">{t('protected:current-name.supporting-docs.title')}</h3>
          <DescriptionListItem className="py-3" term={t('protected:current-name.supporting-docs.docs-required')}>
            <p>
              {preferredSameAsDocumentName === false && supportingDocuments?.required
                ? t('protected:review.yes')
                : t('protected:review.no')}
            </p>
          </DescriptionListItem>
          {supportingDocumentsNames && supportingDocumentsNames.length > 0 && (
            <DescriptionListItem className="py-3" term={t('protected:current-name.supporting-docs.title')}>
              <UnorderedList>
                {supportingDocumentsNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </UnorderedList>
            </DescriptionListItem>
          )}
        </div>
      </DescriptionList>
      {children}
    </section>
  );
}
