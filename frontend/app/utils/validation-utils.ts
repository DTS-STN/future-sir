import { Redacted } from 'effect';
import type { z, ZodEffects, ZodTypeAny } from 'zod';

import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * Parses a string to a boolean.
 */
export function asBoolean<T extends ZodTypeAny>(schema: T): ZodEffects<T, boolean> {
  return schema.transform((val) => val.toLowerCase() === 'true');
}

/**
 * Parses a string to a number.
 */
export function asNumber<T extends ZodTypeAny>(schema: T): ZodEffects<T, number> {
  return schema.transform((val) => {
    const number = Number(val);

    if (Number.isNaN(number)) {
      throw new AppError(`Invalid number ${val}`, ErrorCodes.INVALID_NUMBER);
    }

    return number;
  });
}

/**
 * Checks if a value is in a record.
 *
 * @param record - The record to check against.
 * @param val - The value to check.
 * @returns True if the value is in the record, false otherwise.
 */
export function isIn(record: Record<string, unknown>) {
  return (val: string) => Object.keys(record).includes(val);
}

/**
 * Preprocesses validation input.
 *
 * This function takes a record and returns a new record with empty string
 * values replaced with undefined. This is useful for handling optional
 * environment variables that may not be set.
 *
 * @param data - The record to be preprocessed.
 * @returns A new record with empty string values replaced with undefined.
 */
export function preprocess<K extends string | number | symbol, T>(data: Record<K, T>): Record<K, T | undefined> {
  const processedEntries = Object.entries(data) //
    .map(([key, val]) => [key, val === '' ? undefined : val]);

  return Object.fromEntries(processedEntries);
}

/**
 * Wraps a value in a Redacted instance to protected secrets.
 */
export function redact<T extends ZodTypeAny>(schema: T): ZodEffects<T, Redacted.Redacted<z.infer<T>>> {
  return schema.transform((val) => Redacted.make(val));
}
