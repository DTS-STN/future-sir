import { parsePhoneNumberWithError } from 'libphonenumber-js';
import * as v from 'valibot';

import {
  getApplicantGenders,
  getLocalizedApplicantGenderById,
} from '~/.server/domain/person-case/services/applicant-gender-service';
import {
  getApplicantSecondaryDocumentChoices,
  getLocalizedApplicantSecondaryDocumentChoiceById,
} from '~/.server/domain/person-case/services/applicant-secondary-document-service';
import { getApplicantHadSinOptions } from '~/.server/domain/person-case/services/applicant-sin-service';
import { getApplicantSupportingDocumentTypes } from '~/.server/domain/person-case/services/applicant-supporting-document-service';
import { getApplicationSubmissionScenarios } from '~/.server/domain/person-case/services/application-submission-scenario';
import { getTypesOfApplicationToSubmit } from '~/.server/domain/person-case/services/application-type-service';
import {
  getLanguagesOfCorrespondence,
  getLocalizedLanguageOfCorrespondenceById,
} from '~/.server/domain/person-case/services/language-correspondence-service';
import { serverEnvironment } from '~/.server/environment';
import { getCountries, getLocalizedCountryById } from '~/.server/shared/services/country-service';
import { getLocalizedProvinceById, getProvinces } from '~/.server/shared/services/province-service';
import { stringToIntegerSchema } from '~/.server/validation/string-to-integer-schema';
import { APPLICANT_STATUS_IN_CANADA } from '~/domain/constants';
import type { InPersonSinApplication } from '~/routes/protected/sin-application/types';
import { getStartOfDayInTimezone, isDateInPastOrTodayInTimeZone, isValidDateString, toISODateString } from '~/utils/date-utils';
import { REGEX_PATTERNS } from '~/utils/regex-utils';
import { formatSin, isValidSin } from '~/utils/sin-utils';
import { trimToUndefined } from '~/utils/string-utils';

const validBornOutsideOfCanadaDocuments = [
  'certificate-of-canadian-citizenship', //
] as const;

const validCanadianStatuses = [APPLICANT_STATUS_IN_CANADA.canadianCitizenBornOutsideCanada] as const;

function toDateString(year?: string, month?: string, day?: string): string {
  try {
    return toISODateString(Number(year), Number(month), Number(day));
  } catch {
    return '';
  }
}

const REQUIRE_OPTIONS = { yes: 'Yes', no: 'No' } as const;
export const maxNumberOfParents = 4 as const;

export const birthDetailsSchema = v.variant(
  'country',
  [
    v.object({
      country: v.literal(serverEnvironment.PP_CANADA_COUNTRY_CODE, 'protected:birth-details.country.invalid-country'),
      province: v.lazy(() =>
        v.picklist(
          getProvinces().map(({ id }) => id),
          'protected:birth-details.province.required-province',
        ),
      ),
      city: v.pipe(
        v.string('protected:birth-details.city.required-city'),
        v.trim(),
        v.nonEmpty('protected:birth-details.city.required-city'),
        v.maxLength(100, 'protected:birth-details.city.invalid-city'),
        v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:birth-details.city.invalid-city'),
      ),
      fromMultipleBirth: v.boolean('protected:birth-details.from-multiple.required-from-multiple'),
    }),
    v.object({
      country: v.pipe(
        v.string('protected:birth-details.country.required-country'),
        v.nonEmpty('protected:birth-details.country.required-country'),
        v.excludes(serverEnvironment.PP_CANADA_COUNTRY_CODE, 'protected:birth-details.country.invalid-country'),
        v.lazy(() =>
          v.picklist(
            getCountries().map(({ id }) => id),
            'protected:birth-details.country.invalid-country',
          ),
        ),
      ),
      province: v.optional(
        v.pipe(
          v.string('protected:birth-details.province.required-province'),
          v.trim(),
          v.nonEmpty('protected:birth-details.province.required-province'),
          v.maxLength(100, 'protected:birth-details.province.invalid-province'),
          v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:birth-details.province.invalid-province'),
        ),
      ),
      city: v.optional(
        v.pipe(
          v.string('protected:birth-details.city.required-city'),
          v.trim(),
          v.nonEmpty('protected:birth-details.city.required-city'),
          v.maxLength(100, 'protected:birth-details.city.invalid-city'),
          v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:birth-details.city.invalid-city'),
        ),
      ),
      fromMultipleBirth: v.boolean('protected:birth-details.from-multiple.required-from-multiple'),
    }),
  ],
  'protected:birth-details.country.required-country',
);

