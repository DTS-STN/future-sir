import { faker } from '@faker-js/faker';

import type { AssociateSinResponse } from '~/.server/domain/multi-channel/associate-sin-models';
import { HttpStatusCodes } from '~/errors/http-status-codes';
import { isValidSin } from '~/utils/sin-utils';

export function generateFakeAssociateSinResponse(): AssociateSinResponse {
  return {
    code: HttpStatusCodes.OK.toString(),
    SIN: generateFakeSin(),
  };
}

/**
 * Generates a valid-format 800 series SIN number
 * @returns {string} A 9-digit SIN number
 */
function generateFakeSin() {
  let sin = '';
  while (!isValidSin(sin)) sin = faker.helpers.fromRegExp('8[0-9]{8}');
  return sin;
}
