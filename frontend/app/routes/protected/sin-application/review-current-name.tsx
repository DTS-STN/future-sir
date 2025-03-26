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
    <section>
      <h2 className="font-lato text-2xl font-bold">{t('protected:review.sub-title-preferred-name')}</h2>
      <DescriptionList className="mt-6 divide-y border-y">
        <DescriptionListItem term={t('protected:current-name.preferred-name.description')}>
          <p>{preferredSameAsDocumentName ? t('protected:review.yes') : t('protected:review.no')}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:current-name.preferred-name.first-name')}>
          <p>{firstName}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:current-name.preferred-name.middle-name')}>
          {preferredSameAsDocumentName === false && middleName && <p>{middleName}</p>}
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:current-name.preferred-name.last-name')}>
          <p>{lastName}</p>
        </DescriptionListItem>
      </DescriptionList>
      <h3 className="font-lato mt-8 text-xl font-bold">{t('protected:current-name.supporting-docs.title')}</h3>
      <DescriptionList className="mt-6 divide-y border-y">
        <DescriptionListItem term={t('protected:current-name.supporting-docs.docs-required')}>
          <p>
            {preferredSameAsDocumentName === false && supportingDocuments?.required
              ? t('protected:review.yes')
              : t('protected:review.no')}
          </p>
        </DescriptionListItem>
        {supportingDocumentsNames && supportingDocumentsNames.length > 0 && (
          <DescriptionListItem term={t('protected:current-name.supporting-docs.title')}>
            <UnorderedList>
              {supportingDocumentsNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </UnorderedList>
          </DescriptionListItem>
        )}
      </DescriptionList>
      {children}
    </section>
  );
}
