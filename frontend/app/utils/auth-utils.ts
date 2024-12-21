import type { SessionData } from 'express-session';

export function hasRole(authState: SessionData['authState'], role: Role) {
  return authState?.idTokenClaims?.roles?.includes(role);
}
