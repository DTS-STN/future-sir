import { parsePhoneNumberWithError } from 'libphonenumber-js';
import * as v from 'valibot';

import { applicantGenderService, languageCorrespondenceService } from '~/.server/domain/person-case/services';
import { getApplicantSecondaryDocumentChoices } from '~/.server/domain/person-case/services/applicant-secondary-document-service';
import { getApplicantHadSinOptions } from '~/.server/domain/person-case/services/applicant-sin-service';
import { getApplicationSubmissionScenarios } from '~/.server/domain/person-case/services/application-submission-scenario';
import { getTypesOfApplicationToSubmit } from '~/.server/domain/person-case/services/application-type-service';
import { serverEnvironment } from '~/.server/environment';
import { countryService, provinceService } from '~/.server/shared/services';
import { getStartOfDayInTimezone, isDateInPastOrTodayInTimeZone, isValidDateString } from '~/utils/date-utils';
import { REGEX_PATTERNS } from '~/utils/regex-utils';
import { formatSin, isValidSin } from '~/utils/sin-utils';

export const birthDetailsSchema = v.variant(
  'country',
  [
    v.object({
      country: v.literal(serverEnvironment.PP_CANADA_COUNTRY_CODE, 'protected:birth-details.country.invalid-country'),
      province: v.picklist(
        provinceService.getProvinces().map(({ id }) => id),
        'protected:birth-details.province.required-province',
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
        v.picklist(
          countryService.getCountries().map(({ id }) => id),
          'protected:birth-details.country.invalid-country',
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

export const contactInformationSchema = v.intersect([
  v.object({
    preferredLanguage: v.picklist(
      languageCorrespondenceService.getLanguagesOfCorrespondence().map(({ id }) => id),
      'protected:contact-information.error-messages.preferred-language-required',
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
        province: v.picklist(
          provinceService.getProvinces().map(({ id }) => id),
          'protected:contact-information.error-messages.province-required',
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
        country: v.picklist(countryService.getCountries().map(({ id }) => id)),
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

export const validCurrentNameDocTypes = [
  'marriage-document',
  'divorce-decree',
  'name-change',
  'adoption-order',
  'notarial-certificate',
  'resident-record',
  'replace-imm1442',
  'birth-certificate',
  'citizenship-certificate',
] as const;

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
              v.array(v.string(), 'protected:current-name.supporting-error.required-error'),
              v.nonEmpty('protected:current-name.supporting-error.required-error'),
              v.checkItems(
                (item, index, array) =>
                  array.indexOf(item) === index &&
                  validCurrentNameDocTypes.includes(item as (typeof validCurrentNameDocTypes)[number]),
                'protected:current-name.supporting-error.invalid-error',
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

export const maxNumberOfParents = 4;

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
                province: v.picklist(
                  provinceService.getProvinces().map(({ id }) => id),
                  'protected:parent-details.province-error.required-province',
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
                  v.picklist(
                    countryService.getCountries().map(({ id }) => id),
                    'protected:parent-details.country-error.invalid-country',
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
  gender: v.picklist(
    applicantGenderService.getApplicantGenders().map(({ id }) => id),
    'protected:personal-information.gender.required',
  ),
});

export const previousSinSchema = v.pipe(
  v.object({
    hasPreviousSin: v.picklist(
      getApplicantHadSinOptions().map(({ id }) => id),
      'protected:previous-sin.error-messages.has-previous-sin-required',
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

const validBornOutsideOfCanadaDocuments = [
  'certificate-of-canadian-citizenship', //
] as const;

const validCanadianStatuses = [
  'canadian-citizen-born-outside-canada', //
] as const;

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
          v.number('protected:primary-identity-document.date-of-birth.required-year'),
          v.integer('protected:primary-identity-document.date-of-birth.invalid-year'),
          v.minValue(1, 'protected:primary-identity-document.date-of-birth.invalid-year'),
          v.maxValue(
            getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE).getFullYear(),
            'protected:primary-identity-document.date-of-birth.invalid-year',
          ),
        ),
        dateOfBirthMonth: v.pipe(
          v.number('protected:primary-identity-document.date-of-birth.required-month'),
          v.integer('protected:primary-identity-document.date-of-birth.invalid-month'),
          v.minValue(1, 'protected:primary-identity-document.date-of-birth.invalid-month'),
          v.maxValue(12, 'protected:primary-identity-document.date-of-birth.invalid-month'),
        ),
        dateOfBirthDay: v.pipe(
          v.number('protected:primary-identity-document.date-of-birth.required-day'),
          v.integer('protected:primary-identity-document.date-of-birth.invalid-day'),
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
        gender: v.picklist(
          applicantGenderService.getApplicantGenders().map(({ id }) => id),
          'protected:primary-identity-document.gender.required',
        ),
        citizenshipDateYear: v.pipe(
          v.number('protected:primary-identity-document.citizenship-date.required-year'),
          v.integer('protected:primary-identity-document.citizenship-date.invalid-year'),
          v.minValue(1, 'protected:primary-identity-document.citizenship-date.invalid-year'),
          v.maxValue(
            getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE).getFullYear(),
            'protected:primary-identity-document.citizenship-date.invalid-year',
          ),
        ),
        citizenshipDateMonth: v.pipe(
          v.number('protected:primary-identity-document.citizenship-date.required-month'),
          v.integer('protected:primary-identity-document.citizenship-date.invalid-month'),
          v.minValue(1, 'protected:primary-identity-document.citizenship-date.invalid-month'),
          v.maxValue(12, 'protected:primary-identity-document.citizenship-date.invalid-month'),
        ),
        citizenshipDateDay: v.pipe(
          v.number('protected:primary-identity-document.citizenship-date.required-day'),
          v.integer('protected:primary-identity-document.citizenship-date.invalid-day'),
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

export const privacyStatementSchema = v.object({
  agreedToTerms: v.literal(true, 'protected:privacy-statement.confirm-privacy-notice-checkbox.required'),
});

export const requestDetailsSchema = v.object({
  scenario: v.picklist(
    getApplicationSubmissionScenarios().map(({ id }) => id),
    'protected:request-details.required-scenario',
  ),
  type: v.picklist(
    getTypesOfApplicationToSubmit().map(({ id }) => id),
    'protected:request-details.required-request',
  ),
});

export const secondaryDocumentSchema = v.pipe(
  v.object({
    documentType: v.picklist(
      getApplicantSecondaryDocumentChoices().map(({ id }) => id),
      'protected:secondary-identity-document.document-type.invalid',
    ),
    expiryYear: v.pipe(
      v.number('protected:secondary-identity-document.expiry-date.required-year'),
      v.integer('protected:secondary-identity-document.expiry-date.invalid-year'),
      v.minValue(
        getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE).getFullYear(),
        'protected:secondary-identity-document.expiry-date.invalid-year',
      ),
    ),
    expiryMonth: v.pipe(
      v.number('protected:secondary-identity-document.expiry-date.required-month'),
      v.integer('protected:secondary-identity-document.expiry-date.invalid-month'),
      v.minValue(1, 'protected:secondary-identity-document.expiry-date.invalid-month'),
      v.maxValue(12, 'protected:secondary-identity-document.expiry-date.invalid-month'),
    ),
  }),
  v.forward(
    v.partialCheck(
      [['expiryYear'], ['expiryMonth']],
      (input) =>
        input.expiryYear > getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE).getFullYear() ||
        (input.expiryYear === getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE).getFullYear() &&
          input.expiryMonth >= getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE).getMonth()),
      'protected:secondary-identity-document.expiry-date.invalid',
    ),
    ['expiryMonth'],
  ),
);
