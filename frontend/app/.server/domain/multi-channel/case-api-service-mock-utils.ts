import { fakerEN_CA, fakerFR_CA } from '@faker-js/faker';
import type { Faker } from '@faker-js/faker';

import type {
  SinCaseBirthDetailsDto,
  SinCaseCurrentNameDto,
  SinCaseDto,
  SinCaseParentDetailsDto,
} from '~/.server/domain/multi-channel/sin-case-models';
import { getApplicantGenders } from '~/.server/domain/person-case/services/applicant-gender-service';
import { getApplicantSupportingDocumentTypes } from '~/.server/domain/person-case/services/applicant-supporting-document-service';
import { getApplicationSubmissionScenarios } from '~/.server/domain/person-case/services/application-submission-scenario';
import { getTypesOfApplicationToSubmit } from '~/.server/domain/person-case/services/application-type-service';
import { getLanguagesOfCorrespondence } from '~/.server/domain/person-case/services/language-correspondence-service';
import { serverEnvironment } from '~/.server/environment';
import { getProvinces } from '~/.server/shared/services/province-service';
import { APPLICANT_PRIMARY_DOCUMENT_CHOICE, APPLICANT_STATUS_IN_CANADA } from '~/domain/constants';
import { formatSin, isValidSin } from '~/utils/sin-utils';

fakerEN_CA.seed(123);
fakerFR_CA.seed(123);

function getFaker(lang: Language): Faker {
  return lang === 'fr' ? fakerFR_CA : fakerEN_CA;
}

/**
 * Generates a valid-format SIN number
 * @returns {string} A 9-digit SIN number
 */
function generateSIN(faker: Faker) {
  // Generate a fake SIN that follows format but isn't a real SIN
  let sin = '';

  do {
    sin = faker.helpers.fromRegExp('8[0-9]{8}');
  } while (!isValidSin(sin));

  return formatSin(sin);
}

/**
 * Generates a random date in ISO format for a given range
 * @param {number} startYear - The earliest year to generate
 * @param {number} endYear - The latest year to generate
 * @returns {Object} Object containing date parts and full date
 */
function generateDateInfo(faker: Faker, startYear = 1950, endYear = 2000) {
  const date = faker.date.between({
    from: `${startYear}-01-01`,
    to: `${endYear}-12-31`,
  });

  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return {
    year,
    month,
    day,
    fullDate: `${year}-${month}-${day}`,
  };
}

/**
 * Generates birth location details
 * @returns {Object} Birth location object
 */
function generateBirthLocation(faker: Faker): SinCaseBirthDetailsDto {
  return {
    fromMultipleBirth: false,
    country: serverEnvironment.PP_CANADA_COUNTRY_CODE,
    province: faker.helpers.arrayElement(getProvinces().map(({ id }) => id)),
    city: faker.location.city(),
  };
}

function generateParentDetailsDto(faker: Faker): SinCaseParentDetailsDto {
  return faker.helpers.arrayElement([
    {
      unavailable: true,
    },
    {
      unavailable: false,
      givenName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      birthLocation: generateBirthLocation(faker),
    },
  ]);
}

function generateCurrentNameInfo(faker: Faker): SinCaseCurrentNameDto {
  return faker.helpers.arrayElement([
    {
      preferredSameAsDocumentName: true,
    },
    {
      preferredSameAsDocumentName: false,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      supportingDocuments: {
        required: false,
      },
    },
    {
      preferredSameAsDocumentName: false,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      supportingDocuments: {
        required: true,
        documentTypes: faker.helpers.arrayElements(getApplicantSupportingDocumentTypes().map(({ id }) => id)),
      },
    },
  ]);
}

/**
 * Generates a specified number of mock SIN application cases
 * @param {number} count - Number of cases to generate
 * @returns {Array} Array of mock cases
 */
export function generateMockSinCases(count = 10): SinCaseDto[] {
  const cases: SinCaseDto[] = [];

  for (let i = 0; i < count; i++) {
    const lang = fakerEN_CA.helpers.arrayElement<Language>(['en', 'fr']);
    const faker = getFaker(lang);

    const birthDate = generateDateInfo(faker, 1950, 2005);
    const citizenshipDate = generateDateInfo(
      faker,
      Number.parseInt(birthDate.year),
      Math.min(parseInt(birthDate.year) + 30, new Date().getFullYear() - 1),
    );

    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const gender = faker.helpers.arrayElement(getApplicantGenders().map(({ id }) => id));

    const hasPreviousSin = faker.helpers.arrayElement([serverEnvironment.PP_HAS_HAD_PREVIOUS_SIN_CODE, '564190001']);
    const parentCount = faker.number.int({ min: 1, max: 2 });

    cases.push({
      caseId: i.toString().padStart(9, '0'),
      birthDetails: {
        ...generateBirthLocation(faker),
        fromMultipleBirth: faker.datatype.boolean(),
      },
      contactInformation: {
        preferredLanguage: faker.helpers.arrayElement(getLanguagesOfCorrespondence().map(({ id }) => id)),
        primaryPhoneNumber: faker.phone.number({ style: 'international' }),
        emailAddress: faker.internet.email(),
        country: serverEnvironment.PP_CANADA_COUNTRY_CODE,
        province: faker.helpers.arrayElement(getProvinces().map(({ id }) => id)),
        city: faker.location.city(),
        address: faker.location.streetAddress(),
        postalCode: fakerEN_CA.location.zipCode({ state: fakerEN_CA.location.state({ abbreviated: true }) }),
      },
      currentNameInfo: generateCurrentNameInfo(faker),
      parentDetails: Array.from({ length: parentCount }, () => generateParentDetailsDto(faker)),
      personalInformation: {
        firstNamePreviouslyUsed: faker.helpers.arrayElement([
          [],
          [faker.person.firstName()],
          [faker.person.firstName(), faker.person.firstName()],
        ]),
        lastNameAtBirth: lastName,
        lastNamePreviouslyUsed: faker.helpers.arrayElement([[], [faker.person.lastName()]]),
        gender: gender,
      },
      previousSin:
        hasPreviousSin === serverEnvironment.PP_HAS_HAD_PREVIOUS_SIN_CODE
          ? { hasPreviousSin: serverEnvironment.PP_HAS_HAD_PREVIOUS_SIN_CODE, socialInsuranceNumber: generateSIN(faker) }
          : { hasPreviousSin: '564190001' },
      primaryDocuments: {
        currentStatusInCanada: APPLICANT_STATUS_IN_CANADA.canadianCitizenBornOutsideCanada,
        documentType: APPLICANT_PRIMARY_DOCUMENT_CHOICE.certificateOfCanadianCitizenship,
        registrationNumber: faker.string.numeric(8),
        clientNumber: faker.string.numeric(10),
        givenName: firstName,
        lastName: lastName,
        dateOfBirth: birthDate.fullDate,
        gender: gender,
        citizenshipDate: citizenshipDate.fullDate,
      },
      privacyStatement: { agreedToTerms: true },
      requestDetails: {
        scenario: faker.helpers.arrayElement(getApplicationSubmissionScenarios().map(({ id }) => id)),
        type: faker.helpers.arrayElement(getTypesOfApplicationToSubmit().map(({ id }) => id)),
      },
      secondaryDocument: {
        documentType: faker.helpers.arrayElement(['564190000', '564190001']),
        expiryYear: (new Date().getFullYear() + faker.number.int({ min: 1, max: 5 })).toString(),
        expiryMonth: faker.helpers.arrayElement(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']),
      },
    } satisfies SinCaseDto);
  }

  return cases;
}
