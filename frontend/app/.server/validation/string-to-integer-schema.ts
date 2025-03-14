import * as v from 'valibot';

/**
 * Creates a Valibot schema to validate and transform a string into an integer.
 *
 * @returns A Valibot schema that validates and transforms a string to an integer.
 *
 * Example usage:
 * ```ts
 * import * as v from 'valibot';
 *
 * const result = v.parse(stringToIntegerSchema(), '42'); // returns 42
 */
export function stringToIntegerSchema(message?: string): v.GenericSchema<string, number> {
  return v.pipe(
    v.string(message), //
    v.trim(),
    v.nonEmpty(message),
    v.transform(Number),
    v.integer(message),
  );
}
