import * as v from 'valibot';

import { primaryDocument } from '~/routes/protected/sin-application/validation.server';
import { toISODateString } from '~/utils/date-utils';

export const primaryDocumentSchema = v.intersect([
  v.object({
    currentStatusInCanada: primaryDocument.currentStatusSchema,
  }),
  v.variant(
    'documentType',
    [
      v.object({
        documentType: primaryDocument.documentTypeSchema,
        registrationNumber: primaryDocument.registrationNumberSchema,
        clientNumber: primaryDocument.clientNumberSchema,
        givenName: primaryDocument.givenNameSchema,
        lastName: primaryDocument.lastNameSchema,
        dateOfBirthYear: primaryDocument.dateOfBirthYearSchema,
        dateOfBirthMonth: primaryDocument.dateOfBirthMonthSchema,
        dateOfBirthDay: primaryDocument.dateOfBirthDaySchema,
        dateOfBirth: primaryDocument.dateOfBirthSchema,
        gender: primaryDocument.genderSchema,
        citizenshipDateYear: primaryDocument.citizenshipYearSchema,
        citizenshipDateMonth: primaryDocument.citizenshipMonthSchema,
        citizenshipDateDay: primaryDocument.citizenshipDaySchema,
        citizenshipDate: primaryDocument.citizenshipDateSchema,
      }),
    ],
    'protected:primary-identity-document.document-type.required',
  ),
]);

export function parsePrimaryDocument(formData: FormData) {
  const dateOfBirthYear = formData.get('dateOfBirthYear')?.toString();
  const dateOfBirthMonth = formData.get('dateOfBirthMonth')?.toString();
  const dateOfBirthDay = formData.get('dateOfBirthDay')?.toString();

  const citizenshipDateYear = formData.get('citizenshipDateYear')?.toString();
  const citizenshipDateMonth = formData.get('citizenshipDateMonth')?.toString();
  const citizenshipDateDay = formData.get('citizenshipDateDay')?.toString();

  const formValues = {
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
  };

  return {
    parseResult: v.safeParse(primaryDocumentSchema, formValues),
    formValues: {
      citizenshipDate: formValues.citizenshipDate,
      clientNumber: formValues.clientNumber,
      currentStatusInCanada: formValues.currentStatusInCanada,
      dateOfBirth: formValues.currentStatusInCanada,
      documentType: formValues.documentType,
      gender: formValues.gender,
      givenName: formValues.givenName,
      lastName: formValues.lastName,
      registrationNumber: formValues.registrationNumber,
    },
  };
}

function toDateString(year?: string, month?: string, day?: string): string {
  try {
    return toISODateString(Number(year), Number(month), Number(day));
  } catch {
    return '';
  }
}
