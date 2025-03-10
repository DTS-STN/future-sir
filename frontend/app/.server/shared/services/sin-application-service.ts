import { serverEnvironment } from '~/.server/environment';
import type { SinApplicationRequest } from '~/.server/shared/api/interop';
import type { InPersonSinApplication } from '~/routes/protected/person-case/types';

export function mapInPersonSINCaseToSinApplicationRequest(
  inPersonSINCase: Required<InPersonSinApplication>,
): SinApplicationRequest {
  // TODO: Remove after mapping is done
  // Need to recheck mapping for below fields
  // inPersonSINCase.primaryDocuments.currentStatusInCanada -> confirm if the Reference data id is correct
  // inPersonSINCase.currentNameInfo.middleName -> conacatenate with first name field for given name
  // How are we mapping "SIN Confirmation receiving method" to inPersonSINCase? Hardcoded to 'Email' for now

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
                ReferenceDataName: inPersonSINCase.primaryDocuments.currentStatusInCanada, //confirm if the Canadian citizen born outside Canada is Certificate of ClientLegalStatus OR just Certificate
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
            CertificateCategoryCode: {
              ReferenceDataID: '1', //confirm if the Reference data id is correct for Canadian citizen born outside Canada
              ReferenceDataName: inPersonSINCase.primaryDocuments.currentStatusInCanada, //confirm if the Canadian citizen born outside Canada is Certificate of ClientLegalStatus OR just Certificate
            },
            ResourceReference: 'Documents',
            CertificateIdentification: [{ IdentificationID: inPersonSINCase.primaryDocuments.registrationNumber }], //confirm if reference id is for Canadian citizen born outside Canada or separate value
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
                AddressStreet: { StreetName: 'QC' },
                AddressCityName: inPersonSINCase.contactInformation.city,
                AddressProvince: {
                  ProvinceCode: {
                    ReferenceDataID:
                      inPersonSINCase.contactInformation.country === serverEnvironment.PP_CANADA_COUNTRY_CODE
                        ? inPersonSINCase.contactInformation.province
                        : undefined,
                  },
                },
                AddressCountry: {
                  CountryCode: {
                    ReferenceDataID:
                      inPersonSINCase.contactInformation.country === serverEnvironment.PP_CANADA_COUNTRY_CODE ? 'CA' : 'US',
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
                      ReferenceDataID:
                        inPersonSINCase.birthDetails.country === serverEnvironment.PP_CANADA_COUNTRY_CODE
                          ? inPersonSINCase.birthDetails.province
                          : undefined,
                    },
                  },
                  AddressCountry: {
                    CountryCode: {
                      ReferenceDataID:
                        inPersonSINCase.birthDetails.country === serverEnvironment.PP_CANADA_COUNTRY_CODE ? 'CA' : 'US',
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
              ReferenceDataID: 'Email', //need to check which value would go here
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
