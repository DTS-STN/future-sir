import { CodedError } from '~/errors/coded-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * An error route that can be used to test error boundaries.
 */
export default function Error() {
  throw new CodedError('This is a test error', ErrorCodes.TEST_ERROR_CODE);
}
