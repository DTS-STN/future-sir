import type { ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { DescriptionList, DescriptionListItem } from '~/components/description-list';

interface ReviewContactInformationProps {
  preferredLanguageName: string;
  primaryPhoneNumber: string;
  secondaryPhoneNumber: string | undefined;
  emailAddress: string | undefined;
  countryName: string;
  address: string;
  postalCode: string;
  city: string;
  provinceName: string | undefined;
  children: ReactNode;
}

export function ReviewContactInformation({
  preferredLanguageName,
  primaryPhoneNumber,
  secondaryPhoneNumber,
  emailAddress,
  countryName,
  address,
  postalCode,
  city,
  provinceName,
  children,
}: ReviewContactInformationProps) {
  const { t } = useTranslation(['protected']);
  return (
    <section>
      <h2 className="font-lato text-2xl font-bold">{t('protected:contact-information.page-title')}</h2>
      <h3 className="font-lato mt-8 text-xl font-bold">{t('protected:contact-information.correspondence')}</h3>
      <DescriptionList className="mt-6 divide-y border-y">
        <DescriptionListItem term={t('protected:contact-information.preferred-language-label')}>
          <p>{preferredLanguageName}</p>
        </DescriptionListItem>
        <DescriptionListItem term={t('protected:contact-information.primary-phone-label')}>
          <p>{primaryPhoneNumber}</p>
        </DescriptionListItem>
        {secondaryPhoneNumber && (
          <DescriptionListItem term={t('protected:contact-information.secondary-phone-label')}>
            <p>{secondaryPhoneNumber}</p>
          </DescriptionListItem>
        )}
        {emailAddress && (
          <DescriptionListItem term={t('protected:contact-information.email-label')}>
            <p>{emailAddress}</p>
          </DescriptionListItem>
        )}
      </DescriptionList>
      <h3 className="font-lato mt-8 text-xl font-bold">{t('protected:contact-information.mailing-address')}</h3>
      <DescriptionList className="mt-6 divide-y border-y">
        <DescriptionListItem term={t('protected:contact-information.address-label')}>
          <Address
            address={{
              addressLine1: address,
              city: city,
              provinceState: provinceName,
              postalZipCode: postalCode,
              country: countryName,
            }}
          />
        </DescriptionListItem>
      </DescriptionList>
      {children}
    </section>
  );
}