export const parseBirthDetails = (formData: FormData) =>
  v.safeParse(birthDetailsSchema, {
    country: formData.get('country') as string,
    province: trimToUndefined(formData.get('province') as string),
    city: trimToUndefined(formData.get('city') as string),
    fromMultipleBirth: formData.get('from-multiple')
      ? formData.get('from-multiple') === REQUIRE_OPTIONS.yes //
      : undefined,
  });

export const contactInformationSchema = v.intersect([
  v.object({
    preferredLanguage: v.lazy(() =>
      v.picklist(
        getLanguagesOfCorrespondence().map(({ id }) => id),
        'protected:contact-information.error-messages.preferred-language-required',
      ),
    ),
    primaryPhoneNumber: v.pipe(
      v.string(),
      v.trim(),
      v.nonEmpty('protected:contact-information.error-messages.primary-phone-required'),
      v.transform((val) => parsePhoneNumberWithError(val, 'CA').formatInternational().replace(/ /g, '')),
    ),
    secondaryPhoneNumber: v.optional(
      v.pipe(
        v.string(),
        v.trim(),
        v.transform((val) => parsePhoneNumberWithError(val, 'CA').formatInternational().replace(/ /g, '')),
      ),
    ),
    emailAddress: v.optional(
      v.pipe(v.string(), v.trim(), v.email('protected:contact-information.error-messages.email-address-invalid-format')),
    ),
  }),
  v.variant(
    'country',
    [
      v.object({
        country: v.literal(serverEnvironment.PP_CANADA_COUNTRY_CODE),
        province: v.lazy(() =>
          v.picklist(
            getProvinces().map(({ id }) => id),
            'protected:contact-information.error-messages.province-required',
          ),
        ),
        address: v.pipe(v.string(), v.trim(), v.nonEmpty('protected:contact-information.error-messages.address-required')),
        postalCode: v.pipe(
          v.string(),
          v.trim(),
          v.nonEmpty('protected:contact-information.error-messages.postal-code-required'),
        ),
        city: v.pipe(v.string(), v.trim(), v.nonEmpty('protected:contact-information.error-messages.city-required')),
      }),
      v.object({
        country: v.lazy(() => v.picklist(getCountries().map(({ id }) => id))),
        province: v.pipe(v.string(), v.trim(), v.nonEmpty('protected:contact-information.error-messages.province-required')),
        address: v.pipe(v.string(), v.trim(), v.nonEmpty('protected:contact-information.error-messages.address-required')),
        postalCode: v.pipe(
          v.string(),
          v.trim(),
          v.nonEmpty('protected:contact-information.error-messages.postal-code-required'),
        ),
        city: v.pipe(v.string(), v.trim(), v.nonEmpty('protected:contact-information.error-messages.city-required')),
      }),
    ],
    'protected:contact-information.error-messages.country-required',
  ),
]);

export const parseContactInformation = (formData: FormData) =>
  v.safeParse(contactInformationSchema, {
    preferredLanguage: formData.get('preferredLanguage') as string,
    primaryPhoneNumber: formData.get('primaryPhoneNumber') as string,
    secondaryPhoneNumber: formData.get('secondaryPhoneNumber') ? (formData.get('secondaryPhoneNumber') as string) : undefined,
    emailAddress: formData.get('emailAddress') ? (formData.get('emailAddress') as string) : undefined,
    country: formData.get('country') as string,
    address: formData.get('address') as string,
    postalCode: formData.get('postalCode') as string,
    city: formData.get('city') as string,
    province: formData.get('province') as string,
  });

