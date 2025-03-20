import { describe, it, expect, vi } from 'vitest';

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

vi.mock('~/.server/domain/person-case/services/applicant-status-in-canada-service');
vi.mock('~/.server/domain/person-case/services/applicant-supporting-document-service');
vi.mock('~/.server/domain/person-case/services/applicant-primary-document-service');

describe('mapSubmitSinApplicationRequestToSinApplicationRequest', () => {
  it('should map SubmitSinApplicationRequest to SinApplicationRequest correctly when preferredSameAsDocumentName is true', () => {
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

    vi.mocked(getApplicantStatusInCanadaChoicesById).mockReturnValueOnce(applicantStatusInCanadaChoiceMock);
    vi.mocked(getApplicantPrimaryDocumentChoiceById).mockReturnValueOnce(applicantPrimaryDocumentChoiceMock);
    vi.mocked(getApplicantSupportingDocumentTypesById);

    const submitSinApplicationRequest: SubmitSinApplicationRequest = {
      birthDetails: {
        city: 'City',
        province: 'Province',
        country: 'Country',
        fromMultipleBirth: false,
      },
      contactInformation: {
        address: 'Address',
        city: 'City',
        province: 'Province',
        country: 'Country',
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
            country: 'ParentCountry',
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
      requestDetails: { type: 'RequestType', scenario: 'Scenario' },
      secondaryDocument: { documentType: 'SecDocType', expiryYear: '2025', expiryMonth: '12' },
    };

    const expected: SinApplicationRequest = {
      SystemCredential: 'KwisatzHaderach',
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
                ReferenceDataID: '564190002',
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
                                ReferenceDataID: 'ParentCountry',
                              },
                            },
                            AddressProvince: {
                              ProvinceCode: {
                                ReferenceDataID: 'ParentProvince',
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
                      ReferenceDataID: 'Province',
                    },
                  },
                  AddressCountry: {
                    CountryCode: {
                      ReferenceDataID: 'Country',
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
                        ReferenceDataID: 'Province',
                      },
                    },
                    AddressCountry: {
                      CountryCode: {
                        ReferenceDataID: 'Country',
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

    const result = mapSubmitSinApplicationRequestToSinApplicationRequest(submitSinApplicationRequest);

    expect(result).toStrictEqual(expected);
    expect(getApplicantStatusInCanadaChoicesById).toHaveBeenCalledExactlyOnceWith(applicantStatusInCanadaChoiceMock.id);
    expect(getApplicantPrimaryDocumentChoiceById).toHaveBeenCalledExactlyOnceWith(applicantPrimaryDocumentChoiceMock.id);
    expect(getApplicantSupportingDocumentTypesById).not.toHaveBeenCalled();
  });

  it('should map SubmitSinApplicationRequest to SinApplicationRequest correctly when preferredSameAsDocumentName is false', () => {
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

    vi.mocked(getApplicantStatusInCanadaChoicesById).mockReturnValueOnce(applicantStatusInCanadaChoiceMock);
    vi.mocked(getApplicantPrimaryDocumentChoiceById).mockReturnValueOnce(applicantPrimaryDocumentChoiceMock);
    vi.mocked(getApplicantSupportingDocumentTypesById).mockReturnValueOnce(applicantSupportingDocumentTypeMock);

    const submitSinApplicationRequest: SubmitSinApplicationRequest = {
      birthDetails: {
        city: 'City',
        province: 'Province',
        country: 'Country',
        fromMultipleBirth: false,
      },
      contactInformation: {
        address: 'Address',
        city: 'City',
        province: 'Province',
        country: 'Country',
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
            country: 'ParentCountry',
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
      requestDetails: { type: 'RequestType', scenario: 'Scenario' },
      secondaryDocument: { documentType: 'SecDocType', expiryYear: '2025', expiryMonth: '12' },
    };

    const expected: SinApplicationRequest = {
      SystemCredential: 'KwisatzHaderach',
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
                ReferenceDataID: '564190002',
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
                                ReferenceDataID: 'ParentCountry',
                              },
                            },
                            AddressProvince: {
                              ProvinceCode: {
                                ReferenceDataID: 'ParentProvince',
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
                      ReferenceDataID: 'Province',
                    },
                  },
                  AddressCountry: {
                    CountryCode: {
                      ReferenceDataID: 'Country',
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
                        ReferenceDataID: 'Province',
                      },
                    },
                    AddressCountry: {
                      CountryCode: {
                        ReferenceDataID: 'Country',
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

    const result = mapSubmitSinApplicationRequestToSinApplicationRequest(submitSinApplicationRequest);

    expect(result).toStrictEqual(expected);
    expect(getApplicantStatusInCanadaChoicesById).toHaveBeenCalledExactlyOnceWith(applicantStatusInCanadaChoiceMock.id);
    expect(getApplicantPrimaryDocumentChoiceById).toHaveBeenCalledExactlyOnceWith(applicantPrimaryDocumentChoiceMock.id);
    expect(getApplicantSupportingDocumentTypesById).toHaveBeenCalledExactlyOnceWith(applicantSupportingDocumentTypeMock.id);
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
