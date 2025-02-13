import { useActionData, useFetcher } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { ActionDataErrorSummary, ErrorSummary, FetcherErrorSummary, FormErrorSummary } from '~/components/error-summary';

// See https://github.com/jsdom/jsdom/issues/1695
Element.prototype.scrollIntoView = vi.fn();

vi.mock('react-router', () => ({
  useFetcher: vi.fn(),
  useActionData: vi.fn(),
}));

describe('ErrorSummary', () => {
  it('should not render an error summary when there are no errors', () => {
    const { container } = render(<ErrorSummary errors={[]} />);
    expect(container).toMatchSnapshot('expected html');
    expect(container.ownerDocument.activeElement !== container.querySelector('section')).toBeTruthy();
  });

  it('should render an error summary with 1 error', () => {
    const { container } = render(<ErrorSummary errors={[{ fieldId: 'input-test', errorMessage: 'Test error 1' }]} />);
    expect(container).toMatchSnapshot('expected html');
    expect(container.ownerDocument.activeElement === container.querySelector('section')).toBeTruthy();
  });

  it('should render an error summary with 2 errors', () => {
    const { container } = render(
      <ErrorSummary
        errors={[
          { fieldId: 'input-test', errorMessage: 'Test error 1' },
          { fieldId: 'input-test', errorMessage: 'Test error 2' },
        ]}
      />,
    );
    expect(container).toMatchSnapshot('expected html');
    expect(container.ownerDocument.activeElement === container.querySelector('section')).toBeTruthy();
  });
});

describe('ActionDataErrorSummary', () => {
  it('displays errors from action data', () => {
    const actionData = { errors: { field: ['Test error message'] } };

    const { container } = render(
      <ActionDataErrorSummary actionData={actionData}>
        <div id="test-field" aria-errormessage="test-error">
          Test Field
        </div>
        <div id="test-error">{actionData.errors.field.at(0)}</div>
      </ActionDataErrorSummary>,
    );

    expect(container).toMatchSnapshot('expected html');
    expect(container.ownerDocument.activeElement === container.querySelector('section')).toBeTruthy();
  });
});

describe('FetcherErrorSummary', () => {
  it('displays errors from fetcher data', () => {
    const actionData = { errors: { field: ['Test error message'] } };
    const fetcherMock = mock<ReturnType<typeof useFetcher>>({ data: actionData });
    vi.mocked(useFetcher).mockReturnValue(fetcherMock);

    const { container } = render(
      <FetcherErrorSummary fetcherKey="test-fetcher">
        <div id="test-field" aria-errormessage="test-error">
          Test Field
        </div>
        <div id="test-error">{actionData.errors.field.at(0)}</div>
      </FetcherErrorSummary>,
    );

    expect(container).toMatchSnapshot('expected html');
    expect(container.ownerDocument.activeElement === container.querySelector('section')).toBeTruthy();
  });
});

describe('FormErrorSummary', () => {
  it('displays errors from form action data', () => {
    const actionData = { errors: { field: ['Test error message'] } };
    vi.mocked(useActionData).mockReturnValue(actionData);

    const { container } = render(
      <FormErrorSummary>
        <div id="test-field" aria-errormessage="test-error">
          Test Field
        </div>
        <div id="test-error">{actionData.errors.field.at(0)}</div>
      </FormErrorSummary>,
    );

    expect(container).toMatchSnapshot('expected html');
    expect(container.ownerDocument.activeElement === container.querySelector('section')).toBeTruthy();
  });
});
