import type { ReadonlyDeep } from 'type-fest';

import globalOptionSetsData from '~/.server/resources/esdc-global-option-sets.json';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

type OptionSet = ReadonlyDeep<(typeof globalOptionSetsData)[number]>;

/**
 * Retrieves an option set by its name.
 *
 * @param optionSetName The name of the option set to retrieve.
 * @returns The option set if found.
 * @throws {AppError} If the option set is not found.
 */
export function getOptionSet(optionSetName: string): OptionSet {
  const optionSet = globalOptionSetsData.find((os) => os.name === optionSetName);

  if (!optionSet) {
    throw new AppError(`Option set '${optionSetName}' not found.`, ErrorCodes.NO_OPTION_SET_FOUND);
  }

  return optionSet;
}
