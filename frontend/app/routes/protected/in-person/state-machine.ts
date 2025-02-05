import type { ActionFunctionArgs } from 'react-router';
import { generatePath } from 'react-router';

import type { Actor } from 'xstate';
import { createActor, setup } from 'xstate';

import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';
import type { I18nRouteFile } from '~/i18n-routes';
import { i18nRoutes } from '~/i18n-routes';
import { getLanguage } from '~/utils/i18n-utils';
import { getRouteByFile } from '~/utils/route-utils';

type Event = { type: 'prev' } | { type: 'next' } | { type: 'cancel' };
type Meta = { i18nRouteFile: I18nRouteFile };

const machineId = '(in-person-machine)';

export const machine = setup({
  types: {
    events: {} as Event,
    meta: {} as Meta,
  },
}).createMachine({
  id: machineId,
  initial: 'start',
  states: {
    'start': {
      on: {
        next: { target: 'privacy-statement' },
      },
      meta: {
        i18nRouteFile: 'routes/protected/in-person/index.tsx',
      },
    },
    'privacy-statement': {
      on: {
        next: { target: 'request-details' },
        cancel: { target: 'start' },
      },
      meta: {
        i18nRouteFile: 'routes/protected/in-person/privacy-statement.tsx',
      },
    },
    'request-details': {
      on: {
        prev: { target: 'privacy-statement' },
        next: { target: 'primary-docs' },
        cancel: { target: 'start' },
      },
      meta: {
        i18nRouteFile: 'routes/protected/in-person/request-details.tsx',
      },
    },
    'primary-docs': {
      on: {
        prev: { target: 'request-details' },
        next: { target: 'secondary-docs' },
        cancel: { target: 'start' },
      },
      meta: {
        i18nRouteFile: 'routes/protected/in-person/primary-docs.tsx',
      },
    },
    'secondary-docs': {
      on: {
        prev: { target: 'primary-docs' },
        next: { target: 'name-info' },
        cancel: { target: 'start' },
      },
      meta: {
        i18nRouteFile: 'routes/protected/in-person/secondary-docs.tsx',
      },
    },
    'name-info': {
      on: {
        prev: { target: 'secondary-docs' },
        next: { target: 'personal-info' },
        cancel: { target: 'start' },
      },
      meta: {
        i18nRouteFile: 'routes/protected/in-person/name-info.tsx',
      },
    },
    'personal-info': {
      on: {
        prev: { target: 'name-info' },
        next: { target: 'birth-info' },
        cancel: { target: 'start' },
      },
      meta: {
        i18nRouteFile: 'routes/protected/in-person/personal-info.tsx',
      },
    },
    'birth-info': {
      on: {
        prev: { target: 'personal-info' },
        next: { target: 'parent-info' },
        cancel: { target: 'start' },
      },
      meta: {
        i18nRouteFile: 'routes/protected/in-person/birth-info.tsx',
      },
    },
    'parent-info': {
      on: {
        prev: { target: 'birth-info' },
        next: { target: 'previous-sin-info' },
        cancel: { target: 'start' },
      },
      meta: {
        i18nRouteFile: 'routes/protected/in-person/parent-info.tsx',
      },
    },
    'previous-sin-info': {
      on: {
        prev: { target: 'parent-info' },
        next: { target: 'contact-info' },
        cancel: { target: 'start' },
      },
      meta: {
        i18nRouteFile: 'routes/protected/in-person/previous-sin-info.tsx',
      },
    },
    'contact-info': {
      on: {
        prev: { target: 'previous-sin-info' },
        next: { target: 'review' },
        cancel: { target: 'start' },
      },
      meta: {
        i18nRouteFile: 'routes/protected/in-person/contact-info.tsx',
      },
    },
    'review': {
      on: {
        cancel: { target: 'start' },
        // TODO --- rest of events
      },
      meta: {
        i18nRouteFile: 'routes/protected/in-person/review.tsx',
      },
    },
  },
});

/**
 * Creates a new machine actor.
 */
export function create(session: AppSession, tabId: string): Actor<typeof machine> {
  const flow = (session.inPersonFlow ??= {}); // ensure session container exists

  const actor = createActor(machine);
  actor.subscribe((snapshot) => void (flow[tabId] = snapshot));

  return actor.start();
}

/**
 * Loads a machine actor from session.
 */
export function load(session: AppSession, tabId: string): Actor<typeof machine> {
  const flow = (session.inPersonFlow ??= {}); // ensure session container exists

  const snapshot = flow[tabId] && { snapshot: flow[tabId] };

  if (!snapshot) {
    throw new AppError('The machine snapshot was not found in session', ErrorCodes.MISSING_SNAPSHOT);
  }

  const actor = createActor(machine, snapshot);
  actor.subscribe((snapshot) => void (flow[tabId] = snapshot));

  return actor.start();
}

export function getRoute(actor: Actor<typeof machine>, args: ActionFunctionArgs): string {
  const language = getLanguage(args.request);

  if (!language) {
    throw new AppError('The current language could not be determined from the request', ErrorCodes.MISSING_LANG_PARAM);
  }

  const snapshot = actor.getSnapshot();
  const meta = snapshot.getMeta()[`${machineId}.${snapshot.value}`];

  if (!meta) {
    throw new AppError('The metadata for the current machine state could not be determined', ErrorCodes.MISSING_META);
  }

  const { paths } = getRouteByFile(meta.i18nRouteFile, i18nRoutes);

  return generatePath(paths[language], args.params);
}
