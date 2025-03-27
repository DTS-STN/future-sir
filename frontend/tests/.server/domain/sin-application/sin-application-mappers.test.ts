import { faker } from '@faker-js/faker';
import { describe, expect, it, vi } from 'vitest';

import type {
  ApplicantPrimaryDocumentChoice,
  ApplicantStatusInCanadaChoice,
  ApplicantSupportingDocumentType,
} from '~/.server/domain/person-case/models';
import { getApplicantPrimaryDocumentChoiceById } from '~/.server/domain/person-case/services/applicant-primary-document-service';
import { getApplicantStatusInCanadaChoicesById } from '~/.server/domain/person-case/services/applicant-status-in-canada-service';
import { getApplicantSupportingDocumentTypesById } from '~/.server/domain/person-case/services/applicant-supporting-document-service';
import {
  mapSinApplicationResponseToSubmitSinApplicationResponse,
  mapSubmitSinApplicationRequestToSinApplicationRequest,
} from '~/.server/domain/sin-application/sin-application-mappers';
import type {
  SubmitSinApplicationRequest,
  SubmitSinApplicationResponse,
} from '~/.server/domain/sin-application/sin-application-models';
import type { SinApplicationRequest, SinApplicationResponse } from '~/.server/shared/api/interop';
import type { Country, Province } from '~/.server/shared/models';
import { getCountryById } from '~/.server/shared/services/country-service';
import { getProvinceById } from '~/.server/shared/services/province-service';

vi.mock('~/.server/domain/person-case/services/applicant-status-in-canada-service');
vi.mock('~/.server/domain/person-case/services/applicant-supporting-document-service');
vi.mock('~/.server/domain/person-case/services/applicant-primary-document-service');
vi.mock('~/.server/shared/services/country-service');
vi.mock('~/.server/shared/services/province-service');

