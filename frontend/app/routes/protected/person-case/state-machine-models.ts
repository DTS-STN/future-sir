import 'express-session';
import type { SnapshotFrom } from 'xstate';

import type { Machine } from '~/routes/protected/person-case/state-machine.server';

export type FormData = {
  [K in keyof InPersonSinApplication]?: {
    values?: Partial<InPersonSinApplication[K]>;
    errors?: Errors;
  };
};

export type Errors = Readonly<Record<string, [string, ...string[]] | undefined>>;

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

export type ParentDetailsData = (
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
        country?: string;
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
  expiryMonth: string;
  expiryYear: string;
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

declare module 'express-session' {
  interface SessionData {
    inPersonSinApplications: Record<string, SnapshotFrom<Machine> | undefined>;
  }
}

export {};
