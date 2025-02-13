import { useId } from 'react';
import type { ComponentProps } from 'react';

import { InputError } from '~/components/input-error';
import { InputHelp } from '~/components/input-help';
import { InputLabel } from '~/components/input-label';
import { cn } from '~/utils/tailwind-utils';

export interface InputFileProps extends OmitStrict<ComponentProps<'input'>, 'type'> {
  errorMessage?: string;
  helpMessagePrimary?: React.ReactNode;
  helpMessagePrimaryClassName?: string;
  helpMessageSecondary?: React.ReactNode;
  helpMessageSecondaryClassName?: string;
  label: string;
  name: string;
}

export function InputFile({
  'aria-describedby': ariaDescribedby,
  errorMessage,
  className,
  helpMessagePrimary,
  helpMessagePrimaryClassName,
  helpMessageSecondary,
  helpMessageSecondaryClassName,
  id,
  label,
  required,
  ...rest
}: InputFileProps) {
  const defaultId = useId();
  const baseId = `input-file-${id ?? defaultId}`;
  const ids = {
    wrapper: baseId,
    label: `${baseId}-label`,
    input: `${baseId}-input`,
    error: `${baseId}-error`,
    help: {
      primary: `${baseId}-help-primary`,
      secondary: `${baseId}-help-secondary`,
    },
  };
  const resolvedAriaDescribedby =
    [
      ariaDescribedby, //
      !!helpMessagePrimary && ids.help.primary,
      !!helpMessageSecondary && ids.help.secondary,
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <div id={ids.wrapper} className="space-y-2">
      <InputLabel id={ids.label} htmlFor={id} required={required}>
        {label}
      </InputLabel>
      {errorMessage && (
        <p>
          <InputError id={ids.error}>{errorMessage}</InputError>
        </p>
      )}
      {helpMessagePrimary && (
        <InputHelp id={ids.help.primary} className={helpMessagePrimaryClassName}>
          {helpMessagePrimary}
        </InputHelp>
      )}
      <input
        aria-describedby={resolvedAriaDescribedby}
        aria-errormessage={errorMessage ? ids.error : undefined}
        aria-invalid={errorMessage ? true : undefined}
        aria-labelledby={ids.label}
        aria-required={required ? true : undefined}
        className={cn(
          'block cursor-pointer rounded-lg border border-gray-500 focus:border-blue-500 focus:ring-3 focus:ring-blue-500 focus:outline-hidden',
          'file:border-r file:border-gray-200 file:bg-gray-50 file:text-black hover:file:bg-gray-200',
          'disabled:pointer-events-none disabled:bg-gray-100 disabled:opacity-70',
          'aria-invalid:border-red-500 aria-invalid:focus:border-red-500 aria-invalid:focus:ring-red-500',
          className,
        )}
        id={ids.input}
        required={required}
        {...rest}
        type="file"
      />
      {helpMessageSecondary && (
        <InputHelp id={ids.help.secondary} className={helpMessageSecondaryClassName}>
          {helpMessageSecondary}
        </InputHelp>
      )}
    </div>
  );
}
