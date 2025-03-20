import type { Actor } from 'xstate';

import { LogFactory } from '~/.server/logging';
import { i18nRedirect } from '~/.server/utils/route-utils';
import type { I18nRouteFile } from '~/i18n-routes';
import { loadMachineActor } from '~/routes/protected/person-case/state-machine.server';
import type { Machine, StateName } from '~/routes/protected/person-case/state-machine.server';

const log = LogFactory.getLogger(import.meta.url);

/**
 * Arguments for loadMachineContextOrRedirect function
 */
type LoadMachineContextOrRedirectArgs = {
  /** The current application session */
  session: AppSession;
  /** The incoming request */
  request: Request;
  /** Optional state name to validate */
  stateName?: StateName;
  /** Route to redirect to if tab ID or machine actor not found */
  i18nRedirectRouteFile?: I18nRouteFile;
};

type LoadedMachineContext = { machineActor: Actor<Machine>; tabId: string };

/**
 * Loads the necessary machine context (actor and tab ID) from the request or redirects if not found.
 * This function ensures all required components for state machine operations are available before proceeding.
 *
 * @returns Object containing the machine actor and tab ID
 * @throws Redirects to the specified route if tab ID is missing or machine actor cannot be loaded
 */
export function loadMachineContextOrRedirect({
  session,
  request,
  stateName,
  i18nRedirectRouteFile = 'routes/protected/index.tsx',
}: LoadMachineContextOrRedirectArgs): LoadedMachineContext {
  // Extract tab ID from URL search parameters (identifies the current user's browser tab/session context)
  const url = new URL(request.url);
  const tabId = url.searchParams.get('tid');

  if (!tabId) {
    log.debug('Could not find tab ID in request; redirecting to %s', i18nRedirectRouteFile);
    throw i18nRedirect(i18nRedirectRouteFile, request);
  }

  // Load the machine actor
  const machineActor = loadMachineActor(session, request, stateName);

  if (!machineActor) {
    log.warn('Could not find a machine snapshot in session; redirecting to %s', i18nRedirectRouteFile);
    throw i18nRedirect(i18nRedirectRouteFile, request);
  }

  return { machineActor, tabId };
}
