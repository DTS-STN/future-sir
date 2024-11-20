import type { ComponentProps, ElementRef } from 'react';
import { forwardRef } from 'react';

import { Form, useRouteLoaderData } from 'react-router';

import type { loader } from '~/root';

type AppFormProps = ComponentProps<typeof Form>;

/**
 * A custom form component that automatically adds a CSRF token.
 */
export const AppForm = forwardRef<ElementRef<typeof Form>, AppFormProps>(({ children, ...props }, ref) => {
  const rootLoaderData = useRouteLoaderData<typeof loader>('root');

  return (
    <Form ref={ref} method="POST" {...props}>
      <input type="hidden" name="_csrf" value={rootLoaderData?.csrfToken} />
      {children}
    </Form>
  );
});

AppForm.displayName = 'AppForm';
