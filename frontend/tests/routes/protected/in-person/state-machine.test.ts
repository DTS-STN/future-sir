import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';

import { machine, routes } from '~/routes/protected/in-person/state-machine';

describe('in-person machine transitions', () => {
  const states = [
    'start',
    'privacy-statement',
    'request-details',
    'primary-docs',
    'secondary-docs',
    'name-info',
    'personal-info',
    'birth-info',
    'parent-info',
    'previous-sin-info',
    'contact-info',
    'review',
  ];

  const prevStates = Object.entries({
    'request-details': 'privacy-statement',
    'primary-docs': 'request-details',
    'secondary-docs': 'primary-docs',
    'name-info': 'secondary-docs',
    'personal-info': 'name-info',
    'birth-info': 'personal-info',
    'parent-info': 'birth-info',
    'previous-sin-info': 'parent-info',
    'contact-info': 'previous-sin-info',
  });

  const nextStates = Object.entries({
    'start': 'privacy-statement',
    'privacy-statement': 'request-details',
    'request-details': 'primary-docs',
    'primary-docs': 'secondary-docs',
    'secondary-docs': 'name-info',
    'name-info': 'personal-info',
    'personal-info': 'birth-info',
    'birth-info': 'parent-info',
    'parent-info': 'previous-sin-info',
    'previous-sin-info': 'contact-info',
    'contact-info': 'review',
  });

  it.each(nextStates)('should transition from %s to %s on next event', (from, to) => {
    const state = machine.resolveState({ context: { routes }, value: from });
    const actor = createActor(machine, { state }).start();

    actor.send({ type: 'next' });

    expect(actor.getSnapshot().value).toEqual(to);
  });

  it.each(prevStates)('should transition from %s to %s on prev event', (from, to) => {
    const state = machine.resolveState({ context: { routes }, value: from });
    const actor = createActor(machine, { state }).start();

    actor.send({ type: 'prev' });

    expect(actor.getSnapshot().value).toEqual(to);
  });

  it.each(states.filter((state) => state !== 'start'))('should transition from %s to start on cancel', (from) => {
    const state = machine.resolveState({ context: { routes }, value: from });
    const actor = createActor(machine, { state }).start();

    actor.send({ type: 'cancel' });

    expect(actor.getSnapshot().value).toEqual('start');
  });
});
