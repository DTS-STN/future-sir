import { mockCaseApi } from '~/.server/domain/multi-channel/mocks/case-api-service.mock';
import { serverEnvironment } from '~/.server/environment';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

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
  | { preferredSameAsDocumentName: true }
  | {
      preferredSameAsDocumentName: false;
      firstName: string;
      middleName?: string;
      lastName: string;
      supportingDocuments:
        | { required: false }
        | {
            required: true;
            documentTypes: string[];
          };
    };

export type ParentDetailsData = (
  | { unavailable: true }
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

export type PersonSinCase = {
  caseId: string;
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

// TODO: Build real implementation (the response will likely be a NIEM type and will have to be mapped)
const realCaseApi = {
  getCases: async (): Promise<PersonSinCase[]> => {
    const response = await fetch(`${serverEnvironment.INTEROP_SIN_REG_API_BASE_URL}/cases`);
    if (!response.ok) throw new AppError(`Cases not found.`, ErrorCodes.SIN_CASE_NOT_FOUND);
    return response.json();
  },

  getCaseById: async (id: string): Promise<PersonSinCase> => {
    const response = await fetch(`${serverEnvironment.INTEROP_SIN_REG_API_BASE_URL}/cases/${id}`);
    if (!response.ok) throw new AppError(`Case with ID '${id}' not found.`, ErrorCodes.SIN_CASE_NOT_FOUND);
    return response.json();
  },
};

export const caseApi = serverEnvironment.ENABLE_SIN_API_SERVICE_MOCK ? mockCaseApi : realCaseApi;
