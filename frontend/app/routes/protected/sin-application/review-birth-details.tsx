import type { ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { DescriptionList, DescriptionListItem } from '~/components/description-list';

interface ReviewBirthDetailsProps {
  city: string | undefined;
  provinceName: string | undefined;
  countryName: string;
  fromMultipleBirth: boolean;
  children: ReactNode;
}

export function ReviewBirthDetails({ city, provinceName, countryName, fromMultipleBirth, children }: ReviewBirthDetailsProps) {
  const { t } = useTranslation(['protected']);
  return (
    <section>
      <h2 className="font-lato text-2xl font-bold">{t('protected:birth-details.page-title')}</h2>
      <DescriptionList className="mt-6 divide-y border-y">
        <DescriptionListItem term={t('protected:review.birth-place')}>
          <Address
            address={{
              city: city,
              provinceState: provinceName,
              country: countryName,
            }}
          />
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:review.multiple-birth')}>
          <p>{fromMultipleBirth ? t('protected:review.yes') : t('protected:review.no')}</p>
        </DescriptionListItem>
      </DescriptionList>
      {children}
    </section>
  );
}
