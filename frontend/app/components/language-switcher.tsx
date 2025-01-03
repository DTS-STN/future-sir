import type { ComponentProps } from 'react';

import { InlineLink } from '~/components/inline-link';
import { useLanguage } from '~/hooks/use-language';
import { useRoute } from '~/hooks/use-route';
import type { I18nRouteFile } from '~/i18n-routes';

type LanguageSwitcherProps = Omit<ComponentProps<typeof InlineLink>, 'file' | 'lang' | 'reloadDocument' | 'to'>;

export function LanguageSwitcher({ className, children, ...props }: LanguageSwitcherProps) {
  const { altLanguage } = useLanguage();
  const { file } = useRoute();

  return (
    <InlineLink file={file as I18nRouteFile} lang={altLanguage} reloadDocument={true} {...props}>
      {children}
    </InlineLink>
  );
}
