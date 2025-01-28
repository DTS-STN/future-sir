import { useTranslation } from 'react-i18next';

import { AnchorLink } from '~/components/anchor-link';

export function SkipNavigationLinks() {
  const { t } = useTranslation(['gcweb']);

  return (
    <div id="skip-to-content">
      <AnchorLink
        anchorElementId="wb-cont"
        className="absolute z-10 mx-2 -translate-y-full p-2 transition-all focus:mt-2 focus:translate-y-0"
        data-testid="skip-to-content"
      >
        {t('gcweb:nav.skip-to-content')}
      </AnchorLink>
      <AnchorLink
        anchorElementId="wb-info"
        className="absolute z-10 mx-2 -translate-y-full p-2 transition-all focus:mt-2 focus:translate-y-0"
        data-testid="skip-to-about"
      >
        {t('gcweb:nav.skip-to-about')}
      </AnchorLink>
    </div>
  );
}
