import 'express-session';

import type { ServerEnvironment } from '~/.server/environment';

export type BirthDetailsData =
  | { country: ServerEnvironment['PP_CANADA_COUNTRY_CODE']; province: string; city: string; fromMultipleBirth: boolean }
  | { country: string; province?: string; city?: string; fromMultipleBirth: boolean };

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
        | { required: false } //
        | { required: true; documentTypes: string[] };
    };

export type ParentDetailsData = (
  | { unavailable: true }
  | {
      unavailable: false;
      givenName: string;
      lastName: string;
      birthLocation:
        | { country: 'CAN'; province: string; city: string } //
        | { country: string; province?: string; city?: string };
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
  // document: File; TODO :: enable me!
  expiryDate: string;
};

export type InPersonSinApplication = Partial<{
  currentNameInfo: CurrentNameData;
  privacyStatement: PrivacyStatementData;
  requestDetails: RequestDetailsData;
  primaryDocuments: PrimaryDocumentData;
  personalInformation: PersonalInfoData;
  secondaryDocument: SecondaryDocumentData;
  previousSin: PreviousSinData;
  contactInformation: ContactInformationData;
  birthDetails: BirthDetailsData;
  parentDetails: ParentDetailsData;
}>;

declare module 'express-session' {
  interface SessionData {
    inPersonSinApplications: Record<string, InPersonSinApplication | undefined>;
  }
}

export {};
