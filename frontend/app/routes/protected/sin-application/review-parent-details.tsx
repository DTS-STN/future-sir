import type { ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { DescriptionList, DescriptionListItem } from '~/components/description-list';

interface ReviewParentDetailsProps {
  parentDetails: (
    | {
        unavailable: boolean;
        givenName?: string;
        lastName?: string;
        birthLocation?: { country: string; city?: string; province?: string };
        countryName?: string;
        provinceName?: string;
      }
    | undefined
  )[];
  children: ReactNode;
}

export function ReviewParentDetails({ parentDetails, children }: ReviewParentDetailsProps) {
  const { t } = useTranslation(['protected']);

  return (
    <section className="space-y-3">
      <h2 className="font-lato text-2xl font-bold">{t('protected:parent-details.page-title')}</h2>
      <ul className="divide-y border-y">
        {Array.isArray(parentDetails) &&
          parentDetails.map((parentDetail, index) => (
            <li key={`parent-${index + 1}`}>
              <h3 className="font-lato my-2 text-xl font-bold text-slate-700">
                {t('protected:parent-details.section-title')}
                <span className="ml-[0.5ch]">{index + 1}</span>
              </h3>
              <DescriptionList className="divide-y border-y">
                {parentDetail?.unavailable ? (
                  <DescriptionListItem className="py-3" term={t('protected:parent-details.details-unavailable')}>
                    {t('protected:review.yes')}
                  </DescriptionListItem>
                ) : (
                  <>
                    <DescriptionListItem className="py-3" term={t('protected:parent-details.given-name')}>
                      {parentDetail?.givenName}
                    </DescriptionListItem>
                    <DescriptionListItem className="py-3" term={t('protected:parent-details.last-name')}>
                      {parentDetail?.lastName}
                    </DescriptionListItem>
                    <DescriptionListItem className="py-3" term={t('protected:review.birth-place')}>
                      {parentDetail?.countryName && (
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
            </li>
          ))}
      </ul>
      {children}
    </section>
  );
}
