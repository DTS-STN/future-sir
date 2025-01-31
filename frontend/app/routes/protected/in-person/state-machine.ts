import type { Actor } from 'xstate';
import { createActor, setup } from 'xstate';

type Event = { type: 'prev' } | { type: 'next' } | { type: 'cancel' };

export const machine = setup({
  types: {
    events: {} as Event,
  },
}).createMachine({
  id: '(in-person-machine)',
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
        // TODO --- rest of events
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
