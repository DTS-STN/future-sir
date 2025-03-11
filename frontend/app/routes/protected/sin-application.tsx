import type { RouteHandle } from 'react-router';

import type { ResourceKey } from 'i18next';
import { useTranslation } from 'react-i18next';

import { Address } from '~/components/address';
import { DescriptionList, DescriptionListItem } from '~/components/description-list';
import { InlineLink } from '~/components/links';

const handle = {
  i18nNamespace: ['protected'],
} as const satisfies RouteHandle;

interface SinApplicationProps {
  inPersonSINCase: {
    primaryDocuments: DataProps['data'];
    secondaryDocument: SecondayDocumentDataProps['data'];
    currentNameInfo: PreferredNameDataProps['data'];
    personalInformation: PersonalDetailsDataProps['data'];
    birthDetails: BirthDetailsDataProps['data'];
    parentDetails: ParentDetailsDataProps['data'];
    previousSin: DataProps['data'];
    contactInformation: ContactInformationDataProps['data'];
  };
  tabId?: string;
}

export function SinApplication({ inPersonSINCase, tabId }: SinApplicationProps) {
  return (
    <div className="mt-12 space-y-15">
      <PrimaryDocumentData data={inPersonSINCase.primaryDocuments} tabId={tabId} />
      <SecondayDocumentData data={inPersonSINCase.secondaryDocument} tabId={tabId} />
      <PreferredNameData data={inPersonSINCase.currentNameInfo} tabId={tabId} />
      <PersonalDetailsData data={inPersonSINCase.personalInformation} tabId={tabId} />
      <BirthDetailsData data={inPersonSINCase.birthDetails} tabId={tabId} />
      <ParentDetailsData data={inPersonSINCase.parentDetails} tabId={tabId} />
      <PreviousSinData data={inPersonSINCase.previousSin} tabId={tabId} />
      <ContactInformationData data={inPersonSINCase.contactInformation} tabId={tabId} />
    </div>
  );
}

interface DataProps {
  data: Record<string, string | undefined>;
  tabId?: string;
}

function PrimaryDocumentData({ data, tabId }: DataProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <section className="space-y-3">
      <h2 className="font-lato text-2xl font-bold">{t('protected:primary-identity-document.page-title')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.current-status-in-canada.title')}>
          <p>
            {t(
              `protected:primary-identity-document.current-status-in-canada.options.${data.currentStatusInCanada}` as ResourceKey,
            )}
          </p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.document-type.title')}>
          <p>{t(`protected:primary-identity-document.document-type.options.${data.documentType}` as ResourceKey)}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.registration-number.label')}>
          <p>{data.registrationNumber}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.client-number.label')}>
          <p>{data.clientNumber}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.given-name.label')}>
          <p>{data.givenName}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.last-name.label')}>
          <p>{data.lastName}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.date-of-birth.label')}>
          <p>{data.dateOfBirth}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.gender.label')}>
          <p>{data.genderName}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:primary-identity-document.citizenship-date.label')}>
          <p>{data.citizenshipDate}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:review.document-uploaded')}>
          <p>{t('protected:review.choosen-file')}</p>
        </DescriptionListItem>
      </DescriptionList>
      <InlineLink file="routes/protected/person-case/primary-docs.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-primary-identity-document')}
      </InlineLink>
    </section>
  );
}

interface SecondayDocumentDataProps {
  data: {
    documentTypeName: string;
    documentType: string;
    expiryMonth: number;
    expiryYear: number;
  };
  tabId?: string;
}

function SecondayDocumentData({ data, tabId }: SecondayDocumentDataProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <section className="space-y-3">
      <h2 className="font-lato text-2xl font-bold">{t('protected:secondary-identity-document.page-title')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem className="py-3" term={t('protected:secondary-identity-document.document-type.title')}>
          <p>{data.documentTypeName}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:secondary-identity-document.expiry-date.title')}>
          <p>
            {data.expiryMonth} {data.expiryYear}
          </p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:review.document-uploaded')}>
          <p>{t('protected:review.choosen-file')}</p>
        </DescriptionListItem>
      </DescriptionList>
      <InlineLink file="routes/protected/person-case/secondary-doc.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-secondary-identity-document')}
      </InlineLink>
    </section>
  );
}

