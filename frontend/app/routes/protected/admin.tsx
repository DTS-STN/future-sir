import { redirect } from 'react-router';

import type { Route } from './+types/admin';
import { LogFactory } from '~/.server/logging';
import { PageTitle } from '~/components/page-title';
import { CodedError } from '~/errors/coded-error';
import { ErrorCodes } from '~/errors/error-codes';
import { hasRole } from '~/utils/auth-utils';

export function loader({ context, params, request }: Route.LoaderArgs) {
  const log = LogFactory.getLogger(import.meta.url);

  if (!context.session.authState) {
    log.debug('User is not authenticated, redirecting to login page');

    const { pathname, search } = new URL(request.url);
    throw redirect(`/auth/login?returnto=${pathname}${search}`);
  }

  if (!hasRole(context.session.authState, 'admin')) {
    log.debug('User is not authorized to access this page; missing role admin');
    throw new CodedError('User is not authorized to access this page', ErrorCodes.ACCESS_FORBIDDEN, { statusCode: 403 });
  }

  return {};
}

export default function AdminDashboard({ actionData, loaderData, matches, params }: Route.ComponentProps) {
  return <PageTitle>Admin dashboard</PageTitle>;
}
