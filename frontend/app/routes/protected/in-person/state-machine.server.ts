import type { ActionFunctionArgs } from 'react-router';
import { generatePath } from 'react-router';

import type { Actor } from 'xstate';
import { createActor, setup } from 'xstate';

import { LogFactory } from '~/.server/logging';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import type { I18nRouteFile } from '~/i18n-routes';
import { i18nRoutes } from '~/i18n-routes';
import { getLanguage } from '~/utils/i18n-utils';
import { getRouteByFile } from '~/utils/route-utils';

export type Machine = typeof machine;

/* TODO :: GjB :: remove the following comment when the types are filled out */
/* eslint-disable @typescript-eslint/no-empty-object-type */

export type BirthInfoData = {};

export type ContactInfoData = {};

export type NameInfoData = {};

export type ParentInfoData = {};

export type PersonalInfoData = {};

export type PreviousSinInfoData = {};

export type PrimaryDocsData = {};

export type PrivacyStatementData = {};

export type RequestDetailsData = {
  requestDetails: {
    requestType: string;
    situationType: string;
  };
};

export type SecondaryDocsData = {};

const log = LogFactory.getLogger(import.meta.url);

/**
 * Type representing the possible state names for the in-person application process.
 */
export type StateName =
  | 'start'
  | 'privacy-statement'
  | 'request-details'
  | 'primary-docs'
  | 'secondary-docs'
  | 'name-info'
  | 'personal-info'
  | 'birth-info'
  | 'parent-info'
  | 'previous-sin-info'
  | 'contact-info'
  | 'review';

export const machineId = 'in-person';

/**
 * XState machine definition for the in-person application process.
 * This machine manages the flow of the application, including navigation
 * between different states and handling user interactions.
 */
