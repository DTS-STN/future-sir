import type { ComponentProps } from 'react';

import { useTranslation } from 'react-i18next';

export type PageDetailsProps = ComponentProps<'section'> & {
  buildDate: string;
  buildVersion: string;
  pageId: string;
};

export function PageDetails({ buildDate, buildVersion, pageId, ...props }: PageDetailsProps) {
  const { t } = useTranslation(['gcweb']);

  return (
    <section className="mt-16 mb-8" {...props}>
      <h2 className="sr-only">{t('gcweb:page-details.page-details')}</h2>
      <dl id="wb-dtmd" className="space-y-1">
        <div className="flex gap-2">
          <dt>{t('gcweb:page-details.screen-id')}</dt>
          <dd>{pageId}</dd>
        </div>
        <div className="flex gap-2">
          <dt>{t('gcweb:page-details.date-modfied')}</dt>
          <dd>
            <time>{buildDate.slice(0, 10)}</time>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt>{t('gcweb:page-details.version')}</dt>
          <dd>{buildVersion}</dd>
        </div>
      </dl>
    </section>
  );
}