export const currentNameSchema = v.variant(
  'preferredSameAsDocumentName',
  [
    v.object({ preferredSameAsDocumentName: v.literal(true) }),
    v.object({
      preferredSameAsDocumentName: v.literal(false),
      firstName: v.pipe(
        v.string('protected:current-name.first-name-error.required-error'),
        v.trim(),
        v.nonEmpty('protected:current-name.first-name-error.required-error'),
        v.maxLength(100, 'protected:current-name.first-name-error.max-length-error'),
        v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:current-name.first-name-error.format-error'),
      ),
      middleName: v.optional(
        v.pipe(
          v.string('protected:current-name.middle-name-error.required-error'),
          v.trim(),
          v.maxLength(100, 'protected:current-name.middle-name-error.max-length-error'),
          v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:current-name.middle-name-error.format-error'),
        ),
      ),
      lastName: v.pipe(
        v.string('protected:current-name.last-name-error.required-error'),
        v.trim(),
        v.nonEmpty('protected:current-name.last-name-error.required-error'),
        v.maxLength(100, 'protected:current-name.last-name-error.max-length-error'),
        v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:current-name.last-name-error.format-error'),
      ),
      supportingDocuments: v.variant(
        'required',
        [
          v.object({ required: v.literal(false) }),
          v.object({
            required: v.literal(true),
            documentTypes: v.pipe(
              v.array(
                v.lazy(() =>
                  v.picklist(
                    getApplicantSupportingDocumentTypes().map((doc) => doc.id),
                    'protected:current-name.supporting-error.invalid-error',
                  ),
                ),
              ),
              v.nonEmpty('protected:current-name.supporting-error.required-error'),
              v.checkItems(
                (item, index, array) => array.indexOf(item) === index,
                'protected:current-name.supporting-error.duplicate-error',
              ),
            ),
          }),
        ],
        'protected:current-name.supporting-error.required-error',
      ),
    }),
  ],
  'protected:current-name.preferred-name.required-error',
);

export const parseCurrentName = (formData: FormData) =>
  v.safeParse(currentNameSchema, {
    preferredSameAsDocumentName: formData.get('same-name')
      ? formData.get('same-name') === REQUIRE_OPTIONS.yes //
      : undefined,
    firstName: String(formData.get('first-name')),
    middleName: trimToUndefined(String(formData.get('middle-name'))),
    lastName: String(formData.get('last-name')),
    supportingDocuments: {
      required: formData.get('docs-required')
        ? formData.get('docs-required') === REQUIRE_OPTIONS.yes //
        : undefined,
      documentTypes: formData.getAll('doc-type').map(String),
    },
  });

export const parentDetailsSchema = v.pipe(
  v.array(
    v.variant(
      'unavailable',
      [
        v.object({
          unavailable: v.literal(true),
        }),
        v.object({
          unavailable: v.literal(false),
          givenName: v.pipe(
            v.string('protected:parent-details.given-name-error.required-error'),
            v.trim(),
            v.nonEmpty('protected:parent-details.given-name-error.required-error'),
            v.maxLength(100, 'protected:parent-details.given-name-error.max-length-error'),
            v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:parent-details.given-name-error.format-error'),
          ),
          lastName: v.pipe(
            v.string('protected:parent-details.last-name-error.required-error'),
            v.trim(),
            v.nonEmpty('protected:parent-details.last-name-error.required-error'),
            v.maxLength(100, 'protected:parent-details.last-name-error.max-length-error'),
            v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:parent-details.last-name-error.format-error'),
          ),
          birthLocation: v.variant(
            'country',
            [
              v.object({
                country: v.literal(
                  serverEnvironment.PP_CANADA_COUNTRY_CODE,
                  'protected:parent-details.country-error.invalid-country',
                ),
                province: v.lazy(() =>
                  v.picklist(
                    getProvinces().map(({ id }) => id),
                    'protected:parent-details.province-error.required-province',
                  ),
                ),
                city: v.pipe(
                  v.string('protected:parent-details.city-error.required-city'),
                  v.trim(),
                  v.nonEmpty('protected:parent-details.city-error.required-city'),
                  v.maxLength(100, 'protected:parent-details.city-error.invalid-city'),
                  v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:parent-details.city-error.invalid-city'),
                ),
              }),
              v.object({
                country: v.pipe(
                  v.string('protected:parent-details.country-error.required-country'),
                  v.nonEmpty('protected:parent-details.country-error.required-country'),
                  v.excludes(
                    serverEnvironment.PP_CANADA_COUNTRY_CODE,
                    'protected:parent-details.country-error.invalid-country',
                  ),
                  v.lazy(() =>
                    v.picklist(
                      getCountries().map(({ id }) => id),
                      'protected:parent-details.country-error.invalid-country',
                    ),
                  ),
                ),
                province: v.optional(
                  v.pipe(
                    v.string('protected:parent-details.province-error.required-province'),
                    v.trim(),
                    v.nonEmpty('protected:parent-details.province-error.required-province'),
                    v.maxLength(100, 'protected:parent-details.province-error.invalid-province'),
                    v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:parent-details.province-error.invalid-province'),
                  ),
                ),
                city: v.optional(
                  v.pipe(
                    v.string('protected:parent-details.city-error.required-city'),
                    v.trim(),
                    v.nonEmpty('protected:parent-details.city-error.required-city'),
                    v.maxLength(100, 'protected:parent-details.city-error.invalid-city'),
                    v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:parent-details.city-error.invalid-city'),
                  ),
                ),
              }),
            ],
            'protected:parent-details.country-error.required-country',
          ),
        }),
      ],
      'protected:parent-details.details-unavailable',
    ),
    'protected:parent-details.details-unavailable',
  ),
  v.minLength(1),
  v.maxLength(maxNumberOfParents),
);

