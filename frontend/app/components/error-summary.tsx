import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

type ErrorList = [string?, ...string[]];
type NestedErrors = Readonly<Partial<Record<string, ErrorList | undefined>>>;

interface ErrorSummaryProps {
  errors?: NestedErrors;
  full?: boolean;
}

export function ErrorSummary({ errors, full }: ErrorSummaryProps) {
  const { t } = useTranslation(['gcweb']);

  const summaryErrors = useMemo<ErrorList | undefined>(() => {
    if (errors) {
      return full
        ? Object.values(errors)
            .filter(Array.isArray)
            .filter((arr) => arr.length > 0)
            .flatMap((arr) => arr)
        : Object.values(errors)
            .filter(Array.isArray)
            .filter((arr) => arr.length > 0)
            .map((arr) => arr[0]);
    }
  }, [errors, full]);

  return (
    <>
      {summaryErrors && summaryErrors.length > 0 && (
        <section className="my-5 border-4 border-red-600 p-4" tabIndex={-1} role="alert">
          <h2 className="font-lato text-lg font-semibold">
            {t('gcweb:error-summary.header', { count: summaryErrors.length })}
          </h2>
          <ul className="mt-1.5 list-disc space-y-2 pl-7">
            {summaryErrors.map((errorMessage) => (
              <li key={errorMessage} className="text-red-700 underline">
                {errorMessage}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
