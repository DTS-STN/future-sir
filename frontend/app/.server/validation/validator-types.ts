/**
 * Type representing the primitive values allowed in a validator's data schema.
 */
export type ValidatorDataSchemaValuePrimitives = string | number | boolean | null | undefined;

/**
 * Type representing the values allowed in a validator's data schema. This allows
 * for both primitive values and arrays of primitive values.
 *
 * Arrays can contain multiple elements of the primitive types, allowing
 * flexibility in the schema definition.
 */
export type ValidatorDataSchemaValue = ValidatorDataSchemaValuePrimitives | ValidatorDataSchemaValuePrimitives[];

/**
 * Type representing the structure of data for a validator. This is a record
 * where keys are strings (property names) and values are either primitive
 * types or arrays of primitive types. This allows for flexible validation
 * schemas, accommodating both single values and lists.
 */
export type ValidatorDataSchema = Record<string, ValidatorDataSchemaValue>;

/**
 * Result type for an unsuccessful validation, containing detailed error messages
 * for each invalid field in the validated object.
 *
 * @template T - The type of object being validated.
 *
 * The `errors` object uses `Partial` to allow for optional error messages for
 * each field, as not all fields may have validation errors. `Readonly` ensures
 * that the error messages cannot be modified after validation.
 */
export interface InvalidResult<T extends ValidatorDataSchema> {
  success: false;
  errors: Readonly<Partial<Record<keyof T, string | undefined>>>;
}

/**
 * Result type for a successful validation, containing the validated object data.
 *
 * @template T - The type of object being validated.
 */
export interface ValidResult<T extends ValidatorDataSchema> {
  success: true;
  data: T;
}

/**
 * Generic interface for validators. Validators take a partial object of type `T`
 * and return either a successful result containing the validated data or an
 * unsuccessful result containing error messages.
 *
 * @template T - The type of object being validated.
 *
 * The `validate` method performs the core validation logic. It returns a
 * `ValidResult` if the data meets the validation criteria, or an `InvalidResult`
 * with detailed error messages if it does not.
 */
export interface Validator<T extends ValidatorDataSchema> {
  /**
   * Validates the provided data object of type `T`.
   *
   * @param data - A partial object of type `T` representing the data to validate.
   * @returns An `InvalidResult` if validation fails, or a `ValidResult` if validation succeeds.
   *
   * Example:
   * ```typescript
   * const result = validator.validate({ key: 'value' });
   * if (result.success) {
   *   console.log('Valid data:', result.data);
   * } else {
   *   console.log('Validation errors:', result.errors);
   * }
   * ```
   */
  validate: (data: Partial<T>) => InvalidResult<T> | ValidResult<T>;
}
