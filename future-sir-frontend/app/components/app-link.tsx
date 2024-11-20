import type { ComponentProps, ElementRef } from 'react';
import { forwardRef } from 'react';

import type { Params, Path } from 'react-router';
import { generatePath, Link } from 'react-router';

import { useLanguage } from '~/hooks/use-language';
import type { I18nRouteFile } from '~/i18n-routes';
import { i18nRoutes } from '~/i18n-routes';
import { getRouteByFile } from '~/utils/route-utils';

type AppLinkProps = Omit<ComponentProps<typeof Link>, 'to'> & {
  file: I18nRouteFile;
  hash?: Path['hash'];
  lang?: Language;
  params?: Params;
  search?: Path['search'];
};

/**
 * A custom link component that handles rendering application hrefs in the correct language.
 */
export const AppLink = forwardRef<ElementRef<typeof Link>, AppLinkProps>(
  ({ children, hash, lang, params, file, search, ...props }, ref) => {
    const { currentLanguage } = useLanguage();

    const targetLanguage = lang ?? currentLanguage;

    if (targetLanguage === undefined) {
      throw new Error(
        'The `lang` parameter was not provided, and the current language could not be determined from the request',
      );
    }

    const route = getRouteByFile(file, i18nRoutes);
    const pathname = generatePath(route.paths[targetLanguage], params);
    const reloadDocument = props.reloadDocument ?? lang !== undefined;

    return (
      <Link ref={ref} lang={targetLanguage} to={{ hash, pathname, search }} reloadDocument={reloadDocument} {...props}>
        {children}
      </Link>
    );
  },
);

AppLink.displayName = 'AppLink';
