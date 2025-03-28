import { faker } from '@faker-js/faker';
import { describe, expect, it, vi } from 'vitest';

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

vi.mock('~/.server/domain/person-case/services/applicant-supporting-document-service');
vi.mock('~/.server/shared/services/country-service');
vi.mock('~/.server/shared/services/province-service');

describe('mapSubmitSinApplicationRequestToSinApplicationRequest', () => {
  it('should map SubmitSinApplicationRequest to SinApplicationRequest correctly when country is CA and preferredSameAsDocumentName is true', () => {
    const countryMock: Country = {
      id: 'Country01',
      alphaCode: 'CA',
      nameEn: 'Canada En',
      nameFr: 'Canada Fr',
    };

    const provinceMock: Province = {
      id: 'Province01',
      alphaCode: 'ON',
      nameEn: 'Ontario En',
      nameFr: 'Ontario Fr',
    };

    vi.mocked(getCountryById).mockReturnValue(countryMock);
    vi.mocked(getProvinceById).mockReturnValue(provinceMock);

    const idToken = faker.internet.jwt();
    const submitSinApplicationRequest: SubmitSinApplicationRequest = {
      birthDetails: {
        city: 'City',
        province: provinceMock.id,
        country: countryMock.id,
        fromMultipleBirth: true,
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
        preferredLanguage: '564190000',
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
        gender: '564190000',
      },
      previousSin: {
        hasPreviousSin: '564190000',
        socialInsuranceNumber: '123456789',
      },
      primaryDocuments: {
        citizenshipDate: '2020-01-01',
        currentStatusInCanada: 'StatusInCanada01',
        registrationNumber: 'RegNumber',
        documentType: 'PrimaryDocument01',
        clientNumber: 'ClientNumber',
        givenName: 'GivenName',
        lastName: 'LastName',
        dateOfBirth: '2000-01-01',
        gender: '564190000',
      },
      privacyStatement: {
        agreedToTerms: true,
      },
      requestDetails: { type: '564190000', scenario: '564190000' },
      secondaryDocument: { documentType: '564190000', expiryYear: '2025', expiryMonth: '12' },
    };

    const expected: SinApplicationRequest = {
      SINApplication: {
        Applicant: {
          Certificate: [
            {
              CertificateCategoryCode: {
                ReferenceDataID: '564190001',
                ReferenceDataName: 'PID',
              },
              CertificateEffectiveDate: {
                date: '2020-01-01',
              },
              CertificateIssueDate: {
                date: '2020-01-01',
              },
              Client: {
                PersonBirthDate: {
                  date: '2000-01-01',
                },
                PersonBirthLocation: {
                  LocationContactInformation: [
                    {
                      Address: [
                        {
                          AddressCityName: 'City',
                          AddressCountry: {
                            CountryCode: {
                              ReferenceDataID: 'CA',
                            },
                          },
                          AddressProvince: {
                            ProvinceCode: {
                              ReferenceDataID: 'ON',
                              ReferenceDataName: 'Ontario En',
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
                PersonGenderCode: {
                  ReferenceDataID: '564190000',
                },
                PersonName: [
                  {
                    PersonGivenName: 'GivenName',
                    PersonSurName: 'LastName',
                  },
                ],
              },
              RelatedPerson: [
                {
                  PersonName: [
                    {
                      PersonGivenName: '',
                      PersonSurName: '',
                    },
                  ],
                  PersonRelationshipCode: {
                    ReferenceDataName: 'Parent 1',
                  },
                },
              ],
              ResourceReference: 'Primary Document Citizenship PID.pdf',
            },
            {
              CertificateCategoryCode: {
                ReferenceDataID: '564190000',
                ReferenceDataName: 'SD',
              },
              CertificateExpiryDate: {
                date: '2025-12',
              },
              ResourceReference: 'Secondary Document Passport SD.pdf',
            },
          ],
          ClientLegalStatus: {
            Certificate: [
              {
                CertificateEffectiveDate: {
                  date: '2020-01-01',
                },
              },
            ],
          },
          PersonBirthDate: {
            date: '2000-01-01',
          },
          PersonBirthLocation: {
            LocationContactInformation: [
              {
                Address: [
                  {
                    AddressCityName: 'City',
                    AddressCountry: {
                      CountryCode: {
                        ReferenceDataID: 'CA',
                      },
                    },
                    AddressProvince: {
                      ProvinceCode: {
                        ReferenceDataID: 'ON',
                        ReferenceDataName: 'Ontario En',
                      },
                    },
                  },
                ],
              },
            ],
          },
          PersonContactInformation: [
            {
              Address: [
                {
                  AddressCityName: 'City',
                  AddressCountry: {
                    CountryCode: {
                      ReferenceDataID: 'CA',
                    },
                  },
                  AddressPostalCode: 'PostalCode',
                  AddressProvince: {
                    ProvinceCode: {
                      ReferenceDataID: 'ON',
                      ReferenceDataName: 'Ontario En',
                    },
                  },
                  AddressRecipientName: 'GivenName LastName',
                  AddressSecondaryUnitText: '',
                  AddressStreet: {
                    StreetName: 'Address',
                    StreetNumberText: '',
                  },
                },
              ],
              EmailAddress: [
                {
                  EmailAddressID: 'email@example.com',
                },
              ],
              TelephoneNumber: [
                {
                  FullTelephoneNumber: {
                    TelephoneNumberFullID: '1234567890',
                  },
                  TelephoneNumberCategoryCode: {
                    ReferenceDataName: 'Primary',
                  },
                },
                {
                  FullTelephoneNumber: {
                    TelephoneNumberFullID: '0987654321',
                  },
                  TelephoneNumberCategoryCode: {
                    ReferenceDataName: 'Secondary',
                  },
                },
              ],
            },
          ],
          PersonGenderCode: {
            ReferenceDataID: '564190000',
          },
          PersonLanguage: [
            {
              CommunicationCategoryCode: {
                ReferenceDataName: 'Correspondence',
              },
              LanguageCode: {
                ReferenceDataID: 'EN',
              },
              PreferredIndicator: true,
            },
          ],
          PersonName: [
            {
              PersonGivenName: 'GivenName',
              PersonNameCategoryCode: {
                ReferenceDataName: 'Legal',
              },
              PersonSurName: 'LastName',
            },
            {
              PersonNameCategoryCode: {
                ReferenceDataName: 'at birth',
              },
              PersonSurName: 'LastNameAtBirth',
            },
            {
              PersonGivenName: 'FirstNamePrev',
              PersonNameCategoryCode: {
                ReferenceDataName: 'Alternate',
              },
            },
            {
              PersonNameCategoryCode: {
                ReferenceDataName: 'Alternate',
              },
              PersonSurName: 'LastNamePrev',
            },
          ],
          RelatedPerson: [
            {
              PersonName: [
                {
                  PersonGivenName: 'ParentFirstName',
                  PersonSurName: 'ParentLastName',
                },
              ],
              PersonRelationshipCode: {
                ReferenceDataName: 'Parent 1',
              },
            },
          ],
        },
        SINApplicationCategoryCode: {
          ReferenceDataID: '564190000',
        },
        SINApplicationDetail: [
          {
            ApplicationDetailID: 'SIN Application Submission Scenario',
            ApplicationDetailValue: {
              ValueCode: {
                ReferenceDataID: '564190000',
              },
            },
          },
          {
            ApplicationDetailID: 'SIN Confirmation receiving method',
            ApplicationDetailValue: {
              ValueCode: {
                ReferenceDataID: '564190001',
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
              ValueBoolean: true,
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
            ApplicationDetailID: 'Register indian status on record',
            ApplicationDetailValue: {
              ValueBoolean: false,
            },
          },
        ],
      },
      SystemCredential: idToken,
    };

    const result = mapSubmitSinApplicationRequestToSinApplicationRequest(submitSinApplicationRequest, idToken);

    expect(result).toStrictEqual(expected);
    expect(getCountryById).toHaveBeenCalledWith(countryMock.id);
    expect(getProvinceById).toHaveBeenCalledWith(provinceMock.id);
  });

  it('should map SubmitSinApplicationRequest to SinApplicationRequest correctly when country is US and preferredSameAsDocumentName is false', () => {
    const countryMock: Country = {
      id: 'Country02',
      alphaCode: 'US',
      nameEn: 'United States En',
      nameFr: 'United States Fr',
    };

    vi.mocked(getCountryById).mockReturnValue(countryMock);
    vi.mocked(getProvinceById);

    const idToken = faker.internet.jwt();
    const submitSinApplicationRequest: SubmitSinApplicationRequest = {
      birthDetails: {
        city: 'City',
        province: 'US State',
        country: countryMock.id,
        fromMultipleBirth: false,
      },
      contactInformation: {
        address: 'Address',
        city: 'City',
        province: 'US State',
        country: countryMock.id,
        postalCode: 'PostalCode',
        emailAddress: 'email@example.com',
        primaryPhoneNumber: '1234567890',
        secondaryPhoneNumber: '0987654321',
        preferredLanguage: '564190000',
      },
      currentNameInfo: {
        preferredSameAsDocumentName: false,
        firstName: 'FirstName',
        middleName: 'MiddleName',
        lastName: 'LastName',
        supportingDocuments: {
          required: true,
          documentTypes: ['SupportingDocument01'],
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
            province: 'Parent US State',
          },
        },
      ],
      personalInformation: {
        lastNameAtBirth: 'LastNameAtBirth',
        firstNamePreviouslyUsed: ['FirstNamePrev'],
        lastNamePreviouslyUsed: ['LastNamePrev'],
        gender: '564190000',
      },
      previousSin: {
        hasPreviousSin: '564190000',
        socialInsuranceNumber: '123456789',
      },
      primaryDocuments: {
        citizenshipDate: '2020-01-01',
        currentStatusInCanada: 'StatusInCanada01',
        registrationNumber: 'RegNumber',
        documentType: 'PrimaryDocument01',
        clientNumber: 'ClientNumber',
        givenName: 'GivenName',
        lastName: 'LastName',
        dateOfBirth: '2000-01-01',
        gender: '564190000',
      },
      privacyStatement: {
        agreedToTerms: true,
      },
      requestDetails: { type: '564190000', scenario: '564190000' },
      secondaryDocument: { documentType: '564190000', expiryYear: '2025', expiryMonth: '12' },
    };

    const expected: SinApplicationRequest = {
      SINApplication: {
        Applicant: {
          Certificate: [
            {
              CertificateCategoryCode: {
                ReferenceDataID: '564190001',
                ReferenceDataName: 'PID',
              },
              CertificateEffectiveDate: {
                date: '2020-01-01',
              },
              CertificateIssueDate: {
                date: '2020-01-01',
              },
              Client: {
                PersonBirthDate: {
                  date: '2000-01-01',
                },
                PersonBirthLocation: {
                  LocationContactInformation: [
                    {
                      Address: [
                        {
                          AddressCityName: 'City',
                          AddressCountry: {
                            CountryCode: {
                              ReferenceDataID: 'US',
                            },
                          },
                          AddressProvince: {
                            ProvinceCode: {
                              ReferenceDataName: 'US State',
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
                PersonGenderCode: {
                  ReferenceDataID: '564190000',
                },
                PersonName: [
                  {
                    PersonGivenName: 'GivenName',
                    PersonSurName: 'LastName',
                  },
                ],
              },
              RelatedPerson: [
                {
                  PersonName: [
                    {
                      PersonGivenName: '',
                      PersonSurName: '',
                    },
                  ],
                  PersonRelationshipCode: {
                    ReferenceDataName: 'Parent 1',
                  },
                },
              ],
              ResourceReference: 'Primary Document Citizenship PID.pdf',
            },
            {
              CertificateCategoryCode: {
                ReferenceDataID: '564190000',
                ReferenceDataName: 'SD',
              },
              CertificateExpiryDate: {
                date: '2025-12',
              },
              ResourceReference: 'Secondary Document Passport SD.pdf',
            },
          ],
          ClientLegalStatus: {
            Certificate: [
              {
                CertificateEffectiveDate: {
                  date: '2020-01-01',
                },
              },
            ],
          },
          PersonBirthDate: {
            date: '2000-01-01',
          },
          PersonBirthLocation: {
            LocationContactInformation: [
              {
                Address: [
                  {
                    AddressCityName: 'City',
                    AddressCountry: {
                      CountryCode: {
                        ReferenceDataID: 'US',
                      },
                    },
                    AddressProvince: {
                      ProvinceCode: {
                        ReferenceDataName: 'US State',
                      },
                    },
                  },
                ],
              },
            ],
          },
          PersonContactInformation: [
            {
              Address: [
                {
                  AddressCityName: 'City',
                  AddressCountry: {
                    CountryCode: {
                      ReferenceDataID: 'US',
                    },
                  },
                  AddressPostalCode: 'PostalCode',
                  AddressProvince: {
                    ProvinceCode: {
                      ReferenceDataName: 'US State',
                    },
                  },
                  AddressRecipientName: 'FirstName MiddleName LastName',
                  AddressSecondaryUnitText: '',
                  AddressStreet: {
                    StreetName: 'Address',
                    StreetNumberText: '',
                  },
                },
              ],
              EmailAddress: [
                {
                  EmailAddressID: 'email@example.com',
                },
              ],
              TelephoneNumber: [
                {
                  FullTelephoneNumber: {
                    TelephoneNumberFullID: '1234567890',
                  },
                  TelephoneNumberCategoryCode: {
                    ReferenceDataName: 'Primary',
                  },
                },
                {
                  FullTelephoneNumber: {
                    TelephoneNumberFullID: '0987654321',
                  },
                  TelephoneNumberCategoryCode: {
                    ReferenceDataName: 'Secondary',
                  },
                },
              ],
            },
          ],
          PersonGenderCode: {
            ReferenceDataID: '564190000',
          },
          PersonLanguage: [
            {
              CommunicationCategoryCode: {
                ReferenceDataName: 'Correspondence',
              },
              LanguageCode: {
                ReferenceDataID: 'EN',
              },
              PreferredIndicator: true,
            },
          ],
          PersonName: [
            {
              PersonGivenName: 'FirstName MiddleName',
              PersonNameCategoryCode: {
                ReferenceDataName: 'Legal',
              },
              PersonSurName: 'LastName',
            },
            {
              PersonNameCategoryCode: {
                ReferenceDataName: 'at birth',
              },
              PersonSurName: 'LastNameAtBirth',
            },
            {
              PersonGivenName: 'FirstNamePrev',
              PersonNameCategoryCode: {
                ReferenceDataName: 'Alternate',
              },
            },
            {
              PersonNameCategoryCode: {
                ReferenceDataName: 'Alternate',
              },
              PersonSurName: 'LastNamePrev',
            },
          ],
          RelatedPerson: [
            {
              PersonName: [
                {
                  PersonGivenName: 'ParentFirstName',
                  PersonSurName: 'ParentLastName',
                },
              ],
              PersonRelationshipCode: {
                ReferenceDataName: 'Parent 1',
              },
            },
          ],
        },
        SINApplicationCategoryCode: {
          ReferenceDataID: '564190000',
        },
        SINApplicationDetail: [
          {
            ApplicationDetailID: 'SIN Application Submission Scenario',
            ApplicationDetailValue: {
              ValueCode: {
                ReferenceDataID: '564190000',
              },
            },
          },
          {
            ApplicationDetailID: 'SIN Confirmation receiving method',
            ApplicationDetailValue: {
              ValueCode: {
                ReferenceDataID: '564190001',
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
            ApplicationDetailID: 'Register indian status on record',
            ApplicationDetailValue: {
              ValueBoolean: false,
            },
          },
        ],
      },
      SystemCredential: idToken,
    };

    const result = mapSubmitSinApplicationRequestToSinApplicationRequest(submitSinApplicationRequest, idToken);

    expect(result).toStrictEqual(expected);
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
