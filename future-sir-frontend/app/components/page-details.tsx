import { useTranslation } from 'react-i18next';

import { useRoute } from '~/hooks/use-route';

export function PageDetails() {
  const route = useRoute();
  const { t } = useTranslation(['gcweb']);

  const { BUILD_DATE, BUILD_VERSION } = __appEnvironment;

  return (
    <section className="mb-8 mt-16">
      <h2 className="sr-only">{t('gcweb:page-details.page-details')}</h2>
      <dl id="wb-dtmd" className="space-y-1">
        <div className="flex gap-2">
          <dt>{t('gcweb:page-details.screen-id')}</dt>
          <dd>
            <span property="identifier">{route.id}</span>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt>{t('gcweb:page-details.date-modfied')}</dt>
          <dd>
            <time property="dateModified">{BUILD_DATE.slice(0, 10)}</time>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt>{t('gcweb:page-details.version')}</dt>
          <dd>
            <span property="version">{BUILD_VERSION}</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
