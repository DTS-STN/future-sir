import type { SinApplicationRequest } from '~/.server/shared/api/interop';

export function mapInPersonSINCaseToSinApplicationRequest(
  inPersonSINCase: Required<InPersonSinApplication>,
): SinApplicationRequest {
  /* TODO: Remove after mapping is done
    ////Head count//////

  PrivacyStatement: done
    inPersonSINCase.privacyStatement.agreedToTerms //NA
  RequestDetails: done
    inPersonSINCase.requestDetails.type
    inPersonSINCase.requestDetails.scenario
  PrimaryDocumentData: done
    inPersonSINCase.primaryDocuments.currentStatusInCanada
    inPersonSINCase.primaryDocuments.documentType
    inPersonSINCase.primaryDocuments.registrationNumber
    inPersonSINCase.primaryDocuments.clientNumber
    inPersonSINCase.primaryDocuments.givenName
    inPersonSINCase.primaryDocuments.lastName
    inPersonSINCase.primaryDocuments.dateOfBirth
    inPersonSINCase.primaryDocuments.gender
    inPersonSINCase.primaryDocuments.citizenshipDate
  SecondaryDocumentData: done
    inPersonSINCase.secondaryDocument.documentType
    inPersonSINCase.secondaryDocument.expiryYear
    inPersonSINCase.secondaryDocument.expiryMonth
  CurrentNameInfo: done
    inPersonSINCase.currentNameInfo.preferredSameAsDocumentName
    inPersonSINCase.currentNameInfo.firstName
    inPersonSINCase.currentNameInfo.middleName
    inPersonSINCase.currentNameInfo.lastName
    inPersonSINCase.currentNameInfo.supportingDocuments.required
    inPersonSINCase.currentNameInfo.supportingDocuments.documentTypes
  PersonalInformation: done
    inPersonSINCase.personalInformation.firstNamePreviouslyUsed
    inPersonSINCase.personalInformation.lastNameAtBirth
    inPersonSINCase.personalInformation.lastNamePreviouslyUsed
    inPersonSINCase.person.gender
  BirthDetails: done
    inPersonSINCase.birthDetails.fromMultipleBirth
    inPersonSINCase.birthDetails.city
    inPersonSINCase.birthDetails.province
    inPersonSINCase.birthDetails.country  //MUST USE "CA" or "US" REGARDLESS For country
  ParentDetailsData: done
    inPErsonSINCase.parentDetails.unavailable
    inPErsonSINCase.parentDetails.givenName
    inPErsonSINCase.parentDetails.lastName
    inPErsonSINCase.parentDetails.birthLocation.city //NA
    inPErsonSINCase.parentDetails.birthLocation.province //NA
    inPErsonSINCase.parentDetails.birthLocation.country //NA
  PreviousSinData: done
    inPersonSINCase.previousSin.hasPreviousSin
    inPersonSINCase.previousSin.socialInsuranceNumber
  ContactInformation: done
    inPersonSINCase.contactInformation.preferredLanguage
    inPersonSINCase.contactInformation.primaryPhoneNumber
    inPersonSINCase.contactInformation.secondaryPhoneNumber
    inPersonSINCase.contactInformation.emailAddress
    inPersonSINCase.contactInformation.address //For the address, only send the 2 letter code "QC"
    inPersonSINCase.contactInformation.city
    inPersonSINCase.contactInformation.province
    inPersonSINCase.contactInformation.country //MUST USE "CA" or "US" REGARDLESS For country
    inPersonSINCase.contactInformation.postalCode
  */

  return {
    SystemCredential: 'KwisatzHaderach',
    SINApplication: {
      Applicant: {
        ClientLegalStatus: {
          Certificate: [
            {
              CertificateIssueDate: { date: inPersonSINCase.primaryDocuments.citizenshipDate },
              CertificateCategoryCode: {
                ReferenceDataID: '564190000', // copied from esdc_applicantstatusincanada for Canadian citizen
                ReferenceDataName: inPersonSINCase.primaryDocuments.currentStatusInCanada,
              },
            },
          ],
        },
        PersonName: [
          {
            PersonNameCategoryCode: {
              ReferenceDataName: 'Legal',
            },
            PersonGivenName: inPersonSINCase.currentNameInfo.preferredSameAsDocumentName
              ? inPersonSINCase.primaryDocuments.givenName
              : inPersonSINCase.currentNameInfo.firstName + ' ' + inPersonSINCase.currentNameInfo.middleName,
            PersonSurName: inPersonSINCase.currentNameInfo.preferredSameAsDocumentName
              ? inPersonSINCase.primaryDocuments.lastName
              : inPersonSINCase.currentNameInfo.lastName,
          },
          {
            PersonNameCategoryCode: {
              ReferenceDataName: 'at birth',
            },
            PersonSurName: inPersonSINCase.personalInformation.lastNameAtBirth,
          },
          ...(inPersonSINCase.personalInformation.firstNamePreviouslyUsed &&
          inPersonSINCase.personalInformation.firstNamePreviouslyUsed.length > 0
            ? inPersonSINCase.personalInformation.firstNamePreviouslyUsed.map((name) => ({
                PersonGivenName: name,
                PersonNameCategoryCode: {
                  ReferenceDataName: 'Alternate',
                },
              }))
            : []),
          ...(inPersonSINCase.personalInformation.lastNamePreviouslyUsed &&
          inPersonSINCase.personalInformation.lastNamePreviouslyUsed.length > 0
            ? inPersonSINCase.personalInformation.lastNamePreviouslyUsed.map((name) => ({
                PersonSurName: name,
                PersonNameCategoryCode: {
                  ReferenceDataName: 'Alternate',
                },
              }))
            : []),
        ],
        Certificate: [
          {
            ResourceReference: 'Documents',
            CertificateIdentification: [{ IdentificationID: inPersonSINCase.primaryDocuments.registrationNumber }],
          },
          {
            CertificateCategoryCode: {
              ReferenceDataID: '564190002', //copied from esdc_applicantprimarydocumentchoices.json
              ReferenceDataName: inPersonSINCase.primaryDocuments.documentType,
            },
            ResourceReference: 'Primary Documents',
          },
          {
            CertificateCategoryCode: {
              ReferenceDataID: inPersonSINCase.secondaryDocument.documentType,
            },
            CertificateExpiryDate: {
              date: inPersonSINCase.secondaryDocument.expiryYear + '-' + inPersonSINCase.secondaryDocument.expiryMonth,
            },
            ResourceReference: 'Secondary Documents',
          },
          ...(!inPersonSINCase.currentNameInfo.preferredSameAsDocumentName &&
          inPersonSINCase.currentNameInfo.supportingDocuments.required
            ? inPersonSINCase.currentNameInfo.supportingDocuments.documentTypes.map((docType) => ({
                CertificateCategoryCode: {
                  ReferenceDataID: docType,
                  ReferenceDataName: docType,
                },
                ResourceReference: 'Supporting documents for name change',
              }))
            : []),
          {
            Client: {
              ClientIdentification: [
                {
                  IdentificationID: inPersonSINCase.primaryDocuments.clientNumber,
                },
              ],
              PersonName: [
                {
                  PersonGivenName: inPersonSINCase.primaryDocuments.givenName,
                  PersonSurName: inPersonSINCase.primaryDocuments.lastName,
                },
              ],
              PersonBirthDate: {
                date: inPersonSINCase.primaryDocuments.dateOfBirth,
              },
              PersonSexAtBirthCode: { ReferenceDataID: inPersonSINCase.personalInformation.gender },
            },
            ...(Array.isArray(inPersonSINCase.parentDetails) && inPersonSINCase.parentDetails.length > 0
              ? inPersonSINCase.parentDetails.map(
                  (parent, index) =>
                    !parent.unavailable && {
                      RelatedPerson: [
                        {
                          PersonName: [
                            {
                              PersonGivenName: parent.givenName,
                              PersonSurName: parent.lastName,
                            },
                          ],
                          PersonRelationshipCode: {
                            ReferenceDataName: 'Parent' + (index + 1),
                          },
                        },
                      ],
                    },
                )
              : []),
          },
        ],

        PersonContactInformation: [
          {
            Address: [
              {
                AddressStreet: { StreetName: inPersonSINCase.contactInformation.address },
                AddressCityName: inPersonSINCase.contactInformation.city,
                AddressProvince: {
                  ProvinceCode: {
                    ReferenceDataID: inPersonSINCase.contactInformation.province,
                  },
                },
                AddressCountry: {
                  CountryCode: {
                    ReferenceDataID: inPersonSINCase.contactInformation.country,
                  },
                },
                AddressPostalCode: inPersonSINCase.contactInformation.postalCode,
              },
            ],
            EmailAddress: [{ EmailAddressID: inPersonSINCase.contactInformation.emailAddress }],
            TelephoneNumber: [
              { FullTelephoneNumber: { TelephoneNumberFullID: inPersonSINCase.contactInformation.primaryPhoneNumber } },
              { FullTelephoneNumber: { TelephoneNumberFullID: inPersonSINCase.contactInformation.secondaryPhoneNumber } },
            ],
          },
        ],
        PersonLanguage: [
          {
            CommunicationCategoryCode: {
              ReferenceDataName: 'Correspondence',
            },
            LanguageCode: { ReferenceDataID: inPersonSINCase.contactInformation.preferredLanguage },
            PreferredIndicator: true,
          },
        ],
        PersonBirthLocation: {
          LocationContactInformation: [
            {
              Address: [
                {
                  AddressCityName: inPersonSINCase.birthDetails.city,
                  AddressProvince: {
                    ProvinceCode: {
                      ReferenceDataID: inPersonSINCase.birthDetails.province,
                    },
                  },
                  AddressCountry: {
                    CountryCode: {
                      ReferenceDataID: inPersonSINCase.birthDetails.country,
                    },
                  },
                },
              ],
            },
          ],
        },
        PersonGenderCode: { ReferenceDataID: inPersonSINCase.primaryDocuments.gender },

        PersonBirthDate: {
          date: inPersonSINCase.primaryDocuments.dateOfBirth,
        },
      },
      SINApplicationCategoryCode: { ReferenceDataID: inPersonSINCase.requestDetails.type },
      SINApplicationDetail: [
        {
          ApplicationDetailID: 'SIN Application Submission Scenario',
          ApplicationDetailValue: {
            ValueCode: {
              ReferenceDataID: inPersonSINCase.requestDetails.scenario,
            },
          },
        },
        {
          ApplicationDetailID: 'SIN Confirmation receiving method',
          ApplicationDetailValue: {
            ValueCode: {
              ReferenceDataID: 'Mail', //need to check which value would go here
            },
          },
        },
        {
          ApplicationDetailID: 'Supporting document contains first name',
          ApplicationDetailValue: {
            ValueBoolean:
              !inPersonSINCase.currentNameInfo.preferredSameAsDocumentName && inPersonSINCase.currentNameInfo.firstName !== '',
          },
        },
        {
          ApplicationDetailID: 'Supporting document contains last name',
          ApplicationDetailValue: {
            ValueBoolean:
              !inPersonSINCase.currentNameInfo.preferredSameAsDocumentName && inPersonSINCase.currentNameInfo.lastName !== '',
          },
        },
        {
          ApplicationDetailID: 'is a part of multibirth',
          ApplicationDetailValue: {
            ValueBoolean: inPersonSINCase.birthDetails.fromMultipleBirth,
          },
        },
        {
          ApplicationDetailID: 'Already had a sin',
          ApplicationDetailValue: {
            ValueBoolean: inPersonSINCase.previousSin.hasPreviousSin === '564190000', //Yes value copied from esdc_didtheapplicanteverhadasinnumber
          },
        },
        {
          ApplicationDetailID: 'Previous SIN Number',
          ApplicationDetailValue: {
            ValueString: inPersonSINCase.previousSin.socialInsuranceNumber,
          },
        },
        {
          ApplicationDetailID: 'is registered indian status',
          ApplicationDetailValue: {
            ValueBoolean: false,
          },
        },
        {
          ApplicationDetailID: 'Registered indian status on record',
          ApplicationDetailValue: {
            ValueBoolean: false,
          },
        },
      ],
    },
  };
}

