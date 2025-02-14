import { useId } from 'react';
import type { ReactNode } from 'react';

import { InputError } from '~/components/input-error';
import { cn } from '~/utils/tailwind-utils';

const baseClassName =
  'size-4 rounded-sm border-gray-500 bg-gray-50 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-hidden';
const disabledClassName = 'pointer-events-none cursor-not-allowed opacity-70';
const errorClassName = 'border-red-500 text-red-700 focus:border-red-500 focus:ring-red-500';
const readOnlyClassName = 'pointer-events-none cursor-not-allowed opacity-70';

export interface InputCheckboxProps extends OmitStrict<React.ComponentProps<'input'>, 'aria-labelledby' | 'type'> {
  append?: ReactNode;
  appendClassName?: string;
  errorMessage?: string;
  hasError?: boolean;
  labelClassName?: string;
  name: string;
}

export function InputCheckbox({
  errorMessage,
  append,
  appendClassName,
  children,
  className,
  hasError,
  id,
  labelClassName,
  ...restProps
}: InputCheckboxProps) {
  const defaultId = useId();
  const baseId = `input-checkbox-${id ?? defaultId}`;
  const ids = {
    label: `${baseId}-label`,
    input: `${baseId}-input`,
    error: `${baseId}-error`,
    wrapper: `${baseId}-wrapper`,
  };

  return (
    <div id={ids.wrapper}>
      {errorMessage && (
        <InputError id={ids.error} className="my-2">
          {errorMessage}
        </InputError>
      )}
      <div className="flex items-center">
        <input
          type="checkbox"
          id={ids.input}
          aria-labelledby={ids.label}
          aria-errormessage={errorMessage ? ids.error : undefined}
          className={cn(
            'size-4 rounded-sm border-gray-500 bg-gray-50 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-hidden',
            baseClassName,
            restProps.readOnly && readOnlyClassName,
            restProps.disabled && disabledClassName,
            (errorMessage ?? hasError) && errorClassName,
            className,
          )}
          data-testid="input-checkbox"
          {...restProps}
        />
        <label
          id={ids.label}
          htmlFor={ids.input}
          className={cn(
            'block pl-3 leading-6',
            restProps.readOnly && readOnlyClassName,
            restProps.disabled && disabledClassName,
            labelClassName,
          )}
        >
          {children}
        </label>
      </div>
      {append && <div className={cn('mt-4 ml-7', appendClassName)}>{append}</div>}
    </div>
  );
}
