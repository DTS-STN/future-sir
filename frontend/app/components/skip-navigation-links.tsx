import type { PropsWithChildren } from 'react';

import { useTranslation } from 'react-i18next';

import { AnchorLink } from '~/components/links';

export function SkipNavigationLinks() {
  const { t } = useTranslation(['gcweb']);

  return (
    <div id="skip-to-content">
      <SkipNavigationLink anchorElementId="wb-cont">{t('gcweb:nav.skip-to-content')}</SkipNavigationLink>
      <SkipNavigationLink anchorElementId="wb-info">{t('gcweb:nav.skip-to-about')}</SkipNavigationLink>
    </div>
  );
}

interface SkipNavigationLinkProps extends PropsWithChildren {
  anchorElementId: string;
}

function SkipNavigationLink({ anchorElementId, children }: SkipNavigationLinkProps) {
  return (
    <AnchorLink
      anchorElementId={anchorElementId}
      className="font-lato absolute z-10 mx-2 inline-flex -translate-y-full items-center justify-center rounded-sm border border-slate-700 bg-slate-700 px-5 py-2.5 align-middle text-sm text-white outline-offset-4 transition-all hover:bg-sky-800 focus:mt-2 focus:translate-y-0 focus:bg-sky-800"
    >
      {children}
    </AnchorLink>
  );
}
