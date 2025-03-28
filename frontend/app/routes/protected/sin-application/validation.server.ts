import * as v from 'valibot';

import { getApplicantGenders } from '~/.server/domain/person-case/services/applicant-gender-service';
import { serverEnvironment } from '~/.server/environment';
import { stringToIntegerSchema } from '~/.server/validation/string-to-integer-schema';
import { APPLICANT_PRIMARY_DOCUMENT_CHOICE, APPLICANT_STATUS_IN_CANADA } from '~/domain/constants';
import { getStartOfDayInTimezone, isDateInPastOrTodayInTimeZone, isValidDateString } from '~/utils/date-utils';
import { REGEX_PATTERNS } from '~/utils/regex-utils';

const validBornOutsideOfCanadaDocuments = [
  APPLICANT_PRIMARY_DOCUMENT_CHOICE.certificateOfCanadianCitizenship, //
] as const;

const validCanadianStatuses = [
  APPLICANT_STATUS_IN_CANADA.canadianCitizenBornOutsideCanada, //
] as const;

export const primaryDocument = {
  currentStatusSchema: v.pipe(
    v.string('protected:primary-identity-document.current-status-in-canada.required'),
    v.trim(),
    v.nonEmpty('protected:primary-identity-document.current-status-in-canada.required'),
    v.picklist(validCanadianStatuses, 'protected:primary-identity-document.current-status-in-canada.invalid'),
  ),
  documentTypeSchema: v.picklist(
    validBornOutsideOfCanadaDocuments,
    'protected:primary-identity-document.document-type.invalid',
  ),
  registrationNumberSchema: v.pipe(
    v.string('protected:primary-identity-document.registration-number.required'),
    v.trim(),
    v.nonEmpty('protected:primary-identity-document.registration-number.required'),
    v.length(8, 'protected:primary-identity-document.registration-number.invalid'),
    v.regex(REGEX_PATTERNS.DIGIT_ONLY, 'protected:primary-identity-document.registration-number.invalid'),
  ),
  clientNumberSchema: v.pipe(
    v.string('protected:primary-identity-document.client-number.required'),
    v.trim(),
    v.nonEmpty('protected:primary-identity-document.client-number.required'),
    v.length(10, 'protected:primary-identity-document.client-number.invalid'),
    v.regex(REGEX_PATTERNS.DIGIT_ONLY, 'protected:primary-identity-document.client-number.invalid'),
  ),
  givenNameSchema: v.pipe(
    v.string('protected:primary-identity-document.given-name.required'),
    v.trim(),
    v.nonEmpty('protected:primary-identity-document.given-name.required'),
    v.maxLength(100, 'protected:primary-identity-document.given-name.max-length'),
    v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:primary-identity-document.given-name.format'),
  ),
  lastNameSchema: v.pipe(
    v.string('protected:primary-identity-document.last-name.required'),
    v.trim(),
    v.nonEmpty('protected:primary-identity-document.last-name.required'),
    v.maxLength(100, 'protected:primary-identity-document.last-name.max-length'),
    v.regex(REGEX_PATTERNS.NON_DIGIT, 'protected:primary-identity-document.last-name.format'),
  ),
  dateOfBirthYearSchema: v.pipe(
    stringToIntegerSchema('protected:primary-identity-document.date-of-birth.required-year'),
    v.minValue(1, 'protected:primary-identity-document.date-of-birth.invalid-year'),
    v.maxValue(
      getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE).getFullYear(),
      'protected:primary-identity-document.date-of-birth.invalid-year',
    ),
  ),
  dateOfBirthMonthSchema: v.pipe(
    stringToIntegerSchema('protected:primary-identity-document.date-of-birth.required-month'),
    v.minValue(1, 'protected:primary-identity-document.date-of-birth.invalid-month'),
    v.maxValue(12, 'protected:primary-identity-document.date-of-birth.invalid-month'),
  ),
  dateOfBirthDaySchema: v.pipe(
    stringToIntegerSchema('protected:primary-identity-document.date-of-birth.required-day'),
    v.minValue(1, 'protected:primary-identity-document.date-of-birth.invalid-day'),
    v.maxValue(31, 'protected:primary-identity-document.date-of-birth.invalid-day'),
  ),
  dateOfBirthSchema: v.pipe(
    v.string(),
    v.custom((input) => isValidDateString(input as string), 'protected:primary-identity-document.date-of-birth.invalid'),
    v.custom(
      (input) => isDateInPastOrTodayInTimeZone(serverEnvironment.BASE_TIMEZONE, input as string),
      'protected:primary-identity-document.date-of-birth.invalid-future-date',
    ),
  ),
  genderSchema: v.lazy(() =>
    v.picklist(
      getApplicantGenders().map(({ id }) => id),
      'protected:primary-identity-document.gender.required',
    ),
  ),
  citizenshipYearSchema: v.pipe(
    stringToIntegerSchema('protected:primary-identity-document.citizenship-date.required-year'),
    v.minValue(1, 'protected:primary-identity-document.citizenship-date.invalid-year'),
    v.maxValue(
      getStartOfDayInTimezone(serverEnvironment.BASE_TIMEZONE).getFullYear(),
      'protected:primary-identity-document.citizenship-date.invalid-year',
    ),
  ),
  citizenshipMonthSchema: v.pipe(
    stringToIntegerSchema('protected:primary-identity-document.citizenship-date.required-month'),
    v.minValue(1, 'protected:primary-identity-document.citizenship-date.invalid-month'),
    v.maxValue(12, 'protected:primary-identity-document.citizenship-date.invalid-month'),
  ),
  citizenshipDaySchema: v.pipe(
    stringToIntegerSchema('protected:primary-identity-document.citizenship-date.required-day'),
    v.minValue(1, 'protected:primary-identity-document.citizenship-date.invalid-day'),
    v.maxValue(31, 'protected:primary-identity-document.citizenship-date.invalid-day'),
  ),
  citizenshipDateSchema: v.pipe(
    v.string(),
    v.custom((input) => isValidDateString(input as string), 'protected:primary-identity-document.citizenship-date.invalid'),
    v.custom(
      (input) => isDateInPastOrTodayInTimeZone(serverEnvironment.BASE_TIMEZONE, input as string),
      'protected:primary-identity-document.citizenship-date.invalid-future-date',
    ),
  ),
};