describe('mapSubmitSinApplicationRequestToSinApplicationRequest', () => {
  it('should map SubmitSinApplicationRequest to SinApplicationRequest correctly when country is CA and preferredSameAsDocumentName is true', () => {
    const applicantStatusInCanadaChoiceMock: ApplicantStatusInCanadaChoice = {
      id: 'StatusInCanadaId',
      nameEn: 'StatusInCanada NameEn',
      nameFr: 'StatusInCanada NameFr',
    };

    const applicantPrimaryDocumentChoiceMock: ApplicantPrimaryDocumentChoice = {
      id: 'PrimaryDocumentId',
      applicantStatusInCanadaId: 'StatusInCanadaId',
      nameEn: 'PrimaryDocument NameEn',
      nameFr: 'PrimaryDocument NameFr',
    };

    const countryMock: Country = {
      id: 'CountryID',
      alphaCode: 'CA',
      nameEn: 'Country Name En',
      nameFr: 'Country Name Fr',
    };

    const provinceMock: Province = {
      id: 'ProvinceID',
      alphaCode: 'QA',
      nameEn: 'Province Name En',
      nameFr: 'Province Name Fr',
    };

    vi.mocked(getApplicantStatusInCanadaChoicesById).mockReturnValueOnce(applicantStatusInCanadaChoiceMock);
    vi.mocked(getApplicantPrimaryDocumentChoiceById).mockReturnValueOnce(applicantPrimaryDocumentChoiceMock);
    vi.mocked(getApplicantSupportingDocumentTypesById);
    vi.mocked(getCountryById).mockReturnValue(countryMock);
    vi.mocked(getProvinceById).mockReturnValue(provinceMock);

    const idToken = faker.internet.jwt();
    const submitSinApplicationRequest: SubmitSinApplicationRequest = {
      birthDetails: {
        city: 'City',
        province: provinceMock.id,
        country: countryMock.id,
        fromMultipleBirth: false,
      },
      contactInformation: {
        address: 'Address',
        city: 'City',
        province: provinceMock.id,
        country: countryMock.id,
        postalCode: 'PostalCode',
        emailAddress: 'email@example.com',
        primaryPhoneNumber: '1234567890',
        secondaryPhoneNumber: '0987654321',
        preferredLanguage: 'EN',
      },
      currentNameInfo: {
        preferredSameAsDocumentName: true,
      },
      parentDetails: [
        {
          unavailable: false,
          givenName: 'ParentFirstName',
          lastName: 'ParentLastName',
          birthLocation: {
            country: countryMock.id,
            city: 'ParentCity',
            province: provinceMock.id,
          },
        },
      ],
      personalInformation: {
        lastNameAtBirth: 'LastNameAtBirth',
        firstNamePreviouslyUsed: ['FirstNamePrev'],
        lastNamePreviouslyUsed: ['LastNamePrev'],
        gender: 'M',
      },
      previousSin: {
        hasPreviousSin: '564190000',
        socialInsuranceNumber: '123456789',
      },
      primaryDocuments: {
        citizenshipDate: '2020-01-01',
        currentStatusInCanada: applicantStatusInCanadaChoiceMock.id,
        registrationNumber: 'RegNumber',
        documentType: applicantPrimaryDocumentChoiceMock.id,
        clientNumber: 'ClientNumber',
        givenName: 'GivenName',
        lastName: 'LastName',
        dateOfBirth: '2000-01-01',
        gender: 'M',
      },
      privacyStatement: {
        agreedToTerms: true,
      },
      requestDetails: { type: 'RequestType', scenario: 'Scenario' },
      secondaryDocument: { documentType: 'SecDocType', expiryYear: '2025', expiryMonth: '12' },
    };

    const expected: SinApplicationRequest = {
      SystemCredential: idToken,
      SINApplication: {
        Applicant: {
          ClientLegalStatus: {
            Certificate: [
              {
                CertificateIssueDate: { date: '2020-01-01' },
                CertificateCategoryCode: {
                  ReferenceDataID: '564190000',
                  ReferenceDataName: applicantStatusInCanadaChoiceMock.nameEn,
                },
              },
            ],
          },
          PersonName: [
            {
              PersonNameCategoryCode: { ReferenceDataName: 'Legal' },
              PersonGivenName: 'GivenName',
              PersonSurName: 'LastName',
            },
            {
              PersonNameCategoryCode: { ReferenceDataName: 'at birth' },
              PersonSurName: 'LastNameAtBirth',
            },
            {
              PersonGivenName: 'FirstNamePrev',
              PersonNameCategoryCode: { ReferenceDataName: 'Alternate' },
            },
            {
              PersonSurName: 'LastNamePrev',
              PersonNameCategoryCode: { ReferenceDataName: 'Alternate' },
            },
          ],
          Certificate: [
            {
              ResourceReference: 'Documents',
              CertificateIdentification: [{ IdentificationID: 'RegNumber' }],
            },
            {
              CertificateCategoryCode: {
                ReferenceDataID: '564190001',
                ReferenceDataName: applicantPrimaryDocumentChoiceMock.nameEn,
              },
              ResourceReference: 'Primary Documents',
            },
            {
              CertificateCategoryCode: {
                ReferenceDataID: 'SecDocType',
              },
              CertificateExpiryDate: {
                date: '2025-12',
              },
              ResourceReference: 'Secondary Documents',
            },
            {
              Client: {
                ClientIdentification: [
                  {
                    IdentificationID: 'ClientNumber',
                  },
                ],
                PersonName: [
                  {
                    PersonGivenName: 'GivenName',
                    PersonSurName: 'LastName',
                  },
                ],
                PersonBirthDate: {
                  date: '2000-01-01',
                },
                PersonSexAtBirthCode: { ReferenceDataID: 'M' },
              },
            },
            {
              RelatedPerson: [
                {
                  PersonRelationshipCode: {
                    ReferenceDataName: 'Parent1',
                  },
                  PersonName: [
                    {
                      PersonGivenName: 'ParentFirstName',
                      PersonSurName: 'ParentLastName',
                    },
                  ],
                  PersonBirthLocation: {
                    LocationContactInformation: [
                      {
                        Address: [
                          {
                            AddressCityName: 'ParentCity',
                            AddressCountry: {
                              CountryCode: {
                                ReferenceDataID: countryMock.alphaCode,
                              },
                            },
                            AddressProvince: {
                              ProvinceCode: {
                                ReferenceDataID: provinceMock.alphaCode,
                                ReferenceDataName: undefined,
                              },
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          ],
          PersonContactInformation: [
            {
              Address: [
                {
                  AddressStreet: { StreetName: 'Address' },
                  AddressCityName: 'City',
                  AddressProvince: {
                    ProvinceCode: {
                      ReferenceDataID: provinceMock.alphaCode,
                      ReferenceDataName: undefined,
                    },
                  },
                  AddressCountry: {
                    CountryCode: {
                      ReferenceDataID: countryMock.alphaCode,
                    },
                  },
                  AddressPostalCode: 'PostalCode',
                },
              ],
              EmailAddress: [{ EmailAddressID: 'email@example.com' }],
              TelephoneNumber: [
                {
                  FullTelephoneNumber: {
                    TelephoneNumberFullID: '1234567890',
                  },
                },
                {
                  FullTelephoneNumber: {
                    TelephoneNumberFullID: '0987654321',
                  },
                },
              ],
            },
          ],
          PersonLanguage: [
            {
              CommunicationCategoryCode: {
                ReferenceDataName: 'Correspondence',
              },
              LanguageCode: { ReferenceDataID: 'EN' },
              PreferredIndicator: true,
            },
          ],
          PersonBirthLocation: {
            LocationContactInformation: [
              {
                Address: [
                  {
                    AddressCityName: 'City',
                    AddressProvince: {
                      ProvinceCode: {
                        ReferenceDataID: provinceMock.alphaCode,
                        ReferenceDataName: undefined,
                      },
                    },
                    AddressCountry: {
                      CountryCode: {
                        ReferenceDataID: countryMock.alphaCode,
                      },
                    },
                  },
                ],
              },
            ],
          },
          PersonGenderCode: {
            ReferenceDataID: 'M',
          },
          PersonBirthDate: {
            date: '2000-01-01',
          },
        },
        SINApplicationCategoryCode: {
          ReferenceDataID: 'RequestType',
        },
        SINApplicationDetail: [
          {
            ApplicationDetailID: 'SIN Application Submission Scenario',
            ApplicationDetailValue: {
              ValueCode: {
                ReferenceDataID: 'Scenario',
              },
            },
          },
          {
            ApplicationDetailID: 'SIN Confirmation receiving method',
            ApplicationDetailValue: {
              ValueCode: {
                ReferenceDataID: 'Mail',
              },
            },
          },
          {
            ApplicationDetailID: 'Supporting document contains first name',
            ApplicationDetailValue: {
              ValueBoolean: false,
            },
          },
          {
            ApplicationDetailID: 'Supporting document contains last name',
            ApplicationDetailValue: {
              ValueBoolean: false,
            },
          },
          {
            ApplicationDetailID: 'is a part of multibirth',
            ApplicationDetailValue: {
              ValueBoolean: false,
            },
          },
          {
            ApplicationDetailID: 'Already had a sin',
            ApplicationDetailValue: {
              ValueBoolean: true,
            },
          },
          {
            ApplicationDetailID: 'Previous SIN Number',
            ApplicationDetailValue: {
              ValueString: '123456789',
            },
          },
          {
            ApplicationDetailID: 'is registered indian status',
            ApplicationDetailValue: {
              ValueBoolean: false,
            },
          },
          {
            ApplicationDetailID: 'Registered indian status on record',
            ApplicationDetailValue: {
              ValueBoolean: false,
            },
          },
        ],
      },
    };

    const result = mapSubmitSinApplicationRequestToSinApplicationRequest(submitSinApplicationRequest, idToken);

    expect(result).toStrictEqual(expected);
    expect(getApplicantStatusInCanadaChoicesById).toHaveBeenCalledExactlyOnceWith(applicantStatusInCanadaChoiceMock.id);
    expect(getApplicantPrimaryDocumentChoiceById).toHaveBeenCalledExactlyOnceWith(applicantPrimaryDocumentChoiceMock.id);
    expect(getApplicantSupportingDocumentTypesById).not.toHaveBeenCalled();
    expect(getCountryById).toHaveBeenCalledWith(countryMock.id);
    expect(getProvinceById).toHaveBeenCalledWith(provinceMock.id);
  });

  it('should map SubmitSinApplicationRequest to SinApplicationRequest correctly when country is US and preferredSameAsDocumentName is false', () => {
    const applicantStatusInCanadaChoiceMock: ApplicantStatusInCanadaChoice = {
      id: 'StatusInCanadaId',
      nameEn: 'StatusInCanada NameEn',
      nameFr: 'StatusInCanada NameFr',
    };

    const applicantPrimaryDocumentChoiceMock: ApplicantPrimaryDocumentChoice = {
      id: 'PrimaryDocumentId',
      applicantStatusInCanadaId: 'StatusInCanadaId',
      nameEn: 'PrimaryDocument NameEn',
      nameFr: 'PrimaryDocument NameFr',
    };

    const applicantSupportingDocumentTypeMock: ApplicantSupportingDocumentType = {
      id: 'DocType1Id',
      nameEn: 'DocType1 NameEn',
      nameFr: 'DocType1 NameFr',
    };

    const countryMock: Country = {
      id: 'CountryID',
      alphaCode: 'US',
      nameEn: 'Country Name En',
      nameFr: 'Country Name Fr',
    };

    vi.mocked(getApplicantStatusInCanadaChoicesById).mockReturnValueOnce(applicantStatusInCanadaChoiceMock);
    vi.mocked(getApplicantPrimaryDocumentChoiceById).mockReturnValueOnce(applicantPrimaryDocumentChoiceMock);
    vi.mocked(getApplicantSupportingDocumentTypesById).mockReturnValueOnce(applicantSupportingDocumentTypeMock);
    vi.mocked(getCountryById).mockReturnValue(countryMock);
    vi.mocked(getProvinceById);

    const idToken = faker.internet.jwt();
    const submitSinApplicationRequest: SubmitSinApplicationRequest = {
      birthDetails: {
        city: 'City',
        province: 'Province',
        country: countryMock.id,
        fromMultipleBirth: false,
      },
      contactInformation: {
        address: 'Address',
        city: 'City',
        province: 'Province',
        country: countryMock.id,
        postalCode: 'PostalCode',
        emailAddress: 'email@example.com',
        primaryPhoneNumber: '1234567890',
        secondaryPhoneNumber: '0987654321',
        preferredLanguage: 'EN',
      },
      currentNameInfo: {
        preferredSameAsDocumentName: false,
        firstName: 'FirstName',
        middleName: 'MiddleName',
        lastName: 'LastName',
        supportingDocuments: {
          required: true,
          documentTypes: [applicantSupportingDocumentTypeMock.id],
        },
      },
      parentDetails: [
        {
          unavailable: false,
          givenName: 'ParentFirstName',
          lastName: 'ParentLastName',
          birthLocation: {
            country: countryMock.id,
            city: 'ParentCity',
            province: 'ParentProvince',
          },
        },
      ],
      personalInformation: {
        lastNameAtBirth: 'LastNameAtBirth',
        firstNamePreviouslyUsed: ['FirstNamePrev'],
        lastNamePreviouslyUsed: ['LastNamePrev'],
        gender: 'M',
      },
      previousSin: {
        hasPreviousSin: '564190000',
        socialInsuranceNumber: '123456789',
      },
      primaryDocuments: {
        citizenshipDate: '2020-01-01',
        currentStatusInCanada: applicantStatusInCanadaChoiceMock.id,
        registrationNumber: 'RegNumber',
        documentType: applicantPrimaryDocumentChoiceMock.id,
        clientNumber: 'ClientNumber',
        givenName: 'GivenName',
        lastName: 'LastName',
        dateOfBirth: '2000-01-01',
        gender: 'M',
      },
      privacyStatement: {
        agreedToTerms: true,
      },
      requestDetails: { type: 'RequestType', scenario: 'Scenario' },
      secondaryDocument: { documentType: 'SecDocType', expiryYear: '2025', expiryMonth: '12' },
    };

    const expected: SinApplicationRequest = {
      SystemCredential: idToken,
      SINApplication: {
        Applicant: {
          ClientLegalStatus: {
            Certificate: [
              {
                CertificateIssueDate: { date: '2020-01-01' },
                CertificateCategoryCode: {
                  ReferenceDataID: '564190000',
                  ReferenceDataName: applicantStatusInCanadaChoiceMock.nameEn,
                },
              },
            ],
          },
          PersonName: [
            {
              PersonNameCategoryCode: { ReferenceDataName: 'Legal' },
              PersonGivenName: 'FirstName MiddleName',
              PersonSurName: 'LastName',
            },
            {
              PersonNameCategoryCode: { ReferenceDataName: 'at birth' },
              PersonSurName: 'LastNameAtBirth',
            },
            {
              PersonGivenName: 'FirstNamePrev',
              PersonNameCategoryCode: { ReferenceDataName: 'Alternate' },
            },
            {
              PersonSurName: 'LastNamePrev',
              PersonNameCategoryCode: { ReferenceDataName: 'Alternate' },
            },
          ],
          Certificate: [
            {
              ResourceReference: 'Documents',
              CertificateIdentification: [{ IdentificationID: 'RegNumber' }],
            },
            {
              CertificateCategoryCode: {
                ReferenceDataID: '564190001',
                ReferenceDataName: applicantPrimaryDocumentChoiceMock.nameEn,
              },
              ResourceReference: 'Primary Documents',
            },
            {
              CertificateCategoryCode: {
                ReferenceDataID: 'SecDocType',
              },
              CertificateExpiryDate: {
                date: '2025-12',
              },
              ResourceReference: 'Secondary Documents',
            },
            {
              CertificateCategoryCode: {
                ReferenceDataID: applicantSupportingDocumentTypeMock.id,
                ReferenceDataName: applicantSupportingDocumentTypeMock.nameEn,
              },
              ResourceReference: 'Supporting documents for name change',
            },
            {
              Client: {
                ClientIdentification: [
                  {
                    IdentificationID: 'ClientNumber',
                  },
                ],
                PersonName: [
                  {
                    PersonGivenName: 'GivenName',
                    PersonSurName: 'LastName',
                  },
                ],
                PersonBirthDate: {
                  date: '2000-01-01',
                },
                PersonSexAtBirthCode: { ReferenceDataID: 'M' },
              },
            },
            {
              RelatedPerson: [
                {
                  PersonRelationshipCode: {
                    ReferenceDataName: 'Parent1',
                  },
                  PersonName: [
                    {
                      PersonGivenName: 'ParentFirstName',
                      PersonSurName: 'ParentLastName',
                    },
                  ],
                  PersonBirthLocation: {
                    LocationContactInformation: [
                      {
                        Address: [
                          {
                            AddressCityName: 'ParentCity',
                            AddressCountry: {
                              CountryCode: {
                                ReferenceDataID: countryMock.alphaCode,
                              },
                            },
                            AddressProvince: {
                              ProvinceCode: {
                                ReferenceDataID: undefined,
                                ReferenceDataName: 'ParentProvince',
                              },
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          ],
          PersonContactInformation: [
            {
              Address: [
                {
                  AddressStreet: { StreetName: 'Address' },
                  AddressCityName: 'City',
                  AddressProvince: {
                    ProvinceCode: {
                      ReferenceDataID: undefined,
                      ReferenceDataName: 'Province',
                    },
                  },
                  AddressCountry: {
                    CountryCode: {
                      ReferenceDataID: countryMock.alphaCode,
                    },
                  },
                  AddressPostalCode: 'PostalCode',
                },
              ],
              EmailAddress: [{ EmailAddressID: 'email@example.com' }],
              TelephoneNumber: [
                {
                  FullTelephoneNumber: {
                    TelephoneNumberFullID: '1234567890',
                  },
                },
                {
                  FullTelephoneNumber: {
                    TelephoneNumberFullID: '0987654321',
                  },
                },
              ],
            },
          ],
          PersonLanguage: [
            {
              CommunicationCategoryCode: {
                ReferenceDataName: 'Correspondence',
              },
              LanguageCode: { ReferenceDataID: 'EN' },
              PreferredIndicator: true,
            },
          ],
          PersonBirthLocation: {
            LocationContactInformation: [
              {
                Address: [
                  {
                    AddressCityName: 'City',
                    AddressProvince: {
                      ProvinceCode: {
                        ReferenceDataID: undefined,
                        ReferenceDataName: 'Province',
                      },
                    },
                    AddressCountry: {
                      CountryCode: {
                        ReferenceDataID: countryMock.alphaCode,
                      },
                    },
                  },
                ],
              },
            ],
          },
          PersonGenderCode: {
            ReferenceDataID: 'M',
          },
          PersonBirthDate: {
            date: '2000-01-01',
          },
        },
        SINApplicationCategoryCode: {
          ReferenceDataID: 'RequestType',
        },
        SINApplicationDetail: [
          {
            ApplicationDetailID: 'SIN Application Submission Scenario',
            ApplicationDetailValue: {
              ValueCode: {
                ReferenceDataID: 'Scenario',
              },
            },
          },
          {
            ApplicationDetailID: 'SIN Confirmation receiving method',
            ApplicationDetailValue: {
              ValueCode: {
                ReferenceDataID: 'Mail',
              },
            },
          },
          {
            ApplicationDetailID: 'Supporting document contains first name',
            ApplicationDetailValue: {
              ValueBoolean: true,
            },
          },
          {
            ApplicationDetailID: 'Supporting document contains last name',
            ApplicationDetailValue: {
              ValueBoolean: true,
            },
          },
          {
            ApplicationDetailID: 'is a part of multibirth',
            ApplicationDetailValue: {
              ValueBoolean: false,
            },
          },
          {
            ApplicationDetailID: 'Already had a sin',
            ApplicationDetailValue: {
              ValueBoolean: true,
            },
          },
          {
            ApplicationDetailID: 'Previous SIN Number',
            ApplicationDetailValue: {
              ValueString: '123456789',
            },
          },
          {
            ApplicationDetailID: 'is registered indian status',
            ApplicationDetailValue: {
              ValueBoolean: false,
            },
          },
          {
            ApplicationDetailID: 'Registered indian status on record',
            ApplicationDetailValue: {
              ValueBoolean: false,
            },
          },
        ],
      },
    };

    const result = mapSubmitSinApplicationRequestToSinApplicationRequest(submitSinApplicationRequest, idToken);

    expect(result).toStrictEqual(expected);
    expect(getApplicantStatusInCanadaChoicesById).toHaveBeenCalledExactlyOnceWith(applicantStatusInCanadaChoiceMock.id);
    expect(getApplicantPrimaryDocumentChoiceById).toHaveBeenCalledExactlyOnceWith(applicantPrimaryDocumentChoiceMock.id);
    expect(getApplicantSupportingDocumentTypesById).toHaveBeenCalledExactlyOnceWith(applicantSupportingDocumentTypeMock.id);
    expect(getCountryById).toHaveBeenCalledWith(countryMock.id);
    expect(getProvinceById).not.toHaveBeenCalled();
  });
});

describe('mapSinApplicationResponseToSubmitSinApplicationResponse', () => {
  it('should map SinApplicationResponse to SubmitSinApplicationResponse correctly', () => {
    const sinApplicationResponse: SinApplicationResponse = {
      SINApplication: {
        SINApplicationIdentification: {
          IdentificationID: '123456789',
        },
      },
    };

    const expected: SubmitSinApplicationResponse = {
      identificationId: '123456789',
    };

    const result = mapSinApplicationResponseToSubmitSinApplicationResponse(sinApplicationResponse);
    expect(result).toEqual(expected);
  });
});
