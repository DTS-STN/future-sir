import type {
  SubmitSinApplicationRequest,
  SubmitSinApplicationResponse,
} from '~/.server/domain/sin-application/sin-application-models';
import { serverEnvironment } from '~/.server/environment';
import type {
  CertificateType,
  CountryType,
  EmailAddressType,
  LegalStatusType,
  PersonBirthDate,
  PersonBirthLocation,
  PersonContactInformation,
  PersonGenderCode,
  PersonLanguage,
  PersonNameType,
  ProvinceType,
  RelatedPerson,
  SinApplicationCategoryCode,
  SinApplicationDetail,
  SinApplicationRequest,
  SinApplicationResponse,
  TelephoneNumberType,
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
        ClientLegalStatus: helpers.mapApplicantClientLegalStatus(),
        PersonName: helpers.mapApplicantPersonName(),
        Certificate: [
          helpers.mapApplicantCertificatePID(), //
          helpers.mapApplicantCertificateSID(),
        ],
        PersonContactInformation: helpers.mapApplicantPersonContactInformation(),
        PersonLanguage: helpers.mapApplicantPersonPersonLanguage(),
        PersonBirthLocation: helpers.mapApplicantPersonPersonBirthLocation(),
        PersonGenderCode: helpers.mapApplicantPersonGenderCode(),
        PersonBirthDate: helpers.mapApplicantPersonBirthDate(),
        RelatedPerson: helpers.mapApplicantRelatedPerson(),
      },
      SINApplicationCategoryCode: helpers.mapSINApplicationCategoryCode(),
      SINApplicationDetail: helpers.mapSINApplicationDetail(),
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

  function getApplicantFirstName(): string {
    if (currentNameInfo.preferredSameAsDocumentName) return primaryDocuments.givenName;
    return currentNameInfo.firstName + ' ' + currentNameInfo.middleName;
  }

  function getApplicantLastName(): string {
    if (currentNameInfo.preferredSameAsDocumentName) return primaryDocuments.lastName;
    return currentNameInfo.lastName;
  }

  function getCountryAlphaCode(countryId: string): string | undefined {
    const { alphaCode } = getCountryById(countryId);

    // must use "CA" or "US" REGARDLESS for country
    if (alphaCode === 'CA' || alphaCode === 'US') {
      return alphaCode;
    }

    return undefined;
  }

  function getCountryType(country: string): CountryType | undefined {
    const alphaCode = getCountryAlphaCode(country);

    if (!alphaCode) {
      return undefined;
    }

    return {
      CountryCode: {
        ReferenceDataID: alphaCode,
      },
    };
  }

  function getProvinceType(country: string, province: string | undefined): ProvinceType | undefined {
    if (!province) {
      return undefined;
    }

    const alphaCode = getCountryAlphaCode(country);

    if (alphaCode === 'CA') {
      const prov = getProvinceById(province);
      return {
        ProvinceCode: {
          ReferenceDataID: prov.alphaCode,
          ReferenceDataName: prov.nameEn,
        },
      };
    }

    return {
      ProvinceCode: {
        ReferenceDataName: province,
      },
    };
  }

  function mapApplicantClientLegalStatus(): LegalStatusType {
    return {
      Certificate: [
        {
          CertificateEffectiveDate: {
            date: primaryDocuments.citizenshipDate,
          },
        },
      ],
    };
  }

  function mapApplicantPersonName(): PersonNameType[] {
    const applicantPersonName: PersonNameType[] = [];

    applicantPersonName.push({
      PersonNameCategoryCode: {
        ReferenceDataName: 'Legal',
      },
      PersonGivenName: getApplicantFirstName(),
      PersonSurName: getApplicantLastName(),
    });

    applicantPersonName.push({
      PersonNameCategoryCode: {
        ReferenceDataName: 'at birth',
      },
      PersonSurName: personalInformation.lastNameAtBirth,
    });

    // TODO: PersonFullName should always be send with ReferenceDataName: 'Native'
    applicantPersonName.push({
      PersonFullName: getApplicantFirstName() + ' ' + getApplicantLastName(),
      PersonNameCategoryCode: {
        ReferenceDataName: 'Native',
      },
    });

    // TODO: Remove it later
    // FirstNamePReviouslyUsed and LastNamePreviouslyUsed must be send together with  ReferenceDataName: 'Alternate'
    applicantPersonName.push({
      PersonGivenName:
        personalInformation.firstNamePreviouslyUsed && personalInformation.firstNamePreviouslyUsed.length > 0
          ? personalInformation.firstNamePreviouslyUsed.join(' ')
          : '',
      PersonNameCategoryCode: {
        ReferenceDataName: 'Alternate',
      },
      PersonSurName:
        personalInformation.lastNamePreviouslyUsed && personalInformation.lastNamePreviouslyUsed.length > 0
          ? personalInformation.lastNamePreviouslyUsed.join(' ')
          : '',
    });

    // TODO: Enable it later
    // FirstNamePReviouslyUsed and LastNamePreviouslyUsed must be send together with  ReferenceDataName: 'Alternate'

    // if (personalInformation.firstNamePreviouslyUsed && personalInformation.firstNamePreviouslyUsed.length > 0) {
    //  applicantPersonName.push(
    //    ...personalInformation.firstNamePreviouslyUsed.map((name) => ({
    //      PersonGivenName: name,
    //      PersonNameCategoryCode: {
    //        ReferenceDataName: 'Alternate',
    //      },
    //    })),
    //  );
    // }

    // if (personalInformation.lastNamePreviouslyUsed && personalInformation.lastNamePreviouslyUsed.length > 0) {
    //  applicantPersonName.push(
    //    ...personalInformation.lastNamePreviouslyUsed.map((name) => ({
    //      PersonSurName: name,
    //      PersonNameCategoryCode: {
    //        ReferenceDataName: 'Alternate',
    //      },
    //    })),
    //  );
    //}

    return applicantPersonName;
  }

  function mapApplicantCertificatePID(): CertificateType {
    return {
      CertificateCategoryCode: {
        // TODO: Fix later, should use primaryDocuments.documentType
        ReferenceDataID: serverEnvironment.PP_APPLICANT_PRIMARY_DOCUMENT_TYPE_CERTIFICATE_CANADIAN_CITIZENSHIP_CODE,
        ReferenceDataName: 'PID',
      },
      ResourceReference: 'Primary Document Citizenship PID.pdf', // doc upload disabled
      Client: {
        PersonName: [
          {
            PersonGivenName: primaryDocuments.givenName,
            PersonSurName: primaryDocuments.lastName,
          },
        ],
        PersonBirthDate: mapApplicantPersonBirthDate(),
        PersonBirthLocation: {
          LocationContactInformation: [
            {
              Address: [
                {
                  AddressCityName: birthDetails.city,
                  AddressProvince: getProvinceType(birthDetails.country, birthDetails.province),
                  AddressCountry: getCountryType(birthDetails.country),
                },
              ],
            },
          ],
        },
        PersonGenderCode: {
          ReferenceDataID: primaryDocuments.gender,
        },
      },
      CertificateEffectiveDate: {
        date: primaryDocuments.citizenshipDate,
      },
      CertificateIssueDate: {
        date: primaryDocuments.citizenshipDate,
      },
      // TODO: One epmty related person always needed :shrug
      RelatedPerson: [
        {
          PersonName: [
            {
              PersonGivenName: '',
              PersonSurName: '',
            },
          ],
          PersonRelationshipCode: {
            ReferenceDataName: 'Parent 1',
          },
        },
      ],
    };
  }

  function mapApplicantCertificateSID(): CertificateType {
    return {
      CertificateCategoryCode: {
        ReferenceDataID: secondaryDocument.documentType,
        ReferenceDataName: 'SD',
      },
      ResourceReference: 'Secondary Document Passport SD.pdf', // doc upload disabled
      CertificateExpiryDate: {
        date: `${secondaryDocument.expiryYear}-${secondaryDocument.expiryMonth}`,
      },
    };
  }

  function mapApplicantRelatedPerson(): RelatedPerson[] {
    const availableParents = parentDetails.filter((parent) => parent.unavailable === false);

    if (availableParents.length === 0) {
      // TODO: One epmty related person always needed :shrug
      return [
        {
          PersonName: [
            {
              PersonGivenName: '',
              PersonSurName: '',
            },
          ],
          PersonRelationshipCode: {
            ReferenceDataName: 'Parent 1',
          },
        },
      ];
    }

    return availableParents.map<RelatedPerson>((parent, index) => {
      const relatedPerson: RelatedPerson = {
        PersonRelationshipCode: {
          ReferenceDataName: `Parent ${(index + 1).toString()}`,
        },
        PersonName: [
          {
            PersonGivenName: parent.givenName,
            PersonSurName: parent.lastName,
          },
        ],
      };

      return relatedPerson;

      // TODO: Parent details birth location is not supported, maybe later!?
      // const birthLocation = parent.birthLocation;

      // if (!birthLocation.city && !birthLocation.country && !birthLocation.province) {
      //   // birth location not set
      //   return relatedPerson;
      // }

      // return {
      //   ...relatedPerson,
      //   PersonBirthLocation: {
      //     LocationContactInformation: [
      //       {
      //         Address: [
      //           {
      //             AddressCityName: birthLocation.city,
      //             AddressProvince: getProvinceType(birthLocation.country, birthLocation.province),
      //             AddressCountry: getCountryType(birthLocation.country),
      //           },
      //         ],
      //       },
      //     ],
      //   },
      // };
    });
  }

  function mapApplicantPersonContactInformation(): PersonContactInformation[] {
    return [
      {
        Address: [
          {
            AddressCityName: contactInformation.city,
            AddressCountry: getCountryType(contactInformation.country),
            AddressPostalCode: contactInformation.postalCode,
            AddressProvince: getProvinceType(contactInformation.country, contactInformation.province),
            AddressRecipientName: `${getApplicantFirstName()} ${getApplicantLastName()}`,
            AddressSecondaryUnitText: '', // field doesn't exists
            AddressStreet: {
              StreetName: contactInformation.address,
              StreetNumberText: '', // field doesn't exists
            },
          },
        ],
        EmailAddress: mapApplicantPersonContactInformationEmailAddress(),
        TelephoneNumber: mapApplicantPersonContactInformationTelephoneNumber(),
      },
    ];
  }

  function mapApplicantPersonContactInformationEmailAddress(): EmailAddressType[] {
    return [
      {
        EmailAddressID: contactInformation.emailAddress ?? '',
      },
    ];
  }

  function mapApplicantPersonContactInformationTelephoneNumber(): TelephoneNumberType[] {
    const telephoneNumber: TelephoneNumberType[] = [];

    telephoneNumber.push({
      TelephoneNumberCategoryCode: {
        ReferenceDataName: 'Primary',
      },
      FullTelephoneNumber: {
        TelephoneNumberFullID: contactInformation.primaryPhoneNumber,
      },
    });

    if (contactInformation.secondaryPhoneNumber) {
      telephoneNumber.push({
        TelephoneNumberCategoryCode: {
          ReferenceDataName: 'Secondary',
        },
        FullTelephoneNumber: {
          TelephoneNumberFullID: contactInformation.secondaryPhoneNumber,
        },
      });
    }

    return telephoneNumber;
  }

  function mapApplicantPersonPersonLanguage(): PersonLanguage[] {
    return [
      {
        CommunicationCategoryCode: {
          ReferenceDataName: 'Correspondence',
        },
        LanguageCode: {
          ReferenceDataID:
            contactInformation.preferredLanguage === serverEnvironment.PP_LANGUAGE_OF_CORRESPONDENCE_FRENCH_CODE //
              ? 'FR'
              : 'EN',
        },
        PreferredIndicator: true,
      },
    ];
  }

  function mapApplicantPersonPersonBirthLocation(): PersonBirthLocation {
    const addressCityName = birthDetails.city;
    const addressProvince = getProvinceType(birthDetails.country, birthDetails.province);
    const addressCountry = getCountryType(birthDetails.country);

    if (!addressCityName && !addressProvince && !addressCountry) {
      // no address
      return {
        LocationContactInformation: [],
      };
    }

    return {
      LocationContactInformation: [
        {
          Address: [
            {
              AddressCityName: addressCityName,
              AddressProvince: addressProvince,
              AddressCountry: addressCountry,
            },
          ],
        },
      ],
    };
  }

  function mapApplicantPersonGenderCode(): PersonGenderCode {
    return {
      ReferenceDataID: primaryDocuments.gender,
    };
  }

  function mapApplicantPersonBirthDate(): PersonBirthDate {
    return {
      date: primaryDocuments.dateOfBirth,
    };
  }

  function mapSINApplicationCategoryCode(): SinApplicationCategoryCode {
    return {
      ReferenceDataID: requestDetails.type,
    };
  }

  function mapSINApplicationDetail(): SinApplicationDetail[] {
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
          ReferenceDataID: serverEnvironment.PP_SIN_CONFIRMATION_RECEIVING_METHOD_BY_MAIL_CODE,
        },
      },
    });

    sinApplicationDetail.push({
      ApplicationDetailID: 'Supporting document contains first name',
      ApplicationDetailValue: {
        ValueBoolean: currentNameInfo.firstName !== undefined && currentNameInfo.firstName.length > 0,
      },
    });

    sinApplicationDetail.push({
      ApplicationDetailID: 'Supporting document contains last name',
      ApplicationDetailValue: {
        ValueBoolean: currentNameInfo.lastName !== undefined && currentNameInfo.lastName.length > 0,
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
        ValueString: previousSin.socialInsuranceNumber ?? '',
      },
    });

    sinApplicationDetail.push({
      ApplicationDetailID: 'is registered indian status',
      ApplicationDetailValue: {
        ValueBoolean: false,
      },
    });

    sinApplicationDetail.push({
      ApplicationDetailID: 'Register indian status on record',
      ApplicationDetailValue: {
        ValueBoolean: false,
      },
    });

    return sinApplicationDetail;
  }

  return {
    mapApplicantCertificatePID,
    mapApplicantCertificateSID,
    mapApplicantClientLegalStatus,
    mapApplicantPersonBirthDate,
    mapApplicantPersonContactInformation,
    mapApplicantPersonGenderCode,
    mapApplicantPersonName,
    mapApplicantPersonPersonBirthLocation,
    mapApplicantPersonPersonLanguage,
    mapApplicantRelatedPerson,
    mapSINApplicationCategoryCode,
    mapSINApplicationDetail,
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
  const identificationArray = sinApplicationResponse.SINApplication?.SINApplicationIdentification;
  if (!identificationArray || !Array.isArray(identificationArray) || identificationArray[0]?.IdentificationID === undefined) {
    // TODO ::: GjB ::: it's not clear if this potentially undefined value is intentional; the OpenAPI spec allows for it, so we have to check for it
    throw new AppError('Failed to map SIN application response; IdentificationID is undefined');
  }

  return {
    identificationId: identificationArray[0]?.IdentificationID,
  };
}
