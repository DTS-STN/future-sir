import { setup } from 'xstate';

import type { I18nRouteFile } from '~/i18n-routes';

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

/**
 * Mapping of state names to their corresponding route files.
 * This object defines the routes for each state in the in-person application process.
 * The keys are the state names, and the values are the paths to the route files.
 */
export const routes = {
  'start': 'routes/protected/in-person/index.tsx',
  'privacy-statement': 'routes/protected/in-person/privacy-statement.tsx',
  'request-details': 'routes/protected/in-person/request-details.tsx',
  'primary-docs': 'routes/protected/in-person/primary-docs.tsx',
  'secondary-docs': 'routes/protected/in-person/secondary-docs.tsx',
  'name-info': 'routes/protected/in-person/name-info.tsx',
  'personal-info': 'routes/protected/in-person/personal-info.tsx',
  'birth-info': 'routes/protected/in-person/birth-info.tsx',
  'parent-info': 'routes/protected/in-person/parent-info.tsx',
  'previous-sin-info': 'routes/protected/in-person/previous-sin-info.tsx',
  'contact-info': 'routes/protected/in-person/contact-info.tsx',
  'review': 'routes/protected/in-person/review.tsx',
} as const satisfies Record<StateName, I18nRouteFile>;

/**
 * XState machine definition for the in-person application process.
 * This machine manages the flow of the application, including navigation
 * between different states and handling user interactions.
 */
export const machine = setup({
  types: {
    context: {} as {
      data?: unknown; // TODO :: fill this out
      routes: Record<StateName, I18nRouteFile>;
    },
    events: {} as
      | { type: 'prev' } //
      | { type: 'next'; data?: unknown } // TODO :: fill this out
      | { type: 'cancel' },
  },
}).createMachine({
  context: { routes },
  initial: 'start',
  states: {
    'start': {
      on: {
        next: { target: 'privacy-statement' },
      },
    },
    'privacy-statement': {
      on: {
        next: { target: 'request-details' },
        cancel: { target: 'start' },
      },
    },
    'request-details': {
      on: {
        prev: { target: 'privacy-statement' },
        next: { target: 'primary-docs' },
        cancel: { target: 'start' },
      },
    },
    'primary-docs': {
      on: {
        prev: { target: 'request-details' },
        next: { target: 'secondary-docs' },
        cancel: { target: 'start' },
      },
    },
    'secondary-docs': {
      on: {
        prev: { target: 'primary-docs' },
        next: { target: 'name-info' },
        cancel: { target: 'start' },
      },
    },
    'name-info': {
      on: {
        prev: { target: 'secondary-docs' },
        next: { target: 'personal-info' },
        cancel: { target: 'start' },
      },
    },
    'personal-info': {
      on: {
        prev: { target: 'name-info' },
        next: { target: 'birth-info' },
        cancel: { target: 'start' },
      },
    },
    'birth-info': {
      on: {
        prev: { target: 'personal-info' },
        next: { target: 'parent-info' },
        cancel: { target: 'start' },
      },
    },
    'parent-info': {
      on: {
        prev: { target: 'birth-info' },
        next: { target: 'previous-sin-info' },
        cancel: { target: 'start' },
      },
    },
    'previous-sin-info': {
      on: {
        prev: { target: 'parent-info' },
        next: { target: 'contact-info' },
        cancel: { target: 'start' },
      },
    },
    'contact-info': {
      on: {
        prev: { target: 'previous-sin-info' },
        next: { target: 'review' },
        cancel: { target: 'start' },
      },
    },
    'review': {
      on: {
        cancel: { target: 'start' },
        // TODO :: rest of events
      },
    },
  },
});
