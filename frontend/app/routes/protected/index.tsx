import type { RouteHandle } from 'react-router';
import { redirect } from 'react-router';

import { Trans, useTranslation } from 'react-i18next';

import type { Route } from './+types/index';
import { LogFactory } from '~/.server/logging';
import { InlineLink } from '~/components/inline-link';
import { CodedError } from '~/errors/coded-error';
import { ErrorCodes } from '~/errors/error-codes';
import { getFixedT } from '~/i18n-config.server';
import { handle as parentHandle } from '~/routes/protected/layout';
import { hasRole } from '~/utils/auth-utils';

export const handle = {
  i18nNamespace: [...parentHandle.i18nNamespace, 'protected'],
} as const satisfies RouteHandle;

export async function loader({ context, request }: Route.LoaderArgs) {
  const log = LogFactory.getLogger(import.meta.url);

  if (!context.session.authState) {
    log.debug('User is not authenticated, redirecting to login page');

    const { pathname, search } = new URL(request.url);
    throw redirect(`/auth/login?returnto=${pathname}${search}`);
  }

  if (!hasRole(context.session.authState, 'user')) {
    log.debug('User is not authorized to access this page; missing role user');
    throw new CodedError('User is not authorized to access this page', ErrorCodes.ACCESS_FORBIDDEN, { statusCode: 403 });
  }

  const t = await getFixedT(request, handle.i18nNamespace);

  return {
    meta: { documentTitle: t('protected:index.page-title') },
  };
}

export function meta({ data }: Route.MetaArgs): Route.MetaDescriptors {
  return [{ title: data.meta.documentTitle }];
}

export default function Index(props: Route.ComponentProps) {
  const { t } = useTranslation(handle.i18nNamespace);

  return (
    <div className="mb-8">
      <p className="mt-8 text-lg">
        <Trans
          i18nKey="protected:index.resources"
          components={{ mark: <mark /> }}
          values={{ resource: t('protected:resource') }}
        />
      </p>
      <ul className="ml-8 mt-8 list-disc">
        <li>
          <InlineLink file="routes/protected/admin.tsx">{t('protected:index.admin-dashboard')}</InlineLink>
        </li>
        <li>
          <InlineLink file="routes/public/index.tsx">{t('protected:index.public')}</InlineLink>
        </li>
        <li>
          <InlineLink to="/">{t('protected:index.home')}</InlineLink>
        </li>
      </ul>
    </div>
  );
}
