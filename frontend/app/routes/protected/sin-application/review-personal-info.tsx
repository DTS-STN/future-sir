import type { ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { DescriptionList, DescriptionListItem } from '~/components/description-list';
import { UnorderedList } from '~/components/lists';

interface ReviewPersonalInfoProps {
  firstNamePreviouslyUsed: string[] | undefined;
  lastNameAtBirth: string;
  lastNamePreviouslyUsed: string[] | undefined;
  genderName: string;
  children: ReactNode;
}

export function ReviewPersonalInfo({
  firstNamePreviouslyUsed,
  lastNameAtBirth,
  lastNamePreviouslyUsed,
  genderName,
  children,
}: ReviewPersonalInfoProps) {
  const { t } = useTranslation(['protected']);

  return (
    <section className="space-y-3">
      <h2 className="font-lato text-2xl font-bold">{t('protected:personal-information.page-title')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem className="py-3" term={t('protected:personal-information.first-name-previously-used.label')}>
          {firstNamePreviouslyUsed && firstNamePreviouslyUsed.length > 0 && (
            <UnorderedList className="break-all">
              {firstNamePreviouslyUsed.map((value, index) => (
                <li key={`${index}-${value}`}>{value}</li>
              ))}
            </UnorderedList>
          )}
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:personal-information.last-name-at-birth.label')}>
          <p>{lastNameAtBirth}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:personal-information.last-name-previously-used.label')}>
          {lastNamePreviouslyUsed && lastNamePreviouslyUsed.length > 0 && (
            <UnorderedList className="break-all">
              {lastNamePreviouslyUsed.map((value, index) => (
                <li key={`${index}-${value}`}>{value}</li>
              ))}
            </UnorderedList>
          )}
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:personal-information.gender.label')}>
          <p>{genderName}</p>
        </DescriptionListItem>
      </DescriptionList>
      {children}
    </section>
  );
}
