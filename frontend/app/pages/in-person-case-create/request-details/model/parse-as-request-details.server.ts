import * as v from 'valibot';

import { getRequestTypes } from '../api/get-request-types.server';
import { getScenarios } from '../api/get-scenarios.server';
import { handle } from '../api/handle';
import type { RequestDetails } from './request-details.server';

import { getFixedT } from '~/i18n-config.server';

export async function parseAsRequestDetails(formData: FormData, langOrReq: Language | Request) {
  const t = await getFixedT(langOrReq, handle.i18nNamespace);

  const requestTypes = getRequestTypes();
  const scenarios = getScenarios();

  const schema = v.object({
    scenario: v.picklist(requestTypes, t('protected:request-details.required-scenario')),
    type: v.picklist(scenarios, t('protected:request-details.required-request')),
  }) satisfies v.GenericSchema<RequestDetails>;

  const input = {
    scenario: formData.get('scenario')?.toString(),
    type: formData.get('request-type')?.toString(),
  } satisfies Partial<v.InferInput<typeof schema>>;

  const parseResult = v.safeParse(schema, input);

  if (!parseResult.success) {
    return {
      success: false,
      errors: v.flatten<typeof schema>(parseResult.issues).nested,
    } as const;
  }

  return {
    success: true,
    output: parseResult.output,
  } as const;
}
