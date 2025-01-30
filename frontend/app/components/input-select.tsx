import type { ComponentProps, ReactNode } from 'react';

import { InputError } from '~/components/input-error';
import { InputHelp } from '~/components/input-help';
import { InputLabel } from '~/components/input-label';
import { cn } from '~/utils/tailwind-utils';

const inputBaseClassName =
  'block rounded-lg border-gray-500 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-500';
const inputDisabledClassName =
  'disabled:bg-gray-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70';
const inputErrorClassName = 'border-red-500 focus:border-red-500 focus:ring-red-500';

export interface InputSelectProps
  extends OmitStrict<
    ComponentProps<'select'>,
    'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-labelledby' | 'aria-required'
  > {
  errorMessage?: string;
  helpMessage?: ReactNode;
  id: string;
  label: string;
  name: string;
  options: OmitStrict<ComponentProps<'option'>, 'id'>[];
}

export function InputSelect(props: InputSelectProps) {
  const { errorMessage, helpMessage, id, label, options, className, ref, required, ...restInputProps } = props;

  const inputErrorId = `input-${id}-error`;
  const inputHelpMessageId = `input-${id}-help`;
  const inputLabelId = `input-${id}-label`;
  const inputTestId = `input-${id}-test`;
  const inputWrapperId = `input-${id}`;

  return (
    <div id={inputWrapperId} data-testid={inputWrapperId}>
      <InputLabel id={inputLabelId} htmlFor={id} className="mb-2" required={required}>
        {label}
      </InputLabel>
      {errorMessage && (
        <p className="mb-2">
          <InputError id={inputErrorId}>{errorMessage}</InputError>
        </p>
      )}
      <select
        ref={ref}
        aria-describedby={helpMessage ? inputHelpMessageId : undefined}
        aria-errormessage={errorMessage && inputErrorId}
        aria-invalid={!!errorMessage}
        aria-labelledby={inputLabelId}
        aria-required={required}
        className={cn(inputBaseClassName, inputDisabledClassName, errorMessage && inputErrorClassName, className)}
        data-testid={inputTestId}
        id={id}
        required={required}
        {...restInputProps}
      >
        {options.map((optionProps, index) => {
          const inputOptionId = `${id}-select-option-${index}`;
          return <option id={inputOptionId} data-testid={inputOptionId} key={String(optionProps.value)} {...optionProps} />;
        })}
      </select>
      {helpMessage && (
        <InputHelp id={inputHelpMessageId} className="mt-2" data-testid={`input-${id}-select-help`}>
          {helpMessage}
        </InputHelp>
      )}
    </div>
  );
}
