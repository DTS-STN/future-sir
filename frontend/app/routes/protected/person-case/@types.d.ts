import 'express-session';

type SupportingDocs =
  | { supportingDocumentsRequired: false }
  | { supportingDocumentsRequired: true; supportingDocumentTypes: string[] };

declare module 'express-session' {
  interface SessionData {
    inPersonSINCase: Partial<{
      currentNameInfo:
        | { preferredSameAsDocumentName: true }
        | ({ preferredSameAsDocumentName: false; firstName: string; middleName?: string; lastName: string } & SupportingDocs);
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
        | { country: 'CAN'; province: string; city: string; fromMultipleBirth: boolean }
        | { country: string; province?: string; city?: string; fromMultipleBirth: boolean };
    }>;
  }
}

export {};
