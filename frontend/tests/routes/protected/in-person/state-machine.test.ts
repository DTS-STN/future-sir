import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';

import type { I18nRouteFile } from '~/i18n-routes';
import type { StateName } from '~/routes/protected/in-person/state-machine.server';
import { machine, machineId } from '~/routes/protected/in-person/state-machine.server';

type StateData = {
  route: I18nRouteFile;
  prev?: StateName;
  next?: StateName;
};

const expectedStates = Object.entries({
  'start': {
    prev: 'start', // 'prev' is a NOOP event for this node
    next: 'privacy-statement',
    route: 'routes/protected/in-person/index.tsx',
  },
  'privacy-statement': {
    prev: 'privacy-statement', // 'prev' is a NOOP event for this node
    next: 'request-details',
    route: 'routes/protected/in-person/privacy-statement.tsx',
  },
  'request-details': {
    prev: 'privacy-statement',
    next: 'primary-docs',
    route: 'routes/protected/in-person/request-details.tsx',
  },
  'primary-docs': {
    prev: 'request-details',
    next: 'secondary-docs',
    route: 'routes/protected/in-person/primary-docs.tsx',
  },
  'secondary-docs': {
    prev: 'primary-docs',
    next: 'name-info',
    route: 'routes/protected/in-person/secondary-docs.tsx',
  },
  'name-info': {
    prev: 'secondary-docs',
    next: 'personal-info',
    route: 'routes/protected/in-person/name-info.tsx',
  },
  'personal-info': {
    prev: 'name-info',
    next: 'birth-info',
    route: 'routes/protected/in-person/personal-info.tsx',
  },
  'birth-info': {
    prev: 'personal-info',
    next: 'parent-info',
    route: 'routes/protected/in-person/birth-info.tsx',
  },
  'parent-info': {
    prev: 'birth-info',
    next: 'previous-sin-info',
    route: 'routes/protected/in-person/parent-info.tsx',
  },
  'previous-sin-info': {
    prev: 'parent-info',
    next: 'contact-info',
    route: 'routes/protected/in-person/previous-sin-info.tsx',
  },
  'contact-info': {
    prev: 'previous-sin-info',
    next: 'review',
    route: 'routes/protected/in-person/contact-info.tsx',
  },
  'review': {
    prev: 'review', // 'prev' is a NOOP event for this node
    next: 'review', // 'next' is a NOOP event for this node
    route: 'routes/protected/in-person/review.tsx',
  },
} satisfies Record<StateName, StateData>);

describe('in-person machine', () => {
  describe.for(expectedStates)('route files', ([fromState, { route }]) => {
    it(`'${fromState}' should route to '${route}'`, () => {
      const state = machine.resolveState({
        context: {
          data: {},
        },
        value: fromState,
      });

      const meta = state.getMeta()[`${machineId}.${fromState as StateName}`];

      expect(meta?.route).toEqual(route);
    });
  });

  describe('state transitions', () => {
    describe.for(expectedStates)(`'prev'`, ([fromState, { prev: toState }]) => {
      it(`should transition from '${fromState}' to '${toState}' on 'prev' event`, () => {
        const state = machine.resolveState({
          context: {
            data: {},
          },
          value: fromState,
        });

        const actor = createActor(machine, { state }).start();
        actor.send({ type: 'prev' });

        expect(actor.getSnapshot().value).toEqual(toState);
      });
    });

    describe.for(expectedStates)(`'next'`, ([fromState, { next: toState }]) => {
      it(`should transition from '${fromState}' to '${toState}' on 'next' event`, () => {
        const state = machine.resolveState({
          context: {
            data: {},
          },
          value: fromState,
        });

        const actor = createActor(machine, { state }).start();
        actor.send({ type: 'next' });

        expect(actor.getSnapshot().value).toEqual(toState);
      });
    });

    describe.for(expectedStates)(`'cancel'`, ([fromState]) => {
      it(`should transition from '${fromState}' to 'start' on 'cancel' event`, () => {
        const state = machine.resolveState({
          context: {
            data: {},
          },
          value: fromState,
        });

        const actor = createActor(machine, { state }).start();
        actor.send({ type: 'cancel' });

        expect(actor.getSnapshot().value).toEqual('start');
      });
    });
  });
});
