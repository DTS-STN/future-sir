import { getApplicantPrimaryDocumentChoiceById } from '~/.server/domain/person-case/services/applicant-primary-document-service';
import { getApplicantStatusInCanadaChoicesById } from '~/.server/domain/person-case/services/applicant-status-in-canada-service';
import { getApplicantSupportingDocumentTypesById } from '~/.server/domain/person-case/services/applicant-supporting-document-service';
import type {
  SubmitSinApplicationRequest,
  SubmitSinApplicationResponse,
} from '~/.server/domain/sin-application/sin-application-models';
import type {
  CertificateType,
  ContactInformationType,
  LegalStatusType,
  PersonBirthDate,
  PersonBirthLocation,
  PersonGenderCode,
  PersonLanguage,
  PersonNameType,
  SinApplicationCategoryCode,
  SinApplicationDetail,
  SinApplicationRequest,
  SinApplicationResponse,
} from '~/.server/shared/api/interop';

/**
 * Maps the SubmitSinApplicationRequest to SinApplicationRequest (NIEM).
 *
 * @param submitSinApplicationRequest - The request object for submitting a SIN application.
 * @returns The mapped SIN application request.
 */
export function mapSubmitSinApplicationRequestToSinApplicationRequest(
  submitSinApplicationRequest: SubmitSinApplicationRequest,
): SinApplicationRequest {
  const helpers = createSubmitSinApplicationRequestToSinApplicationRequestMappingHelpers(submitSinApplicationRequest);

  return {
    SystemCredential: 'KwisatzHaderach',
    SINApplication: {
      Applicant: {
        ClientLegalStatus: helpers.getApplicantClientLegalStatus(),
        PersonName: helpers.getApplicantPersonName(),
        Certificate: helpers.getApplicantCertificate(),
        PersonContactInformation: helpers.getApplicantPersonContactInformation(),
        PersonLanguage: helpers.getApplicantPersonPersonLanguage(),
        PersonBirthLocation: helpers.getApplicantPersonPersonBirthLocation(),
        PersonGenderCode: helpers.getApplicantPersonGenderCode(),
        PersonBirthDate: helpers.getApplicantPersonBirthDate(),
      },
      SINApplicationCategoryCode: helpers.getSINApplicationCategoryCode(),
      SINApplicationDetail: helpers.getSINApplicationDetail(),
    },
  };
}

/**
 * Creates helper functions for mapping SubmitSinApplicationRequest to SinApplicationRequest.
 *
 * @param submitSinApplicationRequest - The request object for submitting a SIN application.
 * @returns An object containing helper functions for mapping.
 */