export const machine = setup({
  types: {
    context: {} as {
      data: {
        birthInfoData?: BirthInfoData;
        contactInfoData?: ContactInfoData;
        nameInfoData?: NameInfoData;
        parentInfoData?: ParentInfoData;
        personalInfoData?: PersonalInfoData;
        previousSinInfoData?: PreviousSinInfoData;
        primaryDocsData?: PrimaryDocsData;
        privacyStatementData?: PrivacyStatementData;
        requestDetailsData?: RequestDetailsData;
        secondaryDocsData?: SecondaryDocsData;
      };
    },
    events: {} as
      | { type: 'cancel' }
      | { type: 'prev' }
      | { type: 'next' }
      | {
          type: 'next';
          data:
            | BirthInfoData
            | ContactInfoData
            | NameInfoData
            | ParentInfoData
            | PersonalInfoData
            | PreviousSinInfoData
            | PrimaryDocsData
            | PrivacyStatementData
            | RequestDetailsData
            | SecondaryDocsData;
        },
    meta: {} as {
      route: I18nRouteFile;
    },
  },
  actions: {
    'reset-context': ({ context }) => {
      context.data = {};
    },
    'update-context': ({ context, event }) => {
      if ('data' in event) {
        Object.assign(context.data, event.data);
      }
    },
  },
}).createMachine({
  id: machineId,
  context: {
    data: {},
  },
  initial: 'start',
  states: {
    'start': {
      meta: {
        route: 'routes/protected/in-person/index.tsx',
      },
      on: {
        next: { target: 'privacy-statement' },
      },
    },
    'privacy-statement': {
      meta: {
        route: 'routes/protected/in-person/privacy-statement.tsx',
      },
      on: {
        next: { target: 'request-details' },
        cancel: {
          actions: 'reset-context',
          target: 'start',
        },
      },
    },
    'request-details': {
      meta: {
        route: 'routes/protected/in-person/request-details.tsx',
      },
      on: {
        prev: { target: 'privacy-statement' },
        next: {
          actions: 'update-context',
          target: 'primary-docs',
        },
        cancel: {
          actions: 'reset-context',
          target: 'start',
        },
      },
    },
    'primary-docs': {
      meta: {
        route: 'routes/protected/in-person/primary-docs.tsx',
      },
      on: {
        prev: { target: 'request-details' },
        next: { target: 'secondary-docs' },
        cancel: {
          actions: 'reset-context',
          target: 'start',
        },
      },
    },
    'secondary-docs': {
      meta: {
        route: 'routes/protected/in-person/secondary-docs.tsx',
      },
      on: {
        prev: { target: 'primary-docs' },
        next: { target: 'name-info' },
        cancel: {
          actions: 'reset-context',
          target: 'start',
        },
      },
    },
    'name-info': {
      meta: {
        route: 'routes/protected/in-person/name-info.tsx',
      },
      on: {
        prev: { target: 'secondary-docs' },
        next: { target: 'personal-info' },
        cancel: {
          actions: 'reset-context',
          target: 'start',
        },
      },
    },
    'personal-info': {
      meta: {
        route: 'routes/protected/in-person/personal-info.tsx',
      },
      on: {
        prev: { target: 'name-info' },
        next: { target: 'birth-info' },
        cancel: {
          actions: 'reset-context',
          target: 'start',
        },
      },
    },
    'birth-info': {
      meta: {
        route: 'routes/protected/in-person/birth-info.tsx',
      },
      on: {
        prev: { target: 'personal-info' },
        next: { target: 'parent-info' },
        cancel: {
          actions: 'reset-context',
          target: 'start',
        },
      },
    },
    'parent-info': {
      meta: {
        route: 'routes/protected/in-person/parent-info.tsx',
      },
      on: {
        prev: { target: 'birth-info' },
        next: { target: 'previous-sin-info' },
        cancel: {
          actions: 'reset-context',
          target: 'start',
        },
      },
    },
    'previous-sin-info': {
      meta: {
        route: 'routes/protected/in-person/previous-sin-info.tsx',
      },
      on: {
        prev: { target: 'parent-info' },
        next: { target: 'contact-info' },
        cancel: {
          actions: 'reset-context',
          target: 'start',
        },
      },
    },
    'contact-info': {
      meta: {
        route: 'routes/protected/in-person/contact-info.tsx',
      },
      on: {
        prev: { target: 'previous-sin-info' },
        next: { target: 'review' },
        cancel: {
          actions: 'reset-context',
          target: 'start',
        },
      },
    },
    'review': {
      meta: {
        route: 'routes/protected/in-person/review.tsx',
      },
      on: {
        cancel: {
          actions: 'reset-context',
          target: 'start',
        },
        // TODO :: rest of events
      },
    },
  },
});

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

  const actor = createActor(machine, { id: tabId });
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
export function loadMachineActor(session: AppSession, request: Request, stateName?: StateName): Actor<Machine> | undefined {
  const flow = (session.inPersonFlow ??= {}); // ensure session container exists

  const tabId = new URL(request.url).searchParams.get('tid');

  if (!tabId) {
    log.debug('Could not find tab id in request; returning undefined');
    return undefined;
  }

  if (!flow[tabId]) {
    log.debug('Could not find a machine snapshot session; returning undefined');
    return undefined;
  }

  // if a desired state name has been provided, we load it,
  // otherwise use the state name that has been stored in session
  const snapshot = stateName ? machine.resolveState({ value: stateName, context: flow[tabId].context }) : flow[tabId];

  const actor = createActor(machine, { id: tabId, snapshot });
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

  const snapshot = actor.getSnapshot();
  const meta = snapshot.getMeta()[`${machineId}.${snapshot.value}`];

  if (!meta) {
    // this should never happen if the state machine is configured correctly
    throw new AppError('The metadata for the current machine state could not be determined', ErrorCodes.MISSING_META);
  }

  const url = new URL(request.url);
  const { paths } = getRouteByFile(meta.route, i18nRoutes);
  url.pathname = generatePath(paths[language], params);

  return url.toString();
}
