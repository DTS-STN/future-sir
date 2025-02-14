import { useId } from 'react';
import type { ComponentProps, ReactNode } from 'react';

import { InputCheckbox } from '~/components/input-checkbox';
import { InputError } from '~/components/input-error';
import { InputHelp } from '~/components/input-help';
import { InputLegend } from '~/components/input-legend';

export interface InputCheckboxesOption
  extends OmitStrict<
    ComponentProps<typeof InputCheckbox>,
    'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-required' | 'id' | 'name' | 'required'
  > {
  value: string;
}

export interface InputCheckboxesProps {
  errorMessage?: string;
  helpMessagePrimary?: React.ReactNode;
  helpMessagePrimaryClassName?: string;
  helpMessageSecondary?: React.ReactNode;
  helpMessageSecondaryClassName?: string;
  id?: string;
  options: InputCheckboxesOption[];
  legend: ReactNode;
  name: string;
  required?: boolean;
}

export function InputCheckboxes({
  errorMessage,
  helpMessagePrimary,
  helpMessagePrimaryClassName,
  helpMessageSecondary,
  helpMessageSecondaryClassName,
  id,
  legend,
  name,
  options,
  required,
}: InputCheckboxesProps) {
  const defaultId = useId();
  const baseId = `input-checkboxes-${id ?? defaultId}`;
  const ids = {
    wrapper: baseId,
    legend: `${baseId}-legend`,
    error: `${baseId}-error`,
    help: {
      primary: `${baseId}-help-primary`,
      secondary: `${baseId}-help-secondary`,
    },
  };

  const ariaDescribedbyIds =
    [
      !!helpMessagePrimary && ids.help.primary, //
      !!helpMessageSecondary && ids.help.secondary,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <fieldset id={ids.wrapper} className="space-y-2">
      <InputLegend id={ids.legend} required={required}>
        {legend}
      </InputLegend>
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
      <ul className="space-y-2">
        {options.map((optionProps) => {
          const checkboxId = `${defaultId}-option-${optionProps.value}`;
          return (
            <li key={checkboxId}>
              <InputCheckbox
                aria-describedby={ariaDescribedbyIds}
                aria-errormessage={errorMessage ? ids.error : undefined}
                aria-invalid={errorMessage ? true : undefined}
                aria-required={required ? true : undefined}
                hasError={!!errorMessage}
                id={checkboxId}
                name={name}
                required={required}
                {...optionProps}
              />
            </li>
          );
        })}
      </ul>
      {helpMessageSecondary && (
        <InputHelp id={ids.help.secondary} className={helpMessageSecondaryClassName}>
          {helpMessageSecondary}
        </InputHelp>
      )}
    </fieldset>
  );
}
