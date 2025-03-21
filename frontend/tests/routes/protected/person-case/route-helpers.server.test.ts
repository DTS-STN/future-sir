import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { MockProxy } from 'vitest-mock-extended';
import type { Actor } from 'xstate';

import { i18nRedirect } from '~/.server/utils/route-utils';
import type { I18nRouteFile } from '~/i18n-routes';
import type {
  GetTabIdOrRedirectOptions,
  LoadMachineActorOrRedirectOptions,
} from '~/routes/protected/person-case/route-helpers.server';
import {
  DEFAULT_GET_TAB_ID_OR_REDIRECT_OPTIONS,
  DEFAULT_LOAD_MACHINE_ACTOR_OR_REDIRECT_OPTIONS,
  getTabIdOrRedirect,
  loadMachineActorOrRedirect,
} from '~/routes/protected/person-case/route-helpers.server';
import { loadMachineActor } from '~/routes/protected/person-case/state-machine.server';
import type { Machine } from '~/routes/protected/person-case/state-machine.server';

vi.mock('~/.server/utils/route-utils', () => ({
  i18nRedirect: vi.fn((i18nRouteFile, request) => {
    return { i18nRouteFile, request };
  }),
}));

vi.mock('~/routes/protected/person-case/state-machine.server', () => ({
  loadMachineActor: vi.fn(),
}));

vi.mock('~/.server/logging', () => ({
  LogFactory: {
    getLogger: () => ({
      debug: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

describe('getTabIdOrRedirect', () => {
  it('should return tabId when exists', () => {
    const requestMock = mock<Request>({ url: 'http://example.com/?tid=123' });
    const optionsMock: GetTabIdOrRedirectOptions = {};

    const expected = '123';

    const result = getTabIdOrRedirect(requestMock, optionsMock);

    expect(result).toEqual(expected);
  });

  it('should redirect to DEFAULT i18nRedirectRouteFile option if tabId is not found', () => {
    const requestMock = mock<Request>({ url: 'http://example.com/' });
    const optionsMock: GetTabIdOrRedirectOptions = {};

    expect(() => getTabIdOrRedirect(requestMock, optionsMock)).toThrow(
      expect.objectContaining({
        i18nRouteFile: DEFAULT_GET_TAB_ID_OR_REDIRECT_OPTIONS.i18nRedirectRouteFile,
        request: requestMock,
      }),
    );

    expect(i18nRedirect).toHaveBeenCalledWith(DEFAULT_GET_TAB_ID_OR_REDIRECT_OPTIONS.i18nRedirectRouteFile, requestMock);
  });

  it('should redirect to i18nRedirectRouteFile option if tabId is not found', () => {
    const requestMock = mock<Request>({ url: 'http://example.com/' });
    const i18nRedirectRouteFile: I18nRouteFile = 'routes/protected/person-case/privacy-statement.tsx';
    const optionsMock: GetTabIdOrRedirectOptions = { i18nRedirectRouteFile };

    expect(() => getTabIdOrRedirect(requestMock, optionsMock)).toThrow(
      expect.objectContaining({ i18nRouteFile: i18nRedirectRouteFile, request: requestMock }),
    );

    expect(i18nRedirect).toHaveBeenCalledWith(i18nRedirectRouteFile, requestMock);
  });
});

describe('loadMachineActorOrRedirect', () => {
  let machineActorMock: MockProxy<Actor<Machine>>;
  let appSessionMock: MockProxy<AppSession>;

  beforeEach(() => {
    machineActorMock = mock<Actor<Machine>>({ id: 'actor-id' });
    appSessionMock = mock<AppSession>({ inPersonSinApplications: {} });
  });

  it('should return machineActor when found', () => {
    const requestMock = mock<Request>({ url: 'http://example.com/?tid=123' });
    const flowIdMock = '123';
    const optionsMock: LoadMachineActorOrRedirectOptions = { stateName: 'review' };

    vi.mocked(loadMachineActor).mockReturnValue(machineActorMock);

    const expected = machineActorMock;

    const result = loadMachineActorOrRedirect(appSessionMock, requestMock, flowIdMock, optionsMock);

    expect(result).toEqual(expected);
    expect(loadMachineActor).toHaveBeenCalledExactlyOnceWith(appSessionMock, flowIdMock, 'review');
  });

  it('should redirect to DEFAULT i18nRedirectRouteFile option if machineActor is not found', () => {
    const requestMock = mock<Request>({ url: 'http://example.com/?tid=123' });
    const flowIdMock = '123';
    const optionsMock: LoadMachineActorOrRedirectOptions = { stateName: 'review' };

    vi.mocked(loadMachineActor).mockReturnValue(undefined);

    expect(() => loadMachineActorOrRedirect(appSessionMock, requestMock, flowIdMock, optionsMock)).toThrow(
      expect.objectContaining({
        i18nRouteFile: DEFAULT_LOAD_MACHINE_ACTOR_OR_REDIRECT_OPTIONS.i18nRedirectRouteFile,
        request: requestMock,
      }),
    );

    expect(loadMachineActor).toHaveBeenCalledExactlyOnceWith(appSessionMock, flowIdMock, 'review');
    expect(i18nRedirect).toHaveBeenCalledWith(
      DEFAULT_LOAD_MACHINE_ACTOR_OR_REDIRECT_OPTIONS.i18nRedirectRouteFile,
      requestMock,
    );
  });

  it('should redirect to i18nRedirectRouteFile option if machineActor is not found', () => {
    const requestMock = mock<Request>({ url: 'http://example.com/?tid=123' });
    const flowIdMock = '123';
    const i18nRedirectRouteFileOptionMock: I18nRouteFile = 'routes/protected/person-case/privacy-statement.tsx';
    const optionsMock: LoadMachineActorOrRedirectOptions = {
      i18nRedirectRouteFile: i18nRedirectRouteFileOptionMock,
      stateName: 'review',
    };

    vi.mocked(loadMachineActor).mockReturnValue(undefined);

    expect(() => loadMachineActorOrRedirect(appSessionMock, requestMock, flowIdMock, optionsMock)).toThrow(
      expect.objectContaining({ i18nRouteFile: i18nRedirectRouteFileOptionMock, request: requestMock }),
    );

    expect(loadMachineActor).toHaveBeenCalledExactlyOnceWith(appSessionMock, flowIdMock, 'review');
    expect(i18nRedirect).toHaveBeenCalledWith(i18nRedirectRouteFileOptionMock, requestMock);
  });
});