interface PreferredNameDataProps {
  data: {
    preferredSameAsDocumentName: boolean;
    firstName: string;
    middleName?: string;
    lastName: string;
    supportingDocuments?: { required: boolean; documentTypes?: string[] };
  };
  tabId?: string;
}

function PreferredNameData({ data, tabId }: PreferredNameDataProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  return (
    <section className="space-y-3">
      <h2 className="font-lato text-2xl font-bold">{t('protected:review.sub-title-preferred-name')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem className="py-3" term={t('protected:current-name.preferred-name.description')}>
          <p>{data.preferredSameAsDocumentName ? t('protected:review.yes') : t('protected:review.no')}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:current-name.preferred-name.first-name')}>
          <p>{data.firstName}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:current-name.preferred-name.middle-name')}>
          {data.preferredSameAsDocumentName === false && data.middleName && <p>{data.middleName}</p>}
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:current-name.preferred-name.last-name')}>
          <p>{data.lastName}</p>
        </DescriptionListItem>
        <div className="mt-3">
          <h3 className="font-lato text-xl font-bold">{t('protected:current-name.supporting-docs.title')}</h3>
          <DescriptionListItem className="py-3" term={t('protected:current-name.supporting-docs.docs-required')}>
            <p>
              {data.preferredSameAsDocumentName === false && data.supportingDocuments?.required
                ? t('protected:review.yes')
                : t('protected:review.no')}
            </p>
          </DescriptionListItem>
          {data.preferredSameAsDocumentName === false && data.supportingDocuments?.required && (
            <DescriptionListItem className="py-3" term={t('protected:current-name.supporting-docs.title')}>
              {data.supportingDocuments.documentTypes && data.supportingDocuments.documentTypes.length > 0 && (
                <ul className="ml-6 list-disc">
                  {data.supportingDocuments.documentTypes.map((value) => (
                    <li key={value}>{t(`protected:current-name.doc-types.${value}` as ResourceKey)}</li>
                  ))}
                </ul>
              )}
            </DescriptionListItem>
          )}
        </div>
      </DescriptionList>
      <InlineLink file="routes/protected/person-case/current-name.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-current-name')}
      </InlineLink>
    </section>
  );
}

interface PersonalDetailsDataProps {
  data: {
    firstNamePreviouslyUsed?: string[];
    lastNameAtBirth: string;
    lastNamePreviouslyUsed?: string[];
    gender: string;
    genderName: string;
  };
  tabId?: string;
}

function PersonalDetailsData({ data, tabId }: PersonalDetailsDataProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <section className="space-y-3">
      <h2 className="font-lato text-2xl font-bold">{t('protected:personal-information.page-title')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem className="py-3" term={t('protected:personal-information.first-name-previously-used.label')}>
          {data.firstNamePreviouslyUsed && data.firstNamePreviouslyUsed.length > 0 && (
            <ul className="ml-6 list-disc">
              {data.firstNamePreviouslyUsed.map((value, index) => (
                <li key={`${index}-${value}`}>{value}</li>
              ))}
            </ul>
          )}
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:personal-information.last-name-at-birth.label')}>
          <p>{data.lastNameAtBirth}</p>
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:personal-information.last-name-previously-used.label')}>
          {data.lastNamePreviouslyUsed && data.lastNamePreviouslyUsed.length > 0 && (
            <ul className="ml-6 list-disc">
              {data.lastNamePreviouslyUsed.map((value, index) => (
                <li key={`${index}-${value}`}>{value}</li>
              ))}
            </ul>
          )}
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:personal-information.gender.label')}>
          <p>{data.genderName}</p>
        </DescriptionListItem>
      </DescriptionList>
      <InlineLink file="routes/protected/person-case/personal-info.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-personal-details')}
      </InlineLink>
    </section>
  );
}

interface BirthDetailsDataProps {
  data: {
    city?: string;
    province?: string;
    provinceName?: string;
    country: string;
    countryName: string;
    fromMultipleBirth: boolean;
  };
  tabId?: string;
}

function BirthDetailsData({ data, tabId }: BirthDetailsDataProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <section className="space-y-3">
      <h2 className="font-lato text-2xl font-bold">{t('protected:birth-details.page-title')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem className="py-3" term={t('protected:review.birth-place')}>
          <Address
            address={{
              city: data.city,
              provinceState: data.provinceName,
              country: data.countryName,
            }}
          />
        </DescriptionListItem>
        <DescriptionListItem className="py-3" term={t('protected:review.multiple-birth')}>
          <p>{data.fromMultipleBirth ? t('protected:review.yes') : t('protected:review.no')}</p>
        </DescriptionListItem>
      </DescriptionList>
      <InlineLink file="routes/protected/person-case/birth-details.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-birth-details')}
      </InlineLink>
    </section>
  );
}

interface ParentDetailsDataProps {
  data: (
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
  tabId?: string;
}

function ParentDetailsData({ data, tabId }: ParentDetailsDataProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <section className="space-y-3">
      <h2 className="font-lato text-2xl font-bold">{t('protected:parent-details.page-title')}</h2>
      <ul className="divide-y border-y">
        {Array.isArray(data) &&
          data.map((parentDetail, index) => (
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
      <InlineLink file="routes/protected/person-case/parent-details.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-parent-details')}
      </InlineLink>
    </section>
  );
}

function PreviousSinData({ data, tabId }: DataProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <section className="space-y-3">
      <h2 className="font-lato text-2xl font-bold">{t('protected:previous-sin.page-title')}</h2>
      <DescriptionList className="divide-y border-y">
        <DescriptionListItem className="py-3" term={t('protected:previous-sin.has-previous-sin-label')}>
          <p>{data.hasPreviousSinText}</p>
        </DescriptionListItem>
        {data.socialInsuranceNumber && (
          <DescriptionListItem className="py-3" term={t('protected:previous-sin.social-insurance-number-label')}>
            <p>{data.socialInsuranceNumber}</p>
          </DescriptionListItem>
        )}
      </DescriptionList>
      <InlineLink file="routes/protected/person-case/previous-sin.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-previous-sin')}
      </InlineLink>
    </section>
  );
}

interface ContactInformationDataProps {
  data: {
    preferredLanguage: string;
    preferredLanguageName: string;
    primaryPhoneNumber: string;
    secondaryPhoneNumber?: string;
    emailAddress?: string;
    country: string;
    countryName: string;
    address: string;
    postalCode: string;
    city: string;
    province: string;
    provinceName?: string;
  };
  tabId?: string;
}

function ContactInformationData({ data, tabId }: ContactInformationDataProps) {
  const { t } = useTranslation(handle.i18nNamespace);
  return (
    <section className="space-y-3">
      <h2 className="font-lato text-2xl font-bold">{t('protected:contact-information.page-title')}</h2>
      <div className="mt-3">
        <h3 className="font-lato text-xl font-bold text-slate-700">{t('protected:contact-information.correspondence')}</h3>
        <DescriptionList className="mt-3 divide-y border-y">
          <DescriptionListItem className="py-3" term={t('protected:contact-information.preferred-language-label')}>
            <p>{data.preferredLanguageName}</p>
          </DescriptionListItem>
          <DescriptionListItem className="py-3" term={t('protected:contact-information.primary-phone-label')}>
            <p>{data.primaryPhoneNumber}</p>
          </DescriptionListItem>
          {data.secondaryPhoneNumber && (
            <DescriptionListItem className="py-3" term={t('protected:contact-information.secondary-phone-label')}>
              <p>{data.secondaryPhoneNumber}</p>
            </DescriptionListItem>
          )}
          {data.emailAddress && (
            <DescriptionListItem className="py-3" term={t('protected:contact-information.email-label')}>
              <p>{data.emailAddress}</p>
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
                addressLine1: data.address,
                city: data.city,
                provinceState: data.provinceName,
                postalZipCode: data.postalCode,
                country: data.countryName,
              }}
            />
          </DescriptionListItem>
        </DescriptionList>
      </div>
      <InlineLink file="routes/protected/person-case/contact-information.tsx" search={`tid=${tabId}`}>
        {t('protected:review.edit-contact-information')}
      </InlineLink>
    </section>
  );
}
