import { getRequestTypes } from './get-request-types.server';
import { getScenarios } from './get-scenarios.server';
import { handle } from './handle';
import type { Route } from '.react-router/types/app/routes/protected/person-case/+types/request-details';

import { requireAuth } from '~/.server/utils/auth-utils';
import { getTranslation } from '~/i18n-config.server';

export async function loader({ context, request }: Route.LoaderArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);
  const { t } = await getTranslation(request, handle.i18nNamespace);
  const requestTypes = getRequestTypes();
  const scenarios = getScenarios();
  return {
    documentTitle: t('protected:request-details.page-title'),
    defaultFormValues: context.session.inPersonSINCase?.requestDetails,
    requestTypes,
    scenarios,
  };
}
