import { CodedError } from '~/errors/coded-error';

/**
 * An error route that can be used to test error boundaries.
 */
export default function Error() {
  throw new CodedError('ERR-0001');
}
