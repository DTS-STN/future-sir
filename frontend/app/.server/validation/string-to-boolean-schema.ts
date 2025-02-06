import * as v from 'valibot';

/**
 * Creates a Valibot schema to validate and transform a string representing
 * a boolean ('true' or 'false') into an actual boolean (true or false).
 *
 * The input string will be compared against the string representations
 * of boolean values ('true' and 'false') and transformed into a corresponding
 * boolean value (true or false).
 *
 * @returns {v.GenericSchema<string, boolean>} A Valibot schema that validates
 * and transforms a string to a boolean.
 *
 * Example usage:
 * ```ts
 * import * as v from 'valibot';
 *
 * const result = v.parse(stringToBooleanSchema(), 'true'); // returns true
 * ```
 */
export function stringToBooleanSchema(): v.GenericSchema<string, boolean> {
  return v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty(),
    v.picklist(['true', 'false']),
    v.transform((input) => input === 'true'),
  );
}