export const parseParentDetails = (formData: FormData) =>
  v.safeParse(
    parentDetailsSchema,
    Array.from({ length: Math.min(Number(formData.get('parent-amount')) || 0, maxNumberOfParents) }).map((_, i) => ({
      unavailable: Boolean(formData.get(`${i}-unavailable`)),
      givenName: String(formData.get(`${i}-given-name`)),
      lastName: String(formData.get(`${i}-last-name`)),
      birthLocation: {
        country: String(formData.get(`${i}-country`)),
        province: trimToUndefined(String(formData.get(`${i}-province`))),
        city: trimToUndefined(String(formData.get(`${i}-city`))),
      },
    })),
  );

export const personalInfoSchema = v.object({
  firstNamePreviouslyUsed: v.optional(
    v.array(
      v.pipe(
        v.string(),
        v.trim(),
        v.maxLength(100, 'protected:personal-information.first-name-previously-used.max-length'),
        v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:personal-information.first-name-previously-used.format'),
      ),
    ),
  ),
  lastNameAtBirth: v.pipe(
    v.string('protected:personal-information.last-name-at-birth.required'),
    v.trim(),
    v.nonEmpty('protected:personal-information.last-name-at-birth.required'),
    v.maxLength(100, 'protected:personal-information.last-name-at-birth.max-length'),
    v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:personal-information.last-name-at-birth.format'),
  ),
  lastNamePreviouslyUsed: v.optional(
    v.array(
      v.pipe(
        v.string(),
        v.trim(),
        v.maxLength(100, 'protected:personal-information.last-name-previously-used.max-length'),
        v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:personal-information.last-name-previously-used.format'),
      ),
    ),
  ),
  gender: v.lazy(() =>
    v.picklist(
      getApplicantGenders().map(({ id }) => id),
      'protected:personal-information.gender.required',
    ),
  ),
});

export const parsePersonalInfo = (formData: FormData) =>
  v.safeParse(personalInfoSchema, {
    firstNamePreviouslyUsed: formData.getAll('firstNamePreviouslyUsed').map(String).filter(Boolean),
    lastNameAtBirth: String(formData.get('lastNameAtBirth')),
    lastNamePreviouslyUsed: formData.getAll('lastNamePreviouslyUsed').map(String).filter(Boolean),
    gender: String(formData.get('gender')),
  });

export const previousSinSchema = v.pipe(
  v.object({
    hasPreviousSin: v.lazy(() =>
      v.picklist(
        getApplicantHadSinOptions().map(({ id }) => id),
        'protected:previous-sin.error-messages.has-previous-sin-required',
      ),
    ),
    socialInsuranceNumber: v.optional(
      v.pipe(
        v.string(),
        v.trim(),
        v.check((sin) => isValidSin(sin), 'protected:previous-sin.error-messages.sin-required'),
        v.transform((sin) => formatSin(sin, '')),
      ),
    ),
  }),
  v.forward(
    v.partialCheck(
      [['hasPreviousSin'], ['socialInsuranceNumber']],
      (input) =>
        input.socialInsuranceNumber === undefined ||
        (input.hasPreviousSin === serverEnvironment.PP_HAS_HAD_PREVIOUS_SIN_CODE &&
          isValidSin(input.socialInsuranceNumber ?? '')),
      'protected:previous-sin.error-messages.sin-required',
    ),
    ['socialInsuranceNumber'],
  ),
);

export const parsePreviousSin = (formData: FormData) =>
  v.safeParse(previousSinSchema, {
    hasPreviousSin: formData.get('hasPreviousSin') as string,
    socialInsuranceNumber:
      formData.get('hasPreviousSin') === serverEnvironment.PP_HAS_HAD_PREVIOUS_SIN_CODE
        ? (formData.get('socialInsuranceNumber') as string)
        : undefined,
  });

