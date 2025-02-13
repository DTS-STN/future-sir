import { createRoutesStub } from 'react-router';

import { faUser } from '@fortawesome/free-solid-svg-icons';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '~/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardIcon,
  CardImage,
  CardTag,
  CardTitle,
} from '~/components/card';
import { AppLink } from '~/components/links';

describe('Card', () => {
  it('should render a card', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Test Card</CardDescription>
        </CardHeader>
      </Card>,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render a card with a link', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => (
          <Card asChild>
            <AppLink file="routes/public/index.tsx">
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Test Card</CardDescription>
              </CardHeader>
            </AppLink>
          </Card>
        ),
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render a card with a link with an image', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => (
          <Card asChild>
            <AppLink file="routes/public/index.tsx">
              <CardImage src="https://www.canada.ca/content/dam/canada/activities/20250115-1-520x200.jpg" />
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Test Card</CardDescription>
              </CardHeader>
              <CardFooter>
                <CardTag>Coming soon</CardTag>
              </CardFooter>
            </AppLink>
          </Card>
        ),
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render a card with a link with an icon', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => (
          <Card>
            <div className="flex items-center gap-4 p-6">
              <CardIcon icon={faUser} />
              <CardHeader className="p-0">
                <CardTitle asChild>
                  <h2>Card Title</h2>
                </CardTitle>
                <CardDescription>Test Card</CardDescription>
              </CardHeader>
            </div>
          </Card>
        ),
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);
    expect(container).toMatchSnapshot('expected html');
  });

  it('should render a card with a link with an icon, content, footer with button and heading2', () => {
    const RoutesStub = createRoutesStub([
      {
        path: '/fr/public',
        Component: () => (
          <Card>
            <div className="flex items-center gap-4 p-6">
              <CardIcon icon={faUser} />
              <CardHeader className="p-0">
                <CardTitle asChild>
                  <h2>Card Title</h2>
                </CardTitle>
                <CardDescription>Test Card</CardDescription>
              </CardHeader>
            </div>
            <CardContent className="space-y-3">
              <p>Card content part 1</p>
              <p>Card content part 2</p>
            </CardContent>
            <CardFooter>
              <Button>Click me</Button>
            </CardFooter>
          </Card>
        ),
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/public']} />);
    expect(container).toMatchSnapshot('expected html');
  });
});
