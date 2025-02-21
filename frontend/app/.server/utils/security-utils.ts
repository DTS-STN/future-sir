/**
 * Represents a value that is redacted when stringified or logged.
 * @template T The type of the wrapped value
 */
type Redacted<T> = RedactedContainer<T>;

/**
 * Creates a new redacted value wrapper.
 *
 * @template T The type of the value to redact
 * @param value The value to wrap in a redacted container
 * @returns A redacted wrapper that hides the value when stringified
 */
function createRedacted<T>(value: T): Redacted<T> {
  return new RedactedContainer(value);
}

/**
 * A container class that wraps a value and ensures it is redacted when converted to a string or logged.
 * The original value can only be accessed through the explicit `value()` method.
 *
 * @template T The type of the encapsulated value
 */
class RedactedContainer<T> {
  private readonly val: T;

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
   * @returns The value `'<redacted>'`
   */
  public [Symbol.for('nodejs.util.inspect.custom')](): '<redacted>' {
    return this.toString();
  }

  /**
   * Controls how the object is serialized when JSON.stringify() is called.
   *
   * @returns The value `'<redacted>'`
   */
  public toJSON(): '<redacted>' {
    return this.toString();
  }

  /**
   * Returns a redacted string representation that hides the actual value.
   *
   * @returns The value `'<redacted>'`
   */
  public toString(): '<redacted>' {
    return '<redacted>';
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

/**
 * A hybrid function-class that provides both a factory function for creating redacted values
 * and access to the RedactedContainer class itself.
 *
 * This can be used in two ways:
 *
 * 1. As a function to create redacted values:
 *    ```typescript
 *    const redacted = Redacted('sensitive data');
 *    ```
 *
 * 2. As a class:
 *    ```typescript
 *    const redacted = new Redacted('sensitive data')
 *    ```
 */
export const Redacted: {
  new <T>(value: T): Redacted<T>;
  <T>(value: T): Redacted<T>;
} = Object.assign(createRedacted, RedactedContainer);
