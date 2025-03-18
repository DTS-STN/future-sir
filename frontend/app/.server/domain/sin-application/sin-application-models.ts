export type SubmitSinApplicationRequest = {
  birthDetails: SubmitSinApplicationRequestBirthDetails;
  contactInformation: SubmitSinApplicationRequestContactInformation;
  currentNameInfo: SubmitSinApplicationRequestCurrentName;
  parentDetails: SubmitSinApplicationRequestParentDetails;
  personalInformation: SubmitSinApplicationRequestPersonalInfo;
  previousSin: SubmitSinApplicationRequestPreviousSin;
  primaryDocuments: SubmitSinApplicationRequestPrimaryDocument;
  requestDetails: SubmitSinApplicationRequestRequestDetails;
  secondaryDocument: SubmitSinApplicationRequestSecondaryDocument;
};

export type SubmitSinApplicationRequestBirthDetails = {
  country: string;
  province?: string | undefined;
  city?: string | undefined;
  fromMultipleBirth: boolean;
};

export type SubmitSinApplicationRequestContactInformation = {
  preferredLanguage: string;
  primaryPhoneNumber: string;
  secondaryPhoneNumber?: string | undefined;
  emailAddress?: string | undefined;
  country: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
};

export type SubmitSinApplicationRequestCurrentName =
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
      middleName?: string | undefined;
      lastName: string;
      supportingDocuments:
        | {
            required: true;
            documentTypes: string[];
          }
        | {
            required: false;
            documentTypes?: undefined;
          };
    };

export type SubmitSinApplicationRequestParentDetails = (
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
        province?: string | undefined;
        city?: string | undefined;
      };
    }
)[];

export type SubmitSinApplicationRequestPersonalInfo = {
  firstNamePreviouslyUsed?: string[] | undefined;
  lastNameAtBirth: string;
  lastNamePreviouslyUsed?: string[] | undefined;
  gender: string;
};

export type SubmitSinApplicationRequestPreviousSin = {
  hasPreviousSin: string;
  socialInsuranceNumber?: string | undefined;
};

export type SubmitSinApplicationRequestPrimaryDocument = {
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

export type SubmitSinApplicationRequestRequestDetails = {
  type: string;
  scenario: string;
};

export type SubmitSinApplicationRequestSecondaryDocument = {
  documentType: string;
  expiryMonth: number;
  expiryYear: number;
};

export type SubmitSinApplicationResponse = {
  identificationId: string | undefined;
};
