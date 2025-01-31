import type { Actor } from 'xstate';
import { createActor, setup } from 'xstate';

import type { I18nRouteFile } from '~/i18n-routes';

type Event = { type: 'prev' } | { type: 'next' } | { type: 'cancel' };
type Meta = { i18nRouteFile: I18nRouteFile };

export const machine = setup({
  types: {
    events: {} as Event,
    meta: {} as Meta,
  },
}).createMachine({
  id: '(in-person-machine)',
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
 * Creates a new machine actor or loads one from session.
 */
export function create(session: AppSession, tabId: string): Actor<typeof machine> {
  const flow = (session.inPersonFlow ??= {}); // ensure session container exists

  const snapshot = flow[tabId] && { snapshot: flow[tabId] };
  const actor = createActor(machine, snapshot);
  actor.subscribe((snapshot) => void (flow[tabId] = snapshot));

  return actor;
}