export const primaryDocumentSchema = v.intersect([
  v.object({
    currentStatusInCanada: v.pipe(
      v.string('protected:primary-identity-document.current-status-in-canada.required'),
      v.trim(),
      v.nonEmpty('protected:primary-identity-document.current-status-in-canada.required'),
      v.picklist(validCanadianStatuses, 'protected:primary-identity-document.current-status-in-canada.invalid'),
    ),
  }),
  v.variant(
    'documentType',
    [
      v.object({
        documentType: v.picklist(
          validBornOutsideOfCanadaDocuments,
          'protected:primary-identity-document.document-type.invalid',
        ),
        registrationNumber: v.pipe(
          v.string('protected:primary-identity-document.registration-number.required'),
          v.trim(),
          v.nonEmpty('protected:primary-identity-document.registration-number.required'),
          v.length(8, 'protected:primary-identity-document.registration-number.invalid'),
          v.regex(REGEX_PATTERNS.DIGIT_ONLY, 'protected:primary-identity-document.registration-number.invalid'),
        ),
        clientNumber: v.pipe(
          v.string('protected:primary-identity-document.client-number.required'),
          v.trim(),
          v.nonEmpty('protected:primary-identity-document.client-number.required'),
          v.length(10, 'protected:primary-identity-document.client-number.invalid'),
          v.regex(REGEX_PATTERNS.DIGIT_ONLY, 'protected:primary-identity-document.client-number.invalid'),
        ),
        givenName: v.pipe(
          v.string('protected:primary-identity-document.given-name.required'),
          v.trim(),
          v.nonEmpty('protected:primary-identity-document.given-name.required'),
          v.maxLength(100, 'protected:primary-identity-document.given-name.max-length'),
          v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:primary-identity-document.given-name.format'),
        ),
        lastName: v.pipe(
          v.string('protected:primary-identity-document.last-name.required'),
          v.trim(),
          v.nonEmpty('protected:primary-identity-document.last-name.required'),
          v.maxLength(100, 'protected:primary-identity-document.last-name.max-length'),
          v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:primary-identity-document.last-name.format'),
        ),
        dateOfBirthYear: v.pipe(
          stringToIntegerSchema('protected:primary-identity-document.date-of-birth.required-year'),
          v.minValue(1, 'protected:primary-identity-document.date-of-birth.invalid-year'),
          v.maxValue(
            getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE).getFullYear(),
            'protected:primary-identity-document.date-of-birth.invalid-year',
          ),
        ),
        dateOfBirthMonth: v.pipe(
          stringToIntegerSchema('protected:primary-identity-document.date-of-birth.required-month'),
          v.minValue(1, 'protected:primary-identity-document.date-of-birth.invalid-month'),
          v.maxValue(12, 'protected:primary-identity-document.date-of-birth.invalid-month'),
        ),
        dateOfBirthDay: v.pipe(
          stringToIntegerSchema('protected:primary-identity-document.date-of-birth.required-day'),
          v.minValue(1, 'protected:primary-identity-document.date-of-birth.invalid-day'),
          v.maxValue(31, 'protected:primary-identity-document.date-of-birth.invalid-day'),
        ),
        dateOfBirth: v.pipe(
          v.string(),
          v.custom((input) => isValidDateString(input as string), 'protected:primary-identity-document.date-of-birth.invalid'),
          v.custom(
            (input) => isDateInPastOrTodayInTimeZone(serverEnvironment.BASE_TIMEZONE, input as string),
            'protected:primary-identity-document.date-of-birth.invalid-future-date',
          ),
        ),
        gender: v.lazy(() =>
          v.picklist(
            getApplicantGenders().map(({ id }) => id),
            'protected:primary-identity-document.gender.required',
          ),
        ),
        citizenshipDateYear: v.pipe(
          stringToIntegerSchema('protected:primary-identity-document.citizenship-date.required-year'),
          v.minValue(1, 'protected:primary-identity-document.citizenship-date.invalid-year'),
          v.maxValue(
            getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE).getFullYear(),
            'protected:primary-identity-document.citizenship-date.invalid-year',
          ),
        ),
        citizenshipDateMonth: v.pipe(
          stringToIntegerSchema('protected:primary-identity-document.citizenship-date.required-month'),
          v.minValue(1, 'protected:primary-identity-document.citizenship-date.invalid-month'),
          v.maxValue(12, 'protected:primary-identity-document.citizenship-date.invalid-month'),
        ),
        citizenshipDateDay: v.pipe(
          stringToIntegerSchema('protected:primary-identity-document.citizenship-date.required-day'),
          v.minValue(1, 'protected:primary-identity-document.citizenship-date.invalid-day'),
          v.maxValue(31, 'protected:primary-identity-document.citizenship-date.invalid-day'),
        ),
        citizenshipDate: v.pipe(
          v.string(),
          v.custom(
            (input) => isValidDateString(input as string),
            'protected:primary-identity-document.citizenship-date.invalid',
          ),
        ),
      }),
    ],
    'protected:primary-identity-document.document-type.required',
  ),
]);

