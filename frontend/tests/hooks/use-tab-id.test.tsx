import { MemoryRouter, useLocation } from 'react-router';

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SESSION_STORAGE_KEY, useTabId } from '~/hooks/use-tab-id';

describe('use-tab-id', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

  it('should generate a new tab id if none exists in session storage', () => {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);

    const { result } = renderHook(() => ({ location: useLocation(), tabId: useTabId() }), { wrapper });

    expect(result.current.tabId).toMatch(/[a-z]{2}-[0-9]{4}/);
    expect(window.sessionStorage.getItem(SESSION_STORAGE_KEY)).toEqual(result.current.tabId);
  });

  it('should update the URL if it does not match existing tab id', () => {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, 'xx-0000');

    const { result } = renderHook(() => ({ location: useLocation(), tabId: useTabId() }), { wrapper });

    expect(result.current.tabId).toEqual('xx-0000');
    expect(result.current.location.search).toContain('tid=xx-0000');
  });

  it('should not update the URL if options.navigate=false', () => {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, 'xx-0000');

    const { result } = renderHook(() => ({ location: useLocation(), tabId: useTabId({ navigate: false }) }), { wrapper });

    expect(result.current.tabId).toEqual('xx-0000');
    expect(result.current.location.search).not.toContain('tid=xx-0000');
  });

  it('should re-render when session storage changes', () => {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, 'xx-0000');

    const { result } = renderHook(() => ({ location: useLocation(), tabId: useTabId() }), { wrapper });

    expect(result.current.tabId).toEqual('xx-0000');

    act(() => {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, 'xx-1111');
      window.dispatchEvent(new StorageEvent('storage', { key: SESSION_STORAGE_KEY }));
    });

    expect(result.current.tabId).toEqual('xx-1111');
    expect(result.current.location.search).toContain('tid=xx-1111');
  });
});
