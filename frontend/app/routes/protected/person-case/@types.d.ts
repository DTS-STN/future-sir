import 'express-session';

import type { ServerEnvironment } from '~/.server/environment';

declare module 'express-session' {
  interface SessionData {
    inPersonSINCase: Partial<{
      currentNameInfo:
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
      privacyStatement: {
        agreedToTerms: true;
      };
      requestDetails: {
        type: string;
        scenario: string;
      };
      primaryDocuments: {
        citizenshipDate: string;
        clientNumber: string;
        currentStatusInCanada: string;
        dateOfBirth: string;
        documentType: string;
        gender: string;
        givenName: string;
        lastName: string;
        registrationNumber: string;
        document: File;
      };
      personalInformation: {
        firstNamePreviouslyUsed?: string[];
        lastNameAtBirth: string;
        lastNamePreviouslyUsed?: string[];
        gender: string;
      };
      secondaryDocument: {
        documentType: string;
        document: File;
        expiryDate: string;
      };
      previousSin: {
        hasPreviousSin: string;
        socialInsuranceNumber?: string;
      };
      contactInformation: {
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
      birthDetails:
        | { country: ServerEnvironment['PP_CANADA_COUNTRY_CODE']; province: string; city: string; fromMultipleBirth: boolean }
        | { country: string; province?: string; city?: string; fromMultipleBirth: boolean };
      parentDetails: (
        | { unavailable: true }
        | {
            unavailable: false;
            givenName: string;
            lastName: string;
            birthLocation:
              | {
                  country: 'CAN';
                  province: string;
                  city: string;
                }
              | {
                  country: string;
                  province?: string;
                  city?: string;
                };
          }
      )[];
    }>;
  }
}

export {};
