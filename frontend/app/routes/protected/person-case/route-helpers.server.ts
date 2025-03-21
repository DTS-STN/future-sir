import type { Actor } from 'xstate';

import { LogFactory } from '~/.server/logging';
import { i18nRedirect } from '~/.server/utils/route-utils';
import type { I18nRouteFile } from '~/i18n-routes';
import { loadMachineActor } from '~/routes/protected/person-case/state-machine.server';
import type { Machine, StateName } from '~/routes/protected/person-case/state-machine.server';

const log = LogFactory.getLogger(import.meta.url);

/**
 * Options for getTabIdOrRedirect function
 */
export type GetTabIdOrRedirectOptions = {
  /** Route to redirect to if tab ID not found */
  i18nRedirectRouteFile?: I18nRouteFile;
};

export const DEFAULT_GET_TAB_ID_OR_REDIRECT_OPTIONS = {
  i18nRedirectRouteFile: 'routes/protected/index.tsx',
} as const satisfies GetTabIdOrRedirectOptions;

export function getTabIdOrRedirect(request: Request, options: GetTabIdOrRedirectOptions = {}): string {
  const { i18nRedirectRouteFile = DEFAULT_GET_TAB_ID_OR_REDIRECT_OPTIONS.i18nRedirectRouteFile } = options;

  // Extract tab ID from URL search parameters (identifies the current user's browser tab/session context)
  const tabId = new URL(request.url).searchParams.get('tid');

  if (!tabId) {
    log.debug('Could not find tab ID in request url [%s]; redirecting to %s', request.url, i18nRedirectRouteFile);
    throw i18nRedirect(i18nRedirectRouteFile, request);
  }

  return tabId;
}

/**
 * Options for loadMachineActorOrRedirect function
 */
export type LoadMachineActorOrRedirectOptions = {
  /** Optional state name to validate */
  stateName?: StateName;
  /** Route to redirect to if tab ID or machine actor not found */
  i18nRedirectRouteFile?: I18nRouteFile;
};

export const DEFAULT_LOAD_MACHINE_ACTOR_OR_REDIRECT_OPTIONS = {
  i18nRedirectRouteFile: 'routes/protected/index.tsx',
} as const satisfies LoadMachineActorOrRedirectOptions;

/**
 * Loads the necessary machine actor from the request or redirects if not found.
 * This function ensures all required components for state machine operations are available before proceeding.
 *
 * @param session - The current application session
 * @param request - The incoming request
 * @param flowId - The flowId to load
 * @param options - Optional options
 * @returns The machine actor
 * @throws Redirects to the specified route if tab ID is missing or machine actor cannot be loaded
 */
export function loadMachineActorOrRedirect(
  session: AppSession,
  request: Request,
  flowId: string,
  options: LoadMachineActorOrRedirectOptions = {},
): Actor<Machine> {
  const { stateName, i18nRedirectRouteFile = DEFAULT_LOAD_MACHINE_ACTOR_OR_REDIRECT_OPTIONS.i18nRedirectRouteFile } = options;

  // Load the machine actor
  const machineActor = loadMachineActor(session, flowId, stateName);

  if (!machineActor) {
    log.warn(
      'Could not find a machine snapshot in session; request url [%s]; redirecting to %s',
      request.url,
      i18nRedirectRouteFile,
    );
    throw i18nRedirect(i18nRedirectRouteFile, request);
  }

  return machineActor;
}
