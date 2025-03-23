export type SinCaseBirthDetailsDto = {
  country: string;
  province?: string;
  city?: string;
  fromMultipleBirth: boolean;
};

export type SinCaseContactInformationDto = {
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

export type SinCaseCurrentNameDto =
  | {
      preferredSameAsDocumentName: true;
      firstName?: undefined;
      middleName?: undefined;
      lastName?: undefined;
      supportingDocuments?: undefined;
    }
  | {
      preferredSameAsDocumentName: false;
      firstName: string;
      middleName?: string;
      lastName: string;
      supportingDocuments:
        | {
            required: false;
            documentTypes?: undefined;
          }
        | {
            required: true;
            documentTypes: string[];
          };
    };

export type SinCaseParentDetailsDto = (
  | {
      unavailable: true;
      givenName?: undefined;
      lastName?: undefined;
      birthLocation?: undefined;
    }
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

export type SinCasePersonalInfoDto = {
  firstNamePreviouslyUsed?: string[];
  lastNameAtBirth: string;
  lastNamePreviouslyUsed?: string[];
  gender: string;
};

export type SinCasePreviousSinDto = {
  hasPreviousSin: string;
  socialInsuranceNumber?: string;
};

export type SinCasePrimaryDocumentDto = {
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

export type SinCasePrivacyStatementDto = {
  agreedToTerms: true;
};

export type SinCaseRequestDetailsDto = {
  type: string;
  scenario: string;
};

export type SinCaseSecondaryDocumentDto = {
  documentType: string;
  expiryMonth: string;
  expiryYear: string;
};

export type SinCaseDto = {
  caseId: string;
  birthDetails: SinCaseBirthDetailsDto;
  contactInformation: SinCaseContactInformationDto;
  currentNameInfo: SinCaseCurrentNameDto;
  parentDetails: SinCaseParentDetailsDto;
  personalInformation: SinCasePersonalInfoDto;
  previousSin: SinCasePreviousSinDto;
  primaryDocuments: SinCasePrimaryDocumentDto;
  privacyStatement: SinCasePrivacyStatementDto;
  requestDetails: SinCaseRequestDetailsDto;
  secondaryDocument: SinCaseSecondaryDocumentDto;
};
