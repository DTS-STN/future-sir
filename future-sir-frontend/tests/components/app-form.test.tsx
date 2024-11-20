import { createRoutesStub, useRouteLoaderData } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppForm } from '~/components';

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouteLoaderData: vi.fn(),
}));

describe('AppForm', () => {
  it('renders a form with the CSRF token added', () => {
    vi.mocked(useRouteLoaderData).mockReturnValue({
      csrfToken: '00000000-0000-0000-0000-000000000000',
    });

    const RoutesStub = createRoutesStub([
      {
        path: '/',
        Component: () => <AppForm>This is a test</AppForm>,
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/']} />);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });
});
