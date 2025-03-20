import type { ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { DescriptionList, DescriptionListItem } from '~/components/description-list';

interface ReviewPrimaryDocsProps {
  currentStatusInCanadaName: string;
  documentTypeName: string;
  registrationNumber: string;
  clientNumber: string;
  givenName: string;
  lastName: string;
  dateOfBirth: string;
  genderName: string;
  citizenshipDate: string;
  children: ReactNode;
}

export function ReviewPrimaryDocs({
  currentStatusInCanadaName,
  documentTypeName,
  registrationNumber,
  clientNumber,
  givenName,
  lastName,
  dateOfBirth,
  genderName,
  citizenshipDate,
  children,
}: ReviewPrimaryDocsProps) {
  const { t } = useTranslation(['protected']);

  return (
    <section className="space-y-3">
      <h2 className="font-lato text-2xl font-bold">{t('protected:primary-identity-document.page-title')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.current-status-in-canada.title')}>
          <p>{currentStatusInCanadaName}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.document-type.title')}>
          <p>{documentTypeName}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.registration-number.label')}>
          <p>{registrationNumber}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.client-number.label')}>
          <p>{clientNumber}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.given-name.label')}>
          <p>{givenName}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.last-name.label')}>
          <p>{lastName}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.date-of-birth.label')}>
          <p>{dateOfBirth}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.gender.label')}>
          <p>{genderName}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.citizenship-date.label')}>
          <p>{citizenshipDate}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:review.document-uploaded')}>
          <p>{t('protected:review.choosen-file')}</p>
        </DescriptionListItem>
      </DescriptionList>
      {children}
    </section>
  );
}
