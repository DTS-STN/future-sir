import type {
  ApplicationSubmissionScenario,
  LocalizedApplicationSubmissionScenario,
} from '~/.server/domain/person-case/models';
import { getOptionSet } from '~/.server/domain/person-case/services/data-service';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

/**
 * Retrieves a list of application submission scenarios.
 *
 * @returns An array of application submission scenario objects.
 */
export function getApplicationSubmissionScenarios(): readonly ApplicationSubmissionScenario[] {
  const optionSet = getOptionSet('esdc_applicationsubmissionscenarios');
  return optionSet.options.map((option) => ({
    id: option.value.toString(),
    nameEn: option.labelEn,
    nameFr: option.labelFr,
  }));
}

/**
 * Retrieves a single application submission scenario by its ID.
 *
 * @param id The ID of the application submission scenario to retrieve.
 * @returns The application submission scenario object if found.
 * @throws {AppError} If the scenario is not found.
 */
export function getApplicationSubmissionScenarioById(id: string): ApplicationSubmissionScenario {
  const scenario = getApplicationSubmissionScenarios().find((s) => s.id === id);
  if (!scenario) {
    throw new AppError(
      `Application submission scenario with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICATION_SUBMISSION_SCENARIO_FOUND,
    );
  }
  return scenario;
}

/**
 * Retrieves a list of application submission scenarios localized to the specified language.
 *
 * @param language The language to localize the scenario names to.
 * @returns An array of localized application submission scenario objects.
 */
export function getLocalizedApplicationSubmissionScenarios(language: Language): LocalizedApplicationSubmissionScenario[] {
  return getApplicationSubmissionScenarios().map((option) => ({
    id: option.id,
    name: language === 'fr' ? option.nameFr : option.nameEn,
  }));
}

/**
 * Retrieves a single localized application submission scenario by its ID.
 *
 * @param id The ID of the application submission scenario to retrieve.
 * @param language The language to localize the scenario name to.
 * @returns The localized application submission scenario object if found.
 * @throws {AppError} If the scenario is not found.
 */
export function getLocalizedApplicationSubmissionScenarioById(
  id: string,
  language: Language,
): LocalizedApplicationSubmissionScenario {
  const scenario = getLocalizedApplicationSubmissionScenarios(language).find((s) => s.id === id);
  if (!scenario) {
    throw new AppError(
      `Localized application submission scenario with ID '${id}' not found.`,
      ErrorCodes.NO_APPLICATION_SUBMISSION_SCENARIO_FOUND,
    );
  }
  return scenario;
}
