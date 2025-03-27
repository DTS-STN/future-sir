import { Fragment } from 'react';
import type { ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { DescriptionList, DescriptionListItem } from '~/components/description-list';

interface ReviewParentDetailsProps {
  parentDetails: {
    unavailable: boolean;
    givenName?: string;
    lastName?: string;
    birthLocation?: {
      country?: string;
      city?: string;
      province?: string;
    };
    countryName?: string;
    provinceName?: string;
  }[];
  children: ReactNode;
}

export function ReviewParentDetails({ parentDetails, children }: ReviewParentDetailsProps) {
  const { t } = useTranslation(['protected']);

  return (
    <section>
      <h2 className="font-lato text-2xl font-bold">{t('protected:parent-details.page-title')}</h2>

      {Array.isArray(parentDetails) &&
        parentDetails.map((parentDetail, index) => (
          <Fragment key={index + 1}>
            <h3 className="font-lato mt-8 text-xl font-bold">
              {t('protected:parent-details.section-title') + ' ' + (index + 1).toString()}
            </h3>
            <DescriptionList className="mt-6 divide-y border-y">
              {parentDetail.unavailable ? (
                <DescriptionListItem term={t('protected:parent-details.details-unavailable')}>
                  {t('protected:review.yes')}
                </DescriptionListItem>
              ) : (
                <>
                  <DescriptionListItem term={t('protected:parent-details.given-name')}>
                    {parentDetail.givenName}
                  </DescriptionListItem>
                  <DescriptionListItem term={t('protected:parent-details.last-name')}>
                    {parentDetail.lastName}
                  </DescriptionListItem>
                  <DescriptionListItem term={t('protected:review.birth-place')}>
                    {parentDetail.countryName && (
                      <Address
                        address={{
                          city: parentDetail.birthLocation?.city,
                          provinceState: parentDetail.provinceName,
                          country: parentDetail.countryName,
                        }}
                      />
                    )}
                  </DescriptionListItem>
                </>
              )}
            </DescriptionList>
          </Fragment>
        ))}

      {children}
    </section>
  );
}
