import 'express-session';

import type { IDTokenClaims } from '~/.server/auth/auth-strategies';

type SupportingDocs =
  | { supportingDocumentsRequired: false }
  | { supportingDocumentsRequired: true; supportingDocumentTypes: string[] };

type CurrentName =
  | { preferredSameAsDocumentName: true }
  | ({ preferredSameAsDocumentName: false; firstName: string; middleName?: string; lastName: string } & SupportingDocs);

type BirthDetails =
  | { country: 'CAN'; province: string; city: string; fromMultipleBirth: boolean }
  | { country: string; province?: string; city?: string; fromMultipleBirth: boolean };

declare module 'express-session' {
  interface SessionData {
    authState: {
      accessToken: string;
      idToken?: string;
      idTokenClaims?: IDTokenClaims;
    };
    loginState: {
      codeVerifier: string;
      nonce: string;
      returnUrl?: URL;
      state: string;
    };
    /**
     * Represents the session data for the in-person SIN case.
     */
    inPersonSINCase: {
      currentNameInfo?: CurrentName;
      /**
       * Represents the privacy statement data for the in-person SIN case.
       */
      privacyStatement?: {
        /**
         * Indicates whether the user has agreed to the terms of the privacy statement.
         */
        agreedToTerms: true;
      };
      requestDetails?: {
        type: string;
        scenario: string;
      };
      primaryDocuments?: {
        currentStatusInCanada: string;
        documentType: string;
      };
      previousSin?: {
        hasPreviousSin: string;
        socialInsuranceNumber?: string;
      };
      contactInformation?: {
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
      birthDetails?: BirthDetails;
    };
  }
}

export {};