function createSubmitSinApplicationRequestToSinApplicationRequestMappingHelpers(
  submitSinApplicationRequest: SubmitSinApplicationRequest,
) {
  const {
    birthDetails,
    contactInformation,
    currentNameInfo,
    parentDetails,
    personalInformation,
    previousSin,
    primaryDocuments,
    requestDetails,
    secondaryDocument,
  } = submitSinApplicationRequest;

  return {
    getApplicantClientLegalStatus(): LegalStatusType {
      return {
        Certificate: [
          {
            CertificateIssueDate: { date: primaryDocuments.citizenshipDate },
            CertificateCategoryCode: {
              ReferenceDataID: '564190000', // copied from esdc_applicantstatusincanada for Canadian citizen
              ReferenceDataName: getApplicantStatusInCanadaChoicesById(primaryDocuments.currentStatusInCanada).nameEn,
            },
          },
        ],
      };
    },

    getApplicantPersonName(): PersonNameType[] {
      const applicantPersonName: PersonNameType[] = [];

      applicantPersonName.push({
        PersonNameCategoryCode: {
          ReferenceDataName: 'Legal',
        },
        PersonGivenName: currentNameInfo.preferredSameAsDocumentName
          ? primaryDocuments.givenName
          : currentNameInfo.firstName + ' ' + currentNameInfo.middleName,
        PersonSurName: currentNameInfo.preferredSameAsDocumentName ? primaryDocuments.lastName : currentNameInfo.lastName,
      });

      applicantPersonName.push({
        PersonNameCategoryCode: {
          ReferenceDataName: 'at birth',
        },
        PersonSurName: personalInformation.lastNameAtBirth,
      });

      if (personalInformation.firstNamePreviouslyUsed && personalInformation.firstNamePreviouslyUsed.length > 0) {
        applicantPersonName.push(
          ...personalInformation.firstNamePreviouslyUsed.map((name) => ({
            PersonGivenName: name,
            PersonNameCategoryCode: {
              ReferenceDataName: 'Alternate',
            },
          })),
        );
      }

      if (personalInformation.lastNamePreviouslyUsed && personalInformation.lastNamePreviouslyUsed.length > 0) {
        applicantPersonName.push(
          ...personalInformation.lastNamePreviouslyUsed.map((name) => ({
            PersonSurName: name,
            PersonNameCategoryCode: {
              ReferenceDataName: 'Alternate',
            },
          })),
        );
      }

      return applicantPersonName;
    },

    getApplicantCertificate(): CertificateType[] {
      const applicantCertificate: CertificateType[] = [];

      applicantCertificate.push({
        ResourceReference: 'Documents',
        CertificateIdentification: [{ IdentificationID: primaryDocuments.registrationNumber }],
      });

      applicantCertificate.push({
        CertificateCategoryCode: {
          ReferenceDataID: '564190002', //copied from esdc_applicantprimarydocumentchoices.json
          ReferenceDataName: getApplicantPrimaryDocumentChoiceById(primaryDocuments.documentType).nameEn,
        },
        ResourceReference: 'Primary Documents',
      });

      applicantCertificate.push({
        CertificateCategoryCode: {
          ReferenceDataID: secondaryDocument.documentType,
        },
        CertificateExpiryDate: {
          date: secondaryDocument.expiryYear + '-' + secondaryDocument.expiryMonth,
        },
        ResourceReference: 'Secondary Documents',
      });

      if (currentNameInfo.supportingDocuments?.documentTypes && currentNameInfo.supportingDocuments.documentTypes.length > 0) {
        applicantCertificate.push(
          ...currentNameInfo.supportingDocuments.documentTypes.map((docType) => ({
            CertificateCategoryCode: {
              ReferenceDataID: docType,
              ReferenceDataName: getApplicantSupportingDocumentTypesById(docType).nameEn,
            },
            ResourceReference: 'Supporting documents for name change',
          })),
        );
      }

      applicantCertificate.push({
        Client: {
          ClientIdentification: [
            {
              IdentificationID: primaryDocuments.clientNumber,
            },
          ],
          PersonName: [
            {
              PersonGivenName: primaryDocuments.givenName,
              PersonSurName: primaryDocuments.lastName,
            },
          ],
          PersonBirthDate: {
            date: primaryDocuments.dateOfBirth,
          },
          PersonSexAtBirthCode: { ReferenceDataID: personalInformation.gender },
        },
      });

      const availableParentDetails = parentDetails.filter((parent) => parent.unavailable === false);

      if (availableParentDetails.length > 0) {
        applicantCertificate.push({
          RelatedPerson: availableParentDetails.map((parent, index) => ({
            PersonRelationshipCode: {
              ReferenceDataName: 'Parent' + (index + 1),
            },
            PersonName: [
              {
                PersonGivenName: parent.givenName,
                PersonSurName: parent.lastName,
              },
            ],
            PersonBirthLocation: {
              LocationContactInformation: [
                {
                  Address: [
                    {
                      AddressCityName: parent.birthLocation.city,
                      AddressProvince: {
                        ProvinceCode: {
                          ReferenceDataID: parent.birthLocation.province,
                        },
                      },
                      AddressCountry: {
                        CountryCode: {
                          ReferenceDataID: parent.birthLocation.country,
                        },
                      },
                    },
                  ],
                },
              ],
            },
          })),
        });
      }

      return applicantCertificate;
    },

    getApplicantPersonContactInformation(): ContactInformationType[] {
      return [
        {
          Address: [
            {
              AddressStreet: { StreetName: contactInformation.address },
              AddressCityName: contactInformation.city,
              AddressProvince: {
                ProvinceCode: {
                  ReferenceDataID: contactInformation.province,
                },
              },
              AddressCountry: {
                CountryCode: {
                  ReferenceDataID: contactInformation.country,
                },
              },
              AddressPostalCode: contactInformation.postalCode,
            },
          ],
          EmailAddress: [{ EmailAddressID: contactInformation.emailAddress }],
          TelephoneNumber: [
            {
              FullTelephoneNumber: {
                TelephoneNumberFullID: contactInformation.primaryPhoneNumber,
              },
            },
            {
              FullTelephoneNumber: {
                TelephoneNumberFullID: contactInformation.secondaryPhoneNumber,
              },
            },
          ],
        },
      ];
    },

    getApplicantPersonPersonLanguage(): PersonLanguage[] {
      return [
        {
          CommunicationCategoryCode: {
            ReferenceDataName: 'Correspondence',
          },
          LanguageCode: { ReferenceDataID: contactInformation.preferredLanguage },
          PreferredIndicator: true,
        },
      ];
    },

    getApplicantPersonPersonBirthLocation(): PersonBirthLocation {
      return {
        LocationContactInformation: [
          {
            Address: [
              {
                AddressCityName: birthDetails.city,
                AddressProvince: {
                  ProvinceCode: {
                    ReferenceDataID: birthDetails.province,
                  },
                },
                AddressCountry: {
                  CountryCode: {
                    ReferenceDataID: birthDetails.country,
                  },
                },
              },
            ],
          },
        ],
      };
    },

    getApplicantPersonGenderCode(): PersonGenderCode {
      return {
        ReferenceDataID: primaryDocuments.gender,
      };
    },

    getApplicantPersonBirthDate(): PersonBirthDate {
      return {
        date: primaryDocuments.dateOfBirth,
      };
    },

    getSINApplicationCategoryCode(): SinApplicationCategoryCode {
      return {
        ReferenceDataID: requestDetails.type,
      };
    },

    getSINApplicationDetail(): SinApplicationDetail[] {
      const sinApplicationDetail: SinApplicationDetail[] = [];

      sinApplicationDetail.push({
        ApplicationDetailID: 'SIN Application Submission Scenario',
        ApplicationDetailValue: {
          ValueCode: {
            ReferenceDataID: requestDetails.scenario,
          },
        },
      });

      sinApplicationDetail.push({
        ApplicationDetailID: 'SIN Confirmation receiving method',
        ApplicationDetailValue: {
          ValueCode: {
            ReferenceDataID: 'Mail', //Mail or Email
          },
        },
      });

      sinApplicationDetail.push({
        ApplicationDetailID: 'Supporting document contains first name',
        ApplicationDetailValue: {
          ValueBoolean:
            currentNameInfo.preferredSameAsDocumentName === false &&
            typeof currentNameInfo.firstName === 'string' &&
            currentNameInfo.firstName.length > 0,
        },
      });

      sinApplicationDetail.push({
        ApplicationDetailID: 'Supporting document contains last name',
        ApplicationDetailValue: {
          ValueBoolean:
            currentNameInfo.preferredSameAsDocumentName === false &&
            typeof currentNameInfo.lastName === 'string' &&
            currentNameInfo.lastName.length > 0,
        },
      });

      sinApplicationDetail.push({
        ApplicationDetailID: 'is a part of multibirth',
        ApplicationDetailValue: {
          ValueBoolean: birthDetails.fromMultipleBirth,
        },
      });

      sinApplicationDetail.push({
        ApplicationDetailID: 'Already had a sin',
        ApplicationDetailValue: {
          ValueBoolean: previousSin.hasPreviousSin === '564190000', //Yes value copied from esdc_didtheapplicanteverhadasinnumber
        },
      });

      sinApplicationDetail.push({
        ApplicationDetailID: 'Previous SIN Number',
        ApplicationDetailValue: {
          ValueString: previousSin.socialInsuranceNumber,
        },
      });

      sinApplicationDetail.push({
        ApplicationDetailID: 'is registered indian status',
        ApplicationDetailValue: {
          ValueBoolean: false,
        },
      });

      sinApplicationDetail.push({
        ApplicationDetailID: 'Registered indian status on record',
        ApplicationDetailValue: {
          ValueBoolean: false,
        },
      });

      return sinApplicationDetail;
    },
  };
}

/**
 * Maps the SinApplicationResponse (NIEM) to SubmitSinApplicationResponse.
 *
 * @param sinApplicationResponse - The response object from the SIN application.
 * @returns The mapped submit SIN application response.
 */
export function mapSinApplicationResponseToSubmitSinApplicationResponse(
  sinApplicationResponse: SinApplicationResponse,
): SubmitSinApplicationResponse {
  return {
    identificationId: sinApplicationResponse.SINApplication?.SINApplicationIdentification?.IdentificationID,
  };
}
