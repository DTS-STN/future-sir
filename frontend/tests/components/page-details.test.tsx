import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PageDetails } from '~/components/page-details';

vi.mock('react-i18next');

describe('PageDetails', () => {
  it('should render the pageid, app version, and date modified', () => {
    vi.stubGlobal('__appEnvironment', {
      BUILD_DATE: '2000-01-01T00:00:00Z',
      BUILD_VERSION: '0.0.0',
    });

    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => <PageDetails />,
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });
});
