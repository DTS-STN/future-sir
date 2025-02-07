import type { ActionFunctionArgs } from 'react-router';
import { generatePath } from 'react-router';

import type { Actor } from 'xstate';
import { createActor } from 'xstate';

import { LogFactory } from '~/.server/logging';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import { i18nRoutes } from '~/i18n-routes';
import type { StateName } from '~/routes/protected/in-person/state-machine';
import { machine } from '~/routes/protected/in-person/state-machine';
import { getLanguage } from '~/utils/i18n-utils';
import { getRouteByFile } from '~/utils/route-utils';

type Machine = typeof machine;

const log = LogFactory.getLogger(import.meta.url);

/**
 * Creates a new in-person application state machine actor and stores it in the session.
 *
 * This function retrieves the `tabId` from the request URL, creates a new XState actor
 * for the in-person application flow, subscribes to its state changes to persist
 * the snapshot in the session, and starts the actor.
 *
 * @throws {Response} 400 response if the `tabId` is missing in the request.
 */
export function createMachineActor(session: AppSession, request: Request): Actor<Machine> {
  const flow = (session.inPersonFlow ??= {}); // ensure session container exists

  const tabId = new URL(request.url).searchParams.get('tid');

  if (!tabId) {
    log.warn('Could not find tabId in request; returning 400 response.');
    throw Response.json('The tabId could not be found in the request', { status: 400 });
  }

  const actor = createActor(machine);
  actor.subscribe((snapshot) => void (flow[tabId] = snapshot));
  log.debug('Created new in-person state machine for session [%s] and tabId [%s]', session.id, tabId);

  return actor.start();
}

/**
 * Loads an existing in-person application state machine actor from the session.
 *
 * This function retrieves the `tabId` from the request URL, attempts to load a
 * persisted XState actor snapshot from the session, and recreates the actor
 * with the loaded snapshot.
 *
 * @throws {AppError} If the machine snapshot is not found in the session.
 * @throws {Response} 400 response if the `tabId` is missing in the request.
 */
export function loadMachineActor(session: AppSession, request: Request, state: StateName): Actor<Machine> {
  const flow = (session.inPersonFlow ??= {}); // ensure session container exists

  const tabId = new URL(request.url).searchParams.get('tid');

  if (!tabId) {
    // XXX :: GjB :: how should we handle this case?
    //               Showing an error page seems like bad UX.
    log.warn('Could not find tabId in request; returning 400 response.');
    throw Response.json('The tabId could not be found in the request', { status: 400 });
  }

  if (!flow[tabId]) {
    // XXX :: GjB :: how should we handle this case?
    //               Showing an error page seems like bad UX.
    throw new AppError(
      'The machine snapshot was not found in session', //
      ErrorCodes.MISSING_SNAPSHOT,
    );
  }

  const snapshot = machine.resolveState({ value: state, context: flow[tabId].context });
  const actor = createActor(machine, { snapshot });
  actor.subscribe((snapshot) => void (flow[tabId] = snapshot));
  log.debug('Loaded in-person state machine for session [%s] and tabId [%s]', session.id, tabId);

  return actor.start();
}

/**
 * Generates a URL for a given machine state and arguments.
 *
 * This function determines the appropriate route based on the current machine state,
 * language, and provided arguments. It retrieves metadata associated with the state,
 * uses it to find the correct route definition, and constructs the URL using the provided
 * parameters. It throws an error if the language cannot be determined from the request
 * or if the metadata for the current machine state cannot be found.
 *
 * @throws {AppError} If the language or metadata cannot be determined.
 */
export function getStateRoute(actor: Actor<Machine>, { params, request }: ActionFunctionArgs): string {
  const language = getLanguage(request);

  if (!language) {
    throw new AppError(
      'The current language could not be determined from the request', //
      ErrorCodes.MISSING_LANG_PARAM,
    );
  }

  const { context, value } = actor.getSnapshot();
  const i18nRouteFile = context.routes[value];

  const url = new URL(request.url);
  const { paths } = getRouteByFile(i18nRouteFile, i18nRoutes);
  url.pathname = generatePath(paths[language], params);

  return url.toString();
}
