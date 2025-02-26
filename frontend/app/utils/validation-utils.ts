import type { FlatNamespace, KeyPrefix } from 'i18next';
import { getDotPath } from 'valibot';
import type { BaseIssue, BaseSchema, BaseSchemaAsync, InferIssue } from 'valibot';

import { getTranslation } from '~/i18n-config.server';

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

export async function translateIssues<
  TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
  TIssues extends [InferIssue<TSchema>, ...InferIssue<TSchema>[]],
  TLanguageOrRequest extends Language | Request,
  TNs extends FlatNamespace,
  TKPrefix extends KeyPrefix<TNs> = undefined,
>(issues: TIssues, LanguageOrRequest: TLanguageOrRequest, ns: TNs, keyPrefix?: TKPrefix): Promise<TIssues> {
  const { t } = await getTranslation(LanguageOrRequest, ns, keyPrefix);
  return issues.map((issue) => {
    const issueType = issue.type;
    const dotPath = getDotPath(issue);
    const i18nKey = [dotPath, issueType].filter(Boolean).join('.');
    const defaultValue = issue.message;
    const requirement = issue.requirement;
    const message = t(i18nKey, defaultValue, { requirement }) as string;
    return { ...issue, message };
  }) as TIssues;
}
