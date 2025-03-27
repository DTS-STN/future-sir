import { getApplicantPrimaryDocumentChoiceById } from '~/.server/domain/person-case/services/applicant-primary-document-service';
import { getApplicantStatusInCanadaChoicesById } from '~/.server/domain/person-case/services/applicant-status-in-canada-service';
import { getApplicantSupportingDocumentTypesById } from '~/.server/domain/person-case/services/applicant-supporting-document-service';
import type {
  SubmitSinApplicationRequest,
  SubmitSinApplicationResponse,
} from '~/.server/domain/sin-application/sin-application-models';
import { serverEnvironment } from '~/.server/environment';
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
import { getCountryById } from '~/.server/shared/services/country-service';
import { getProvinceById } from '~/.server/shared/services/province-service';
import { AppError } from '~/errors/app-error';

/**
 * Maps the SubmitSinApplicationRequest to SinApplicationRequest (NIEM).
 *
 * @param submitSinApplicationRequest - The request object for submitting a SIN application.
 * @param idToken - The ID token for authentication.
 * @returns The mapped SIN application request.
 */
export function mapSubmitSinApplicationRequestToSinApplicationRequest(
  submitSinApplicationRequest: SubmitSinApplicationRequest,
  idToken: string,
): SinApplicationRequest {
  const helpers = createSubmitSinApplicationRequestToSinApplicationRequestMappingHelpers(submitSinApplicationRequest);

  return {
    SystemCredential: idToken,
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

function getCountry(country?: string): string | undefined {
  return country && (getCountryById(country).alphaCode === 'CA' || getCountryById(country).alphaCode === 'US') // must use "CA" or "US" REGARDLESS for country
    ? getCountryById(country).alphaCode
    : undefined;
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
              ReferenceDataID: serverEnvironment.PP_APPLICANT_STATUS_IN_CANADA_CANADIAN_CITIZEN_CODE,
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
          ReferenceDataID: serverEnvironment.PP_APPLICANT_PRIMARY_DOCUMENT_TYPE_CERTIFICATE_CANADIAN_CITIZENSHIP_CODE,
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
                          ReferenceDataID:
                            parent.birthLocation.province && getCountry(parent.birthLocation.country) === 'CA'
                              ? getProvinceById(parent.birthLocation.province).alphaCode
                              : undefined,
                          ReferenceDataName:
                            getCountry(parent.birthLocation.country) === 'US' ? parent.birthLocation.province : undefined,
                        },
                      },
                      AddressCountry: {
                        CountryCode: {
                          ReferenceDataID: getCountry(parent.birthLocation.country),
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
                  ReferenceDataID:
                    contactInformation.province && getCountry(contactInformation.country) === 'CA'
                      ? getProvinceById(contactInformation.province).alphaCode
                      : undefined,
                  ReferenceDataName: getCountry(contactInformation.country) === 'US' ? contactInformation.province : undefined,
                },
              },
              AddressCountry: {
                CountryCode: {
                  ReferenceDataID: getCountry(contactInformation.country),
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
                    ReferenceDataID:
                      birthDetails.province && getCountry(birthDetails.country) === 'CA'
                        ? getProvinceById(birthDetails.province).alphaCode
                        : undefined,
                    ReferenceDataName: getCountry(birthDetails.country) === 'US' ? birthDetails.province : undefined,
                  },
                },
                AddressCountry: {
                  CountryCode: {
                    ReferenceDataID: getCountryById(birthDetails.country).alphaCode === 'CA' ? 'CA' : 'US', // must use "CA" or "US" REGARDLESS for country
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
            ReferenceDataID: serverEnvironment.PP_SIN_CONFIRMATION_RECEIVING_METHOD_CODE,
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
          ValueBoolean: previousSin.hasPreviousSin === serverEnvironment.PP_HAS_HAD_PREVIOUS_SIN_CODE, //code for Yes value
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
  if (sinApplicationResponse.SINApplication?.SINApplicationIdentification?.IdentificationID === undefined) {
    // TODO ::: GjB ::: it's not clear if this potentially undefined value is intentional; the OpenAPI spec allows for it, so we have to check for it
    throw new AppError('Failed to map SIN application response; IdentificationID is undefined');
  }

  return {
    identificationId: sinApplicationResponse.SINApplication.SINApplicationIdentification.IdentificationID,
  };
}
