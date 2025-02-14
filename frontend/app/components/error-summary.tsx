import type { ComponentPropsWithoutRef, JSX } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useActionData, useFetcher } from 'react-router';

import { useTranslation } from 'react-i18next';

import { AnchorLink } from '~/components/links';
import { cn } from '~/utils/tailwind-utils';

/**
 * Represents an item in the error summary, containing an error message
 * and the associated field ID where the error occurred.
 */
export interface ErrorSummaryItem {
  /** The error message to display. */
  errorMessage: string;
  /** The ID of the field associated with the error. */
  fieldId: string;
}

/**
 * Props for the ErrorSummary component.
 */
export interface ErrorSummaryProps extends OmitStrict<ComponentPropsWithoutRef<'section'>, 'role' | 'tabIndex'> {
  /** A list of error items to display. */
  errors: readonly ErrorSummaryItem[];
}

/**
 * ErrorSummary component displays a list of error messages with associated
 * field IDs and provides anchor links for users to quickly navigate to
 * specific form fields that caused the errors.
 *
 * - When there are errors, the component scrolls the section into view
 *   and focuses on it to ensure visibility.
 * - Provides an accessible, styled list of errors with links to the form fields.
 *
 * @returns The rendered component or `null` if there are no errors.
 */
export function ErrorSummary({ className, errors, ...rest }: ErrorSummaryProps): JSX.Element | null {
  const { t } = useTranslation(['gcweb']);
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll and focus on the error summary when errors are updated.
  useEffect(() => {
    if (errors.length > 0 && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth' });
      sectionRef.current.focus();
    }
  }, [errors]);

  if (errors.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className={cn('my-5 border-4 border-red-600 p-4', className)}
      {...rest}
      tabIndex={-1}
      role="alert"
    >
      <h2 className="font-lato text-lg font-semibold">{t('gcweb:error-summary.header', { count: errors.length })}</h2>
      <ol className="mt-1.5 list-decimal space-y-2 pl-7">
        {errors.map(({ fieldId, errorMessage }) => (
          <li key={`${fieldId}-${errorMessage}`}>
            <AnchorLink className="text-red-700 underline hover:decoration-2 focus:decoration-2" anchorElementId={fieldId}>
              {errorMessage}
            </AnchorLink>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Props for the `ActionDataErrorSummary` component.
 */
type ActionDataErrorSummaryProps = ComponentPropsWithoutRef<'div'> & {
  /**
   * The action data from a React Router Form or Fetcher.
   * This triggers error collection when form or Fetcher data changes.
   */
  actionData: unknown | undefined;
};

/**
 * The `ActionDataErrorSummary` component collects and displays form validation errors.
 *
 * @remarks
 * This component uses the `useEffect` hook to capture validation errors from form inputs that contain
 * the `aria-errormessage` attribute. It finds the error messages, associates them with input fields,
 * and displays them using the `ErrorSummary` component.
 *
 * @example
 * ```tsx
 * import { Form } from 'react-router';
 * import type { Route } from './+types/my-route';
 * import { ActionDataErrorSummary } from '~/components/error-summary';
 *
 * export default function MyRouteComponent({ loaderData, actionData, params }: Route.ComponentProps) {
 *   return (
 *     <ActionDataErrorSummary actionData={actionData}>
 *       <Form method="post" noValidate>
 *         ...
 *       </Form>
 *     </ActionDataErrorSummary>
 *   );
 * }
 * ```
 */
export function ActionDataErrorSummary({ actionData, children, ...rest }: ActionDataErrorSummaryProps): JSX.Element {
  const [errors, setErrors] = useState<readonly ErrorSummaryItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    setErrors(collectFormValidationErrors(containerRef.current));
  }, [actionData]);

  return (
    <div ref={containerRef} {...rest}>
      {errors.length > 0 && <ErrorSummary errors={errors} />}
      {children}
    </div>
  );
}

/**
 * Collects validation errors from form inputs within a container element.
 * @param container - The DOM element to search for form inputs with validation errors
 * @returns An array of ErrorSummaryItems containing field IDs and their corresponding error messages
 */
function collectFormValidationErrors(container: HTMLElement): readonly ErrorSummaryItem[] {
  // Keeps track of processed error message IDs to prevent duplicate error messages
  // when multiple inputs reference the same error message element
  const processedErrorMessageIds = new Set<string>();

  const errorItems: ErrorSummaryItem[] = [];

  for (const input of findInvalidInputs(container)) {
    for (const messageId of getErrorMessageIds(input)) {
      // Skip this error message if we've already processed it to avoid duplicates
      // This can happen when multiple form fields reference the same error message element
      if (processedErrorMessageIds.has(messageId)) {
        continue;
      }

      const errorItem = createErrorItem(input, messageId);

      if (errorItem) {
        errorItems.push(errorItem);
        processedErrorMessageIds.add(messageId);
      }
    }
  }

  return errorItems;
}

/**
 * Finds all input elements with aria-errormessage attributes in the container
 */
function findInvalidInputs(container: HTMLElement): readonly Element[] {
  return Array.from(container.querySelectorAll('[aria-errormessage]'));
}

/**
 * Extracts and returns array of error message IDs from an input's aria-errormessage attribute
 */
function getErrorMessageIds(input: Element): readonly string[] {
  const errorMessageAttr = input.getAttribute('aria-errormessage');

  if (!errorMessageAttr) {
    return [];
  }

  return errorMessageAttr.split(' ').filter(Boolean);
}

/**
 * Creates an ErrorSummaryItem from an input element and error message ID
 * @returns ErrorSummaryItem if valid error message is found, null otherwise
 */
function createErrorItem(input: Element, errorMessageId: string): ErrorSummaryItem | null {
  const errorMessageElement = document.getElementById(errorMessageId);
  const errorMessageContent = errorMessageElement?.textContent?.trim();

  if (!errorMessageContent) {
    return null;
  }

  return {
    fieldId: input.id,
    errorMessage: errorMessageContent,
  };
}

/**
 * Props for the `FetcherErrorSummary` component.
 */
type FetcherErrorSummaryProps = OmitStrict<ActionDataErrorSummaryProps, 'actionData'> & {
  /**
   * The key of the Fetcher instance to use for error collection.
   */
  fetcherKey: string;
};

/**
 * `FetcherErrorSummary` component collects and displays validation errors from a specific Fetcher.
 *
 * @remarks
 * Fetchers are instances provided by React Router that manage form interactions independently.
 * This component works by linking to a specific fetcher instance identified by the `fetcherKey`.
 *
 * @example
 * ```tsx
 * import { useFetcher } from 'react-router';
 * import type { Route } from './+types/my-route';
 * import { FetcherErrorSummary } from '~/components/error-summary';
 *
 * export default function MyRouteComponent({ loaderData, actionData, params }: Route.ComponentProps) {
 *   const fetcher = useFetcher({ key: "my-fetcher-key" });
 *
 *   return (
 *     <FetcherErrorSummary fetcherKey="my-fetcher-key">
 *       <fetcher.Form method="post" noValidate>
 *         ...
 *       </fetcher.Form>
 *     </FetcherErrorSummary>
 *   );
 * }
 * ```
 */
export function FetcherErrorSummary({ children, fetcherKey, ...rest }: FetcherErrorSummaryProps): JSX.Element {
  const fetcher = useFetcher({ key: fetcherKey });
  return (
    <ActionDataErrorSummary actionData={fetcher.data} {...rest}>
      {children}
    </ActionDataErrorSummary>
  );
}

/**
 * Props for the `FormErrorSummary` component.
 */
type FormDataErrorSummaryProps = OmitStrict<ActionDataErrorSummaryProps, 'actionData'>;

/**
 * `FormErrorSummary` component collects and displays validation errors from a form.
 *
 * @remarks
 * This component automatically links to the action data of the current form by using the `useActionData` hook.
 *
 * @example
 * ```tsx
 * import { Form } from 'react-router';
 * import type { Route } from './+types/my-route';
 * import { FormErrorSummary } from '~/components/error-summary';
 *
 * export default function MyRouteComponent({ loaderData, actionData, params }: Route.ComponentProps) {
 *   return (
 *     <FormErrorSummary>
 *       <Form method="post" noValidate>
 *         ...
 *       </Form>
 *     </FormErrorSummary>
 *   );
 * }
 * ```
 */
export function FormErrorSummary({ children, ...rest }: FormDataErrorSummaryProps): JSX.Element {
  const actionData = useActionData();
  return (
    <ActionDataErrorSummary actionData={actionData} {...rest}>
      {children}
    </ActionDataErrorSummary>
  );
}