export const parsePrimaryDocument = (formData: FormData) => {
  const dateOfBirthYear = formData.get('dateOfBirthYear')?.toString();
  const dateOfBirthMonth = formData.get('dateOfBirthMonth')?.toString();
  const dateOfBirthDay = formData.get('dateOfBirthDay')?.toString();
  const citizenshipDateYear = formData.get('citizenshipDateYear')?.toString();
  const citizenshipDateMonth = formData.get('citizenshipDateMonth')?.toString();
  const citizenshipDateDay = formData.get('citizenshipDateDay')?.toString();

  return v.safeParse(primaryDocumentSchema, {
    currentStatusInCanada: formData.get('currentStatusInCanada')?.toString(),
    documentType: formData.get('documentType')?.toString(),
    registrationNumber: formData.get('registrationNumber')?.toString(),
    clientNumber: formData.get('clientNumber')?.toString(),
    givenName: formData.get('givenName')?.toString(),
    lastName: formData.get('lastName')?.toString(),
    gender: formData.get('gender')?.toString(),
    dateOfBirthYear: dateOfBirthYear,
    dateOfBirthMonth: dateOfBirthMonth,
    dateOfBirthDay: dateOfBirthDay,
    dateOfBirth: toDateString(dateOfBirthYear, dateOfBirthMonth, dateOfBirthDay),
    citizenshipDateYear: citizenshipDateYear,
    citizenshipDateMonth: citizenshipDateMonth,
    citizenshipDateDay: citizenshipDateDay,
    citizenshipDate: toDateString(citizenshipDateYear, citizenshipDateMonth, citizenshipDateDay),
  });
};

export const privacyStatementSchema = v.object({
  agreedToTerms: v.literal(true, 'protected:privacy-statement.confirm-privacy-notice-checkbox.required'),
});

export const parsePrivacyStatement = (formData: FormData) =>
  v.safeParse(privacyStatementSchema, {
    agreedToTerms: formData.get('agreedToTerms')?.toString() === 'on',
  });

export const requestDetailsSchema = v.object({
  scenario: v.lazy(() =>
    v.picklist(
      getApplicationSubmissionScenarios().map(({ id }) => id),
      'protected:request-details.required-scenario',
    ),
  ),
  type: v.lazy(() =>
    v.picklist(
      getTypesOfApplicationToSubmit().map(({ id }) => id),
      'protected:request-details.required-request',
    ),
  ),
});

export const parseRequestDetails = (formData: FormData) =>
  v.safeParse(requestDetailsSchema, {
    scenario: formData.get('scenario')?.toString(),
    type: formData.get('request-type')?.toString(),
  });

export const secondaryDocumentSchema = v.pipe(
  v.object({
    documentType: v.lazy(() =>
      v.picklist(
        getApplicantSecondaryDocumentChoices().map(({ id }) => id),
        'protected:secondary-identity-document.document-type.invalid',
      ),
    ),
    expiryYear: v.pipe(
      stringToIntegerSchema('protected:secondary-identity-document.expiry-date.required-year'),
      v.minValue(
        getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE).getFullYear(),
        'protected:secondary-identity-document.expiry-date.invalid-year',
      ),
    ),
    expiryMonth: v.pipe(
      stringToIntegerSchema('protected:secondary-identity-document.expiry-date.required-month'),
      v.minValue(1, 'protected:secondary-identity-document.expiry-date.invalid-month'),
      v.maxValue(12, 'protected:secondary-identity-document.expiry-date.invalid-month'),
    ),
  }),
  v.forward(
    v.partialCheck(
      [['expiryYear'], ['expiryMonth']],
      ({ expiryYear, expiryMonth }) => {
        const currentYear = getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE).getFullYear();
        const currentMonth = getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE).getMonth();

        // expiry date is valid if expiry year is in the future
        if (expiryYear > currentYear) return true;

        // expiry date is valid if expiry month is in the future
        if (expiryYear === currentYear) return expiryMonth >= currentMonth;

        // expiry date is invalid
        return false;
      },
      'protected:secondary-identity-document.expiry-date.invalid',
    ),
    ['expiryMonth'],
  ),
);

