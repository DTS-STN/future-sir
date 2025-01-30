import { createRoutesStub } from 'react-router';

import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card, CardIcon, CardImage, CardTag, CardTitle } from '~/components/card';

describe('Card', () => {
  it('should render a card', () => {
    const { container } = render(
      <Card>
        <CardIcon icon={faUserPlus}>
          <CardTitle title="Card Title" highlight>
            Test Card
          </CardTitle>
        </CardIcon>
      </Card>,
    );
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should render a disabled card', () => {
    const { container } = render(
      <Card disabled>
        <CardIcon icon={faUserPlus}>
          <CardTitle title="Card Title" highlight>
            Test Card
          </CardTitle>
        </CardIcon>
      </Card>,
    );
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should render a card with a link', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => (
          <Card file="routes/public/index.tsx">
            <CardIcon icon={faUserPlus}>
              <CardTitle title="Card Title" highlight>
                Test Card
              </CardTitle>
            </CardIcon>
          </Card>
        ),
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should render a card with a link with an image', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => (
          <Card
            file="routes/public/index.tsx"
            image={<CardImage src="https://www.canada.ca/content/dam/canada/activities/20250115-1-520x200.jpg" alt="" />}
            tag={<CardTag tag={'Coming soon'} />}
          >
            <CardIcon icon={faUserPlus}>
              <CardTitle title="Card Title" highlight>
                Test Card
              </CardTitle>
            </CardIcon>
          </Card>
        ),
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should render a disabled card with a link', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => (
          <Card
            disabled
            file="routes/public/index.tsx"
            image={<CardImage src="https://www.canada.ca/content/dam/canada/activities/20250115-1-520x200.jpg" alt="" />}
            tag={<CardTag tag={'Coming soon'} />}
          >
            <CardIcon icon={faUserPlus}>
              <CardTitle title="Card Title" highlight>
                Test Card
              </CardTitle>
            </CardIcon>
          </Card>
        ),
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should render a card with onClick', () => {
    const RoutesStub = createRoutesStub([
      {
        Component: () => (
          <Card onClick={() => {}} tag={<CardTag tag={'Coming soon'} />}>
            <CardIcon icon={faUserPlus}>
              <CardTitle title="Card Title" highlight>
                Test Card
              </CardTitle>
            </CardIcon>
          </Card>
        ),
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should render a card with onClick with an image', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => (
          <Card
            onClick={() => {}}
            image={<CardImage src="https://www.canada.ca/content/dam/canada/activities/20250115-1-520x200.jpg" alt="" />}
            tag={<CardTag tag={'Coming soon'} />}
          >
            <CardIcon icon={faUserPlus}>
              <CardTitle title="Card Title" highlight>
                Test Card
              </CardTitle>
            </CardIcon>
          </Card>
        ),
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });

  it('should render a disabled card with onClick', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => (
          <Card
            disabled
            onClick={() => {}}
            image={<CardImage src="https://www.canada.ca/content/dam/canada/activities/20250115-1-520x200.jpg" alt="" />}
            tag={<CardTag tag={'Coming soon'} />}
          >
            <CardIcon icon={faUserPlus}>
              <CardTitle title="Card Title" highlight>
                Test Card
              </CardTitle>
            </CardIcon>
          </Card>
        ),
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);
    expect(container.innerHTML).toMatchSnapshot('expected html');
  });
});
