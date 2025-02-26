import type { ComponentProps } from 'react';

import { useLocation, useParams } from 'react-router';

import { InlineLink } from '~/components/links';
import { useLanguage } from '~/hooks/use-language';
import { useRoute } from '~/hooks/use-route';
import type { I18nRouteFile } from '~/i18n-routes';
import { cn } from '~/utils/tailwind-utils';

type LanguageSwitcherProps = OmitStrict<
  ComponentProps<typeof InlineLink>,
  'file' | 'lang' | 'params' | 'reloadDocument' | 'search' | 'to'
>;

export function LanguageSwitcher({ className, children, ...props }: LanguageSwitcherProps) {
  const { altLanguage } = useLanguage();
  const { search } = useLocation();
  const { file } = useRoute();
  const params = useParams();

  return (
    <InlineLink
      className={cn('text-white hover:text-blue-100 focus:text-blue-200 sm:text-lg', className)}
      file={file as I18nRouteFile}
      lang={altLanguage}
      params={params}
      reloadDocument={true}
      search={search}
      {...props}
    >
      {children}
    </InlineLink>
  );
}