export const parseSecondaryDocument = (formData: FormData) =>
  v.safeParse(secondaryDocumentSchema, {
    documentType: formData.get('document-type')?.toString(),
    expiryYear: formData.get('expiry-year')?.toString(),
    expiryMonth: formData.get('expiry-month')?.toString(),
  });

export const formatSinApplication = (inPersonSinApplication: InPersonSinApplication, lang: Language) => {
  return {
    ...inPersonSinApplication,
    primaryDocuments: {
      ...inPersonSinApplication.primaryDocuments,
      genderName: getLocalizedApplicantGenderById(inPersonSinApplication.primaryDocuments.gender, lang).name,
    },
    secondaryDocument: {
      ...inPersonSinApplication.secondaryDocument,
      documentTypeName: getLocalizedApplicantSecondaryDocumentChoiceById(
        inPersonSinApplication.secondaryDocument.documentType,
        lang,
      ).name,
    },
    personalInformation: {
      ...inPersonSinApplication.personalInformation,
      genderName: getLocalizedApplicantGenderById(inPersonSinApplication.personalInformation.gender, lang).name,
    },
    birthDetails: {
      ...inPersonSinApplication.birthDetails,
      countryName: getLocalizedCountryById(inPersonSinApplication.birthDetails.country, lang).name,
      provinceName: inPersonSinApplication.birthDetails.province
        ? inPersonSinApplication.birthDetails.country !== serverEnvironment.PP_CANADA_COUNTRY_CODE
          ? inPersonSinApplication.birthDetails.province
          : getLocalizedProvinceById(inPersonSinApplication.birthDetails.province, lang).name
        : undefined,
    },
    parentDetails: inPersonSinApplication.parentDetails.map((parentdetail) =>
      parentdetail.unavailable
        ? { unavailable: true }
        : {
            unavailable: false,
            givenName: parentdetail.givenName,
            lastName: parentdetail.lastName,
            birthLocation: {
              country: parentdetail.birthLocation.country,
              city: parentdetail.birthLocation.city,
              province: parentdetail.birthLocation.province,
            },
            countryName: getLocalizedCountryById(parentdetail.birthLocation.country, lang).name,
            provinceName: parentdetail.birthLocation.province
              ? parentdetail.birthLocation.country !== serverEnvironment.PP_CANADA_COUNTRY_CODE
                ? parentdetail.birthLocation.province
                : getLocalizedProvinceById(parentdetail.birthLocation.province, lang).name
              : undefined,
          },
    ),
    contactInformation: {
      ...inPersonSinApplication.contactInformation,
      preferredLanguageName: getLocalizedLanguageOfCorrespondenceById(
        inPersonSinApplication.contactInformation.preferredLanguage,
        lang,
      ).name,
      countryName: getLocalizedCountryById(inPersonSinApplication.contactInformation.country, lang).name,
      provinceName: inPersonSinApplication.contactInformation.province
        ? inPersonSinApplication.contactInformation.country !== serverEnvironment.PP_CANADA_COUNTRY_CODE
          ? inPersonSinApplication.contactInformation.province
          : getLocalizedProvinceById(inPersonSinApplication.contactInformation.province, lang).name
        : undefined,
    },
    currentNameInfo: {
      ...inPersonSinApplication.currentNameInfo,
      firstName:
        inPersonSinApplication.currentNameInfo.preferredSameAsDocumentName === true
          ? inPersonSinApplication.primaryDocuments.givenName
          : inPersonSinApplication.currentNameInfo.firstName,
      lastName:
        inPersonSinApplication.currentNameInfo.preferredSameAsDocumentName === true
          ? inPersonSinApplication.primaryDocuments.lastName
          : inPersonSinApplication.currentNameInfo.lastName,
    },
  };
};
