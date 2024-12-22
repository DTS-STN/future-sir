import type { ComponentProps } from 'react';

import type { Params, Path } from 'react-router';
import { generatePath, Link } from 'react-router';

import { CodedError } from '~/errors/coded-error';
import { ErrorCodes } from '~/errors/error-codes';
import { useLanguage } from '~/hooks/use-language';
import type { I18nRouteFile } from '~/i18n-routes';
import { i18nRoutes } from '~/i18n-routes';
import { getRouteByFile } from '~/utils/route-utils';

type BilingualLinkProps = Omit<ComponentProps<typeof Link>, 'to'> & {
  file: I18nRouteFile;
  hash?: Path['hash'];
  lang?: Language;
  params?: Params;
  search?: Path['search'];
  to?: never;
};

type UnilingualLinkProps = Omit<ComponentProps<typeof Link>, 'lang'> & {
  file?: never;
  hash?: never;
  lang?: Language;
  params?: never;
  search?: never;
};

type AppLinkProps = BilingualLinkProps | UnilingualLinkProps;

export function AppLink({ children, hash, lang, params, file, search, to, ...props }: AppLinkProps) {
  const { currentLanguage } = useLanguage();

  if (to !== undefined) {
    return (
      <Link lang={lang} to={to} {...props}>
        {children}
      </Link>
    );
  }

  const targetLanguage = lang ?? currentLanguage;

  if (targetLanguage === undefined) {
    throw new CodedError(
      'The `lang` parameter was not provided, and the current language could not be determined from the request',
      ErrorCodes.MISSING_LANG_PARAM,
    );
  }

  const route = getRouteByFile(file, i18nRoutes);
  const pathname = generatePath(route.paths[targetLanguage], params);

  const langProp = targetLanguage !== currentLanguage ? targetLanguage : undefined;
  const reloadDocumentProp = props.reloadDocument ?? lang !== undefined;

  return (
    <Link lang={langProp} to={{ hash, pathname, search }} reloadDocument={reloadDocumentProp} {...props}>
      {children}
    </Link>
  );
}
