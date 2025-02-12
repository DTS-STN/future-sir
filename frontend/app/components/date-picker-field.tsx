import { Fragment } from 'react';
import type { JSX, ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { InputError } from '~/components/input-error';
import { InputHelp } from '~/components/input-help';
import { InputLabel } from '~/components/input-label';
import { InputLegend } from '~/components/input-legend';
import { useLanguage } from '~/hooks/use-language';
import { extractDateParts, getLocalizedMonths } from '~/utils/date-utils';
import { padWithZero } from '~/utils/string-utils';
import { cn } from '~/utils/tailwind-utils';

type DatePart = 'year' | 'month' | 'day';

type AriaErrorMessage = Readonly<Record<DatePart, string | undefined>>;

/**
 * Order of date parts based on language
 */
const DATE_PART_ORDER = {
  en: ['month', 'day', 'year'] as const,
  fr: ['day', 'month', 'year'] as const,
} as const satisfies Record<Language, DatePart[]>;

const inputStyles = {
  base: 'rounded-lg border-gray-500 focus:border-blue-500 focus:ring-blue-500 block focus:ring focus:outline-none',
  disabled: 'disabled:bg-gray-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70',
  error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
} as const;

/**
 * Props for the DatePickerField component
 */
export interface DatePickerFieldProps {
  defaultValue?: string;
  disabled?: boolean;
  errorMessages?: {
    all?: string;
    day?: string;
    month?: string;
    year?: string;
  };
  helpMessagePrimary?: React.ReactNode;
  helpMessagePrimaryClassName?: string;
  helpMessageSecondary?: React.ReactNode;
  helpMessageSecondaryClassName?: string;
  id: string;
  legend: ReactNode;
  names: {
    day: string;
    month: string;
    year: string;
  };
  required?: boolean;
}

/**
 * DatePickerField component
 *
 * @param props - Props for the DatePickerField component
 * @returns JSX.Element
 */
export const DatePickerField = ({
  defaultValue,
  disabled,
  errorMessages,
  helpMessagePrimary,
  helpMessagePrimaryClassName,
  helpMessageSecondary,
  helpMessageSecondaryClassName,
  id,
  legend,
  names,
  required,
}: DatePickerFieldProps): JSX.Element => {
  const { t } = useTranslation(['gcweb']);
  const { currentLanguage = 'en' } = useLanguage(); // english by default
  const currentDatePartOrder = DATE_PART_ORDER[currentLanguage];

  // Generate unique IDs for accessibility
  const baseId = `date-picker-${id}`;
  const ids = {
    wrapper: baseId,
    legend: `${baseId}-legend`,
    error: {
      all: `${baseId}-error-all`,
      month: `${baseId}-error-month`,
      day: `${baseId}-error-day`,
      year: `${baseId}-error-year`,
    },
    help: {
      primary: `${baseId}-help-primary`,
      secondary: `${baseId}-help-secondary`,
    },
  };

  // Combine IDs for aria-describedby attribute
  const ariaDescribedBy: string = [
    ids.legend, //
    helpMessagePrimary ? ids.help.primary : false,
    helpMessageSecondary ? ids.help.secondary : false,
  ]
    .filter(Boolean)
    .join(' ');

  // Generate error messages for each date part
  const ariaErrorMessage: AriaErrorMessage = currentDatePartOrder.reduce((acc, datePart) => {
    const errors = [
      errorMessages?.all ? ids.error.all : false, //
      errorMessages?.[datePart] ? ids.error[datePart] : false,
    ]
      .filter(Boolean)
      .join(' ');

    return { ...acc, [datePart]: errors || undefined };
  }, {} as AriaErrorMessage);

  // Extract default date parts from the default value
  const { day = '', month = '', year = '' } = extractDateParts(defaultValue ?? '');

  // Define date picker part fields
  const datePickerPartFields = {
    year: (
      <DatePickerYearField
        id={id}
        defaultValue={year}
        name={names.year}
        label={t('gcweb:date-picker.year.label')}
        className="w-full sm:w-32"
        ariaDescribedBy={ariaDescribedBy}
        ariaErrorMessage={ariaErrorMessage.year}
        required={required}
        disabled={disabled}
      />
    ),
    month: (
      <DatePickerMonthField
        id={id}
        defaultValue={month}
        name={names.month}
        label={t('gcweb:date-picker.month.label')}
        placeholder={t('gcweb:date-picker.month.placeholder')}
        className="w-full sm:w-auto"
        currentLanguage={currentLanguage}
        ariaDescribedBy={ariaDescribedBy}
        ariaErrorMessage={ariaErrorMessage.month}
        required={required}
        disabled={disabled}
      />
    ),
    day: (
      <DatePickerDayField
        id={id}
        defaultValue={day}
        name={names.day}
        label={t('gcweb:date-picker.day.label')}
        className="w-full sm:w-20"
        ariaDescribedBy={ariaDescribedBy}
        ariaErrorMessage={ariaErrorMessage.day}
        required={required}
        disabled={disabled}
      />
    ),
  } as const satisfies Record<DatePart, JSX.Element>;

  return (
    <div id={ids.wrapper}>
      <fieldset className="space-y-2">
        <InputLegend id={ids.legend} required={required}>
          {legend}
        </InputLegend>

        {/* Error Messages */}
        {errorMessages && Object.values(errorMessages).filter(Boolean).length > 0 && (
          <div className="space-y-2">
            {errorMessages.all && <InputError id={ids.error.all}>{errorMessages.all}</InputError>}
            {currentDatePartOrder
              .filter((datePart) => Boolean(errorMessages[datePart]))
              .map((datePart) => (
                <p key={datePart}>
                  <InputError id={ids.error[datePart]}>{errorMessages[datePart]}</InputError>
                </p>
              ))}
          </div>
        )}

        {/* Help Messages - Primary */}
        {helpMessagePrimary && (
          <InputHelp id={ids.help.primary} className={helpMessagePrimaryClassName}>
            {helpMessagePrimary}
          </InputHelp>
        )}

        {/* Date Picker Part Fields */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          {currentDatePartOrder.map((datePart) => (
            <Fragment key={datePart}>{datePickerPartFields[datePart]}</Fragment>
          ))}
        </div>

        {/* Help Messages - Secondary */}
        {helpMessageSecondary && (
          <InputHelp id={ids.help.secondary} className={helpMessageSecondaryClassName}>
            {helpMessageSecondary}
          </InputHelp>
        )}
      </fieldset>
    </div>
  );
};

/**
 * Props for the DatePickerMonthField component
 */
interface DatePickerMonthFieldProps {
  ariaDescribedBy: string;
  ariaErrorMessage?: string;
  className?: string;
  currentLanguage?: Language;
  defaultValue: string;
  disabled?: boolean;
  id: string;
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}

/**
 * DatePickerMonthField component
 *
 * @param props - Props for the DatePickerMonthField component
 * @returns JSX.Element
 */
function DatePickerMonthField({
  ariaDescribedBy,
  ariaErrorMessage,
  className,
  currentLanguage,
  defaultValue,
  disabled,
  id,
  label,
  name,
  placeholder,
  required,
}: DatePickerMonthFieldProps): JSX.Element {
  const baseId = `date-picker-${id}-month`;
  const ids = {
    wrapper: baseId,
    label: `${baseId}-label`,
    select: `${baseId}-select`,
    optionUnselected: `${baseId}-option-unselected`,
    option: (monthIndex: number) => `${baseId}-option-${monthIndex}`,
  };
  const hasErrorMessage = !!ariaErrorMessage;
  const months = getLocalizedMonths(currentLanguage ?? 'en');

  return (
    <div id={ids.wrapper} className="space-y-2">
      <InputLabel id={ids.label} htmlFor={ids.select}>
        {label}
      </InputLabel>
      <select
        aria-describedby={ariaDescribedBy}
        aria-errormessage={ariaErrorMessage}
        aria-invalid={hasErrorMessage}
        aria-labelledby={ids.label}
        aria-required={required}
        className={cn(inputStyles.base, inputStyles.disabled, hasErrorMessage && inputStyles.error, className)}
        defaultValue={defaultValue}
        disabled={disabled}
        id={ids.select}
        name={name}
        required={required}
      >
        <option id={ids.optionUnselected} value="" disabled hidden>
          {placeholder}
        </option>
        {months.map((month) => {
          return (
            <option id={ids.option(month.index)} key={month.index} value={padWithZero(month.index, 2)}>
              {month.text}
            </option>
          );
        })}
      </select>
    </div>
  );
}

/**
 * Props for the DatePickerYearField component
 */
interface DatePickerYearFieldProps {
  ariaDescribedBy: string;
  ariaErrorMessage?: string;
  className?: string;
  defaultValue: string;
  disabled?: boolean;
  id: string;
  label: string;
  name: string;
  required?: boolean;
}

/**
 * DatePickerYearField component
 *
 * @param props - Props for the DatePickerYearField component
 * @returns JSX.Element
 */
function DatePickerYearField({
  ariaDescribedBy,
  ariaErrorMessage,
  className,
  defaultValue,
  disabled,
  id,
  label,
  name,
  required,
}: DatePickerYearFieldProps): JSX.Element {
  const baseId = `date-picker-${id}-year`;
  const ids = {
    wrapper: baseId,
    label: `${baseId}-label`,
    input: `${baseId}-input`,
  };
  const hasErrorMessage = !!ariaErrorMessage;

  return (
    <div id={ids.wrapper} className="space-y-2">
      <InputLabel id={ids.label} htmlFor={ids.input}>
        {label}
      </InputLabel>
      <input
        aria-describedby={ariaDescribedBy}
        aria-errormessage={ariaErrorMessage}
        aria-invalid={hasErrorMessage}
        aria-labelledby={ids.label}
        aria-required={required}
        className={cn(inputStyles.base, inputStyles.disabled, hasErrorMessage && inputStyles.error, className)}
        defaultValue={defaultValue}
        disabled={disabled}
        id={ids.input}
        min={1900}
        name={name}
        required={required}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
      />
    </div>
  );
}

/**
 * Props for the DatePickerDayField component
 */
interface DatePickerDayFieldProps {
  ariaDescribedBy: string;
  ariaErrorMessage?: string;
  className?: string;
  defaultValue: string;
  disabled?: boolean;
  id: string;
  label: string;
  name: string;
  required?: boolean;
}

/**
 * DatePickerDayField component
 *
 * @param props - Props for the DatePickerDayField component
 * @returns JSX.Element
 */
function DatePickerDayField({
  ariaDescribedBy,
  ariaErrorMessage,
  className,
  defaultValue,
  disabled,
  id,
  label,
  name,
  required,
}: DatePickerDayFieldProps): JSX.Element {
  const baseId = `date-picker-${id}-day`;
  const ids = {
    wrapper: baseId,
    label: `${baseId}-label`,
    input: `${baseId}-input`,
  };
  const hasErrorMessage = !!ariaErrorMessage;

  return (
    <div id={ids.wrapper} className="space-y-2">
      <InputLabel id={ids.label} htmlFor={ids.input}>
        {label}
      </InputLabel>
      <input
        aria-describedby={ariaDescribedBy}
        aria-errormessage={ariaErrorMessage}
        aria-invalid={hasErrorMessage}
        aria-labelledby={ids.label}
        aria-required={required}
        className={cn(inputStyles.base, inputStyles.disabled, hasErrorMessage && inputStyles.error, className)}
        defaultValue={defaultValue}
        disabled={disabled}
        id={ids.input}
        max={31}
        min={1}
        name={name}
        required={required}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
      />
    </div>
  );
}
