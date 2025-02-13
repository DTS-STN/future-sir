import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageDetails } from '~/components/page-details';

describe('PageDetails', () => {
  it('should render the pageid, app version, and date modified', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => <PageDetails buildDate="2000-01-01T00:00:00Z" buildVersion="0.0.0" pageId="PUBL-0001" />,
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);
    expect(container).toMatchSnapshot('expected html');
  });
});
