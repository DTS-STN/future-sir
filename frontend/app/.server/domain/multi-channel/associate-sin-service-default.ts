import { UNSAFE_invariant } from 'react-router';

import type { AssociateSinResponse } from '~/.server/domain/multi-channel/associate-sin-models';
import type { AssociateSinService } from '~/.server/domain/multi-channel/associate-sin-service';
import { serverEnvironment } from '~/.server/environment';
import { LogFactory } from '~/.server/logging';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

const log = LogFactory.getLogger(import.meta.url);

export function getDefaultAssociateSinService(): AssociateSinService {
  return {
    getAssociatedSin: async (caseId: string): Promise<AssociateSinResponse> => {
      const authHeader = serverEnvironment.INTEROP_ASSOCIATE_SIN_API_AUTH_HEADER.value();
      const response = await fetch(`${serverEnvironment.INTEROP_ASSOCIATE_SIN_API_BASE_URL}/associate-sin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...parseAuthorizationHeader(authHeader),
        },
        body: JSON.stringify({
          caseGuid: caseId,
          idToken: serverEnvironment.TMP_AWS_ID_TOKEN.value(),
        }),
      });
      if (!response.ok)
        throw new AppError(`Associate SIN operation failed for case ID '${caseId}'.`, ErrorCodes.ASSOCIATE_SIN_REQUEST_FAILED);
      return response.json();
    },
  };
}

/**
 * Parses the authorization header string into a key/value pair for http headers.
 *
 * It expects the input string to be in the format "key value", where "key" is
 * the header name and "value" is the header value. If the input string does not
 * conform to this format, a warning is logged, and an empty header object is
 * returned.
 */
function parseAuthorizationHeader(input: string): Record<string, string> {
  const parts = input.split(' ');

  if (parts.length < 2) {
    log.warn('Authorization header is not in the expected "key value" format; ignoring');
    return {};
  }

  const [key, ...valueParts] = parts;
  const value = valueParts.join(' ');

  UNSAFE_invariant(key, 'Expected key to be defined');

  return { [key]: value };
}
