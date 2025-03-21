import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { MockProxy } from 'vitest-mock-extended';
import type { Actor } from 'xstate';

import { loadMachineContextOrRedirect } from '../../../../app/routes/protected/person-case/route-helpers.server';

import { i18nRedirect } from '~/.server/utils/route-utils';
import type { I18nRouteFile } from '~/i18n-routes';
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

describe('loadMachineContextOrRedirect', () => {
  let machineActorMock: MockProxy<Actor<Machine>>;
  let appSessionMock: MockProxy<AppSession>;

  beforeEach(() => {
    machineActorMock = mock<Actor<Machine>>({ id: 'actor-id' });
    appSessionMock = mock<AppSession>({ inPersonSinApplications: {} });
  });

  it('should return machineActor and tabId when both are found', () => {
    const requestMock = mock<Request>({ url: 'http://example.com/?tid=123' });

    vi.mocked(loadMachineActor).mockReturnValue(machineActorMock);

    const expected = { machineActor: machineActorMock, tabId: '123' };

    const result = loadMachineContextOrRedirect({ session: appSessionMock, request: requestMock, stateName: 'review' });

    expect(result).toEqual(expected);
    expect(loadMachineActor).toHaveBeenCalledExactlyOnceWith(appSessionMock, requestMock, 'review');
  });

  it('should redirect to DEFAULT i18nRedirectRouteFile argument value if tabId is not found', () => {
    const requestMock = mock<Request>({ url: 'http://example.com/' });
    const defaultI18nRedirectRouteFile: I18nRouteFile = 'routes/protected/index.tsx';

    expect(() => loadMachineContextOrRedirect({ session: appSessionMock, request: requestMock, stateName: 'review' })).toThrow(
      expect.objectContaining({ i18nRouteFile: defaultI18nRedirectRouteFile, request: requestMock }),
    );

    expect(i18nRedirect).toHaveBeenCalledWith(defaultI18nRedirectRouteFile, requestMock);
    expect(loadMachineActor).not.toHaveBeenCalled();
  });

  it('should redirect to i18nRedirectRouteFile argument value if tabId is not found', () => {
    const requestMock = mock<Request>({ url: 'http://example.com/' });
    const i18nRedirectRouteFile: I18nRouteFile = 'routes/protected/person-case/privacy-statement.tsx';

    expect(() =>
      loadMachineContextOrRedirect({
        session: appSessionMock,
        request: requestMock,
        i18nRedirectRouteFile,
        stateName: 'review',
      }),
    ).toThrow(expect.objectContaining({ i18nRouteFile: i18nRedirectRouteFile, request: requestMock }));

    expect(i18nRedirect).toHaveBeenCalledWith(i18nRedirectRouteFile, requestMock);
    expect(loadMachineActor).not.toHaveBeenCalled();
  });

  it('should redirect to DEFAULT i18nRedirectRouteFile argument value if machineActor is not found', () => {
    const requestMock = mock<Request>({ url: 'http://example.com/?tid=123' });
    const defaultI18nRedirectRouteFile: I18nRouteFile = 'routes/protected/index.tsx';

    vi.mocked(loadMachineActor).mockReturnValue(undefined);

    expect(() => loadMachineContextOrRedirect({ session: appSessionMock, request: requestMock, stateName: 'review' })).toThrow(
      expect.objectContaining({ i18nRouteFile: defaultI18nRedirectRouteFile, request: requestMock }),
    );

    expect(loadMachineActor).toHaveBeenCalledExactlyOnceWith(appSessionMock, requestMock, 'review');
    expect(i18nRedirect).toHaveBeenCalledWith(defaultI18nRedirectRouteFile, requestMock);
  });

  it('should redirect to i18nRedirectRouteFile argument value if machineActor is not found', () => {
    const requestMock = mock<Request>({ url: 'http://example.com/?tid=123' });
    const i18nRedirectRouteFile: I18nRouteFile = 'routes/protected/person-case/privacy-statement.tsx';

    vi.mocked(loadMachineActor).mockReturnValue(undefined);

    expect(() =>
      loadMachineContextOrRedirect({
        session: appSessionMock,
        request: requestMock,
        i18nRedirectRouteFile,
        stateName: 'review',
      }),
    ).toThrow(expect.objectContaining({ i18nRouteFile: i18nRedirectRouteFile, request: requestMock }));

    expect(loadMachineActor).toHaveBeenCalledExactlyOnceWith(appSessionMock, requestMock, 'review');
    expect(i18nRedirect).toHaveBeenCalledWith(i18nRedirectRouteFile, requestMock);
  });
});
