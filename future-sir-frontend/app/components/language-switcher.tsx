import type { ComponentProps, ElementRef } from 'react';
import { forwardRef } from 'react';

import { InlineLink } from '~/components/inline-link';
import { useLanguage } from '~/hooks/use-language';
import { useRoute } from '~/hooks/use-route';
import type { I18nRouteFile } from '~/i18n-routes';

type LanguageSwitcherProps = Omit<ComponentProps<typeof InlineLink>, 'file' | 'lang' | 'reloadDocument' | 'to'>;

export const LanguageSwitcher = forwardRef<ElementRef<typeof InlineLink>, LanguageSwitcherProps>(
  ({ className, children, ...props }, ref) => {
    const { altLanguage } = useLanguage();
    const { file } = useRoute();

    return (
      <InlineLink ref={ref} file={file as I18nRouteFile} lang={altLanguage} reloadDocument={true} {...props}>
        {children}
      </InlineLink>
    );
  },
);

LanguageSwitcher.displayName = 'LanguageSwitcher';