export type BirthDetailsData = {
  country: string;
  province?: string;
  city?: string;
  fromMultipleBirth: boolean;
};

export type ContactInformationData = {
  preferredLanguage: string;
  primaryPhoneNumber: string;
  secondaryPhoneNumber?: string;
  emailAddress?: string;
  country: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
};

export type CurrentNameData =
  | { preferredSameAsDocumentName: true }
  | {
      preferredSameAsDocumentName: false;
      firstName: string;
      middleName?: string;
      lastName: string;
      supportingDocuments:
        | { required: false }
        | {
            required: true;
            documentTypes: string[];
          };
    };

export type ParentDetailsData = (
  | { unavailable: true }
  | {
      unavailable: false;
      givenName: string;
      lastName: string;
      birthLocation: {
        country: string;
        province?: string;
        city?: string;
      };
    }
)[];

export type PersonalInfoData = {
  firstNamePreviouslyUsed?: string[];
  lastNameAtBirth: string;
  lastNamePreviouslyUsed?: string[];
  gender: string;
};

export type PreviousSinData = {
  hasPreviousSin: string;
  socialInsuranceNumber?: string;
};

export type PrimaryDocumentData = {
  citizenshipDate: string;
  clientNumber: string;
  currentStatusInCanada: string;
  dateOfBirth: string;
  documentType: string;
  gender: string;
  givenName: string;
  lastName: string;
  registrationNumber: string;
};

export type PrivacyStatementData = {
  agreedToTerms: true;
};

export type RequestDetailsData = {
  type: string;
  scenario: string;
};

export type SecondaryDocumentData = {
  documentType: string;
  expiryMonth: number;
  expiryYear: number;
};

export type InPersonSinApplication = {
  birthDetails: BirthDetailsData;
  contactInformation: ContactInformationData;
  currentNameInfo: CurrentNameData;
  parentDetails: ParentDetailsData;
  personalInformation: PersonalInfoData;
  previousSin: PreviousSinData;
  primaryDocuments: PrimaryDocumentData;
  privacyStatement: PrivacyStatementData;
  requestDetails: RequestDetailsData;
  secondaryDocument: SecondaryDocumentData;
};
