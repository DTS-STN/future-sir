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
    <section className="space-y-3">
      <h2 className="font-lato text-2xl font-bold">{t('protected:contact-information.page-title')}</h2>
      <div className="mt-3">
        <h3 className="font-lato text-xl font-bold text-slate-700">{t('protected:contact-information.correspondence')}</h3>
        <DescriptionList className="mt-3 divide-y border-y">
          <DescriptionListItem className="py-3" term={t('protected:contact-information.preferred-language-label')}>
            <p>{preferredLanguageName}</p>
          </DescriptionListItem>
          <DescriptionListItem className="py-3" term={t('protected:contact-information.primary-phone-label')}>
            <p>{primaryPhoneNumber}</p>
          </DescriptionListItem>
          {secondaryPhoneNumber && (
            <DescriptionListItem className="py-3" term={t('protected:contact-information.secondary-phone-label')}>
              <p>{secondaryPhoneNumber}</p>
            </DescriptionListItem>
          )}
          {emailAddress && (
            <DescriptionListItem className="py-3" term={t('protected:contact-information.email-label')}>
              <p>{emailAddress}</p>
            </DescriptionListItem>
          )}
        </DescriptionList>
        <h3 className="font-lato mt-3 text-xl font-bold text-slate-700">
          {t('protected:contact-information.mailing-address')}
        </h3>
        <DescriptionList className="mt-3 divide-y border-y">
          <DescriptionListItem className="py-3" term={t('protected:contact-information.address-label')}>
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
      </div>
      {children}
    </section>
  );
}
