import { redirect } from 'react-router';

import type { SessionData } from 'express-session';

import { LogFactory } from '~/.server/logging';
import { CodedError } from '~/errors/coded-error';
import { ErrorCodes } from '~/errors/error-codes';

const log = LogFactory.getLogger(import.meta.url);

/**
 * Represents an authenticated session by extending the base `SessionData` type.
 * This type ensures that the `authState` property is non-nullable.
 */
export type AuthenticatedSession = SessionData & {
  authState: NonNullable<SessionData['authState']>;
};

/**
 * Checks if the user session contains the specified role.
 */
export function hasRole(session: SessionData, role: Role) {
  return session.authState?.idTokenClaims?.roles?.includes(role);
}

/**
 * Requires that the user posses all of the specified roles.
 * Will redirect to the login page if the user is not authenticated.
 * @throws {CodedError} If the user does not have the required roles.
 */
export function requireAuth(
  session: SessionData,
  currentUrl: URL,
  roles: Role[] = [],
): asserts session is AuthenticatedSession {
  if (!session.authState) {
    log.debug('User is not authenticated; redirecting to login page');

    const { pathname, search } = currentUrl;
    throw redirect(`/auth/login?returnto=${pathname}${search}`);
  }

  const missingRoles = roles.filter((role) => !hasRole(session, role));

  if (missingRoles.length > 0) {
    throw new CodedError(
      `User does not have the following required roles: [${missingRoles.join(', ')}]`,
      ErrorCodes.ACCESS_FORBIDDEN,
      { statusCode: 403 },
    );
  }
}
