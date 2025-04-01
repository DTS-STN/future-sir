/**
 * This module provides utility functions for security-related operations,
 * including the redaction of sensitive data. It includes a `Redacted` class
 * that wraps a value and ensures it is redacted when converted to a string
 * or logged, enhancing the security of sensitive information.
 */

/**
 * A container class that wraps a value and ensures it is redacted when converted to a string or logged.
 * The original value can only be accessed through the explicit `value()` method.
 *
 * @template T The type of the encapsulated value
 */
export class Redacted<T> {
  private readonly val: T;

  /**
   * Static factory function to make it easier to instantiate in lambda functions.
   * @param value The value to wrap and redact
   */
  public static make<T>(value: T) {
    return new Redacted(value);
  }

  /**
   * Creates a new redacted container
   * @param value The value to wrap and redact
   */
  public constructor(value: T) {
    this.val = value;
  }

  /**
   * Custom inspection method for Node.js utilities like `util.inspect()`.
   * This ensures the value appears redacted when using Node.js debugging tools.
   * @see https://nodejs.org/api/util.html#utilinspectcustom
   *
   * @returns The value `'<redacted>'` if an initial value was provided, otherwise `undefined`.
   */
  public [Symbol.for('nodejs.util.inspect.custom')](): '<redacted>' | undefined {
    return this.toString();
  }

  /**
   * Controls how the object is serialized when JSON.stringify() is called.
   *
   * @returns The value `'<redacted>'` if an initial value was provided, otherwise `undefined`.
   */
  public toJSON(): '<redacted>' | undefined {
    return this.toString();
  }

  /**
   * Returns a redacted string representation that hides the actual value.
   *
   * @returns The value `'<redacted>'` if an initial value was provided, otherwise `undefined`.
   */
  public toString(): '<redacted>' | undefined {
    return this.val ? '<redacted>' : undefined;
  }

  /**
   * Retrieves the original stored value.
   *
   * @returns The original value
   */
  public value(): T {
    return this.val;
  }
}
