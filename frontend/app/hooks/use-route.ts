import { useLocation } from 'react-router';

import type { I18nPageRoute } from '~/i18n-routes';
import { i18nRoutes } from '~/i18n-routes';
import { getRouteByPath } from '~/utils/route-utils';

export function useRoute(): I18nPageRoute {
  const { pathname } = useLocation();
  return getRouteByPath(pathname, i18nRoutes);
}
