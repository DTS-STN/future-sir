import { useId, useState } from 'react';
import type { ComponentProps } from 'react';

import { useTranslation } from 'react-i18next';

import { InputError } from '~/components/input-error';
import { InputHelp } from '~/components/input-help';
import { InputLabel } from '~/components/input-label';
import { cn } from '~/utils/tailwind-utils';

export interface InputFileProps extends OmitStrict<ComponentProps<'input'>, 'type' | 'defaultValue'> {
  errorMessage?: string;
  captionClassName?: string;
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
  captionClassName,
  helpMessagePrimary,
  helpMessagePrimaryClassName,
  helpMessageSecondary,
  helpMessageSecondaryClassName,
  id,
  label,
  required,
  onChange,
  ...rest
}: InputFileProps) {
  const { t } = useTranslation('gcweb');
  const [fileName, setFileName] = useState(t('input-file.no-file'));
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
    <div id={ids.wrapper} className={cn('space-y-2', className)}>
      <InputLabel id={ids.label} required={required}>
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
        aria-labelledby={ids.label}
        aria-errormessage={errorMessage ? ids.error : undefined}
        aria-invalid={errorMessage ? true : undefined}
        aria-required={required ? true : undefined}
        id={ids.input}
        required={required}
        onChange={(e) => {
          setFileName(e.target.files?.[0]?.name ?? t('input-file.no-file'));
          onChange?.(e);
        }}
        {...rest}
        type="file"
        className="peer absolute -z-10 h-12 w-50 overflow-hidden opacity-0 sm:w-100"
      />
      <label
        htmlFor={ids.input}
        className={cn(
          'block w-full cursor-pointer overflow-hidden rounded-lg border border-gray-500 px-3 py-2 whitespace-nowrap',
          'peer-focus:border-blue-500 peer-focus:ring-1 peer-focus:ring-blue-500 peer-focus:outline-hidden',
          'sm:w-fit sm:pr-20 sm:pl-0',
          'peer-disabled:pointer-events-none peer-disabled:bg-gray-100 peer-disabled:opacity-70',
          errorMessage && 'border-red-500 peer-focus:border-red-500 peer-focus:ring-red-500',
        )}
      >
        <span className={cn('mr-3 hidden rounded bg-slate-100 px-3 py-4 sm:inline', captionClassName)}>
          {t('input-file.choose-file')}
        </span>
        {fileName}
      </label>
      {helpMessageSecondary && (
        <InputHelp id={ids.help.secondary} className={helpMessageSecondaryClassName}>
          {helpMessageSecondary}
        </InputHelp>
      )}
    </div>
  );
}
