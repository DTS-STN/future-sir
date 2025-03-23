import type { SinCaseService } from '~/.server/domain/multi-channel/case-api-service';
import type { SinCaseDto } from '~/.server/domain/multi-channel/sin-case-models';
import { APPLICANT_PRIMARY_DOCUMENT_CHOICE, APPLICANT_STATUS_IN_CANADA } from '~/domain/constants';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

export function getMockSinCaseService(): SinCaseService {
  return {
    getSinCases: async (): Promise<SinCaseDto[]> => {
      return new Promise((resolve) => resolve(mockCases));
    },

    getSinCaseById: async (id: string): Promise<SinCaseDto> =>
      new Promise((resolve, reject) => {
        const _case = mockCases.find(({ caseId }) => caseId === id);
        if (_case) return resolve(_case);
        reject(new AppError(`Case with ID '${id}' not found.`, ErrorCodes.SIN_CASE_NOT_FOUND));
      }),
  };
}

const mockCases = [
  {
    caseId: '00000000000000',
    birthDetails: {
      country: 'f8914e7c-2c95-ea11-a812-000d3a0c2b5d',
      province: '925808d0-3195-ea11-a812-000d3a0c2b5d',
      city: 'City',
      fromMultipleBirth: true,
    },
    contactInformation: {
      preferredLanguage: '564190000',
      primaryPhoneNumber: '+15005005000',
      emailAddress: 'email@email.com',
      country: 'f8914e7c-2c95-ea11-a812-000d3a0c2b5d',
      province: '925808d0-3195-ea11-a812-000d3a0c2b5d',
      address: '123 City',
      postalCode: 'H0H0H0',
      city: 'City',
    },
    currentNameInfo: { preferredSameAsDocumentName: true as const },
    parentDetails: [
      {
        unavailable: false as const,
        givenName: 'Robert',
        lastName: 'Doe',
        birthLocation: {
          country: 'f8914e7c-2c95-ea11-a812-000d3a0c2b5d',
          province: '925808d0-3195-ea11-a812-000d3a0c2b5d',
          city: 'City',
        },
      },
      {
        unavailable: false as const,
        givenName: 'Jane',
        lastName: 'Doe',
        birthLocation: {
          country: 'f8914e7c-2c95-ea11-a812-000d3a0c2b5d',
          province: '925808d0-3195-ea11-a812-000d3a0c2b5d',
          city: 'City',
        },
      },
    ],
    personalInformation: {
      firstNamePreviouslyUsed: ['Robert'],
      lastNameAtBirth: 'Doe',
      lastNamePreviouslyUsed: [],
      gender: '564190001',
    },
    previousSin: { hasPreviousSin: '564190000', socialInsuranceNumber: '800000002' },
    primaryDocuments: {
      currentStatusInCanada: APPLICANT_STATUS_IN_CANADA.canadianCitizenBornOutsideCanada,
      documentType: APPLICANT_PRIMARY_DOCUMENT_CHOICE.certificateOfCanadianCitizenship,
      registrationNumber: '12345678',
      clientNumber: '1234567890',
      givenName: 'John',
      lastName: 'Doe',
      dateOfBirthYear: '1900',
      dateOfBirthMonth: '01',
      dateOfBirthDay: '01',
      dateOfBirth: '1900-01-01',
      gender: '564190001',
      citizenshipDateYear: '1900',
      citizenshipDateMonth: '01',
      citizenshipDateDay: '01',
      citizenshipDate: '1900-01-01',
    },
    privacyStatement: { agreedToTerms: true as const },
    requestDetails: { scenario: '564190000', type: '564190004' },
    secondaryDocument: { documentType: '564190000', expiryYear: '2026', expiryMonth: '01' },
  },
  {
    caseId: '00000000000001',
    birthDetails: {
      country: 'f8914e7c-2c95-ea11-a812-000d3a0c2b5d',
      province: '925808d0-3195-ea11-a812-000d3a0c2b5d',
      city: 'City',
      fromMultipleBirth: false,
    },
    contactInformation: {
      preferredLanguage: '564190000',
      primaryPhoneNumber: '+15005005000',
      emailAddress: 'email@email.com',
      country: 'f8914e7c-2c95-ea11-a812-000d3a0c2b5d',
      province: '925808d0-3195-ea11-a812-000d3a0c2b5d',
      address: '123 City',
      postalCode: 'H0H0H0',
      city: 'City',
    },
    currentNameInfo: {
      preferredSameAsDocumentName: false as const,
      firstName: 'Johnny',
      lastName: 'Doe',
      supportingDocuments: { required: false as const },
    },
    parentDetails: [
      {
        unavailable: false as const,
        givenName: 'Robert',
        lastName: 'Doe',
        birthLocation: {
          country: 'f8914e7c-2c95-ea11-a812-000d3a0c2b5d',
          province: '925808d0-3195-ea11-a812-000d3a0c2b5d',
          city: 'City',
        },
      },
    ],
    personalInformation: {
      firstNamePreviouslyUsed: ['Robert'],
      lastNameAtBirth: 'Doe',
      lastNamePreviouslyUsed: [],
      gender: '564190001',
    },
    previousSin: { hasPreviousSin: '564190001' },
    primaryDocuments: {
      currentStatusInCanada: APPLICANT_STATUS_IN_CANADA.canadianCitizenBornOutsideCanada,
      documentType: APPLICANT_PRIMARY_DOCUMENT_CHOICE.certificateOfCanadianCitizenship,
      registrationNumber: '12345678',
      clientNumber: '1234567890',
      givenName: 'John',
      lastName: 'Doe',
      dateOfBirthYear: '1900',
      dateOfBirthMonth: '01',
      dateOfBirthDay: '01',
      dateOfBirth: '1900-01-01',
      gender: '564190001',
      citizenshipDateYear: '1900',
      citizenshipDateMonth: '01',
      citizenshipDateDay: '01',
      citizenshipDate: '1900-01-01',
    },
    privacyStatement: { agreedToTerms: true as const },
    requestDetails: { scenario: '564190000', type: '564190004' },
    secondaryDocument: { documentType: '564190000', expiryYear: '2026', expiryMonth: '01' },
  },
];
