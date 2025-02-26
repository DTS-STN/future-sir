import { data } from 'react-router';

import { parseAsRequestDetails } from '../model/parse-as-request-details.server';
import type { Route } from '.react-router/types/app/routes/protected/person-case/+types/request-details';

import { requireAuth } from '~/.server/utils/auth-utils';
import { i18nRedirect } from '~/.server/utils/route-utils';
import { AppError } from '~/errors/app-error';
import { ErrorCodes } from '~/errors/error-codes';

export async function action({ context, request }: Route.ActionArgs) {
  requireAuth(context.session, new URL(request.url), ['user']);

  const formData = await request.formData();
  const action = formData.get('action');

  switch (action) {
    case 'back': {
      throw i18nRedirect('routes/protected/person-case/privacy-statement.tsx', request);
    }

    case 'next': {
      const parseResult = await parseAsRequestDetails(formData, request);

      if (!parseResult.success) {
        return data({ errors: parseResult.errors }, { status: 400 });
      }

      context.session.inPersonSINCase ??= {};
      context.session.inPersonSINCase.requestDetails = parseResult.output;

      throw i18nRedirect('routes/protected/person-case/primary-docs.tsx', request);
    }

    default: {
      throw new AppError(`Unrecognized action: ${action}`, ErrorCodes.UNRECOGNIZED_ACTION);
    }
  }
}
