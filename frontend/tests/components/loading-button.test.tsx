import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadingButton } from '~/components/loading-button';

describe('LoadingButton', () => {
  it('renders the children correctly', () => {
    const { container } = render(<LoadingButton>Test Button</LoadingButton>);
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders the loading spinner at the start position', () => {
    const { container } = render(
      <LoadingButton loading loadingPosition="start">
        Test Button
      </LoadingButton>,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders the loading spinner at the end position', () => {
    const { container } = render(
      <LoadingButton loading loadingPosition="end">
        Test Button
      </LoadingButton>,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders the custom loading icon', () => {
    const { container } = render(
      <LoadingButton loading loadingIcon={faCheck}>
        Test Button
      </LoadingButton>,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
